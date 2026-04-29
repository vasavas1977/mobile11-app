CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.system_config (key, value)
VALUES ('line_alert_group_id', '')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;