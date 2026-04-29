UPDATE esim_packages 
SET 
  country_name = 'Singapore, Malaysia, Thailand',
  name = REPLACE(name, 'South East Asia 3 Countries', 'Singapore, Malaysia, Thailand')
WHERE country_name = 'South East Asia 3 Countries';