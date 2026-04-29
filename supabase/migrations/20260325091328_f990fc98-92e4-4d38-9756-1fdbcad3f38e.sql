-- Add model_scope and updated_at to prompt_versions
ALTER TABLE public.prompt_versions
  ADD COLUMN IF NOT EXISTS model_scope text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Allow supervisors to insert prompt versions
CREATE POLICY "Supervisors can insert prompt_versions"
  ON public.prompt_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- Allow supervisors to delete prompt versions
CREATE POLICY "Supervisors can delete prompt_versions"
  ON public.prompt_versions FOR DELETE TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()));