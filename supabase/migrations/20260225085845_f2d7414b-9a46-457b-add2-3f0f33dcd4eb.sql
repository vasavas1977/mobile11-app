-- Insert Africa 18 Countries TUGE ep1 packages (AU variants)
-- Pricing: 4x markup on net_price (Priority tier)
-- Type mapping: DAILY_PACK+Unlimited=limitless, DAILY_PACK+quota=day_pass, DATA_PACK=max_speed

DO $$
DECLARE
  v_provider_id uuid := '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
  v_included json := '[
    {"name":"Congo (DR)","code":"CD","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Morocco","code":"MA","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Egypt","code":"EG","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Congo","code":"CG","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Tunisia","code":"TN","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Uganda","code":"UG","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Gabon","code":"GA","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Kenya","code":"KE","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Tanzania","code":"TZ","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Chad","code":"TD","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Ghana","code":"GH","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Algeria","code":"DZ","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Niger","code":"NE","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Mauritius","code":"MU","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Malawi","code":"MW","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Madagascar","code":"MG","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Nigeria","code":"NG","carriers":[{"name":"Local Carrier","networks":["4G"]}]},
    {"name":"Réunion","code":"RE","carriers":[{"name":"Local Carrier","networks":["4G"]}]}
  ]'::json;
BEGIN

