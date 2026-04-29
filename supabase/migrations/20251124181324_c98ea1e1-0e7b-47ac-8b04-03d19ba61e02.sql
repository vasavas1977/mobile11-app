-- Fix spelling: Change "Golbal" to "Global" in all affected packages
UPDATE esim_packages 
SET 
  country_name = 'Global 109 Countries',
  name = REPLACE(name, 'Golbal', 'Global'),
  updated_at = now()
WHERE country_name = 'Golbal 109 Countries';