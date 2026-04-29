-- Add new columns to kb_improvement_candidates for richer proposals
ALTER TABLE public.kb_improvement_candidates
  ADD COLUMN IF NOT EXISTS suggested_title text,
  ADD COLUMN IF NOT EXISTS suggested_category text,
  ADD COLUMN IF NOT EXISTS suggested_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS confidence_level numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weakness_analysis text,
  ADD COLUMN IF NOT EXISTS missing_facts jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS related_failure_types jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS conversation_examples jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS published_article_id uuid REFERENCES public.kb_articles(id),
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;

-- Add new enum values for kb_issue_type
ALTER TYPE public.kb_issue_type ADD VALUE IF NOT EXISTS 'wrong_language';
ALTER TYPE public.kb_issue_type ADD VALUE IF NOT EXISTS 'bad_structure';
ALTER TYPE public.kb_issue_type ADD VALUE IF NOT EXISTS 'missing_facts';