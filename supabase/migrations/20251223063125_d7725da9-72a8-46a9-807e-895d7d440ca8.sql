-- Create email_whitelist table
CREATE TABLE public.email_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.email_whitelist ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Agents can view, Supervisors can manage
CREATE POLICY "Agents can view whitelist"
  ON public.email_whitelist
  FOR SELECT
  TO authenticated
  USING (is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can insert whitelist"
  ON public.email_whitelist
  FOR INSERT
  TO authenticated
  WITH CHECK (is_supervisor_or_higher(auth.uid()) OR is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can delete whitelist"
  ON public.email_whitelist
  FOR DELETE
  TO authenticated
  USING (is_supervisor_or_higher(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_email_whitelist_email ON public.email_whitelist(email);

-- Add comment
COMMENT ON TABLE public.email_whitelist IS 'Whitelisted email addresses that bypass spam filtering';