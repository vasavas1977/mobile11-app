SELECT cron.unschedule('check-silent-conversations');

SELECT cron.schedule(
  'check-silent-conversations',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jaqyvbjllsanrnpzlyjw.supabase.co/functions/v1/check-silent-conversations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXl2YmpsbHNhbnJucHpseWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MzkwNjksImV4cCI6MjA3NDUxNTA2OX0.EVJdlMp1i1chtGKxdQ66ysmC-iAGefvr9JFLlvzaC34"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);