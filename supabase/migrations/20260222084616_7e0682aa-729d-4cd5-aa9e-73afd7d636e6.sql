UPDATE esim_packages
SET top_up = true
WHERE country_name = 'China'
  AND carrier = 'CMCC (TT&GPT)'
  AND is_active = true;