
-- Approval policies table: flexible rule-matching engine
CREATE TABLE IF NOT EXISTS public.approval_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name text NOT NULL,
  description text,
  domain text NOT NULL,
  action_type_pattern text DEFAULT '*',
  risk_level text DEFAULT '*',
  channel_scope text[] DEFAULT '{}',
  language_scope text[] DEFAULT '{}',
  customer_tier_scope text[] DEFAULT '{}',
  intent_scope text[] DEFAULT '{}',
  decision text NOT NULL DEFAULT 'require_approval',
  max_auto_amount numeric DEFAULT 0,
  approval_roles text[] DEFAULT '{supervisor,admin}',
  escalation_timeout_hours integer DEFAULT 24,
  auto_test_allowed boolean DEFAULT false,
  canary_rollout_pct integer DEFAULT 0,
  priority integer DEFAULT 50,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Approval audit log
CREATE TABLE IF NOT EXISTS public.approval_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES public.approval_policies(id) ON DELETE SET NULL,
  domain text NOT NULL,
  action_type text,
  reference_id uuid,
  reference_table text,
  input_context jsonb DEFAULT '{}'::jsonb,
  decision text NOT NULL,
  decision_reason text,
  matched_policy_name text,
  risk_level text,
  channel text,
  language text,
  customer_tier text,
  decided_by text DEFAULT 'system',
  decided_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  rejection_reason text,
  execution_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors can manage approval_policies" ON public.approval_policies
  FOR ALL TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can read approval_audit_log" ON public.approval_audit_log
  FOR SELECT TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can insert approval_audit_log" ON public.approval_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can update approval_audit_log" ON public.approval_audit_log
  FOR UPDATE TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));

-- Indexes
CREATE INDEX idx_approval_policies_domain ON public.approval_policies(domain);
CREATE INDEX idx_approval_policies_active ON public.approval_policies(is_active, priority DESC);
CREATE INDEX idx_approval_audit_domain ON public.approval_audit_log(domain);
CREATE INDEX idx_approval_audit_status ON public.approval_audit_log(execution_status);
CREATE INDEX idx_approval_audit_decision ON public.approval_audit_log(decision);

-- Seed default policies
INSERT INTO public.approval_policies (policy_name, description, domain, action_type_pattern, risk_level, decision, max_auto_amount, priority, auto_test_allowed) VALUES
  ('Refund requests require approval', 'All refund creation actions must be approved by supervisor', 'backend_action', 'create_refund_request', 'high', 'require_approval', 0, 100, false),
  ('Compensation offers require approval', 'Any credit or compensation action needs human review', 'backend_action', 'offer_compensation', 'high', 'require_approval', 0, 95, false),
  ('High-value refunds need admin', 'Refunds above 50 USD require admin approval', 'backend_action', 'create_refund_request', 'critical', 'require_approval', 50, 110, false),
  ('Read-only actions auto-approve', 'Status checks and lookups can proceed automatically', 'backend_action', 'check_*', 'low', 'auto_approve', 0, 20, true),
  ('KB wording changes can auto-test', 'Minor KB text updates can be shadow-tested', 'kb_improvement', '*', 'low', 'auto_test', 0, 30, true),
  ('KB policy content needs review', 'Policy-related KB changes require supervisor approval', 'kb_improvement', '*', 'high', 'require_approval', 0, 80, false),
  ('Prompt refund flow changes need review', 'Prompt changes affecting refund intents require approval', 'prompt_experiment', 'refund_prompt', 'high', 'require_approval', 0, 90, false),
  ('Prompt tone adjustments auto-test', 'Low-risk prompt wording changes can canary test', 'prompt_experiment', '*', 'low', 'auto_test', 0, 25, true),
  ('Escalation tickets auto-approve', 'Creating escalation tickets is safe to auto-approve', 'backend_action', 'create_escalation_ticket', 'low', 'auto_approve', 0, 40, true),
  ('Human handoff auto-approve', 'Transferring to human agent is always safe', 'backend_action', 'human_handoff', 'low', 'auto_approve', 0, 50, true),
  ('Sales lead creation auto-approve', 'Creating leads from conversations is low-risk', 'backend_action', 'create_sales_lead', 'low', 'auto_approve', 0, 35, true),
  ('FAQ publish needs review', 'Publishing new FAQ to public requires approval', 'faq_publish', '*', 'medium', 'require_approval', 0, 60, true);
