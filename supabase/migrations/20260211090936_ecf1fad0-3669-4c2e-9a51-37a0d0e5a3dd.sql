UPDATE public.esim_packages
SET is_active = true,
    updated_at = now()
WHERE country_code = 'RU'
  AND is_active = false;