-- Update AIS package to require KYC
UPDATE esim_packages 
SET kyc = true 
WHERE package_id = 'A-007-ES-AU-AIS-T-7D/60D-15GB';