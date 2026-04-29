
CREATE TABLE public.customer_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  fact_key TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  source_conversation_id UUID REFERENCES public.conversations(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, category, fact_key)
);

ALTER TABLE public.customer_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can read customer memory"
  ON public.customer_memory
  FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE INDEX idx_customer_memory_contact ON public.customer_memory(contact_id);
