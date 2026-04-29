-- Create storage bucket for affiliate documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('affiliate-documents', 'affiliate-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own documents
CREATE POLICY "Users can upload affiliate documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'affiliate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can view their own documents
CREATE POLICY "Users can view own affiliate documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'affiliate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Admins can view all affiliate documents
CREATE POLICY "Admins can view all affiliate documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'affiliate-documents' AND public.has_role(auth.uid(), 'admin'));