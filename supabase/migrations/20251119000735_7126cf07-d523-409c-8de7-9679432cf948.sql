-- Temporarily drop the validation trigger to allow updates
DROP TRIGGER IF EXISTS validate_package_id_trigger ON esim_packages;