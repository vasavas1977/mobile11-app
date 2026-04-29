-- Fix Day Pass packages: Move qos_speed to speed_after_limit
UPDATE esim_packages
SET 
  speed_after_limit = qos_speed,
  qos_speed = NULL
WHERE carrier = 'DOCOMO' 
  AND package_type = 'day_pass'
  AND country_code = 'JP';

-- Fix Limitless packages: Set qos_speed to "Unlimited"
UPDATE esim_packages
SET qos_speed = 'Unlimited'
WHERE carrier = 'DOCOMO' 
  AND package_type = 'limitless'
  AND country_code = 'JP'
  AND (qos_speed IS NULL OR qos_speed = '');

-- Fix Max Speed packages: Set qos_speed to "Max Speed"
UPDATE esim_packages
SET qos_speed = 'Max Speed'
WHERE carrier = 'DOCOMO' 
  AND package_type = 'max_speed'
  AND country_code = 'JP'
  AND (qos_speed IS NULL OR qos_speed = '');