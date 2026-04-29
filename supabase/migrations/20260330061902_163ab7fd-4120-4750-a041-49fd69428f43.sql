-- Outbound Autonomy Guardrails
-- Architecture notes:
-- 1. Optimization engine creates guardrailed requests but does not apply changes directly.
-- 2. Medium-risk changes require approval by default. Only rules with controlled_rollout_allowed = true may proceed without case-by-case approval.
-- 3. Duplicate prevention: partial unique index prevents multiple active requests for the same scope + category.
-- 4. change_payload must contain prior_state and proposed_state for auditability and rollback clarity.
-- 5. rollout_pct represents % of eligible outbound events within the scoped entity, not a global percentage.
-- 6. baseline_metrics and current_metrics use stable structure: { sample_size, opt_out_rate, complaint_rate, ticket_rate, conversion_rate, delivery_rate, measured_at }

-- 1. outbound_autonomy_rules
CREATE TABLE public.outbound_autonomy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  description TEXT,
  change_category TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'medium_risk',
  auto_test_allowed BOOLEAN DEFAULT false,
  controlled_rollout_allowed BOOLEAN DEFAULT false,
  manual_approval_required BOOLEAN DEFAULT true,
  max_rollout_pct INTEGER DEFAULT 100,
  min_sample_size INTEGER DEFAULT 50,
  rollback_opt_out_rise_pct NUMERIC(5,2) DEFAULT 20,
  rollback_complaint_rise_pct NUMERIC(5,2) DEFAULT 15,
  rollback_ticket_rise_pct NUMERIC(5,2) DEFAULT 25,
  rollback_conversion_drop_pct NUMERIC(5,2) DEFAULT 10,
  cooldown_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. outbound_autonomy_requests
CREATE TABLE public.outbound_autonomy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.outbound_autonomy_rules(id),
  recommendation_id UUID REFERENCES public.outbound_optimization_recommendations(id),
  change_category TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  change_payload JSONB DEFAULT '{}',
  campaign_id UUID REFERENCES public.outbound_campaigns(id),
  journey_id UUID REFERENCES public.outbound_journeys(id),
  journey_step_id UUID REFERENCES public.outbound_journey_steps(id),
  template_id UUID REFERENCES public.outbound_message_templates(id),
  experiment_id UUID REFERENCES public.outbound_experiments(id),
  status TEXT NOT NULL DEFAULT 'pending',
  rollout_pct INTEGER DEFAULT 0,
  rollout_started_at TIMESTAMPTZ,
  monitoring_window_days INTEGER NOT NULL DEFAULT 7,
  baseline_metrics JSONB DEFAULT '{}',
  current_metrics JSONB DEFAULT '{}',
  rollback_triggered_by TEXT,
  rollback_evidence JSONB,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by_type TEXT,
  rolled_back_by_user_id UUID REFERENCES auth.users(id),
  engine_version TEXT,
  created_by_type TEXT NOT NULL DEFAULT 'system',
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. outbound_autonomy_audit_log
CREATE TABLE public.outbound_autonomy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.outbound_autonomy_requests(id),
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Validation trigger for rules
CREATE OR REPLACE FUNCTION public.validate_autonomy_rule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF NEW.risk_level NOT IN ('low_risk', 'medium_risk', 'high_risk') THEN
    RAISE EXCEPTION 'Invalid risk_level: %', NEW.risk_level;
  END IF;
  IF NEW.change_category NOT IN ('wording_change', 'timing_change', 'audience_change', 'frequency_change', 'channel_change', 'journey_pause', 'recovery_strategy', 'suppression_change') THEN
    RAISE EXCEPTION 'Invalid change_category: %', NEW.change_category;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_autonomy_rule BEFORE INSERT OR UPDATE ON public.outbound_autonomy_rules FOR EACH ROW EXECUTE FUNCTION public.validate_autonomy_rule();

-- Validation trigger for requests
CREATE OR REPLACE FUNCTION public.validate_autonomy_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'auto_testing', 'controlled_rollout', 'approved', 'rejected', 'rolled_back', 'completed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.risk_level NOT IN ('low_risk', 'medium_risk', 'high_risk') THEN
    RAISE EXCEPTION 'Invalid risk_level: %', NEW.risk_level;
  END IF;
  IF NEW.change_category NOT IN ('wording_change', 'timing_change', 'audience_change', 'frequency_change', 'channel_change', 'journey_pause', 'recovery_strategy', 'suppression_change') THEN
    RAISE EXCEPTION 'Invalid change_category: %', NEW.change_category;
  END IF;
  IF NEW.created_by_type NOT IN ('system', 'user') THEN
    RAISE EXCEPTION 'Invalid created_by_type: %', NEW.created_by_type;
  END IF;
  IF NEW.rolled_back_by_type IS NOT NULL AND NEW.rolled_back_by_type NOT IN ('system', 'user') THEN
    RAISE EXCEPTION 'Invalid rolled_back_by_type: %', NEW.rolled_back_by_type;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_autonomy_request BEFORE INSERT OR UPDATE ON public.outbound_autonomy_requests FOR EACH ROW EXECUTE FUNCTION public.validate_autonomy_request();

