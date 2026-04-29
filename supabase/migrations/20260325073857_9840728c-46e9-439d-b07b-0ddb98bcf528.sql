
-- Create ai_conversation_events queue table
CREATE TABLE public.ai_conversation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel text,
  language text,
  event_type text NOT NULL CHECK (event_type IN ('bot_reply', 'customer_message', 'rating_received', 'dead_air', 'human_handoff', 'conversation_resolved', 'customer_returned')),
  payload jsonb DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'scoring', 'scored', 'clustered', 'done')),
  scored_at timestamptz,
  clustered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate message-based events
CREATE UNIQUE INDEX idx_ai_conv_events_dedup 
ON public.ai_conversation_events (conversation_id, event_type, COALESCE(message_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Processing indexes
CREATE INDEX idx_ai_conv_events_status ON public.ai_conversation_events (processing_status, created_at);
CREATE INDEX idx_ai_conv_events_conv ON public.ai_conversation_events (conversation_id);
CREATE INDEX idx_ai_conv_events_customer ON public.ai_conversation_events (customer_id);
CREATE INDEX idx_ai_conv_events_created ON public.ai_conversation_events (created_at);

-- Enable RLS
ALTER TABLE public.ai_conversation_events ENABLE ROW LEVEL SECURITY;

-- Agents can read
CREATE POLICY "Agents can read ai_conversation_events"
ON public.ai_conversation_events FOR SELECT
TO authenticated
USING (public.is_agent_or_higher(auth.uid()));

-- Create function to auto-ingest bot replies and customer messages
CREATE OR REPLACE FUNCTION public.auto_ingest_conversation_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_customer_id uuid;
  v_channel text;
  v_event_type text;
  v_payload jsonb;
BEGIN
  -- Only process bot and customer messages (not internal notes)
  IF NEW.is_internal_note = true THEN
    RETURN NEW;
  END IF;

  -- Get conversation details
  SELECT c.contact_id, c.channel
  INTO v_customer_id, v_channel
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  -- Determine event type
  IF NEW.sender_type = 'bot' THEN
    v_event_type := 'bot_reply';
    v_payload := jsonb_build_object('bot_text', LEFT(NEW.content, 2000));
  ELSIF NEW.sender_type = 'customer' THEN
    v_event_type := 'customer_message';
    v_payload := jsonb_build_object('customer_text', LEFT(NEW.content, 2000));
  ELSE
    RETURN NEW; -- skip agent messages
  END IF;

  -- Insert with conflict handling (dedup)
  INSERT INTO ai_conversation_events (
    conversation_id, message_id, customer_id, channel,
    event_type, payload
  ) VALUES (
    NEW.conversation_id, NEW.id, v_customer_id, v_channel,
    v_event_type, v_payload
  )
  ON CONFLICT (conversation_id, event_type, COALESCE(message_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to conversation_messages
CREATE TRIGGER trg_auto_ingest_conversation_event
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
EXECUTE FUNCTION public.auto_ingest_conversation_event();

-- Create function to auto-ingest conversation status changes
CREATE OR REPLACE FUNCTION public.auto_ingest_conv_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_event_type text;
  v_payload jsonb;
BEGIN
  -- Detect human handoff
  IF OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO ai_conversation_events (
      conversation_id, customer_id, channel, event_type, payload
    ) VALUES (
      NEW.id, NEW.contact_id, NEW.channel, 'human_handoff',
      jsonb_build_object('assigned_to', NEW.assigned_to, 'priority', NEW.priority)
    )
    ON CONFLICT (conversation_id, event_type, COALESCE(message_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO NOTHING;
  END IF;

  -- Detect resolution
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    INSERT INTO ai_conversation_events (
      conversation_id, customer_id, channel, event_type, payload
    ) VALUES (
      NEW.id, NEW.contact_id, NEW.channel, 'conversation_resolved',
      jsonb_build_object(
        'resolution_type', CASE WHEN NEW.assigned_to IS NOT NULL THEN 'human' ELSE 'ai' END,
        'resolved_at', NEW.resolved_at
      )
    )
    ON CONFLICT (conversation_id, event_type, COALESCE(message_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to conversations
CREATE TRIGGER trg_auto_ingest_conv_status
AFTER UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.auto_ingest_conv_status_change();

-- Create function to auto-ingest ratings
CREATE OR REPLACE FUNCTION public.auto_ingest_rating_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_contact_id uuid;
  v_channel_val text;
BEGIN
  -- Get conversation details
  SELECT c.contact_id, c.channel
  INTO v_contact_id, v_channel_val
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  INSERT INTO ai_conversation_events (
    conversation_id, customer_id, channel, language,
    event_type, payload
  ) VALUES (
    NEW.conversation_id, v_contact_id, COALESCE(NEW.channel, v_channel_val), NEW.language,
    'rating_received',
    jsonb_build_object('rating', NEW.rating, 'feedback_text', NEW.feedback_text)
  )
  ON CONFLICT (conversation_id, event_type, COALESCE(message_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET payload = EXCLUDED.payload; -- Update rating if re-submitted

  RETURN NEW;
END;
$$;

-- Attach trigger to conversation_ratings
CREATE TRIGGER trg_auto_ingest_rating
AFTER INSERT ON public.conversation_ratings
FOR EACH ROW
EXECUTE FUNCTION public.auto_ingest_rating_event();

-- Create function to auto-ingest dead air events
CREATE OR REPLACE FUNCTION public.auto_ingest_dead_air_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_contact_id uuid;
BEGIN
  SELECT c.contact_id INTO v_contact_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  INSERT INTO ai_conversation_events (
    conversation_id, customer_id, channel,
    event_type, payload
  ) VALUES (
    NEW.conversation_id, v_contact_id, NEW.channel,
    'dead_air',
    jsonb_build_object(
      'silence_seconds', NEW.silence_duration_seconds,
      'customer_returned', NEW.customer_returned,
      'bot_message', LEFT(NEW.bot_message_content, 500)
    )
  )
  ON CONFLICT (conversation_id, event_type, COALESCE(message_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to dead_air_events
CREATE TRIGGER trg_auto_ingest_dead_air
AFTER INSERT ON public.dead_air_events
FOR EACH ROW
EXECUTE FUNCTION public.auto_ingest_dead_air_event();
