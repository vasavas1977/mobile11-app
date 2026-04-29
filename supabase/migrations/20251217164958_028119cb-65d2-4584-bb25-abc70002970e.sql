-- Add LINE-specific columns to contacts table
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS line_user_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS line_display_name TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS line_picture_url TEXT;

-- Create unique index for LINE user lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_line_user_id ON public.contacts(line_user_id) WHERE line_user_id IS NOT NULL;