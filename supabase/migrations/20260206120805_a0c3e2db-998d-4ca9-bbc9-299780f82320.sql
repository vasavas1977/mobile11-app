UPDATE esim_packages 
SET network_type = '4G/5G' 
WHERE country_name = 'Japan' 
  AND carrier = 'Softbank / KDDI' 
  AND is_active = true;