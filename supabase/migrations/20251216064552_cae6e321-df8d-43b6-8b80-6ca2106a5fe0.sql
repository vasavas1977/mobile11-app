-- Create contacts table (unified customer profiles across channels)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  name TEXT,
  line_id TEXT,
  facebook_id TEXT,
  instagram_id TEXT,
  tiktok_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);

-- Create conversations table (unified across all channels)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('email', 'web', 'line', 'facebook', 'instagram', 'tiktok', 'voice')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  subject TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX idx_conversations_assigned ON public.conversations(assigned_to);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_channel ON public.conversations(channel);

-- Create conversation_messages table
CREATE TABLE public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'customer' CHECK (sender_type IN ('customer', 'agent', 'system', 'bot')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversation_messages_conversation ON public.conversation_messages(conversation_id);

-- Create agent_status table (availability tracking)
CREATE TABLE public.agent_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  active_conversations INTEGER NOT NULL DEFAULT 0,
  max_conversations INTEGER NOT NULL DEFAULT 5,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_status_status ON public.agent_status(status);

-- Create kb_articles table (knowledge base)
CREATE TABLE public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_kb_articles_category ON public.kb_articles(category);
CREATE INDEX idx_kb_articles_published ON public.kb_articles(is_published);

-- Create canned_responses table (quick replies)
CREATE TABLE public.canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  category TEXT DEFAULT 'general',
  is_global BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_canned_responses_shortcut ON public.canned_responses(shortcut);
CREATE INDEX idx_canned_responses_category ON public.canned_responses(category);

-- Create agent_metrics_daily table (analytics)
CREATE TABLE public.agent_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  conversations_handled INTEGER NOT NULL DEFAULT 0,
  conversations_resolved INTEGER NOT NULL DEFAULT 0,
  avg_response_time_seconds INTEGER,
  avg_resolution_time_seconds INTEGER,
  customer_satisfaction_score NUMERIC(3,2),
  messages_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, date)
);

CREATE INDEX idx_agent_metrics_agent ON public.agent_metrics_daily(agent_id);
CREATE INDEX idx_agent_metrics_date ON public.agent_metrics_daily(date);

-- Enable RLS on all tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is agent or higher
CREATE OR REPLACE FUNCTION public.is_agent_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('agent', 'supervisor', 'admin')
  )
$$;

-- Helper function to check if user is supervisor or higher
CREATE OR REPLACE FUNCTION public.is_supervisor_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('supervisor', 'admin')
  )
$$;

-- RLS Policies for contacts
CREATE POLICY "Agents can view all contacts"
ON public.contacts FOR SELECT
USING (is_agent_or_higher(auth.uid()));

CREATE POLICY "Agents can create contacts"
ON public.contacts FOR INSERT
WITH CHECK (is_agent_or_higher(auth.uid()));

CREATE POLICY "Agents can update contacts"
ON public.contacts FOR UPDATE
USING (is_agent_or_higher(auth.uid()));

CREATE POLICY "Users can view their own contact"
ON public.contacts FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for conversations
CREATE POLICY "Agents can view all conversations"
ON public.conversations FOR SELECT
USING (is_agent_or_higher(auth.uid()));

CREATE POLICY "Agents can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (is_agent_or_higher(auth.uid()));

CREATE POLICY "Agents can update conversations"
ON public.conversations FOR UPDATE
USING (is_agent_or_higher(auth.uid()));

CREATE POLICY "Customers can view their own conversations"
ON public.conversations FOR SELECT
USING (contact_id IN (SELECT id FROM public.contacts WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can create web conversations"
ON public.conversations FOR INSERT
WITH CHECK (channel = 'web');

-- RLS Policies for conversation_messages
CREATE POLICY "Agents can view all messages"
ON public.conversation_messages FOR SELECT
USING (is_agent_or_higher(auth.uid()) OR (
  NOT is_internal_note AND 
  conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.contacts ct ON c.contact_id = ct.id
    WHERE ct.user_id = auth.uid()
  )
));

CREATE POLICY "Agents can create messages"
ON public.conversation_messages FOR INSERT
WITH CHECK (is_agent_or_higher(auth.uid()) OR sender_type = 'customer');

-- RLS Policies for agent_status
CREATE POLICY "Anyone can view agent status"
ON public.agent_status FOR SELECT
USING (true);

CREATE POLICY "Agents can manage their own status"
ON public.agent_status FOR ALL
USING (user_id = auth.uid() AND is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage all agent status"
ON public.agent_status FOR ALL
USING (is_supervisor_or_higher(auth.uid()));

-- RLS Policies for kb_articles
CREATE POLICY "Anyone can view published public articles"
ON public.kb_articles FOR SELECT
USING (is_published = true AND is_internal = false);

CREATE POLICY "Agents can view all articles including internal"
ON public.kb_articles FOR SELECT
USING (is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage articles"
ON public.kb_articles FOR ALL
USING (is_supervisor_or_higher(auth.uid()));

-- RLS Policies for canned_responses
CREATE POLICY "Agents can view canned responses"
ON public.canned_responses FOR SELECT
USING (is_agent_or_higher(auth.uid()) AND (is_global = true OR created_by = auth.uid()));

CREATE POLICY "Supervisors can manage global canned responses"
ON public.canned_responses FOR ALL
USING (is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Agents can manage their own canned responses"
ON public.canned_responses FOR ALL
USING (is_agent_or_higher(auth.uid()) AND created_by = auth.uid() AND is_global = false);

-- RLS Policies for agent_metrics_daily
CREATE POLICY "Agents can view their own metrics"
ON public.agent_metrics_daily FOR SELECT
USING (agent_id = auth.uid());

CREATE POLICY "Supervisors can view all metrics"
ON public.agent_metrics_daily FOR SELECT
USING (is_supervisor_or_higher(auth.uid()));

CREATE POLICY "System can insert metrics"
ON public.agent_metrics_daily FOR INSERT
WITH CHECK (true);

-- Triggers for updated_at columns
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_status_updated_at
BEFORE UPDATE ON public.agent_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kb_articles_updated_at
BEFORE UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canned_responses_updated_at
BEFORE UPDATE ON public.canned_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();