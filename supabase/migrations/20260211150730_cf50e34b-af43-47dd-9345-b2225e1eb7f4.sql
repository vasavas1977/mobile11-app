UPDATE esim_packages
SET qos_speed = 'Unlimited', updated_at = now()
WHERE provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac'
  AND package_type = 'limitless'
  AND qos_speed IS NULL;