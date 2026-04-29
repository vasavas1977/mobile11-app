
-- Voice session logging for rate limiting and cost tracking
CREATE TABLE public.voice_sessions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  ip_address text,
  conversation_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  estimated_cost numeric(10,4),
  status text NOT NULL DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for rate limiting queries (recent sessions by IP)
CREATE INDEX idx_voice_sessions_log_ip_recent 
  ON public.voice_sessions_log (ip_address, started_at DESC)
  WHERE status = 'active';

-- Index for analytics
CREATE INDEX idx_voice_sessions_log_started 
  ON public.voice_sessions_log (started_at DESC);

-- Enable RLS (service role only)
ALTER TABLE public.voice_sessions_log ENABLE ROW LEVEL SECURITY;

-- Only admin/supervisor can view logs
CREATE POLICY "Agents can view voice session logs"
  ON public.voice_sessions_log FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

-- Cached KB system instruction to avoid re-fetching articles per session
CREATE TABLE public.voice_bot_instruction_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL UNIQUE,
  cached_instruction text NOT NULL,
  article_count integer NOT NULL DEFAULT 0,
  cached_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour')
);

ALTER TABLE public.voice_bot_instruction_cache ENABLE ROW LEVEL SECURITY;
