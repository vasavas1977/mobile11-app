UPDATE esim_packages 
SET is_active = false 
WHERE country_code = 'SG' 
  AND provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac' 
  AND (provider_metadata->>'source') = 'bulk-import-sg-c4';