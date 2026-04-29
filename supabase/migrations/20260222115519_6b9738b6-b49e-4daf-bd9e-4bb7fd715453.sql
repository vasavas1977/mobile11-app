
INSERT INTO public.country_carriers (country_name, country_code, carrier_name, network_type, region_preset, source)
VALUES
  ('Uganda', 'UG', 'Airtel Uganda Ltd.', '4G', 'global_109', 'screenshot'),
  ('Ukraine', 'UA', 'PrJSC VF Ukraine', '4G', 'global_109', 'screenshot'),
  ('United Arab Emirates', 'AE', 'Du', '5G', 'global_109', 'screenshot'),
  ('United Kingdom', 'GB', 'Hutchison 3G UK Ltd.', '5G', 'global_109', 'screenshot'),
  ('United States', 'US', 'US Cellular', '5G', 'global_109', 'screenshot'),
  ('United States', 'US', 'Verizon Wireless', '5G', 'global_109', 'screenshot'),
  ('United States', 'US', 'T-Mobile USA Inc.', '5G', 'global_109', 'screenshot'),
  ('Uruguay', 'UY', 'Telefonica Moviles UY', '5G', 'global_109', 'screenshot'),
  ('Uzbekistan', 'UZ', 'Ucell', '5G', 'global_109', 'screenshot'),
  ('Uzbekistan', 'UZ', 'Unitel LLC (Beeline)', '4G', 'global_109', 'screenshot'),
  ('Vietnam', 'VN', 'MobiFone Corporation', '4G', 'global_109', 'screenshot'),
  ('Vietnam', 'VN', 'Vietnamobile Telecommunications JSC', '4G', 'global_109', 'screenshot')
ON CONFLICT (country_name, carrier_name, network_type, region_preset) DO NOTHING;
