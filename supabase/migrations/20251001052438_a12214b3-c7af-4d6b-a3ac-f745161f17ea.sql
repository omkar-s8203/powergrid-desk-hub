-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily ticket summary at 9 AM every day
SELECT cron.schedule(
  'daily-ticket-summary',
  '0 9 * * *', -- At 9:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://etqwuohosdcxipvwevxt.supabase.co/functions/v1/daily-ticket-summary',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0cXd1b2hvc2RjeGlwdndldnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTM4MTAsImV4cCI6MjA3Mzc4OTgxMH0.GJZEFkh4g3ISAJp-1x73Ihnusl896IKKb5wY4LLO7K0"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);