UPDATE esim_packages
SET is_active = true, updated_at = now()
WHERE provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac'
  AND country_code IN ('AU', 'NZ')
  AND package_id LIKE '%-AU-%';