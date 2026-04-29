-- Update Option IDs for Thailand "Real Unlimited" packages from Excel Page 3 (Daily Unlimited)
-- These updates match packages by validity_days and "unlimited" data pattern

-- 1 Day Unlimited
UPDATE esim_packages 
SET package_id = 'B0D2A35F-4F1F-F011-8B3D-002248F71CA2'
WHERE country_name = 'Thailand' 
  AND validity_days = 1 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 2 Days Unlimited
UPDATE esim_packages 
SET package_id = 'B1D2A35F-4F1F-F011-8B3D-002248F71CA2'
WHERE country_name = 'Thailand' 
  AND validity_days = 2 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 3 Days Unlimited
UPDATE esim_packages 
SET package_id = 'B2D2A35F-4F1F-F011-8B3D-002248F71CA2'
WHERE country_name = 'Thailand' 
  AND validity_days = 3 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 4 Days Unlimited
UPDATE esim_packages 
SET package_id = 'B3D2A35F-4F1F-F011-8B3D-002248F71CA2'
WHERE country_name = 'Thailand' 
  AND validity_days = 4 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 5 Days Unlimited
UPDATE esim_packages 
SET package_id = 'B4D2A35F-4F1F-F011-8B3D-002248F71CA2'
WHERE country_name = 'Thailand' 
  AND validity_days = 5 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 6 Days Unlimited
UPDATE esim_packages 
SET package_id = 'B5D2A35F-4F1F-F011-8B3D-002248F71CA2'
WHERE country_name = 'Thailand' 
  AND validity_days = 6 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 7 Days Unlimited
UPDATE esim_packages 
SET package_id = 'B6D2A35F-4F1F-F011-8B3D-002248F71CA2'
WHERE country_name = 'Thailand' 
  AND validity_days = 7 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 10 Days Unlimited
UPDATE esim_packages 
SET package_id = '2AA88866-5D5D-F011-8F7C-6045BD461BFF'
WHERE country_name = 'Thailand' 
  AND validity_days = 10 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 12 Days Unlimited
UPDATE esim_packages 
SET package_id = '2BA88866-5D5D-F011-8F7C-6045BD461BFF'
WHERE country_name = 'Thailand' 
  AND validity_days = 12 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 15 Days Unlimited
UPDATE esim_packages 
SET package_id = '2CA88866-5D5D-F011-8F7C-6045BD461BFF'
WHERE country_name = 'Thailand' 
  AND validity_days = 15 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 20 Days Unlimited
UPDATE esim_packages 
SET package_id = '2DA88866-5D5D-F011-8F7C-6045BD461BFF'
WHERE country_name = 'Thailand' 
  AND validity_days = 20 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');

-- 30 Days Unlimited
UPDATE esim_packages 
SET package_id = '2EA88866-5D5D-F011-8F7C-6045BD461BFF'
WHERE country_name = 'Thailand' 
  AND validity_days = 30 
  AND (data_amount ILIKE '%unlimited%' OR description ILIKE '%unlimited%');