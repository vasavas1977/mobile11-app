UPDATE esim_providers 
SET 
  api_base_url = 'https://partner-api.tuge.io',
  api_base_url_sandbox = 'https://sandbox-api.tuge.io'
WHERE provider_code = 'tuge';