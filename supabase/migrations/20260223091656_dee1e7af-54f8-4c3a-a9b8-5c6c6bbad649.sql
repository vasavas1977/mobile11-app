-- Step 2: Deactivate TUGE non-TT&GPT China packages (carrier = 'CMCC', not 'CMCC (TT&GPT)')
UPDATE esim_packages 
SET is_active = false, updated_at = now()
WHERE country_code = 'CN' 
  AND carrier = 'CMCC' 
  AND provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac'
  AND is_active = true;

-- Step 3: Reactivate USIMSA China packages
UPDATE esim_packages 
SET is_active = true, updated_at = now()
WHERE country_code = 'CN' 
  AND carrier = 'CMCC' 
  AND provider_id = 'ed79f1a9-1c6f-450f-aae3-7fefc5cc2692'
  AND is_active = false;