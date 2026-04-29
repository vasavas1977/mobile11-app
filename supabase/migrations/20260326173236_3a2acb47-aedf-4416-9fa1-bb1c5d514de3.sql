CREATE TABLE public.fallback_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global',
  primary_provider_id UUID REFERENCES public.esim_providers(id) ON DELETE SET NULL,
  fallback_provider_id UUID REFERENCES public.esim_providers(id) ON DELETE SET NULL,
  trigger_condition TEXT NOT NULL DEFAULT 'failure_rate',
  trigger_threshold NUMERIC NOT NULL DEFAULT 50,
  priority INTEGER NOT NULL DEFAULT 10,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  recovery_success_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  cooldown_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fallback_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fallback rules" ON public.fallback_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));