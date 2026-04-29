
-- Schedule cron job: AI scoring every 2 minutes
SELECT cron.schedule(
  'ai-score-conversations-every-2min',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url:='https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/ai-score-conversations',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- Schedule cron job: AI clustering every 30 minutes
SELECT cron.schedule(
  'ai-cluster-intents-every-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/ai-cluster-intents',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- Schedule cron job: AI daily report at 02:00 UTC
SELECT cron.schedule(
  'ai-daily-report-2am-utc',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/ai-daily-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
