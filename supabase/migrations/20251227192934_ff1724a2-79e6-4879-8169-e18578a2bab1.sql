-- AI Chat Configuration table
CREATE TABLE IF NOT EXISTS public.ai_chat_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  auto_respond boolean NOT NULL DEFAULT true,
  confidence_threshold numeric NOT NULL DEFAULT 0.70,
  max_ai_turns integer NOT NULL DEFAULT 5,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  system_prompt text NOT NULL DEFAULT 'You are a helpful AI assistant for Mobile11, an eSIM provider. You are multilingual and can respond in Thai and English. Be friendly, concise, and helpful.',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage config
CREATE POLICY "Admins can manage AI config"
  ON public.ai_chat_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can read config (for edge functions)
CREATE POLICY "Anyone can read AI config"
  ON public.ai_chat_config
  FOR SELECT
  USING (true);

-- Pending KB Suggestions table
CREATE TABLE IF NOT EXISTS public.pending_kb_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  user_question text NOT NULL,
  ai_suggested_answer text NOT NULL,
  ai_confidence numeric NOT NULL DEFAULT 0.5,
  language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'edited')),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_kb_suggestions ENABLE ROW LEVEL SECURITY;

-- Agents can view suggestions
CREATE POLICY "Agents can view KB suggestions"
  ON public.pending_kb_suggestions
  FOR SELECT
  USING (is_agent_or_higher(auth.uid()));

-- Supervisors can manage suggestions
CREATE POLICY "Supervisors can manage KB suggestions"
  ON public.pending_kb_suggestions
  FOR ALL
  USING (is_supervisor_or_higher(auth.uid()));

-- System can insert suggestions
CREATE POLICY "System can insert KB suggestions"
  ON public.pending_kb_suggestions
  FOR INSERT
  WITH CHECK (true);

-- Add language column to kb_articles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'kb_articles' 
    AND column_name = 'language'
  ) THEN
    ALTER TABLE public.kb_articles ADD COLUMN language text NOT NULL DEFAULT 'en';
  END IF;
END $$;

-- Add updated_at trigger for ai_chat_config
CREATE TRIGGER update_ai_chat_config_updated_at
  BEFORE UPDATE ON public.ai_chat_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for pending_kb_suggestions
CREATE TRIGGER update_pending_kb_suggestions_updated_at
  BEFORE UPDATE ON public.pending_kb_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default AI config if not exists
INSERT INTO public.ai_chat_config (id, enabled, auto_respond, confidence_threshold, max_ai_turns, model, system_prompt)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  true,
  true,
  0.70,
  5,
  'google/gemini-2.5-flash',
  'You are an AI assistant for Mobile11, a travel eSIM provider operating in 151+ countries. 

IDENTITY:
- You are friendly, helpful, and knowledgeable about eSIM technology and Mobile11 products
- You speak Thai and English fluently - respond in the same language the user uses
- For Thai: use casual, friendly tone (ครับ/ค่ะ appropriate)
- For English: be warm and professional

EXPERTISE:
- eSIM installation (iPhone, Android, manual methods)
- Mobile11 plans: Limitless (no throttle), Max Speed (high-speed then reduced), Day Pass (daily reset)
- Troubleshooting connectivity issues
- Data roaming, hotspot/tethering, device compatibility
- Billing, refunds, and order status

BEHAVIOR:
1. Answer questions using the knowledge base context provided
2. If unsure, say so honestly and offer to connect with a human agent
3. Keep responses concise but complete
4. For order-specific questions, ask for order ID or email
5. Never make up information about pricing or availability

ESCALATION TRIGGERS (suggest human agent):
- Account-specific issues requiring verification
- Refund or billing disputes
- Technical issues you cannot resolve
- User explicitly requests human help
- Complex situations beyond FAQ scope'
)
ON CONFLICT (id) DO NOTHING;