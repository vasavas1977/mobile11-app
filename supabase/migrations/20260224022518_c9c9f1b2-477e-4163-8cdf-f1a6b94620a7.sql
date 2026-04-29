CREATE TABLE public.chatbot_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT,
  name TEXT NOT NULL,
  destination TEXT,
  trip_days INTEGER,
  has_used_esim TEXT,
  data_usage TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads"
  ON public.chatbot_leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view leads"
  ON public.chatbot_leads FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));