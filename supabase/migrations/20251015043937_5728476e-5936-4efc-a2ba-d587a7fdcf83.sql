-- Set all packages to data-only (no voice calls)
UPDATE esim_packages 
SET support_voice = false, support_sms = false
WHERE support_voice = true OR support_sms = true;