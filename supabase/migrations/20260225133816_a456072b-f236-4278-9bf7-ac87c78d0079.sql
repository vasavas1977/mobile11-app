-- Populate daily_reset_amount for Africa 18 day_pass packages
-- Extract daily amount from data_amount field (e.g., '1GB/day' -> '1GB', '500MB/day' -> '500MB')
UPDATE esim_packages
SET daily_reset_amount = REPLACE(data_amount, '/day', '')
WHERE country_name ILIKE '%Africa 18%'
  AND package_type = 'day_pass'
  AND daily_reset_amount IS NULL
  AND data_amount LIKE '%/day%';
