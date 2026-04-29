UPDATE esim_packages
SET is_active = false, updated_at = now()
WHERE country_name = 'Indonesia'
  AND carrier = 'Indosat/Tri'
  AND is_active = true;