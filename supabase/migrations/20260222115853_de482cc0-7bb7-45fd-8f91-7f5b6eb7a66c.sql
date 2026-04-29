
INSERT INTO public.country_carriers (country_name, country_code, carrier_name, network_type, region_preset, source)
VALUES
  ('United Arab Emirates', 'AE', 'Etisalat', 'LTE', 'europe_42_stopover', 'manual'),
  ('United Arab Emirates', 'AE', 'DU', 'LTE', 'europe_42_stopover', 'manual'),
  ('Qatar', 'QA', 'Ooredoo (Qtel)', 'LTE', 'europe_42_stopover', 'manual'),
  ('Qatar', 'QA', 'Vodafone', 'LTE', 'europe_42_stopover', 'manual')
ON CONFLICT (country_name, carrier_name, network_type, region_preset) DO NOTHING;
