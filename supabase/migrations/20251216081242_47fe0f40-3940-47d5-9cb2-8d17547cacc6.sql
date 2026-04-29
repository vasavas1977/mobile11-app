-- Add session_token column to contacts for guest identification
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS session_token text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_session_token ON public.contacts(session_token);

-- Update contacts SELECT policy to allow guests to view their own contact via session token
CREATE POLICY "Guests can view their own contact by session token"
ON public.contacts
FOR SELECT
USING (
  session_token IS NOT NULL 
  AND session_token = current_setting('request.headers', true)::json->>'x-guest-session-token'
);

-- Allow guests to view conversations linked to their contact (via session token header)
CREATE POLICY "Guests can view their own conversations"
ON public.conversations
FOR SELECT
USING (
  contact_id IN (
    SELECT id FROM public.contacts 
    WHERE session_token IS NOT NULL 
    AND session_token = current_setting('request.headers', true)::json->>'x-guest-session-token'
  )
);

-- Allow guests to update their own conversations (for timestamp updates)
CREATE POLICY "Guests can update their own conversations"
ON public.conversations
FOR UPDATE
USING (
  contact_id IN (
    SELECT id FROM public.contacts 
    WHERE session_token IS NOT NULL 
    AND session_token = current_setting('request.headers', true)::json->>'x-guest-session-token'
  )
);

-- Allow guests to insert messages in their own conversations
CREATE POLICY "Guests can send messages in their conversations"
ON public.conversation_messages
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.contacts ct ON c.contact_id = ct.id
    WHERE ct.session_token IS NOT NULL 
    AND ct.session_token = current_setting('request.headers', true)::json->>'x-guest-session-token'
  )
);

-- Allow guests to view messages in their own conversations
CREATE POLICY "Guests can view messages in their conversations"
ON public.conversation_messages
FOR SELECT
USING (
  NOT is_internal_note AND
  conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.contacts ct ON c.contact_id = ct.id
    WHERE ct.session_token IS NOT NULL 
    AND ct.session_token = current_setting('request.headers', true)::json->>'x-guest-session-token'
  )
);