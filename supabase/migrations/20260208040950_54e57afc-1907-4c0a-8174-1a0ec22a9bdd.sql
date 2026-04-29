-- Fix missing provider_id for Global 109 Countries packages
UPDATE esim_packages 
SET 
  provider_id = 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692',
  updated_at = NOW()
WHERE 
  name ILIKE '%Global 109 Countries%' 
  AND provider_id IS NULL;