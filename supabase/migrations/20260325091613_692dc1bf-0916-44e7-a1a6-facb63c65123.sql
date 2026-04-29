-- Expand prompt_experiments with additional fields
ALTER TABLE public.prompt_experiments
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS min_conversations integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS winner_version_id uuid REFERENCES public.prompt_versions(id),
  ADD COLUMN IF NOT EXISTS stop_loss_triggered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS stop_loss_metric text,
  ADD COLUMN IF NOT EXISTS stop_loss_threshold numeric(5,2);

-- Expand prompt_experiment_results with updated_at
ALTER TABLE public.prompt_experiment_results
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_winner boolean DEFAULT false;

-- Allow supervisors to insert experiments
CREATE POLICY "Supervisors can insert prompt_experiments"
  ON public.prompt_experiments FOR INSERT TO authenticated
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- Allow supervisors to insert experiment results
CREATE POLICY "Supervisors can insert prompt_experiment_results"
  ON public.prompt_experiment_results FOR INSERT TO authenticated
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- Allow supervisors to update experiment results
CREATE POLICY "Supervisors can update prompt_experiment_results"
  ON public.prompt_experiment_results FOR UPDATE TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()));