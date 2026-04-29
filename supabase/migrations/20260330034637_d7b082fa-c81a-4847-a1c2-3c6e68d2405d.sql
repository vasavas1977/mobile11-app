-- Outbound Campaigns Module

CREATE TABLE public.outbound_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN (
    'sales_followup', 'promotion', 'education', 'win_back',
    'recovery', 'upsell', 'cross_sell', 'enterprise_outreach'
  )),
  campaign_objective TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'active', 'paused', 'completed', 'archived'
  )),
  scheduling_mode TEXT NOT NULL DEFAULT 'scheduled' CHECK (scheduling_mode IN ('scheduled', 'always_on')),
  target_audience_definition JSONB NOT NULL DEFAULT '{}',
  allowed_channels TEXT[] NOT NULL DEFAULT '{line,email,whatsapp,facebook}',
  priority INTEGER NOT NULL DEFAULT 100,
  preference_category TEXT DEFAULT NULL,
  goal_metric TEXT DEFAULT NULL,
  is_recovery_campaign BOOLEAN NOT NULL DEFAULT false,
  start_at TIMESTAMPTZ DEFAULT NULL,
  end_at TIMESTAMPTZ DEFAULT NULL,
  max_sends INTEGER DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outbound_campaigns_status ON public.outbound_campaigns (status);
CREATE INDEX idx_outbound_campaigns_type ON public.outbound_campaigns (campaign_type);
CREATE INDEX idx_outbound_campaigns_schedule ON public.outbound_campaigns (start_at, end_at);
CREATE INDEX idx_outbound_campaigns_created_by ON public.outbound_campaigns (created_by);
CREATE INDEX idx_outbound_campaigns_priority ON public.outbound_campaigns (priority);

ALTER TABLE public.outbound_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view outbound campaigns"
  ON public.outbound_campaigns FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage outbound campaigns"
  ON public.outbound_campaigns FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE TRIGGER update_outbound_campaigns_updated_at
  BEFORE UPDATE ON public.outbound_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();