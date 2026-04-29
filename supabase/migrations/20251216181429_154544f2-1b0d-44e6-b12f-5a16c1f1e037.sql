-- Make ticket-attachments bucket public for viewing attachments
UPDATE storage.buckets 
SET public = true 
WHERE id = 'ticket-attachments';

-- Add policy for authenticated users to upload
CREATE POLICY "Allow authenticated uploads to ticket-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- Add policy for anon uploads (for guest chat users)
CREATE POLICY "Allow anon uploads to ticket-attachments"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'ticket-attachments');

-- Allow public read access
CREATE POLICY "Allow public read of ticket-attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ticket-attachments');