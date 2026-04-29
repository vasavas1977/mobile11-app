-- Fix security warning: Set search_path for validate_package_id function
CREATE OR REPLACE FUNCTION validate_package_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if package_id looks like a UUID (8-4-4-4-12 format with hyphens)
  IF NEW.package_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'package_id cannot be a UUID format. It must be the provider optionId (e.g., "TH_1Days_1GB_Data")';
  END IF;
  
  -- Ensure package_id is not the same as the package's own id
  IF NEW.package_id::text = NEW.id::text THEN
    RAISE EXCEPTION 'package_id cannot be the same as the package id. It must be the provider optionId';
  END IF;
  
  RETURN NEW;
END;
$$;