
-- Insert 8 TUGE Local eSIM Packages: Israel (3), Mongolia (4), Maldives (1)
-- All inactive for manual review before launch

-- ============ ISRAEL (IL) - 3 packages ============
INSERT INTO public.esim_packages (
  package_id, name, description, country_code, country_name, data_amount, validity_days,
  price, cost_price, currency, carrier, network_type, category, sim_type, package_type,
  provider_id, is_local_sim, top_up, is_active, daily_data_reset, kyc, hot_spot,
  pre_installation, support_voice, support_sms, support_data, normal_price,
  provider_metadata, supports_extension
) VALUES
-- Israel 3GB/30days
(
  'tuge-local-il-3gb-30d', 'Israel 3GB 30 Days', 'Local eSIM for Israel. 3GB high-speed data on Partner/Cellcom 4G/5G network. Valid for 30 days. No data after quota used up. Day counting starts at local midnight.',
  'IL', 'Israel', '3GB', 30,
  51.56, 12.89, 'USD', 'Partner/Cellcom', '4G/5G', 'country', 'eSIM', 'max_speed',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', true, false, false, false, false, true,
  true, false, false, true, 0,
  '{"card_type": "M1", "source": "bulk-import-local"}', false
),
-- Israel 5GB/30days
(
  'tuge-local-il-5gb-30d', 'Israel 5GB 30 Days', 'Local eSIM for Israel. 5GB high-speed data on Partner/Cellcom 4G/5G network. Valid for 30 days. No data after quota used up. Day counting starts at local midnight.',
  'IL', 'Israel', '5GB', 30,
  63.24, 15.81, 'USD', 'Partner/Cellcom', '4G/5G', 'country', 'eSIM', 'max_speed',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', true, false, false, false, false, true,
  true, false, false, true, 0,
  '{"card_type": "M1", "source": "bulk-import-local"}', false
),
-- Israel 10GB/30days
(
  'tuge-local-il-10gb-30d', 'Israel 10GB 30 Days', 'Local eSIM for Israel. 10GB high-speed data on Partner/Cellcom 4G/5G network. Valid for 30 days. No data after quota used up. Day counting starts at local midnight.',
  'IL', 'Israel', '10GB', 30,
  84.36, 21.09, 'USD', 'Partner/Cellcom', '4G/5G', 'country', 'eSIM', 'max_speed',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', true, false, false, false, false, true,
  true, false, false, true, 0,
  '{"card_type": "M1", "source": "bulk-import-local"}', false
),

