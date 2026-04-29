
-- Risk level enum
CREATE TYPE public.guardrail_risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Change domain enum
CREATE TYPE public.guardrail_change_domain AS ENUM (
  'kb_proposal', 'prompt_rollout', 'backend_action', 'faq_publish',
  'refund_credit', 'policy_response', 'language_change', 'experiment'
);

-- Guardrail rules table
CREATE TABLE IF NOT EXISTS public.guardrail_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain guardrail_change_domain NOT NULL,
  risk_level guardrail_risk_level NOT NULL DEFAULT 'medium',
  rule_name text NOT NULL,
  description text,
  requires_approval boolean NOT NULL DEFAULT true,
  max_rollout_pct integer DEFAULT 100,
  canary_enabled boolean DEFAULT false,
  shadow_test_enabled boolean DEFAULT false,
  auto_rollback_enabled boolean DEFAULT true,
  rollback_score_drop_threshold numeric(5,2) DEFAULT 5.0,
  rollback_dead_air_rise_threshold numeric(5,2) DEFAULT 10.0,
  rollback_low_rating_threshold numeric(5,2) DEFAULT 15.0,
  min_canary_conversations integer DEFAULT 50,
  cooldown_hours integer DEFAULT 24,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Change requests table
CREATE TABLE IF NOT EXISTS public.guardrail_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain guardrail_change_domain NOT NULL,
  risk_level guardrail_risk_level NOT NULL,
  change_type text NOT NULL,
  change_title text NOT NULL,
  change_description text,
  change_payload jsonb DEFAULT '{}'::jsonb,
  reference_id uuid,
  reference_table text,
  status text NOT NULL DEFAULT 'pending',
  rollout_pct integer DEFAULT 0,
  rollout_mode text DEFAULT 'full',
  canary_started_at timestamptz,
  canary_result jsonb,
  shadow_result jsonb,
  approval_required boolean DEFAULT true,
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  rejection_reason text,
  promoted_at timestamptz,
  promoted_by uuid,
  reverted_at timestamptz,
  reverted_by uuid,
  revert_reason text,
  previous_version_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Rollback events log
CREATE TABLE IF NOT EXISTS public.guardrail_rollback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id uuid REFERENCES public.guardrail_change_requests(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  trigger_metric text,
  trigger_value numeric,
  threshold_value numeric,
  rolled_back_to uuid,
  rolled_back_by text DEFAULT 'system',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.guardrail_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardrail_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardrail_rollback_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors can read guardrail_rules" ON public.guardrail_rules
  FOR SELECT TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));
CREATE POLICY "Supervisors can manage guardrail_rules" ON public.guardrail_rules
  FOR ALL TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can read change_requests" ON public.guardrail_change_requests
  FOR SELECT TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));
CREATE POLICY "Supervisors can manage change_requests" ON public.guardrail_change_requests
  FOR ALL TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can read rollback_events" ON public.guardrail_rollback_events
  FOR SELECT TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));
CREATE POLICY "Supervisors can insert rollback_events" ON public.guardrail_rollback_events
  FOR INSERT TO authenticated WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- Indexes
CREATE INDEX idx_change_requests_status ON public.guardrail_change_requests(status);
CREATE INDEX idx_change_requests_domain ON public.guardrail_change_requests(domain);
CREATE INDEX idx_rollback_events_change ON public.guardrail_rollback_events(change_request_id);

-- Seed default guardrail rules
INSERT INTO public.guardrail_rules (domain, risk_level, rule_name, description, requires_approval, max_rollout_pct, canary_enabled, shadow_test_enabled, auto_rollback_enabled) VALUES
  ('kb_proposal', 'low', 'KB minor update', 'Small factual corrections to existing KB articles', false, 100, false, false, true),
  ('kb_proposal', 'medium', 'KB new article', 'New KB article covering previously missing topic', true, 50, true, false, true),
  ('kb_proposal', 'high', 'KB policy content', 'Changes to refund, warranty, or legal policy content', true, 10, true, true, true),
  ('prompt_rollout', 'low', 'Tone adjustment', 'Minor wording or tone changes to prompts', false, 100, false, false, true),
  ('prompt_rollout', 'medium', 'Prompt logic change', 'Changes to prompt flow or decision logic', true, 30, true, false, true),
  ('prompt_rollout', 'high', 'System prompt rewrite', 'Full rewrite of system or global prompt', true, 10, true, true, true),
  ('backend_action', 'low', 'Read-only action', 'Actions that only read data (check status, lookup)', false, 100, false, false, true),
  ('backend_action', 'medium', 'Write action', 'Actions that create tickets, leads, or schedule tasks', true, 50, true, false, true),
  ('backend_action', 'high', 'Financial action', 'Refunds, credits, payment modifications', true, 0, true, true, true),
  ('refund_credit', 'critical', 'Refund approval', 'Any refund or credit issuance requires human approval', true, 0, false, false, true),
  ('policy_response', 'high', 'Policy-sensitive reply', 'Responses about legal, warranty, or regulatory topics', true, 10, true, true, true),
  ('language_change', 'medium', 'Language prompt update', 'Changes to language-specific prompt instructions', true, 30, true, false, true),
  ('faq_publish', 'low', 'FAQ internal only', 'Publishing FAQ as internal-only article', false, 100, false, false, true),
  ('faq_publish', 'medium', 'FAQ public publish', 'Publishing FAQ to public help center', true, 50, true, false, true),
  ('experiment', 'medium', 'A/B experiment', 'Running prompt experiment with controlled traffic', true, 50, true, false, true);
