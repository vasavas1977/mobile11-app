-- Create storage bucket for price files
INSERT INTO storage.buckets (id, name, public)
VALUES ('price-files', 'price-files', false)
ON CONFLICT (id) DO NOTHING;

-- Admin upload policy
CREATE POLICY "Admins can upload price files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'price-files' AND
  public.has_role(auth.uid(), 'admin')
);

-- Admin read policy
CREATE POLICY "Admins can read price files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'price-files' AND
  public.has_role(auth.uid(), 'admin')
);

-- Admin delete policy
CREATE POLICY "Admins can delete price files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'price-files' AND
  public.has_role(auth.uid(), 'admin')
);

-- Admin update policy
CREATE POLICY "Admins can update price files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'price-files' AND
  public.has_role(auth.uid(), 'admin')
);

-- Create metadata table for tracking uploaded price files
CREATE TABLE public.price_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT NOT NULL CHECK (file_type IN ('tuge', 'usimsa', 'other')),
  sheet_name TEXT,
  packages_count INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);

-- Enable RLS on the metadata table
ALTER TABLE public.price_file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policy for admins to manage price file uploads
CREATE POLICY "Admins can manage price file uploads"
ON public.price_file_uploads
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));