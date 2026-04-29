CREATE TABLE public.voice_live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT UNIQUE NOT NULL,
  conversation_id TEXT,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.voice_live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.voice_live_sessions
  FOR ALL USING (true) WITH CHECK (true);