
INSERT INTO esim_packages (
  package_id, name, country_code, country_name, carrier, price, normal_price, cost_price,
  data_amount, validity_days, validity_period, package_type, provider_id, is_active, currency,
  speed_after_limit, qos_speed, daily_data_reset, daily_reset_amount,
  provider_metadata, sim_type, network_type
)
SELECT
  t.product_code,
  CASE 
    WHEN t.product_type = 'DATA_PACK' THEN
      'Russia ' || t.data_total || COALESCE(t.data_unit, 'GB') || '/' || t.usage_period || ' days'
    WHEN t.product_type = 'DAILY_PACK' AND t.high_speed = 'Unlimited' THEN
      'Russia ' || t.usage_period || ' days, Unlimited'
    ELSE
      'Russia ' || t.usage_period || ' days, ' || t.high_speed || '/day'
  END,
  'RU',
  'Russia',
  'Tele2/Beeline',
  ROUND(t.net_price * 4.0, 2),
  0,
  t.net_price,
  CASE
    WHEN t.product_type = 'DATA_PACK' THEN t.data_total || COALESCE(t.data_unit, 'GB')
    WHEN t.high_speed = 'Unlimited' THEN 'Unlimited'
    ELSE t.high_speed
  END,
  t.usage_period::int,
  t.usage_period || ' Days',
  CASE
    WHEN t.product_type = 'DATA_PACK' THEN 'max_speed'
    WHEN t.product_type = 'DAILY_PACK' AND t.high_speed = 'Unlimited' THEN 'limitless'
    ELSE 'day_pass'
  END,
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac',
  true,
  'THB',
  CASE WHEN t.product_type = 'DAILY_PACK' AND t.high_speed != 'Unlimited' THEN t.limit_speed ELSE NULL END,
  CASE
    WHEN t.product_type = 'DATA_PACK' THEN 'Max Speed'
    WHEN t.product_type = 'DAILY_PACK' AND t.high_speed = 'Unlimited' THEN 'Unlimited'
    ELSE NULL
  END,
  CASE WHEN t.product_type = 'DAILY_PACK' AND t.high_speed != 'Unlimited' THEN true ELSE false END,
  CASE WHEN t.product_type = 'DAILY_PACK' AND t.high_speed != 'Unlimited' THEN t.high_speed ELSE NULL END,
  jsonb_build_object('card_type', 'ep3', 'source', 'tuge_cache'),
  'eSIM',
  '3G/4G'
FROM tuge_product_cache t
WHERE t.card_type = 'ep3'
  AND t.countries::jsonb @> '["RU"]'::jsonb
  AND jsonb_array_length(t.countries::jsonb) = 1
ON CONFLICT (package_id) DO NOTHING;
