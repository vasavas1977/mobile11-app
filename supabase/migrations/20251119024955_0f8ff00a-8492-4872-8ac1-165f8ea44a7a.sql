UPDATE esim_packages 
SET 
  daily_reset_amount = data_amount,
  short_name = data_amount || '/day',
  name = country_name || ' ' || validity_days || ' days, ' || data_amount || '/day',
  description = CASE 
    WHEN package_type = 'day_pass' THEN data_amount || ' high-speed daily, then 384 Kbps unlimited. Perfect for casual browsing.'
    WHEN package_type = 'super_pass' THEN data_amount || ' high-speed daily, then 1 Mbps unlimited. Great for social media.'
    ELSE description
  END
WHERE is_active = true 
  AND daily_data_reset = true 
  AND package_type IN ('day_pass', 'super_pass');