-- ============ MONGOLIA (MN) - 4 packages ============
-- Mongolia 8GB/5days
(
  'tuge-local-mn-8gb-5d', 'Mongolia 8GB 5 Days', 'Local eSIM for Mongolia. 8GB high-speed data with unlimited nationwide calls & SMS on Unitel/Mobicom 5G/4G network. Valid for 5 days. Speed reduced to 128Kbps after data limit. Day counting starts at local midnight. Check balance: Dial *1478#. QR code supports one-time download only.',
  'MN', 'Mongolia', '8GB', 5,
  18.88, 4.72, 'USD', 'Unitel/Mobicom', '5G/4G', 'country', 'eSIM', 'max_speed',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', true, false, false, false, false, true,
  true, true, true, true, 0,
  '{"card_type": "au1", "source": "bulk-import-local"}', false
),
-- Mongolia 15GB/10days
(
  'tuge-local-mn-15gb-10d', 'Mongolia 15GB 10 Days', 'Local eSIM for Mongolia. 15GB high-speed data with unlimited nationwide calls & SMS on Unitel/Mobicom 5G/4G network. Valid for 10 days. Speed reduced to 128Kbps after data limit. Day counting starts at local midnight. Check balance: Dial *1478#. QR code supports one-time download only.',
  'MN', 'Mongolia', '15GB', 10,
  30.20, 7.55, 'USD', 'Unitel/Mobicom', '5G/4G', 'country', 'eSIM', 'max_speed',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', true, false, false, false, false, true,
  true, true, true, true, 0,
  '{"card_type": "au1", "source": "bulk-import-local"}', false
),
-- Mongolia 25GB/20days
(
  'tuge-local-mn-25gb-20d', 'Mongolia 25GB 20 Days', 'Local eSIM for Mongolia. 25GB high-speed data with unlimited nationwide calls & SMS on Unitel/Mobicom 5G/4G network. Valid for 20 days. Speed reduced to 128Kbps after data limit. Day counting starts at local midnight. Check balance: Dial *1478#. QR code supports one-time download only.',
  'MN', 'Mongolia', '25GB', 20,
  49.76, 12.44, 'USD', 'Unitel/Mobicom', '5G/4G', 'country', 'eSIM', 'max_speed',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', true, false, false, false, false, true,
  true, true, true, true, 0,
  '{"card_type": "au1", "source": "bulk-import-local"}', false
),
-- Mongolia 50GB/30days
(
  'tuge-local-mn-50gb-30d', 'Mongolia 50GB 30 Days', 'Local eSIM for Mongolia. 50GB high-speed data with unlimited nationwide calls & SMS on Unitel/Mobicom 5G/4G network. Valid for 30 days. Speed reduced to 128Kbps after data limit. Day counting starts at local midnight. Check balance: Dial *1478#. QR code supports one-time download only.',
  'MN', 'Mongolia', '50GB', 30,
  87.08, 21.77, 'USD', 'Unitel/Mobicom', '5G/4G', 'country', 'eSIM', 'max_speed',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', true, false, false, false, false, true,
  true, true, true, true, 0,
  '{"card_type": "au1", "source": "bulk-import-local"}', false
),

-- ============ MALDIVES (MV) - 1 package ============
(
  'tuge-local-mv-20gb-10d', 'Maldives 20GB 10 Days', 'Local eSIM for Maldives. 20GB data on Dhiraagu/Ooredoo 4G network. Comes with a local phone number and calling credit. Includes 150 mins local calls (same operator) and 150 SMS. Valid for 10 days. Day counting starts at local midnight. Check usage: Dial *200#.',
  'MV', 'Maldives', '20GB', 10,
  187.44, 46.86, 'USD', 'Dhiraagu/Ooredoo', '4G', 'country', 'eSIM', 'max_speed',
  '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac', true, false, false, false, false, true,
  true, true, true, true, 0,
  '{"card_type": "M1", "source": "bulk-import-local"}', false
);

-- Set Mongolia-specific fields (APN and speed_after_limit)
UPDATE public.esim_packages
SET apn = 'internet',
    speed_after_limit = '128Kbps',
    activation_note = 'This is a local eSIM. Day counting starts at local midnight (e.g., activating at any time counts as Day 1 until 11:59 PM local time). Unlimited nationwide calls and SMS included. Check data balance: Dial *1478#. QR code supports one-time download only. APN: internet'
WHERE package_id IN ('tuge-local-mn-8gb-5d', 'tuge-local-mn-15gb-10d', 'tuge-local-mn-25gb-20d', 'tuge-local-mn-50gb-30d');

-- Set Maldives activation note
UPDATE public.esim_packages
SET activation_note = 'This is a local eSIM with a local phone number and calling credit. Includes 150 mins local calls (same operator) and 150 SMS. Day counting starts at local midnight. Check usage: Dial *200#.'
WHERE package_id = 'tuge-local-mv-20gb-10d';

-- Set Israel activation note
UPDATE public.esim_packages
SET activation_note = 'This is a local eSIM. Day counting starts at local midnight (e.g., activating at any time counts as Day 1 until 11:59 PM local time). No data available after quota is used up. QR code supports one-time download only.'
WHERE package_id IN ('tuge-local-il-3gb-30d', 'tuge-local-il-5gb-30d', 'tuge-local-il-10gb-30d');
