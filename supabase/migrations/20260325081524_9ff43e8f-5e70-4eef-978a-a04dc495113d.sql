-- Expand ai_failure_type enum with new values
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'incomplete_answer';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'unclear_answer';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'wrong_language';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'weak_empathy';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'policy_risk';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'dead_air_trigger';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'unresolved_issue';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'repeated_contact_risk';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'missing_backend_action';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'missing_kb';
ALTER TYPE public.ai_failure_type ADD VALUE IF NOT EXISTS 'wrong_intent_classification';

-- Create configurable thresholds table
CREATE TABLE IF NOT EXISTS public.ai_score_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension text NOT NULL UNIQUE,
  warning_threshold smallint NOT NULL DEFAULT 60,
  critical_threshold smallint NOT NULL DEFAULT 40,
  auto_create_failure boolean NOT NULL DEFAULT true,
  failure_type_override text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_score_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents and above can view thresholds"
  ON public.ai_score_thresholds FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

-- Seed default thresholds
INSERT INTO public.ai_score_thresholds (dimension, warning_threshold, critical_threshold, auto_create_failure, failure_type_override) VALUES
  ('composite',          50, 35, true,  NULL),
  ('accuracy',           55, 40, true,  'wrong_answer'),
  ('resolution',         50, 30, true,  'unresolved_issue'),
  ('clarity',            50, 35, true,  'unclear_answer'),
  ('empathy',            50, 35, true,  'weak_empathy'),
  ('policy_compliance',  60, 40, true,  'policy_risk'),
  ('confidence',         45, 30, true,  NULL),
  ('predicted_csat',     45, 30, true,  NULL),
  ('business_outcome',   40, 25, false, NULL),
  ('customer_rating',    40, 20, true,  NULL)
ON CONFLICT (dimension) DO NOTHING;