
-- Update descriptions for 1Mbps Non-Stop packages
UPDATE esim_packages 
SET description = CONCAT(
  'Enjoy truly unlimited data at 1Mbps - perfect for browsing, messaging, social media, and navigation. No daily limits, no throttling, no surprises. Stay connected non-stop throughout your ',
  validity_days,
  '-day journey in ',
  country_name,
  '.'
),
updated_at = now()
WHERE package_type = 'non_stop' AND qos_speed = '1Mbps';

-- Update descriptions for 5Mbps Non-Stop packages
UPDATE esim_packages 
SET description = CONCAT(
  'Premium unlimited data at 5Mbps - ideal for HD streaming, video calls, cloud uploads, and heavy browsing. No daily caps, no speed reduction, just consistent high-speed internet. Experience non-stop connectivity during your ',
  validity_days,
  '-day trip to ',
  country_name,
  '.'
),
updated_at = now()
WHERE package_type = 'non_stop' AND qos_speed = '5Mbps';
