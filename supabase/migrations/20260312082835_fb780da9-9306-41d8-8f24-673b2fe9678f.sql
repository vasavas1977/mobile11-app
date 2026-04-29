UPDATE esim_packages
SET is_local_sim = true, updated_at = now()
WHERE country_name = 'Japan'
  AND carrier = 'DOCOMO';