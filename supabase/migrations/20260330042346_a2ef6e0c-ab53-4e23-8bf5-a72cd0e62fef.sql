-- Outbound Message Templates table
CREATE TABLE public.outbound_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  campaign_type TEXT NULL CHECK (campaign_type IN ('sales_followup', 'promotion', 'education', 'win_back', 'recovery', 'upsell', 'cross_sell', 'enterprise_outreach')),
  channel_type TEXT NOT NULL CHECK (channel_type IN ('line', 'email', 'whatsapp', 'facebook')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'th')),
  intent_type TEXT NOT NULL CHECK (intent_type IN ('welcome', 'followup', 'reminder', 'offer', 'education', 'recovery', 'winback', 'upsell', 'cross_sell', 'thank_you')),
  tone_type TEXT NOT NULL DEFAULT 'friendly' CHECK (tone_type IN ('friendly', 'professional', 'urgent', 'casual', 'empathetic')),
  message_text TEXT NOT NULL,
  email_subject TEXT NULL,
  cta_type TEXT NULL CHECK (cta_type IN ('link', 'reply', 'button', 'none')),
  cta_text TEXT NULL,
  cta_url TEXT NULL,
  supported_variables JSONB DEFAULT '[]'::jsonb,
  version_label TEXT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_outbound_message_templates_lookup ON public.outbound_message_templates (channel_type, language, intent_type);
CREATE INDEX idx_outbound_message_templates_campaign ON public.outbound_message_templates (campaign_type);
CREATE INDEX idx_outbound_message_templates_active ON public.outbound_message_templates (is_active);

-- updated_at trigger
CREATE TRIGGER set_outbound_message_templates_updated_at
  BEFORE UPDATE ON public.outbound_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.outbound_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view message templates"
  ON public.outbound_message_templates FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage message templates"
  ON public.outbound_message_templates FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));