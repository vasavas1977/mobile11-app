-- =====================================================================
-- OUTBOUND LEARNING EVENTS
-- Structured learning data for every outbound send, enabling future
-- AI optimization, A/B testing, and campaign performance analysis.
--
-- ARCHITECTURE NOTES:
--
-- 1. seen_status: Best-effort and channel-dependent.
--    LINE supports read receipts; email open tracking is unreliable.
--    Value may remain 'unknown' permanently for channels without
--    read receipt support. Do not treat 'unknown' as 'not seen'.
--
-- 2. complaint_flag / support_ticket_created: Require defined
--    attribution logic. The attribution job should use a configurable
--    post-send time window (e.g., 48 hours) and/or linked conversation
--    context to determine if a complaint or ticket is attributable to
--    this specific send. Not populated automatically at creation time.
--
-- 3. Event lifecycle:
--    - CREATED by the sender immediately after dispatch with sent_at,
--      delivery_status, stage_snapshot, and IDs populated.
--    - UPDATED asynchronously by:
--      * Delivery webhooks -> delivery_status, seen_status
--      * Reply processing -> reply_status, reply_sentiment
--      * Click tracking -> click_status
--      * Conversion attribution jobs -> conversion_status, conversion_value
--      * Complaint/ticket attribution -> complaint_flag, support_ticket_created
--      * Customer feedback -> post_send_rating
-- =====================================================================

CREATE TABLE public.outbound_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_log_id UUID NOT NULL UNIQUE REFERENCES public.outbound_send_logs(id) ON DELETE CASCADE,
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.outbound_campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES public.outbound_journeys(id) ON DELETE SET NULL,
  journey_step_id UUID REFERENCES public.outbound_journey_steps(id) ON DELETE SET NULL,
  message_template_id UUID REFERENCES public.outbound_message_templates(id) ON DELETE SET NULL,
  stage_snapshot JSONB NOT NULL DEFAULT '{}',
  channel_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  delivery_status TEXT NOT NULL DEFAULT 'unknown',
  seen_status TEXT NOT NULL DEFAULT 'unknown',
  reply_status TEXT NOT NULL DEFAULT 'none',
  reply_sentiment TEXT NOT NULL DEFAULT 'unknown',
  click_status TEXT NOT NULL DEFAULT 'none',
  conversion_status TEXT NOT NULL DEFAULT 'none',
  conversion_value NUMERIC,
  opt_out_status TEXT NOT NULL DEFAULT 'none',
  complaint_flag BOOLEAN NOT NULL DEFAULT false,
  support_ticket_created BOOLEAN NOT NULL DEFAULT false,
  post_send_rating INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_learning_event_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF NEW.delivery_status NOT IN ('unknown', 'delivered', 'bounced', 'rejected') THEN
    RAISE EXCEPTION 'Invalid delivery_status: %', NEW.delivery_status;
  END IF;
  IF NEW.seen_status NOT IN ('unknown', 'seen') THEN
    RAISE EXCEPTION 'Invalid seen_status: %', NEW.seen_status;
  END IF;
  IF NEW.reply_status NOT IN ('none', 'replied') THEN
    RAISE EXCEPTION 'Invalid reply_status: %', NEW.reply_status;
  END IF;
  IF NEW.reply_sentiment NOT IN ('unknown', 'positive', 'neutral', 'negative') THEN
    RAISE EXCEPTION 'Invalid reply_sentiment: %', NEW.reply_sentiment;
  END IF;
  IF NEW.click_status NOT IN ('none', 'clicked') THEN
    RAISE EXCEPTION 'Invalid click_status: %', NEW.click_status;
  END IF;
  IF NEW.conversion_status NOT IN ('none', 'converted') THEN
    RAISE EXCEPTION 'Invalid conversion_status: %', NEW.conversion_status;
  END IF;
  IF NEW.opt_out_status NOT IN ('none', 'opted_out') THEN
    RAISE EXCEPTION 'Invalid opt_out_status: %', NEW.opt_out_status;
  END IF;
  IF NEW.post_send_rating IS NOT NULL AND (NEW.post_send_rating < 1 OR NEW.post_send_rating > 5) THEN
    RAISE EXCEPTION 'post_send_rating must be between 1 and 5, got: %', NEW.post_send_rating;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_learning_event_status
  BEFORE INSERT OR UPDATE ON public.outbound_learning_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_learning_event_status();

CREATE TRIGGER trg_learning_events_updated_at
  BEFORE UPDATE ON public.outbound_learning_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_learning_events_campaign ON public.outbound_learning_events (campaign_id, created_at);
CREATE INDEX idx_learning_events_customer ON public.outbound_learning_events (customer_profile_id, created_at);
CREATE INDEX idx_learning_events_channel_delivery ON public.outbound_learning_events (channel_type, delivery_status);
CREATE INDEX idx_learning_events_journey_step ON public.outbound_learning_events (journey_id, journey_step_id);
CREATE INDEX idx_learning_events_converted ON public.outbound_learning_events (conversion_status) WHERE conversion_status = 'converted';
CREATE INDEX idx_learning_events_template ON public.outbound_learning_events (message_template_id, created_at);

ALTER TABLE public.outbound_learning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view learning events"
  ON public.outbound_learning_events FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can insert learning events"
  ON public.outbound_learning_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can update learning events"
  ON public.outbound_learning_events FOR UPDATE
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can delete learning events"
  ON public.outbound_learning_events FOR DELETE
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()));