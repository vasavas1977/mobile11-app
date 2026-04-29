-- Add new columns to ai_intent_clusters for richer failure clustering
ALTER TABLE public.ai_intent_clusters
  ADD COLUMN IF NOT EXISTS channel_distribution jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS language_distribution jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS common_bad_responses jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS root_cause_hypothesis text,
  ADD COLUMN IF NOT EXISTS recommended_action text,
  ADD COLUMN IF NOT EXISTS repeat_contact_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS containment_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS urgency_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS admin_label text,
  ADD COLUMN IF NOT EXISTS admin_notes text;
