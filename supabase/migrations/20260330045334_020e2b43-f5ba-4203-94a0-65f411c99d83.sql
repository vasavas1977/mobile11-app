-- Outbound Send Logs: permanent audit trail for all outbound message dispatches
CREATE TABLE public.outbound_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_queue_id UUID REFERENCES public.outbound_send_queue(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.outbound_campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES public.outbound_journeys(id) ON DELETE SET NULL,
  journey_step_id UUID REFERENCES public.outbound_journey_steps(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.journey_enrollments(id) ON DELETE SET NULL,
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  provider_name TEXT NULL,
  message_template_id UUID NULL,
  rendered_content TEXT NULL,
  email_subject TEXT NULL,
  send_attempt_number INTEGER NOT NULL DEFAULT 1,
  send_status TEXT NOT NULL DEFAULT 'pending',
  delivery_status TEXT NOT NULL DEFAULT 'unknown',
  reply_status TEXT NOT NULL DEFAULT 'none',
  click_status TEXT NOT NULL DEFAULT 'none',
  conversion_status TEXT NOT NULL DEFAULT 'none',
  external_message_id TEXT NULL,
  failure_reason TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  delivered_at TIMESTAMPTZ NULL,
  replied_at TIMESTAMPTZ NULL,
  clicked_at TIMESTAMPTZ NULL,
  converted_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger for send_status
CREATE OR REPLACE FUNCTION public.validate_send_log_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.send_status NOT IN ('pending', 'sending', 'sent', 'failed') THEN
    RAISE EXCEPTION 'Invalid send_status: %', NEW.send_status;
  END IF;
  IF NEW.delivery_status NOT IN ('unknown', 'delivered', 'bounced', 'rejected') THEN
    RAISE EXCEPTION 'Invalid delivery_status: %', NEW.delivery_status;
  END IF;
  IF NEW.reply_status NOT IN ('none', 'replied') THEN
    RAISE EXCEPTION 'Invalid reply_status: %', NEW.reply_status;
  END IF;
  IF NEW.click_status NOT IN ('none', 'clicked') THEN
    RAISE EXCEPTION 'Invalid click_status: %', NEW.click_status;
  END IF;
  IF NEW.conversion_status NOT IN ('none', 'converted') THEN
    RAISE EXCEPTION 'Invalid conversion_status: %', NEW.conversion_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_send_log_status
  BEFORE INSERT OR UPDATE ON public.outbound_send_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_send_log_status();

-- Indexes
CREATE INDEX idx_send_logs_customer ON public.outbound_send_logs (customer_profile_id, created_at);
CREATE INDEX idx_send_logs_campaign ON public.outbound_send_logs (campaign_id, created_at);
CREATE INDEX idx_send_logs_channel_status ON public.outbound_send_logs (channel_type, send_status);
CREATE INDEX idx_send_logs_external_msg ON public.outbound_send_logs (external_message_id) WHERE external_message_id IS NOT NULL;
CREATE INDEX idx_send_logs_status_agg ON public.outbound_send_logs (send_status, delivery_status);
CREATE INDEX idx_send_logs_journey_step ON public.outbound_send_logs (journey_id, journey_step_id);
CREATE INDEX idx_send_logs_provider ON public.outbound_send_logs (provider_name, created_at);

-- RLS
ALTER TABLE public.outbound_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view send logs"
  ON public.outbound_send_logs FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage send logs"
  ON public.outbound_send_logs FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));