-- Add LINE-specific fields to profiles table for LINE Login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS line_user_id TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS line_display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS line_picture_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Create index for LINE user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON public.profiles(line_user_id) WHERE line_user_id IS NOT NULL;

-- Update handle_new_user function to support LINE auth provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, auth_provider, line_user_id, line_display_name, line_picture_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name',
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email'),
    NEW.raw_user_meta_data->>'line_user_id',
    NEW.raw_user_meta_data->>'line_display_name',
    NEW.raw_user_meta_data->>'line_picture_url'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    line_user_id = EXCLUDED.line_user_id,
    line_display_name = EXCLUDED.line_display_name,
    line_picture_url = EXCLUDED.line_picture_url,
    auth_provider = COALESCE(EXCLUDED.auth_provider, profiles.auth_provider);
  
  -- Ensure every user has the customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;