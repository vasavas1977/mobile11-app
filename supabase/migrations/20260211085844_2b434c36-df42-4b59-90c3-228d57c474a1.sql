UPDATE public.esim_packages
SET name = REPLACE(name, 'Unlimited/day', 'Unlimited'),
    updated_at = now()
WHERE country_code = 'RU'
  AND package_type = 'limitless'
  AND name LIKE '%Unlimited/day%';