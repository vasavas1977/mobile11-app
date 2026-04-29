-- Outbound Journeys and Journey Steps tables

CREATE TABLE public.outbound_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.outbound_campaigns(id) ON DELETE CASCADE,
  journey_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('campaign_start', 'stage_change', 'event_signal', 'manual', 'schedule')),
  trigger_definition JSONB NOT NULL DEFAULT '{}',
  stop_conditions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  max_steps INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.outbound_journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.outbound_journeys(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('send_message', 'check_condition', 'ai_decision', 'handoff', 'update_stage')),
  delay_before_hours INTEGER NOT NULL DEFAULT 0,
  channel_selection_rule TEXT NOT NULL DEFAULT 'preferred' CHECK (channel_selection_rule IN ('preferred', 'specific', 'ai_select')),
  specific_channel TEXT NULL,
  message_template_id UUID NULL,
  ai_generate_message BOOLEAN NOT NULL DEFAULT false,
  ai_generation_instructions TEXT NULL,
  action_if_replied TEXT NOT NULL DEFAULT 'stop' CHECK (action_if_replied IN ('stop', 'next_step', 'branch', 'hand_off')),
  action_if_no_reply TEXT NOT NULL DEFAULT 'next_step' CHECK (action_if_no_reply IN ('stop', 'next_step', 'branch', 'hand_off')),
  action_if_converted TEXT NOT NULL DEFAULT 'stop' CHECK (action_if_converted IN ('stop', 'next_step', 'celebrate')),
  branch_target_step INTEGER NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (journey_id, step_order)
);

CREATE INDEX idx_outbound_journeys_campaign_id ON public.outbound_journeys(campaign_id);
CREATE INDEX idx_outbound_journeys_status ON public.outbound_journeys(status);

CREATE TRIGGER set_outbound_journeys_updated_at
  BEFORE UPDATE ON public.outbound_journeys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_outbound_journey_steps_updated_at
  BEFORE UPDATE ON public.outbound_journey_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.outbound_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_journey_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view outbound journeys"
  ON public.outbound_journeys FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage outbound journeys"
  ON public.outbound_journeys FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Agents can view outbound journey steps"
  ON public.outbound_journey_steps FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage outbound journey steps"
  ON public.outbound_journey_steps FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));