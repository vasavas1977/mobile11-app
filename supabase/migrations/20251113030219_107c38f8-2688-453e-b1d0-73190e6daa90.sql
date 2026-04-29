-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false);

-- Allow authenticated users to upload files to their own tickets
CREATE POLICY "Users can upload attachments to their tickets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM support_tickets
    WHERE user_id = auth.uid() OR email = auth.email()
  )
);

-- Allow users to view attachments from their tickets
CREATE POLICY "Users can view their ticket attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM support_tickets
    WHERE user_id = auth.uid() OR email = auth.email()
  )
);

-- Allow admins to upload and view all ticket attachments
CREATE POLICY "Admins can upload all ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view all ticket attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow users and admins to delete their own uploaded attachments
CREATE POLICY "Users can delete their ticket attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT id::text
      FROM support_tickets
      WHERE user_id = auth.uid() OR email = auth.email()
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);