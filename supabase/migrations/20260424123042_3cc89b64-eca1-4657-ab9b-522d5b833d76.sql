CREATE TABLE public.voice_bridge_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  call_sid TEXT,
  cid TEXT,
  caller_number TEXT,
  did_number TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  stage TEXT,
  message TEXT,
  elapsed_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_vbl_call_sid ON public.voice_bridge_logs(call_sid);
CREATE INDEX idx_vbl_created_at ON public.voice_bridge_logs(created_at DESC);
CREATE INDEX idx_vbl_did_created ON public.voice_bridge_logs(did_number, created_at DESC);
CREATE INDEX idx_vbl_stage ON public.voice_bridge_logs(stage);

ALTER TABLE public.voice_bridge_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors and admins can view bridge logs"
ON public.voice_bridge_logs
FOR SELECT
TO authenticated
USING (public.is_supervisor_or_higher(auth.uid()));

ALTER TABLE public.voice_bridge_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_bridge_logs;

SELECT cron.schedule(
  'voice-bridge-logs-cleanup',
  '15 3 * * *',
  $$ DELETE FROM public.voice_bridge_logs WHERE created_at < now() - interval '14 days'; $$
);