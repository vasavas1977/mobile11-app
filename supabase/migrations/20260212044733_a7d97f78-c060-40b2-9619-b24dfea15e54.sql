CREATE OR REPLACE FUNCTION public.get_package_search_index()
RETURNS TABLE(country_name text, country_code text, category text, included_countries jsonb, package_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ep.country_name,
    MAX(ep.country_code) as country_code,
    MAX(ep.category) as category,
    (array_agg(ep.included_countries) FILTER (WHERE ep.included_countries IS NOT NULL))[1]::jsonb as included_countries,
    COUNT(*) as package_count
  FROM esim_packages ep
  WHERE ep.is_active = true
  GROUP BY ep.country_name;
$$;