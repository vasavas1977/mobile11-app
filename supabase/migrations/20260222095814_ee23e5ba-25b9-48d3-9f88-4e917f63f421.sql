UPDATE esim_packages
SET is_active = true, updated_at = now()
WHERE country_name = 'Europe 41 Countries'
  AND provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac'
  AND is_active = false;