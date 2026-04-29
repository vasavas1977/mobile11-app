-- Add is_popular column
ALTER TABLE public.esim_packages ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;

-- Update the Thailand 10-day AIS package
UPDATE public.esim_packages
SET
  name = 'Thailand Unlimited 5G / 10 Days (AIS)',
  data_amount = 'Unlimited',
  description = 'Unlimited 5G max speed data with no speed cap. Includes free WiFi and 400 minutes of free local calls within Thailand. Requires KYC verification.',
  support_voice = true,
  support_sms = true,
  hot_spot = true,
  package_type = 'limitless',
  network_type = '5G',
  is_popular = true
WHERE id = '2702fc2c-46b7-41b1-82a2-216ec60952cc';