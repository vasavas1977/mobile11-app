-- Update Mongolia carrier to Unitel only (TUGE offers Unitel, not Mobicom)
UPDATE country_carriers
SET carrier_name = 'Unitel', network_type = '5G/4G', updated_at = now()
WHERE country_code = 'MN' AND id = 'af40dd3a-501a-4ce9-b7f9-a393d1264cd1';

-- Update existing Unitel entry to include 5G
UPDATE country_carriers
SET network_type = '5G/4G', updated_at = now()
WHERE country_code = 'MN' AND id = '8e5a1d0a-1fcd-43be-b977-79cebdbc4348';

-- Update esim_packages carrier for Mongolia TUGE packages
UPDATE esim_packages
SET carrier = 'Unitel', network_type = '5G/4G', updated_at = now()
WHERE country_code = 'MN' AND carrier ILIKE '%Mobicom%';