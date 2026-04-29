-- Add whatsapp_phone column to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_phone text;

-- Drop existing constraint and recreate with whatsapp included
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_channel_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_channel_check 
  CHECK (channel IN ('email', 'web', 'line', 'facebook', 'instagram', 'tiktok', 'voice', 'form', 'whatsapp'));