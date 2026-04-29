
-- Enums
CREATE TYPE public.ai_failure_type AS ENUM (
  'wrong_answer','hallucination','language_mismatch','tone_inappropriate',
  'missing_knowledge','policy_violation','loop_detected','failed_handoff',
  'timeout','unknown'
);

CREATE TYPE public.ai_failure_severity AS ENUM ('low','medium','high','critical');

CREATE TYPE public.kb_issue_type AS ENUM (
  'missing_article','outdated_content','incomplete_answer','conflicting_info','low_clarity'
);

CREATE TYPE public.experiment_status AS ENUM ('draft','running','paused','completed','rolled_back');

-- 1. ai_conversation_scores
CREATE TABLE public.ai_conversation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel text,
  language text,
  ai_accuracy_score smallint CHECK (ai_accuracy_score BETWEEN 0 AND 100),
  ai_resolution_score smallint CHECK (ai_resolution_score BETWEEN 0 AND 100),
  ai_clarity_score smallint CHECK (ai_clarity_score BETWEEN 0 AND 100),
  ai_empathy_score smallint CHECK (ai_empathy_score BETWEEN 0 AND 100),
  ai_policy_compliance_score smallint CHECK (ai_policy_compliance_score BETWEEN 0 AND 100),
  ai_confidence_score smallint CHECK (ai_confidence_score BETWEEN 0 AND 100),
  predicted_customer_satisfaction_score smallint CHECK (predicted_customer_satisfaction_score BETWEEN 0 AND 100),
  business_outcome_score smallint CHECK (business_outcome_score BETWEEN 0 AND 100),
  composite_score smallint CHECK (composite_score BETWEEN 0 AND 100),
  scoring_model_version text,
  score_reasoning_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_conv_scores_conversation ON public.ai_conversation_scores(conversation_id);
CREATE INDEX idx_ai_conv_scores_customer ON public.ai_conversation_scores(customer_id);
CREATE INDEX idx_ai_conv_scores_created ON public.ai_conversation_scores(created_at);

-- 2. ai_failure_events
CREATE TABLE public.ai_failure_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  failure_type public.ai_failure_type NOT NULL,
  failure_subtype text,
  detected_by text NOT NULL DEFAULT 'system',
  severity public.ai_failure_severity NOT NULL DEFAULT 'medium',
  bot_response_excerpt text,
  customer_last_message text,
  root_cause_guess text,
  suggested_fix_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_failures_conversation ON public.ai_failure_events(conversation_id);
CREATE INDEX idx_ai_failures_customer ON public.ai_failure_events(customer_id);
CREATE INDEX idx_ai_failures_type ON public.ai_failure_events(failure_type);
CREATE INDEX idx_ai_failures_created ON public.ai_failure_events(created_at);

-- 3. ai_intent_clusters
CREATE TABLE public.ai_intent_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name text NOT NULL,
  cluster_description text,
  language text DEFAULT 'en',
  representative_questions jsonb DEFAULT '[]'::jsonb,
  conversation_count integer NOT NULL DEFAULT 0,
  average_customer_rating numeric(3,1),
  average_ai_score numeric(5,2),
  dead_air_rate numeric(5,2),
  human_handoff_rate numeric(5,2),
  resolved_without_human_rate numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_intent_clusters_name ON public.ai_intent_clusters(cluster_name);

-- 4. kb_improvement_candidates
CREATE TABLE public.kb_improvement_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  related_cluster_id uuid REFERENCES public.ai_intent_clusters(id) ON DELETE SET NULL,
  related_article_id uuid REFERENCES public.kb_articles(id) ON DELETE SET NULL,
  issue_type public.kb_issue_type NOT NULL,
  issue_summary text NOT NULL,
  current_kb_excerpt text,
  proposed_kb_draft text,
  expected_impact text,
  status text NOT NULL DEFAULT 'pending',
  generated_by text NOT NULL DEFAULT 'system',
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_candidates_status ON public.kb_improvement_candidates(status);
CREATE INDEX idx_kb_candidates_cluster ON public.kb_improvement_candidates(related_cluster_id);

-- 5. prompt_versions
CREATE TABLE public.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_type text NOT NULL,
  version_name text NOT NULL,
  description text,
  prompt_text text NOT NULL,
  language text DEFAULT 'en',
  channel_scope text[] DEFAULT '{}',
  intent_scope text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prompt_versions_type ON public.prompt_versions(prompt_type);
