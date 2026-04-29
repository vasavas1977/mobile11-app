
INSERT INTO public.esim_packages (
  package_id, name, country_name, country_code, data_amount, validity_days,
  package_type, price, cost_price, carrier, network_type,
  provider_id, initialize_policy, support_voice, support_sms, support_data,
  is_local_sim, sim_type, is_active, activation_note, description,
  included_countries, markup_percentage, normal_price, category
) VALUES (
  'C-001-ES-ZD-al1-T-28D/60D-80GB',
  'Australia 80GB 28 Days',
  'Australia',
  'AU',
  '80GB',
  28,
  'max_speed',
  55.48,
  13.87,
  'Vodafone',
  '4G',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac',
  'designated_date',
  true,
  true,
  true,
  true,
  'eSIM',
  true,
  'Advance booking 2 days prior required. QR code supports one-time download only.',
  'Unlimited calls to 35 countries + unlimited talk and text. 80GB high-speed data.',
  '["Argentina","Brazil","Canada","Chile","China","Colombia","France","Germany","Guam","Hong Kong","Hungary","Iceland","India","Indonesia","Ireland","Japan","Malaysia","Malta","Mexico","New Zealand","Norway","Peru","Philippines","Puerto Rico","Romania","Singapore","Slovenia","South Korea","Sweden","Taiwan","Thailand","Ukraine","United Kingdom","United States","Venezuela"]',
  300,
  0,
  'local'
);
