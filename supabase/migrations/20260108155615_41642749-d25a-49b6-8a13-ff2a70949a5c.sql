-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create the cron job to call process-auto-renewal every 5 minutes
SELECT cron.schedule(
  'process-auto-renewal-job',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/process-auto-renewal',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34'
      ),
      body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
    ) AS request_id;
  $$
);