-- Add missing columns to esim_packages table to match the full package structure
ALTER TABLE public.esim_packages
ADD COLUMN IF NOT EXISTS access_type text,
ADD COLUMN IF NOT EXISTS pre_installation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS top_up boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hot_spot boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS initialize_policy text;