CREATE INDEX idx_prompt_versions_active ON public.prompt_versions(is_active) WHERE is_active = true;

-- 6. prompt_experiments
CREATE TABLE public.prompt_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name text NOT NULL,
  prompt_type text NOT NULL,
  control_prompt_version_id uuid REFERENCES public.prompt_versions(id) ON DELETE SET NULL,
  candidate_prompt_version_id uuid REFERENCES public.prompt_versions(id) ON DELETE SET NULL,
  target_channels text[] DEFAULT '{}',
  target_intents text[] DEFAULT '{}',
  rollout_percentage smallint NOT NULL DEFAULT 10 CHECK (rollout_percentage BETWEEN 0 AND 100),
  success_metric text,
  stop_loss_rule text,
  status public.experiment_status NOT NULL DEFAULT 'draft',
  started_at timestamptz,
  ended_at timestamptz
);
CREATE INDEX idx_prompt_experiments_status ON public.prompt_experiments(status);

-- 7. prompt_experiment_results
CREATE TABLE public.prompt_experiment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES public.prompt_experiments(id) ON DELETE CASCADE,
  prompt_version_id uuid REFERENCES public.prompt_versions(id) ON DELETE SET NULL,
  conversations_count integer NOT NULL DEFAULT 0,
  avg_customer_rating numeric(3,1),
  avg_ai_score numeric(5,2),
  dead_air_rate numeric(5,2),
  containment_rate numeric(5,2),
  human_handoff_rate numeric(5,2),
  repeat_contact_rate numeric(5,2),
  conversion_rate numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_experiment_results_exp ON public.prompt_experiment_results(experiment_id);

-- 8. autonomous_actions_log
CREATE TABLE public.autonomous_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  action_payload jsonb DEFAULT '{}'::jsonb,
  action_result jsonb DEFAULT '{}'::jsonb,
  action_status text NOT NULL DEFAULT 'completed',
  triggered_by text NOT NULL DEFAULT 'system',
  approval_status text NOT NULL DEFAULT 'auto_approved',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_auto_actions_conversation ON public.autonomous_actions_log(conversation_id);
CREATE INDEX idx_auto_actions_customer ON public.autonomous_actions_log(customer_id);
CREATE INDEX idx_auto_actions_type ON public.autonomous_actions_log(action_type);
CREATE INDEX idx_auto_actions_created ON public.autonomous_actions_log(created_at);

-- 9. ai_daily_optimization_reports
CREATE TABLE public.ai_daily_optimization_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL UNIQUE,
  total_conversations_analyzed integer NOT NULL DEFAULT 0,
  low_score_clusters jsonb DEFAULT '[]'::jsonb,
  top_failure_patterns jsonb DEFAULT '[]'::jsonb,
  kb_candidates_generated integer NOT NULL DEFAULT 0,
  prompt_candidates_generated integer NOT NULL DEFAULT 0,
  winning_experiments jsonb DEFAULT '[]'::jsonb,
  rollback_events jsonb DEFAULT '[]'::jsonb,
  executive_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_daily_reports_date ON public.ai_daily_optimization_reports(report_date);

-- RLS
ALTER TABLE public.ai_conversation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_failure_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_intent_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_improvement_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_experiment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_optimization_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT for agents+
CREATE POLICY "Agents can read ai_conversation_scores" ON public.ai_conversation_scores FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Agents can read ai_failure_events" ON public.ai_failure_events FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Agents can read ai_intent_clusters" ON public.ai_intent_clusters FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Agents can read kb_improvement_candidates" ON public.kb_improvement_candidates FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Agents can read prompt_versions" ON public.prompt_versions FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Agents can read prompt_experiments" ON public.prompt_experiments FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Agents can read prompt_experiment_results" ON public.prompt_experiment_results FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Agents can read autonomous_actions_log" ON public.autonomous_actions_log FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Agents can read ai_daily_optimization_reports" ON public.ai_daily_optimization_reports FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));

-- Supervisors can manage improvement tables
CREATE POLICY "Supervisors can update kb_improvement_candidates" ON public.kb_improvement_candidates FOR UPDATE TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));
CREATE POLICY "Supervisors can update prompt_versions" ON public.prompt_versions FOR UPDATE TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));
CREATE POLICY "Supervisors can update prompt_experiments" ON public.prompt_experiments FOR UPDATE TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));
