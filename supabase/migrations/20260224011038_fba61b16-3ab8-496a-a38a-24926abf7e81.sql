UPDATE esim_packages 
SET 
  is_active = true,
  country_name = 'Singapore, Malaysia & Thailand',
  category = 'regional',
  name = REPLACE(name, 'Singapore ', 'Singapore, Malaysia & Thailand ')
WHERE (provider_metadata->>'source') = 'bulk-import-sg-c4';