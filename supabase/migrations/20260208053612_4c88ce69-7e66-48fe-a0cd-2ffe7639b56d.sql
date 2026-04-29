INSERT INTO esim_packages (
  name, package_id, country_name, country_code, carrier, package_type, 
  data_amount, validity_days, price, network_type, qos_speed, 
  speed_after_limit, is_active, currency, support_data
) VALUES 
  ('Thailand AIS 7 days Unlimited', 'ais-thailand-7d-unlimited', 'Thailand', 'TH', 'AIS', 'limitless', 'Unlimited', 7, 12.99, '4G / 5G', 'Unlimited', NULL, true, 'USD', true),
  ('Thailand AIS 15 days Unlimited', 'ais-thailand-15d-unlimited', 'Thailand', 'TH', 'AIS', 'limitless', 'Unlimited', 15, 22.99, '4G / 5G', 'Unlimited', NULL, true, 'USD', true),
  ('Thailand AIS 30 days Unlimited', 'ais-thailand-30d-unlimited', 'Thailand', 'TH', 'AIS', 'limitless', 'Unlimited', 30, 39.99, '4G / 5G', 'Unlimited', NULL, true, 'USD', true),
  ('Thailand AIS 7 days 5GB', 'ais-thailand-7d-5gb', 'Thailand', 'TH', 'AIS', 'max_speed', '5GB', 7, 8.99, '4G / 5G', 'Full Speed', NULL, true, 'USD', true),
  ('Thailand AIS 15 days 10GB', 'ais-thailand-15d-10gb', 'Thailand', 'TH', 'AIS', 'max_speed', '10GB', 15, 15.99, '4G / 5G', 'Full Speed', NULL, true, 'USD', true),
  ('Thailand AIS 1 day 1GB/day', 'ais-thailand-1d-1gb', 'Thailand', 'TH', 'AIS', 'day_pass', '1GB', 1, 2.50, '4G / 5G', '1Mbps', '1 Mbps', true, 'USD', true),
  ('Thailand AIS 7 days 1GB/day', 'ais-thailand-7d-1gb-day', 'Thailand', 'TH', 'AIS', 'day_pass', '1GB', 7, 9.99, '4G / 5G', '1Mbps', '1 Mbps', true, 'USD', true);