CREATE TABLE public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.esim_providers(id) ON DELETE CASCADE NOT NULL,
  job_type text NOT NULL DEFAULT 'api_sync',
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_seconds numeric,
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  error_details jsonb,
  triggered_by text DEFAULT 'manual',
  triggered_by_user_id uuid,
  metadata jsonb DEFAULT '{}',
  next_scheduled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sync_jobs_provider ON public.sync_jobs(provider_id);
CREATE INDEX idx_sync_jobs_status ON public.sync_jobs(status);
CREATE INDEX idx_sync_jobs_started ON public.sync_jobs(started_at DESC);
CREATE INDEX idx_sync_jobs_job_type ON public.sync_jobs(job_type);

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync jobs"
  ON public.sync_jobs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sync jobs"
  ON public.sync_jobs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sync jobs"
  ON public.sync_jobs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.sync_jobs (provider_id, job_type, status, started_at, completed_at, duration_seconds, records_processed, records_created, records_updated, records_failed, triggered_by, metadata)
VALUES 
  ('4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', 'api_sync', 'completed', '2026-02-06 01:40:00+00', '2026-02-06 01:43:51+00', 231, 10000, 10000, 0, 0, 'manual', '{"source": "TUGE Partner API", "endpoint": "/products"}'),
  ('4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', 'excel_import', 'completed', '2026-01-13 14:51:00+00', '2026-01-13 14:51:31+00', 31, 2144, 2144, 0, 0, 'manual', '{"file": "eSIM Quotation 1.2 (2026 Q1).xlsx", "sheet": "Global"}'),
  ('4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', 'excel_import', 'completed', '2026-02-11 08:13:00+00', '2026-02-11 08:13:16+00', 16, 2144, 0, 2144, 0, 'manual', '{"file": "eSIM Quotation 1.2 (2026 Q1) rev3.xlsx", "sheet": "Global"}'),
  ('4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', 'excel_import', 'completed', '2026-03-21 19:55:00+00', '2026-03-21 19:58:35+00', 215, 3233, 1089, 2144, 0, 'manual', '{"file": "eSIM Quotation 2026 Q1 rev4.xlsx", "sheet": "Global"}'),
  ('ed79f1a9-1c6f-450f-aae3-7fefc5cc2692', 'excel_import', 'completed', '2026-01-10 18:00:00+00', '2026-01-10 18:05:30+00', 330, 2558, 2558, 0, 0, 'manual', '{"file": "USIMSA_catalog_jan2026.xlsx", "sheet": "Packages"}'),
  ('ed79f1a9-1c6f-450f-aae3-7fefc5cc2692', 'price_update', 'completed', '2026-02-26 18:40:00+00', '2026-02-26 18:42:26+00', 146, 2558, 0, 2558, 0, 'manual', '{"file": "USIMSA_prices_feb2026.xlsx", "note": "Quarterly price update"}');