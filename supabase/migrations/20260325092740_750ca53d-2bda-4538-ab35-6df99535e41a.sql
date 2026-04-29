
CREATE TABLE IF NOT EXISTS public.missing_action_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_name text NOT NULL,
  action_description text,
  detected_intent text NOT NULL,
  example_customer_messages jsonb DEFAULT '[]'::jsonb,
  example_conversation_ids uuid[] DEFAULT '{}',
  occurrence_count integer DEFAULT 1,
  estimated_monthly_volume integer DEFAULT 0,
  estimated_containment_lift numeric(5,2) DEFAULT 0,
  estimated_csat_lift numeric(5,2) DEFAULT 0,
  impact_score numeric(5,2) DEFAULT 0,
  suggested_input_schema jsonb DEFAULT '{}'::jsonb,
  suggested_approval_required boolean DEFAULT false,
  cluster_id uuid REFERENCES public.ai_intent_clusters(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'detected',
  language text DEFAULT 'en',
  channel text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.missing_action_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors can read missing_action_candidates"
  ON public.missing_action_candidates FOR SELECT TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can update missing_action_candidates"
  ON public.missing_action_candidates FOR UPDATE TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Service role can insert missing_action_candidates"
  ON public.missing_action_candidates FOR INSERT TO authenticated
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE INDEX idx_missing_action_status ON public.missing_action_candidates(status);
CREATE INDEX idx_missing_action_impact ON public.missing_action_candidates(impact_score DESC);
