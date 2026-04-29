-- Step 1: Remove fake AIS packages (no provider_id)
DELETE FROM esim_packages 
WHERE country_name = 'Thailand' 
  AND carrier = 'AIS' 
  AND provider_id IS NULL;

-- Step 2: Insert real TUGE AIS package with voice + SMS support
INSERT INTO esim_packages (
  package_id, name, country_name, country_code, carrier,
  package_type, data_amount, validity_days, validity_period,
  price, cost_price, currency, qos_speed, speed_after_limit,
  network_type, provider_id, is_active, 
  support_data, support_voice, support_sms
) VALUES (
  'A-007-ES-AU-AIS-T-7D/60D-15GB',
  'Thailand 15GB / 7 Days (AIS)',
  'Thailand', 'TH', 'AIS',
  'max_speed', '15GB', 7, '60 days',
  12.99, 4.22, 'USD', '15GB High Speed', '1 Mbps',
  '4G / 5G',
  (SELECT id FROM esim_providers WHERE provider_code = 'tuge'),
  true, true, true, true
)
ON CONFLICT (package_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  cost_price = EXCLUDED.cost_price,
  support_voice = EXCLUDED.support_voice,
  support_sms = EXCLUDED.support_sms,
  is_active = EXCLUDED.is_active;