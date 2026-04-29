
-- Fix conversations SELECT policies - drop restrictive ones and create permissive ones
DROP POLICY IF EXISTS "Agents can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Customers can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Guests can view their own conversations" ON public.conversations;

-- Create permissive SELECT policy that allows agents OR customers OR guests
CREATE POLICY "Agents can view all conversations" 
ON public.conversations 
FOR SELECT 
USING (is_agent_or_higher(auth.uid()));

CREATE POLICY "Customers can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (contact_id IN (SELECT id FROM contacts WHERE user_id = auth.uid()));

CREATE POLICY "Guests can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (contact_id IN (
  SELECT id FROM contacts 
  WHERE session_token IS NOT NULL 
  AND session_token = (current_setting('request.headers', true)::json->>'x-guest-session-token')
));
