-- Create provider_apn_config table for multi-provider APN management
CREATE TABLE public.provider_apn_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.esim_providers(id) NOT NULL,
  
  -- Region/Country targeting (null = default for provider)
  region_code TEXT,           -- e.g., 'DEFAULT', 'ASIA', 'EUROPE', 'AMERICAS', 'SOUTHEAST_ASIA'
  country_code TEXT,          -- e.g., 'JP', 'TH' (for country-specific APNs)
  
  -- APN Configuration
  primary_apn TEXT NOT NULL,  -- First APN to try (e.g., 'CMLINK')
  alternative_apns TEXT[],    -- Fallback APNs in order
  
  -- Hotspot-specific (if different from cellular)
  hotspot_apn TEXT,           -- APN specifically for Personal Hotspot
  
  -- Additional settings
  apn_username TEXT,          -- Usually blank
  apn_password TEXT,          -- Usually blank
  apn_type TEXT,              -- e.g., 'default,supl,dun' for Android
  
  -- Provider notes
  notes TEXT,                 -- Internal notes about this config
  
  -- Metadata
  priority INTEGER DEFAULT 0, -- Higher = more specific (country > region > default)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_provider_apn_lookup ON public.provider_apn_config(provider_id, country_code, region_code);
CREATE INDEX idx_provider_apn_active ON public.provider_apn_config(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.provider_apn_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read active APN configs (for chatbot)
CREATE POLICY "Anyone can view active APN configs" 
ON public.provider_apn_config FOR SELECT 
USING (is_active = true);

-- Only admins can manage APN configs
CREATE POLICY "Admins can manage APN configs"
ON public.provider_apn_config FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_provider_apn_config_updated_at
BEFORE UPDATE ON public.provider_apn_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed USIMSA APN Data based on Excel file
-- First get the USIMSA provider ID
DO $$
DECLARE
  usimsa_id UUID;
BEGIN
  SELECT id INTO usimsa_id FROM public.esim_providers WHERE provider_code = 'usimsa' LIMIT 1;
  
  IF usimsa_id IS NOT NULL THEN
    -- USIMSA Default (covers Global 109/151, Europe 42, Americas, etc.)
    INSERT INTO public.provider_apn_config (provider_id, region_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'DEFAULT',
      'CMLINK',
      ARRAY['cmhk', 'internet.proximus.be', 'mobile.three.com.hk'],
      'CMLINK',
      'Default APN for most USIMSA packages - Global, Europe, Americas',
      0
    );

    -- USIMSA Asia Region (Japan, Korea, Thailand, UAE, etc.)
    INSERT INTO public.provider_apn_config (provider_id, region_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'ASIA',
      'cmhk',
      ARRAY['CMLINK', 'mobile.three.com.hk'],
      'cmhk',
      'Asia region packages - JP, KR, TH, UAE, etc.',
      10
    );

    -- USIMSA Southeast Asia
    INSERT INTO public.provider_apn_config (provider_id, region_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'SOUTHEAST_ASIA',
      'cmhk',
      ARRAY['mobile.three.com.hk', 'CMLINK'],
      'cmhk',
      'Southeast Asia packages - SG, MY, VN, ID, PH, etc.',
      15
    );

    -- USIMSA Europe
    INSERT INTO public.provider_apn_config (provider_id, region_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'EUROPE',
      'CMLINK',
      ARRAY['internet.proximus.be', 'cmhk'],
      'CMLINK',
      'Europe 42 countries packages',
      10
    );

    -- USIMSA Turkey (special case - has specific APNs)
    INSERT INTO public.provider_apn_config (provider_id, country_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'TR',
      'cmlink',
      ARRAY['ibox.tim.it', 'wap.tim.it', 'cmhk'],
      'cmlink',
      'Turkey specific - multiple carrier APNs available',
      20
    );

    -- USIMSA Cambodia (special case)
    INSERT INTO public.provider_apn_config (provider_id, country_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'KH',
      'cmlink',
      ARRAY['smartone', 'cmhk'],
      'cmlink',
      'Cambodia specific APNs',
      20
    );

    -- USIMSA Canada (special case)
    INSERT INTO public.provider_apn_config (provider_id, country_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'CA',
      'cmlink',
      ARRAY['orange', 'cmhk', 'CMLINK'],
      'cmlink',
      'Canada specific APNs',
      20
    );

    -- USIMSA Guam (special case)
    INSERT INTO public.provider_apn_config (provider_id, country_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'GU',
      'mobile.three.com.hk',
      ARRAY['cmhk', 'CMLINK'],
      'mobile.three.com.hk',
      'Guam specific APNs',
      20
    );

    -- USIMSA Japan (country-specific override)
    INSERT INTO public.provider_apn_config (provider_id, country_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'JP',
      'cmhk',
      ARRAY['CMLINK', 'mobile.three.com.hk'],
      'cmhk',
      'Japan specific - cmhk works best',
      20
    );

    -- USIMSA Thailand (country-specific)
    INSERT INTO public.provider_apn_config (provider_id, country_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'TH',
      'cmhk',
      ARRAY['CMLINK', 'mobile.three.com.hk'],
      'cmhk',
      'Thailand specific',
      20
    );

    -- USIMSA Korea (country-specific)
    INSERT INTO public.provider_apn_config (provider_id, country_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'KR',
      'cmhk',
      ARRAY['CMLINK'],
      'cmhk',
      'Korea specific',
      20
    );

    -- USIMSA UAE (country-specific)
    INSERT INTO public.provider_apn_config (provider_id, country_code, primary_apn, alternative_apns, hotspot_apn, notes, priority)
    VALUES (
      usimsa_id,
      'AE',
      'cmhk',
      ARRAY['CMLINK'],
      'cmhk',
      'UAE specific',
      20
    );
  END IF;
END $$;