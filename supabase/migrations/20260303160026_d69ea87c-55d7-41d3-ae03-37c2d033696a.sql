-- Allow anonymous users (anon role) to create contacts for web chat widget
-- Scoped: only when session_token is provided (not null)
CREATE POLICY "Anon can create contacts with session token"
ON public.contacts FOR INSERT
TO anon
WITH CHECK (session_token IS NOT NULL);

-- Also allow anon to read their own contact by session token (for conversation resume)
-- Check if this policy already exists first
DROP POLICY IF EXISTS "Guests can view their own contact by session token" ON public.contacts;
CREATE POLICY "Guests can view their own contact by session token"
ON public.contacts FOR SELECT
TO anon
USING (session_token IS NOT NULL AND session_token = current_setting('request.headers', true)::json->>'x-guest-session-token');

-- Allow anon to insert conversation_messages (for sending chat messages)
DROP POLICY IF EXISTS "Anon can insert conversation messages" ON public.conversation_messages;
CREATE POLICY "Anon can insert conversation messages"
ON public.conversation_messages FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to create conversations for web chat
DROP POLICY IF EXISTS "Anon can create web conversations" ON public.conversations;
CREATE POLICY "Anon can create web conversations"
ON public.conversations FOR INSERT
TO anon
WITH CHECK (channel = 'web');