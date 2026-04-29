-- Corrective Migration: Update Thailand 1Mbps Unlimited Package Pricing
-- This migration updates all Thailand 1Mbps "Unlimited" packages to match the Excel file prices
-- Matching by data_amount, validity_days, country, and QoS instead of package_id

-- 500MB Packages (12 packages)
UPDATE esim_packages
SET normal_price = 0.65, min_sell_price = 0.59, cost_price = 0.26, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 1;

UPDATE esim_packages
SET normal_price = 1.48, min_sell_price = 1.34, cost_price = 0.59, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 2;

UPDATE esim_packages
SET normal_price = 1.95, min_sell_price = 1.75, cost_price = 0.77, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 3;

UPDATE esim_packages
SET normal_price = 2.60, min_sell_price = 2.34, cost_price = 1.03, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 4;

UPDATE esim_packages
SET normal_price = 2.98, min_sell_price = 2.68, cost_price = 1.18, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 5;

UPDATE esim_packages
SET normal_price = 3.34, min_sell_price = 3.00, cost_price = 1.32, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 6;

UPDATE esim_packages
SET normal_price = 3.81, min_sell_price = 3.43, cost_price = 1.51, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 7;

UPDATE esim_packages
SET normal_price = 5.02, min_sell_price = 4.51, cost_price = 1.99, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 10;

UPDATE esim_packages
SET normal_price = 6.03, min_sell_price = 5.43, cost_price = 2.39, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 12;

UPDATE esim_packages
SET normal_price = 7.62, min_sell_price = 6.85, cost_price = 3.01, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 15;

UPDATE esim_packages
SET normal_price = 9.93, min_sell_price = 8.94, cost_price = 3.94, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 20;

UPDATE esim_packages
SET normal_price = 15.13, min_sell_price = 13.62, cost_price = 5.99, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '500MB' AND validity_days = 30;

-- 1GB Packages (12 packages)
UPDATE esim_packages
SET normal_price = 1.12, min_sell_price = 1.00, cost_price = 0.44, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 1;

UPDATE esim_packages
SET normal_price = 2.33, min_sell_price = 2.09, cost_price = 0.92, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 2;

UPDATE esim_packages
SET normal_price = 2.98, min_sell_price = 2.68, cost_price = 1.18, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 3;

UPDATE esim_packages
SET normal_price = 3.90, min_sell_price = 3.51, cost_price = 1.54, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 4;

UPDATE esim_packages
SET normal_price = 4.55, min_sell_price = 4.09, cost_price = 1.80, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 5;

UPDATE esim_packages
SET normal_price = 5.20, min_sell_price = 4.68, cost_price = 2.06, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 6;

UPDATE esim_packages
SET normal_price = 5.76, min_sell_price = 5.19, cost_price = 2.28, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 7;

UPDATE esim_packages
SET normal_price = 7.62, min_sell_price = 6.85, cost_price = 3.01, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 10;

UPDATE esim_packages
SET normal_price = 8.92, min_sell_price = 8.02, cost_price = 3.53, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 12;

UPDATE esim_packages
SET normal_price = 10.31, min_sell_price = 9.28, cost_price = 4.09, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 15;

UPDATE esim_packages
SET normal_price = 15.13, min_sell_price = 13.62, cost_price = 5.99, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 20;

UPDATE esim_packages
SET normal_price = 22.93, min_sell_price = 20.64, cost_price = 9.09, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '1GB' AND validity_days = 30;

-- 2GB Packages (12 packages) - THIS IS THE KEY FIX FOR THE REPORTED ISSUE
UPDATE esim_packages
SET normal_price = 1.77, min_sell_price = 1.59, cost_price = 0.70, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 1;

UPDATE esim_packages
SET normal_price = 3.63, min_sell_price = 3.26, cost_price = 1.44, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 2;

UPDATE esim_packages
SET normal_price = 4.55, min_sell_price = 4.09, cost_price = 1.80, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 3;

UPDATE esim_packages
SET normal_price = 5.94, min_sell_price = 5.34, cost_price = 2.36, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 4;

UPDATE esim_packages
SET normal_price = 6.88, min_sell_price = 6.19, cost_price = 2.72, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 5;

UPDATE esim_packages
SET normal_price = 7.80, min_sell_price = 7.02, cost_price = 3.09, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 6;

UPDATE esim_packages
SET normal_price = 8.72, min_sell_price = 7.85, cost_price = 3.46, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 7;

UPDATE esim_packages
SET normal_price = 11.23, min_sell_price = 10.11, cost_price = 4.45, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 10;

UPDATE esim_packages
SET normal_price = 13.56, min_sell_price = 12.21, cost_price = 5.37, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 12;

UPDATE esim_packages
SET normal_price = 17.08, min_sell_price = 15.38, cost_price = 6.77, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 15;

UPDATE esim_packages
SET normal_price = 22.93, min_sell_price = 20.64, cost_price = 9.09, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 20;

UPDATE esim_packages
SET normal_price = 34.54, min_sell_price = 31.08, cost_price = 13.69, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '2GB' AND validity_days = 30;

-- 3GB Packages (12 packages)
UPDATE esim_packages
SET normal_price = 2.42, min_sell_price = 2.17, cost_price = 0.96, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 1;

UPDATE esim_packages
SET normal_price = 4.93, min_sell_price = 4.43, cost_price = 1.95, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 2;

UPDATE esim_packages
SET normal_price = 7.42, min_sell_price = 6.68, cost_price = 2.94, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 3;

UPDATE esim_packages
SET normal_price = 9.01, min_sell_price = 8.11, cost_price = 3.57, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 4;

UPDATE esim_packages
SET normal_price = 10.22, min_sell_price = 9.19, cost_price = 4.05, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 5;

UPDATE esim_packages
SET normal_price = 11.14, min_sell_price = 10.02, cost_price = 4.41, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 6;

UPDATE esim_packages
SET normal_price = 12.26, min_sell_price = 11.04, cost_price = 4.86, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 7;

UPDATE esim_packages
SET normal_price = 14.39, min_sell_price = 12.95, cost_price = 5.70, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 10;

UPDATE esim_packages
SET normal_price = 17.17, min_sell_price = 15.46, cost_price = 6.81, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 12;

UPDATE esim_packages
SET normal_price = 20.89, min_sell_price = 18.80, cost_price = 8.28, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 15;

UPDATE esim_packages
SET normal_price = 26.92, min_sell_price = 24.23, cost_price = 10.67, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 20;

UPDATE esim_packages
SET normal_price = 38.53, min_sell_price = 34.68, cost_price = 15.26, updated_at = now()
WHERE country_name = 'Thailand' AND qos_speed = '1Mbps' AND name LIKE '%Unlimited%' 
  AND data_amount = '3GB' AND validity_days = 30;