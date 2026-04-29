-- Phase 0 voice bot diagnostic instrumentation
CREATE TABLE IF NOT EXISTS public.voice_diagnostic_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_event_id uuid NOT NULL,
  live_session_id uuid NOT NULL,
  conversation_id uuid,
  turn_id integer NOT NULL,
  conversation_turn_count integer NOT NULL,
  refresh_trigger text NOT NULL DEFAULT 'none'
    CHECK (refresh_trigger IN ('none','turn_count','timer','reconnect')),
  refreshed_this_turn boolean NOT NULL DEFAULT false,
  server_prompt_had_history boolean NOT NULL DEFAULT false,
  vad_commit_to_first_audio_ms integer,
  name_adoption_state text NOT NULL DEFAULT 'unknown',
  channel text NOT NULL CHECK (channel IN ('webchat','pstn')),
  ts_client bigint NOT NULL,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS voice_diagnostic_events_client_event_id_uq
  ON public.voice_diagnostic_events (client_event_id);
CREATE INDEX IF NOT EXISTS voice_diagnostic_events_live_session_idx
  ON public.voice_diagnostic_events (live_session_id, ts_client);
CREATE INDEX IF NOT EXISTS voice_diagnostic_events_created_at_idx
  ON public.voice_diagnostic_events (created_at);

-- RLS enabled but no policies. Table is not exposed via PostgREST.
-- The voice-diag edge function uses the service role (bypasses RLS); the
-- X-Diag-Secret header is the actual gate.
ALTER TABLE public.voice_diagnostic_events ENABLE ROW LEVEL SECURITY;

-- 7-day retention. pg_cron is already installed in this project.
DO $$
BEGIN
  PERFORM cron.unschedule('voice-diagnostic-events-retention')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'voice-diagnostic-events-retention');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'voice-diagnostic-events-retention',
  '17 3 * * *',
  $$DELETE FROM public.voice_diagnostic_events WHERE created_at < now() - interval '7 days'$$
);