INSERT INTO esim_packages (package_id, name, country_name, country_code, data_amount, validity_days, cost_price, price, package_type, qos_speed, speed_after_limit, category, carrier, network_type, is_active, provider_id, included_countries, supports_extension, is_local_sim, currency, daily_data_reset)
VALUES
-- === 1 Day ===
('E-167-ES-AU-D-eP1-1D/60D-500M', '1Day / 500MB per day', 'Africa 18 Countries', 'AF', '500MB/day', 1, 1.81, 7.24, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-1D/60D-1GB', '1Day / 1GB per day', 'Africa 18 Countries', 'AF', '1GB/day', 1, 2.73, 10.92, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-1D/60D-2GB', '1Day / 2GB per day', 'Africa 18 Countries', 'AF', '2GB/day', 1, 4.27, 17.08, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-1D/60D-Unlimited', '1Day / Unlimited', 'Africa 18 Countries', 'AF', 'Unlimited', 1, 5.35, 21.40, 'limitless', 'Unlimited', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),

-- === 3 Days ===
('E-167-ES-AU-T-eP1-3D/60D-1GB', '3Days / 1GB', 'Africa 18 Countries', 'AF', '1GB', 3, 3.35, 13.40, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-3D/60D-500M', '3Days / 500MB per day', 'Africa 18 Countries', 'AF', '500MB/day', 3, 3.96, 15.84, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-3D/60D-3GB', '3Days / 3GB', 'Africa 18 Countries', 'AF', '3GB', 3, 6.43, 25.72, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-3D/60D-1GB', '3Days / 1GB per day', 'Africa 18 Countries', 'AF', '1GB/day', 3, 6.73, 26.92, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-3D/60D-2GB', '3Days / 2GB per day', 'Africa 18 Countries', 'AF', '2GB/day', 3, 9.50, 38.00, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-3D/60D-5GB', '3Days / 5GB', 'Africa 18 Countries', 'AF', '5GB', 3, 10.43, 41.72, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-3D/60D-Unlimited', '3Days / Unlimited', 'Africa 18 Countries', 'AF', 'Unlimited', 3, 14.40, 57.60, 'limitless', 'Unlimited', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-3D/60D-10GB', '3Days / 10GB', 'Africa 18 Countries', 'AF', '10GB', 3, 16.28, 65.12, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-3D/60D-20GB', '3Days / 20GB', 'Africa 18 Countries', 'AF', '20GB', 3, 31.05, 124.20, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-3D/60D-30GB', '3Days / 30GB', 'Africa 18 Countries', 'AF', '30GB', 3, 41.21, 164.84, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-3D/60D-50GB', '3Days / 50GB', 'Africa 18 Countries', 'AF', '50GB', 3, 57.21, 228.84, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),

-- === 5 Days ===
('E-167-ES-AU-T-eP1-5D/60D-1GB', '5Days / 1GB', 'Africa 18 Countries', 'AF', '1GB', 5, 3.66, 14.64, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-5D/60D-500M', '5Days / 500MB per day', 'Africa 18 Countries', 'AF', '500MB/day', 5, 6.43, 25.72, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-5D/60D-3GB', '5Days / 3GB', 'Africa 18 Countries', 'AF', '3GB', 5, 6.89, 27.56, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-5D/60D-5GB', '5Days / 5GB', 'Africa 18 Countries', 'AF', '5GB', 5, 10.74, 42.96, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-5D/60D-1GB', '5Days / 1GB per day', 'Africa 18 Countries', 'AF', '1GB/day', 5, 11.04, 44.16, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-5D/60D-2GB', '5Days / 2GB per day', 'Africa 18 Countries', 'AF', '2GB/day', 5, 15.66, 62.64, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-5D/60D-10GB', '5Days / 10GB', 'Africa 18 Countries', 'AF', '10GB', 5, 16.89, 67.56, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-5D/60D-Unlimited', '5Days / Unlimited', 'Africa 18 Countries', 'AF', 'Unlimited', 5, 23.35, 93.40, 'limitless', 'Unlimited', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-5D/60D-20GB', '5Days / 20GB', 'Africa 18 Countries', 'AF', '20GB', 5, 31.97, 127.88, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-5D/60D-30GB', '5Days / 30GB', 'Africa 18 Countries', 'AF', '30GB', 5, 42.75, 171.00, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-5D/60D-50GB', '5Days / 50GB', 'Africa 18 Countries', 'AF', '50GB', 5, 60.29, 241.16, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),

-- === 7 Days ===
('E-167-ES-AU-T-eP1-7D/60D-1GB', '7Days / 1GB', 'Africa 18 Countries', 'AF', '1GB', 7, 3.96, 15.84, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-7D/60D-3GB', '7Days / 3GB', 'Africa 18 Countries', 'AF', '3GB', 7, 7.50, 30.00, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-7D/60D-500M', '7Days / 500MB per day', 'Africa 18 Countries', 'AF', '500MB/day', 7, 8.89, 35.56, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-7D/60D-5GB', '7Days / 5GB', 'Africa 18 Countries', 'AF', '5GB', 7, 11.35, 45.40, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-7D/60D-1GB', '7Days / 1GB per day', 'Africa 18 Countries', 'AF', '1GB/day', 7, 15.35, 61.40, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-7D/60D-10GB', '7Days / 10GB', 'Africa 18 Countries', 'AF', '10GB', 7, 18.12, 72.48, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-7D/60D-2GB', '7Days / 2GB per day', 'Africa 18 Countries', 'AF', '2GB/day', 7, 21.82, 87.28, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-7D/60D-Unlimited', '7Days / Unlimited', 'Africa 18 Countries', 'AF', 'Unlimited', 7, 32.59, 130.36, 'limitless', 'Unlimited', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-7D/60D-20GB', '7Days / 20GB', 'Africa 18 Countries', 'AF', '20GB', 7, 33.51, 134.04, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-7D/60D-30GB', '7Days / 30GB', 'Africa 18 Countries', 'AF', '30GB', 7, 44.90, 179.60, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-7D/60D-50GB', '7Days / 50GB', 'Africa 18 Countries', 'AF', '50GB', 7, 63.37, 253.48, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),

-- === 10 Days ===
('E-167-ES-AU-T-eP1-10D/60D-1GB', '10Days / 1GB', 'Africa 18 Countries', 'AF', '1GB', 10, 4.27, 17.08, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-10D/60D-3GB', '10Days / 3GB', 'Africa 18 Countries', 'AF', '3GB', 10, 7.81, 31.24, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-10D/60D-5GB', '10Days / 5GB', 'Africa 18 Countries', 'AF', '5GB', 10, 11.97, 47.88, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-10D/60D-500M', '10Days / 500MB per day', 'Africa 18 Countries', 'AF', '500MB/day', 10, 12.58, 50.32, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-10D/60D-10GB', '10Days / 10GB', 'Africa 18 Countries', 'AF', '10GB', 10, 18.74, 74.96, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-10D/60D-1GB', '10Days / 1GB per day', 'Africa 18 Countries', 'AF', '1GB/day', 10, 21.82, 87.28, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-10D/60D-2GB', '10Days / 2GB per day', 'Africa 18 Countries', 'AF', '2GB/day', 10, 31.05, 124.20, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-10D/60D-20GB', '10Days / 20GB', 'Africa 18 Countries', 'AF', '20GB', 10, 35.05, 140.20, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-10D/60D-Unlimited', '10Days / Unlimited', 'Africa 18 Countries', 'AF', 'Unlimited', 10, 45.82, 183.28, 'limitless', 'Unlimited', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-10D/60D-30GB', '10Days / 30GB', 'Africa 18 Countries', 'AF', '30GB', 10, 47.36, 189.44, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-10D/60D-50GB', '10Days / 50GB', 'Africa 18 Countries', 'AF', '50GB', 10, 67.37, 269.48, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),

-- === 15 Days ===
('E-167-ES-AU-T-eP1-15D/60D-1GB', '15Days / 1GB', 'Africa 18 Countries', 'AF', '1GB', 15, 4.58, 18.32, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-15D/60D-3GB', '15Days / 3GB', 'Africa 18 Countries', 'AF', '3GB', 15, 8.27, 33.08, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-15D/60D-5GB', '15Days / 5GB', 'Africa 18 Countries', 'AF', '5GB', 15, 12.27, 49.08, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-15D/60D-500M', '15Days / 500MB per day', 'Africa 18 Countries', 'AF', '500MB/day', 15, 18.74, 74.96, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-15D/60D-10GB', '15Days / 10GB', 'Africa 18 Countries', 'AF', '10GB', 15, 19.35, 77.40, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-15D/60D-1GB', '15Days / 1GB per day', 'Africa 18 Countries', 'AF', '1GB/day', 15, 32.59, 130.36, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-15D/60D-20GB', '15Days / 20GB', 'Africa 18 Countries', 'AF', '20GB', 15, 35.97, 143.88, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-15D/60D-2GB', '15Days / 2GB per day', 'Africa 18 Countries', 'AF', '2GB/day', 15, 46.44, 185.76, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-15D/60D-30GB', '15Days / 30GB', 'Africa 18 Countries', 'AF', '30GB', 15, 49.52, 198.08, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-15D/60D-Unlimited', '15Days / Unlimited', 'Africa 18 Countries', 'AF', 'Unlimited', 15, 68.60, 274.40, 'limitless', 'Unlimited', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-15D/60D-50GB', '15Days / 50GB', 'Africa 18 Countries', 'AF', '50GB', 15, 71.06, 284.24, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),

-- === 20 Days (day_pass/limitless only) ===
('E-167-ES-AU-D-eP1-20D/60D-500M', '20Days / 500MB per day', 'Africa 18 Countries', 'AF', '500MB/day', 20, 24.89, 99.56, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-20D/60D-1GB', '20Days / 1GB per day', 'Africa 18 Countries', 'AF', '1GB/day', 20, 43.36, 173.44, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-20D/60D-2GB', '20Days / 2GB per day', 'Africa 18 Countries', 'AF', '2GB/day', 20, 61.83, 247.32, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-20D/60D-Unlimited', '20Days / Unlimited', 'Africa 18 Countries', 'AF', 'Unlimited', 20, 91.38, 365.52, 'limitless', 'Unlimited', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),

-- === 30 Days ===
('E-167-ES-AU-T-eP1-30D/60D-1GB', '30Days / 1GB', 'Africa 18 Countries', 'AF', '1GB', 30, 4.89, 19.56, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-30D/60D-3GB', '30Days / 3GB', 'Africa 18 Countries', 'AF', '3GB', 30, 8.73, 34.92, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-30D/60D-5GB', '30Days / 5GB', 'Africa 18 Countries', 'AF', '5GB', 30, 12.89, 51.56, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-30D/60D-10GB', '30Days / 10GB', 'Africa 18 Countries', 'AF', '10GB', 30, 19.97, 79.88, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-T-eP1-30D/60D-20GB', '30Days / 20GB', 'Africa 18 Countries', 'AF', '20GB', 30, 37.21, 148.84, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-30D/60D-500M', '30Days / 500MB per day', 'Africa 18 Countries', 'AF', '500MB/day', 30, 37.21, 148.84, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-30D/60D-30GB', '30Days / 30GB', 'Africa 18 Countries', 'AF', '30GB', 30, 51.06, 204.24, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-30D/60D-1GB', '30Days / 1GB per day', 'Africa 18 Countries', 'AF', '1GB/day', 30, 64.91, 259.64, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-T-eP1-30D/60D-50GB', '30Days / 50GB', 'Africa 18 Countries', 'AF', '50GB', 30, 74.76, 299.04, 'max_speed', 'Max Speed', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', false),
('E-167-ES-AU-D-eP1-30D/60D-2GB', '30Days / 2GB per day', 'Africa 18 Countries', 'AF', '2GB/day', 30, 92.61, 370.44, 'day_pass', NULL, '384kbps', 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true),
('E-167-ES-AU-D-eP1-30D/60D-Unlimited', '30Days / Unlimited', 'Africa 18 Countries', 'AF', 'Unlimited', 30, 136.93, 547.72, 'limitless', 'Unlimited', NULL, 'regional', 'Africa 18 Countries', '4G', true, v_provider_id, v_included::jsonb, true, false, 'USD', true)
ON CONFLICT (package_id) DO UPDATE SET
  name = EXCLUDED.name,
  cost_price = EXCLUDED.cost_price,
  price = EXCLUDED.price,
  package_type = EXCLUDED.package_type,
  qos_speed = EXCLUDED.qos_speed,
  speed_after_limit = EXCLUDED.speed_after_limit,
  is_active = EXCLUDED.is_active,
  included_countries = EXCLUDED.included_countries,
  updated_at = now();

-- Also insert country_carriers entries for Africa 18
INSERT INTO country_carriers (country_name, country_code, carrier_name, network_type, region_preset, source) VALUES
('Congo (DR)', 'CD', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Morocco', 'MA', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Egypt', 'EG', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Congo', 'CG', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Tunisia', 'TN', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Uganda', 'UG', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Gabon', 'GA', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Kenya', 'KE', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Tanzania', 'TZ', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Chad', 'TD', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Ghana', 'GH', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Algeria', 'DZ', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Niger', 'NE', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Mauritius', 'MU', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Malawi', 'MW', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Madagascar', 'MG', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Nigeria', 'NG', 'Local Carrier', '4G', 'AFRICA_18', 'tuge'),
('Réunion', 'RE', 'Local Carrier', '4G', 'AFRICA_18', 'tuge')
ON CONFLICT DO NOTHING;

END $$;