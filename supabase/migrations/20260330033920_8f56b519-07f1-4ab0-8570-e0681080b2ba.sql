-- Customer Consent, Suppression & Frequency Controls

-- 1. customer_preferences (1:1 with customer_profiles)
CREATE TABLE public.customer_preferences (
  customer_profile_id UUID PRIMARY KEY REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  prefers_sales_followup BOOLEAN NOT NULL DEFAULT true,
  prefers_news_and_promotions BOOLEAN NOT NULL DEFAULT true,
  opt_out_email BOOLEAN NOT NULL DEFAULT false,
  opt_out_line BOOLEAN NOT NULL DEFAULT false,
  opt_out_whatsapp BOOLEAN NOT NULL DEFAULT false,
  opt_out_facebook BOOLEAN NOT NULL DEFAULT false,
  opt_out_all BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME DEFAULT NULL,
  quiet_hours_end TIME DEFAULT NULL,
  max_sends_7d INTEGER NOT NULL DEFAULT 3,
  max_sends_30d INTEGER NOT NULL DEFAULT 8,
  manual_suppressed_until TIMESTAMPTZ DEFAULT NULL,
  manual_suppression_reason TEXT DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. outbound_suppression_logs
CREATE TABLE public.outbound_suppression_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  suppression_reason TEXT NOT NULL CHECK (suppression_reason IN (
    'opt_out_global', 'opt_out_channel', 'quiet_hours',
    'frequency_cap_7d', 'frequency_cap_30d',
    'unresolved_issue', 'bad_experience', 'manual_suppression'
  )),
  channel_type TEXT DEFAULT NULL,
  campaign_id UUID DEFAULT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_outbound_suppression_customer_created
  ON public.outbound_suppression_logs (customer_profile_id, created_at DESC);
CREATE INDEX idx_outbound_suppression_reason
  ON public.outbound_suppression_logs (suppression_reason);
CREATE INDEX idx_outbound_suppression_campaign
  ON public.outbound_suppression_logs (campaign_id) WHERE campaign_id IS NOT NULL;

-- RLS
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_suppression_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view customer preferences"
  ON public.customer_preferences FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage customer preferences"
  ON public.customer_preferences FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Agents can view suppression logs"
  ON public.outbound_suppression_logs FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage suppression logs"
  ON public.outbound_suppression_logs FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- updated_at trigger
CREATE TRIGGER update_customer_preferences_updated_at
  BEFORE UPDATE ON public.customer_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();