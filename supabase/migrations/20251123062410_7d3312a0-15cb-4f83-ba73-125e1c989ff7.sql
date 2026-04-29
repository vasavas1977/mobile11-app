-- Step 1: Drop the existing check constraint
ALTER TABLE esim_packages DROP CONSTRAINT IF EXISTS check_package_type;

-- Step 2: Update package_type from non_stop to limitless BEFORE adding new constraint
UPDATE esim_packages 
SET 
  package_type = 'limitless',
  updated_at = now()
WHERE package_type = 'non_stop';

-- Step 3: Now add the new check constraint with 'limitless' included
ALTER TABLE esim_packages 
ADD CONSTRAINT check_package_type 
CHECK (package_type IN ('day_pass', 'max_speed', 'limitless'));

-- Step 4: Update descriptions to reflect maximum speeds with minimum guarantees
UPDATE esim_packages 
SET 
  description = CASE
    WHEN qos_speed ILIKE '%5mbps%' THEN 
      'Unlimited data at maximum network speeds (up to 5G). No caps, no throttling. Minimum speed guaranteed at 5 Mbps. Perfect for streaming, video calls, and heavy usage.'
    WHEN qos_speed ILIKE '%1mbps%' THEN 
      'Unlimited data at maximum network speeds (up to 5G). No caps, no throttling. Minimum speed guaranteed at 1 Mbps. Great for worry-free connectivity.'
    ELSE 
      'Unlimited data at maximum network speeds. No caps, no throttling, no limits. Stream, browse, and connect without worry.'
  END,
  updated_at = now()
WHERE package_type = 'limitless';