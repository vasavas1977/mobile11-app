UPDATE esim_packages
SET country_name = 'Turkey(Türkiye)', updated_at = now()
WHERE country_name = 'Turkey'
  AND provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';