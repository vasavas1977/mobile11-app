-- Update all Max Speed packages to have qos_speed match network_type
UPDATE esim_packages 
SET qos_speed = network_type,
    updated_at = now()
WHERE package_type = 'max_speed' AND (qos_speed IS NULL OR qos_speed != network_type);
