
-- Voice bot configuration table
CREATE TABLE public.voice_bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  did_number text,
  sip_trunk_host text,
  greeting_message text NOT NULL DEFAULT 'Hello! Thank you for calling Mobile11. How can I help you today?',
  greeting_language text NOT NULL DEFAULT 'en-US',
  voice_name text NOT NULL DEFAULT 'en-US-Neural2-F',
  mode text NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'ivr', 'forward')),
  forward_number text,
  max_call_duration_seconds integer NOT NULL DEFAULT 300,
  escalation_message text NOT NULL DEFAULT 'Let me transfer you to a live agent. Please hold.',
  webhook_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_bot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view voice bot config"
  ON public.voice_bot_config FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage voice bot config"
  ON public.voice_bot_config FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- Voice call logs table
CREATE TABLE public.voice_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id text NOT NULL,
  caller_number text,
  did_number text,
  conversation_id uuid REFERENCES public.conversations(id),
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'in_progress', 'completed', 'failed', 'escalated')),
  duration_seconds integer,
  transcript text,
  ai_responses jsonb DEFAULT '[]'::jsonb,
  escalated_to uuid,
  escalation_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view call logs"
  ON public.voice_call_logs FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "System can insert call logs"
  ON public.voice_call_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update call logs"
  ON public.voice_call_logs FOR UPDATE
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

-- Insert default config
INSERT INTO public.voice_bot_config (is_enabled) VALUES (false);

-- Add trigger for updated_at
CREATE TRIGGER update_voice_bot_config_updated_at
  BEFORE UPDATE ON public.voice_bot_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
