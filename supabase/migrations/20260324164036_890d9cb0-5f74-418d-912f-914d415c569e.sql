
-- Conversation ratings table for chat + voice bot feedback
CREATE TABLE public.conversation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  channel TEXT DEFAULT 'web',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversation_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can insert ratings (guests included)
CREATE POLICY "Anyone can insert ratings"
  ON public.conversation_ratings
  FOR INSERT
  WITH CHECK (true);

-- Agents can read ratings
CREATE POLICY "Agents can read ratings"
  ON public.conversation_ratings
  FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

-- FAQ analytics table for AI-powered question clustering
CREATE TABLE public.faq_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_cluster TEXT NOT NULL,
  question_count INTEGER DEFAULT 1,
  avg_rating NUMERIC(3,2),
  sample_questions JSONB DEFAULT '[]',
  channels JSONB DEFAULT '[]',
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  auto_suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faq_analytics ENABLE ROW LEVEL SECURITY;

-- Agents can read FAQ analytics
CREATE POLICY "Agents can read faq_analytics"
  ON public.faq_analytics
  FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

-- Service role can manage faq_analytics (for edge functions)
CREATE POLICY "Service role can manage faq_analytics"
  ON public.faq_analytics
  FOR ALL
  USING (true)
  WITH CHECK (true);
