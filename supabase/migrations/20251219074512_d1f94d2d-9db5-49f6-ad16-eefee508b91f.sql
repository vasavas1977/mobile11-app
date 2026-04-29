-- Add Facebook display columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS facebook_display_name text,
ADD COLUMN IF NOT EXISTS facebook_picture_url text;