-- Create storage bucket for regional images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'regional-images',
  'regional-images',
  true,
  5242880, -- 5MB
  ARRAY['image/webp', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to regional images
CREATE POLICY "Public read access for regional images"
ON storage.objects FOR SELECT
USING (bucket_id = 'regional-images');

-- Allow service role to upload images
CREATE POLICY "Service role can upload regional images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'regional-images');

-- Allow service role to update images
CREATE POLICY "Service role can update regional images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'regional-images');

-- Allow service role to delete images
CREATE POLICY "Service role can delete regional images"
ON storage.objects FOR DELETE
USING (bucket_id = 'regional-images');