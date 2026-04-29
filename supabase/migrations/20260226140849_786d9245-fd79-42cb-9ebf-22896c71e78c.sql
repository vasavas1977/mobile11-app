
-- Fix 1: Make ticket-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'ticket-attachments';

-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view ticket attachments" ON storage.objects;

-- Create restricted policies for ticket-attachments
-- Agents/admins can view all attachments
CREATE POLICY "Agents can view ticket attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  public.is_agent_or_higher(auth.uid())
);

-- Authenticated users can view attachments from their own conversations
CREATE POLICY "Users view own conversation attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT c.id FROM conversations c
    JOIN contacts ct ON c.contact_id = ct.id
    WHERE ct.user_id = auth.uid()
  )
);

-- Keep upload policy but restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can upload ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;

CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  auth.role() = 'authenticated'
);

-- Fix 2: Restrict contacts INSERT to authenticated users or remove wide-open policy
-- Edge functions (create-ticket, ai-chat-response) use service role key which bypasses RLS
DROP POLICY IF EXISTS "Anyone can create contacts for chat widget" ON public.contacts;

-- Allow authenticated users to create contacts
CREATE POLICY "Authenticated users can create contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (true);
