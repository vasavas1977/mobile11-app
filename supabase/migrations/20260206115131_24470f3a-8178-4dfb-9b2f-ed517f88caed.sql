-- Enable TUGE provider for production use
UPDATE esim_providers 
SET is_active = true, updated_at = now() 
WHERE provider_code = 'tuge';