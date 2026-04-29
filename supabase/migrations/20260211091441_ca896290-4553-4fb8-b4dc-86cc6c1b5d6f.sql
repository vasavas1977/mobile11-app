UPDATE public.esim_packages
SET normal_price = 0,
    updated_at = now()
WHERE country_code = 'RU'
  AND normal_price > 0;