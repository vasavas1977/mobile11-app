UPDATE esim_packages 
SET is_active = false 
WHERE (provider_metadata->>'source') = 'bulk-import-sg-c4';