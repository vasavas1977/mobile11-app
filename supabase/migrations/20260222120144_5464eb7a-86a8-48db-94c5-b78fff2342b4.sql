
UPDATE public.country_carriers 
SET network_type = '5G', updated_at = now() 
WHERE region_preset = 'europe_42_stopover';
