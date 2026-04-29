
-- Import Russia C4 AU packages from tuge_product_cache into esim_packages
-- Pricing: cost_price * 4.0 for priority retail
INSERT INTO public.esim_packages (
  package_id, name, country_code, country_name, cost_price, price, currency,
  package_type, provider_id, carrier, validity_days, data_amount,
  speed_after_limit, qos_speed, daily_data_reset, is_active, daily_reset_amount
)
SELECT
  product_code,
  -- Generate name
  CASE
    WHEN product_type = 'DAILY_PACK' AND high_speed = 'Unlimited' THEN
      'Russia ' || usage_period || ' days, Unlimited/day'
    WHEN product_type = 'DAILY_PACK' THEN
      'Russia ' || usage_period || ' days, ' || high_speed || '/day'
    ELSE
      'Russia ' || usage_period || ' days, ' || data_total || 
      CASE WHEN data_unit = 'GB' THEN 'GB' ELSE data_unit END
  END,
  'RU',
  'Russia',
  net_price,
  ROUND(net_price * 4.0, 2),
  'USD',
  -- package_type classification
  CASE
    WHEN product_type = 'DAILY_PACK' AND high_speed = 'Unlimited' THEN 'limitless'
    WHEN product_type = 'DAILY_PACK' THEN 'day_pass'
    WHEN product_type = 'DATA_PACK' THEN 'max_speed'
  END,
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac',
  'MTS',
  usage_period,
  -- data_amount
  CASE
    WHEN product_type = 'DAILY_PACK' AND high_speed = 'Unlimited' THEN 'Unlimited'
    WHEN product_type = 'DAILY_PACK' THEN high_speed
    ELSE data_total || CASE WHEN data_unit = 'GB' THEN 'GB' ELSE data_unit END
  END,
  -- speed_after_limit
  CASE WHEN product_type = 'DAILY_PACK' AND high_speed != 'Unlimited' THEN '384kbps' ELSE NULL END,
  -- qos_speed
  CASE
    WHEN product_type = 'DAILY_PACK' AND high_speed = 'Unlimited' THEN 'Unlimited'
    WHEN product_type = 'DATA_PACK' THEN 'Max Speed'
    ELSE NULL
  END,
  -- daily_data_reset
  CASE WHEN product_type = 'DAILY_PACK' THEN true ELSE false END,
  false,
  -- daily_reset_amount for day_pass
  CASE WHEN product_type = 'DAILY_PACK' AND high_speed != 'Unlimited' THEN high_speed ELSE NULL END
FROM tuge_product_cache
WHERE countries @> '["RU"]'::jsonb
  AND card_type = 'C4'
  AND product_code LIKE '%AU%'
  AND jsonb_array_length(countries::jsonb) = 1
ON CONFLICT (package_id) DO UPDATE SET
  cost_price = EXCLUDED.cost_price,
  price = EXCLUDED.price,
  name = EXCLUDED.name,
  updated_at = now();
