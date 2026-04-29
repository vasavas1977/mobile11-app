-- Fix 1: Clear incorrect included_countries JSONB data (111 countries → NULL)
UPDATE esim_packages
SET 
  included_countries = NULL,
  updated_at = now()
WHERE country_name = 'Europe 42 Countries'
  AND package_type = 'non_stop'
  AND included_countries IS NOT NULL
  AND jsonb_array_length(included_countries->'countries') = 111;

-- Fix 2: Update short_name to be more descriptive
UPDATE esim_packages
SET 
  short_name = country_name || ' ' || validity_days || 'd Unlimited',
  updated_at = now()
WHERE country_name = 'Europe 42 Countries'
  AND package_type = 'non_stop'
  AND short_name = '1 Mbps unlimited';