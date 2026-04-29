UPDATE esim_packages 
SET 
  country_name = 'Singapore/Malaysia/Thailand',
  name = REPLACE(name, 'Singapore, Malaysia, Thailand', 'Singapore/Malaysia/Thailand')
WHERE country_name = 'Singapore, Malaysia, Thailand';