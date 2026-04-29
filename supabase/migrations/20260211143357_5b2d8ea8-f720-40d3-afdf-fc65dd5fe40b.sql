DELETE FROM esim_packages 
WHERE provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac' 
AND provider_metadata->>'card_type' = 'ep1'
AND package_id NOT LIKE 'C-%';