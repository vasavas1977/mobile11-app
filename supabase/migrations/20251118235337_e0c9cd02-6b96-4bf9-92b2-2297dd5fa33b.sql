-- Drop the validation trigger temporarily
DROP TRIGGER IF EXISTS validate_package_id_trigger ON esim_packages;

-- We'll recreate it after the data update is complete
-- You'll need to run the edge function again after this migration