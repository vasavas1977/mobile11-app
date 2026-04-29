UPDATE public.esim_packages
SET normal_price = ROUND(cost_price * 4.0, 2),
    updated_at = now()
WHERE country_code = 'RU'
  AND normal_price = 0;