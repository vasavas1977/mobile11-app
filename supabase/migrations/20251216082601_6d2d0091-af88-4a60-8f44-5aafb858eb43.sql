
-- Fix conversation_messages SELECT policies
DROP POLICY IF EXISTS "Agents can view all messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Guests can view messages in their conversations" ON public.conversation_messages;

-- Recreate as proper permissive policies
CREATE POLICY "Agents can view all messages" 
ON public.conversation_messages 
FOR SELECT 
USING (is_agent_or_higher(auth.uid()));

CREATE POLICY "Users can view messages in their conversations" 
ON public.conversation_messages 
FOR SELECT 
USING (
  NOT is_internal_note 
  AND conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN contacts ct ON c.contact_id = ct.id
    WHERE ct.user_id = auth.uid()
  )
);

CREATE POLICY "Guests can view messages in their conversations" 
ON public.conversation_messages 
FOR SELECT 
USING (
  NOT is_internal_note 
  AND conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN contacts ct ON c.contact_id = ct.id
    WHERE ct.session_token IS NOT NULL 
    AND ct.session_token = (current_setting('request.headers', true)::json->>'x-guest-session-token')
  )
);
