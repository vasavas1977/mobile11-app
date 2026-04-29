
-- Table: ai_generated_message_batches
CREATE TABLE public.ai_generated_message_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('line', 'email', 'whatsapp', 'facebook')),
  intent_type TEXT NOT NULL,
  tone_type TEXT NOT NULL DEFAULT 'friendly' CHECK (tone_type IN ('friendly', 'professional', 'urgent', 'casual', 'empathetic')),
  customer_profile_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  customer_context JSONB NOT NULL DEFAULT '{}',
  generated_variants JSONB NOT NULL DEFAULT '[]',
  prompt_version TEXT NULL,
  generation_engine TEXT NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'partially_approved', 'approved', 'rejected')),
  approved_template_ids UUID[] DEFAULT '{}',
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_gen_batches_campaign ON public.ai_generated_message_batches (campaign_type);
CREATE INDEX idx_ai_gen_batches_channel ON public.ai_generated_message_batches (channel_type);
CREATE INDEX idx_ai_gen_batches_status ON public.ai_generated_message_batches (status);
CREATE INDEX idx_ai_gen_batches_created ON public.ai_generated_message_batches (created_at DESC);

-- RLS
ALTER TABLE public.ai_generated_message_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view AI message batches"
  ON public.ai_generated_message_batches
  FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage AI message batches"
  ON public.ai_generated_message_batches
  FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));
