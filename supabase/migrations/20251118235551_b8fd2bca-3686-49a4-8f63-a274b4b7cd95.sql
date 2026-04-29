-- Recreate the validation trigger
CREATE TRIGGER validate_package_id_trigger
BEFORE INSERT OR UPDATE ON esim_packages
FOR EACH ROW
EXECUTE FUNCTION validate_package_id();