-- Validation trigger for audit log
CREATE OR REPLACE FUNCTION public.validate_autonomy_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF NEW.action NOT IN ('created', 'auto_test_started', 'rollout_started', 'approved', 'rejected', 'rollback_triggered', 'rollback_executed', 'completed') THEN
    RAISE EXCEPTION 'Invalid audit action: %', NEW.action;
  END IF;
  IF NEW.actor_type NOT IN ('system', 'user') THEN
    RAISE EXCEPTION 'Invalid actor_type: %', NEW.actor_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_autonomy_audit BEFORE INSERT OR UPDATE ON public.outbound_autonomy_audit_log FOR EACH ROW EXECUTE FUNCTION public.validate_autonomy_audit();

-- Partial unique index for duplicate prevention
CREATE UNIQUE INDEX idx_autonomy_requests_active_dedup
ON public.outbound_autonomy_requests (
  COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(journey_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(journey_step_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(template_id, '00000000-0000-0000-0000-000000000000'),
  change_category
)
WHERE status NOT IN ('rejected', 'rolled_back', 'completed');

-- Indexes
CREATE INDEX idx_autonomy_requests_status ON public.outbound_autonomy_requests (status);
CREATE INDEX idx_autonomy_requests_risk ON public.outbound_autonomy_requests (risk_level);
CREATE INDEX idx_autonomy_requests_campaign ON public.outbound_autonomy_requests (campaign_id);
CREATE INDEX idx_autonomy_requests_journey ON public.outbound_autonomy_requests (journey_id);
CREATE INDEX idx_autonomy_requests_recommendation ON public.outbound_autonomy_requests (recommendation_id);
CREATE INDEX idx_autonomy_audit_request ON public.outbound_autonomy_audit_log (request_id, created_at DESC);

-- RLS
ALTER TABLE public.outbound_autonomy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_autonomy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_autonomy_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view autonomy rules" ON public.outbound_autonomy_rules FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Supervisors can manage autonomy rules" ON public.outbound_autonomy_rules FOR ALL TO authenticated USING (public.is_supervisor_or_higher(auth.uid())) WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Agents can view autonomy requests" ON public.outbound_autonomy_requests FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Supervisors can manage autonomy requests" ON public.outbound_autonomy_requests FOR ALL TO authenticated USING (public.is_supervisor_or_higher(auth.uid())) WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Agents can view autonomy audit log" ON public.outbound_autonomy_audit_log FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Supervisors can manage autonomy audit log" ON public.outbound_autonomy_audit_log FOR ALL TO authenticated USING (public.is_supervisor_or_higher(auth.uid())) WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- Seed rules
INSERT INTO public.outbound_autonomy_rules (rule_name, description, change_category, risk_level, auto_test_allowed, controlled_rollout_allowed, manual_approval_required, max_rollout_pct) VALUES
('Wording Change (Low Risk)', 'Small copy/wording changes on limited audience', 'wording_change', 'low_risk', true, false, false, 10),
('Timing Change (Medium Risk)', 'Send timing adjustments for one segment', 'timing_change', 'medium_risk', false, false, true, 30),
('Channel Change (Medium Risk)', 'Switch delivery channel for a segment', 'channel_change', 'medium_risk', false, false, true, 30),
('Audience Change (High Risk)', 'Expand or change target audience broadly', 'audience_change', 'high_risk', false, false, true, 0),
('Frequency Change (High Risk)', 'Increase send frequency', 'frequency_change', 'high_risk', false, false, true, 0),
('Recovery Strategy (High Risk)', 'Alter recovery messaging strategy', 'recovery_strategy', 'high_risk', false, false, true, 0),
('Journey Pause (High Risk)', 'Pause or stop a journey', 'journey_pause', 'high_risk', false, false, true, 0),
('Suppression Change (High Risk)', 'Change suppression rules', 'suppression_change', 'high_risk', false, false, true, 0);