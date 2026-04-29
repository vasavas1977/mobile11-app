-- Fix AIS package country_name from 'TH' to 'Thailand'
-- This allows the package to appear in Thailand page queries
UPDATE esim_packages 
SET country_name = 'Thailand' 
WHERE package_id = 'A-007-ES-AU-AIS-T-7D/60D-15GB';