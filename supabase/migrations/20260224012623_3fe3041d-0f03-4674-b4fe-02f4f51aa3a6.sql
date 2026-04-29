-- Deactivate USIMSA Singapore, Malaysia & Thailand packages
UPDATE esim_packages
SET is_active = false
WHERE country_name = 'Singapore, Malaysia & Thailand'
  AND provider_id != '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';

-- Activate TUGE Singapore, Malaysia & Thailand packages
UPDATE esim_packages
SET is_active = true
WHERE country_name = 'Singapore, Malaysia & Thailand'
  AND provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';