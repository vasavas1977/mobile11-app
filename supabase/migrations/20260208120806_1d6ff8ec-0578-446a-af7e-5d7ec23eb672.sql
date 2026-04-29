-- Add is_local_sim column to esim_packages table
ALTER TABLE esim_packages ADD COLUMN IF NOT EXISTS is_local_sim BOOLEAN DEFAULT false;

-- Update the AIS Thailand package with correct data and mark as local SIM
UPDATE esim_packages
SET 
  name = 'Thailand 35GB / 7 Days Unlimited Data at 1 Mbps after (AIS)',
  package_type = 'max_speed',
  data_amount = '35GB',
  speed_after_limit = '1 Mbps',
  qos_speed = 'Max Speed',
  is_local_sim = true,
  description = 'Get 35GB of high-speed data in Thailand. After your data limit, enjoy unlimited data at 1 Mbps. Requires KYC verification.',
  updated_at = NOW()
WHERE id = '24cef975-a7e3-4f18-a548-27c323f80cf1';