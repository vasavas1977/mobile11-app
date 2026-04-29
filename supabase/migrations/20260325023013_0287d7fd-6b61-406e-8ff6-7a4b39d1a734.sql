CREATE TABLE public.dead_air_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  bot_message_id UUID REFERENCES conversation_messages(id) ON DELETE SET NULL,
  bot_message_content TEXT NOT NULL,
  channel TEXT DEFAULT 'web',
  silence_duration_seconds INTEGER NOT NULL,
  customer_returned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dead_air_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view dead air events"
  ON public.dead_air_events FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Service role can insert dead air events"
  ON public.dead_air_events FOR INSERT TO service_role
  WITH CHECK (true);

CREATE INDEX idx_dead_air_events_conversation_id ON public.dead_air_events(conversation_id);
CREATE INDEX idx_dead_air_events_created_at ON public.dead_air_events(created_at DESC);