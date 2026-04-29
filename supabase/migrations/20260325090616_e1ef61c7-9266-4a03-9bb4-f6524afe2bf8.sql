-- FAQ Candidates table for auto-generated FAQ proposals
CREATE TABLE public.faq_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Content
  canonical_question text NOT NULL,
  customer_phrasings jsonb DEFAULT '[]',
  short_answer text,
  long_answer text,
  faq_title text,
  -- Classification
  intent_tag text,
  language text DEFAULT 'en',
  category text DEFAULT 'troubleshoot',
  -- Source
  source_cluster_id uuid REFERENCES public.ai_intent_clusters(id),
  source_failure_types jsonb DEFAULT '[]',
  conversation_count integer DEFAULT 0,
  sample_conversation_ids jsonb DEFAULT '[]',
  -- Scoring
  frequency_score numeric DEFAULT 0,
  confusion_score numeric DEFAULT 0,
  expected_support_reduction numeric DEFAULT 0,
  confidence numeric DEFAULT 0,
  priority integer DEFAULT 0,
  -- Workflow
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  publish_target text CHECK (publish_target IN ('bot-core-knowledge', 'public', 'internal', NULL)),
  published_article_id uuid REFERENCES public.kb_articles(id),
  rejected_reason text,
  approved_by uuid,
  -- Post-publish analytics
  pre_publish_low_rating_rate numeric,
  post_publish_low_rating_rate numeric,
  pre_publish_dead_air_rate numeric,
  post_publish_dead_air_rate numeric,
  published_at timestamptz,
  analytics_measured_at timestamptz,
  -- Meta
  generated_by text DEFAULT 'ai-faq-engine-v1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.faq_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on faq_candidates"
  ON public.faq_candidates FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins can read faq_candidates"
  ON public.faq_candidates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_faq_candidates_status ON public.faq_candidates(status);
CREATE INDEX idx_faq_candidates_priority ON public.faq_candidates(priority DESC);
CREATE INDEX idx_faq_candidates_cluster ON public.faq_candidates(source_cluster_id);