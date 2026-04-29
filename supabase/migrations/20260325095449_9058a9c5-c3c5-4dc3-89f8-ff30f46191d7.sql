-- Domain Intent Library for Mobile11 telecom/eSIM support
CREATE TABLE public.domain_intent_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'support',
  ideal_behavior jsonb NOT NULL DEFAULT '{}',
  ideal_actions jsonb NOT NULL DEFAULT '[]',
  resolution_criteria jsonb NOT NULL DEFAULT '{}',
  typical_failures jsonb NOT NULL DEFAULT '[]',
  score_expectations jsonb NOT NULL DEFAULT '{}',
  related_kb_categories text[] DEFAULT '{}',
  related_action_types text[] DEFAULT '{}',
  related_cluster_names text[] DEFAULT '{}',
  target_channels text[] DEFAULT '{web,line,whatsapp,facebook,email}',
  matching_keywords text[] NOT NULL DEFAULT '{}',
  matching_patterns text[] DEFAULT '{}',
  total_conversations integer DEFAULT 0,
  avg_score numeric DEFAULT 0,
  avg_rating numeric DEFAULT 0,
  containment_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.domain_intent_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read domain intents"
ON public.domain_intent_library FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage domain intents"
ON public.domain_intent_library FOR ALL TO authenticated
USING (public.is_supervisor_or_higher(auth.uid()));

CREATE TABLE public.conversation_intent_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  intent_id uuid REFERENCES public.domain_intent_library(id) ON DELETE CASCADE NOT NULL,
  confidence numeric DEFAULT 0,
  matched_keywords text[] DEFAULT '{}',
  score_vs_expectation jsonb DEFAULT '{}',
  behavior_compliance jsonb DEFAULT '{}',
  improvement_suggestions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, intent_id)
);

ALTER TABLE public.conversation_intent_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read intent matches"
ON public.conversation_intent_matches FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Service role can manage intent matches"
ON public.conversation_intent_matches FOR ALL TO authenticated
USING (public.is_supervisor_or_higher(auth.uid()));

CREATE INDEX idx_conv_intent_matches_conv ON public.conversation_intent_matches(conversation_id);
CREATE INDEX idx_conv_intent_matches_intent ON public.conversation_intent_matches(intent_id);
CREATE INDEX idx_domain_intent_key ON public.domain_intent_library(intent_key);