-- Create cache table for TUGE products (separate from production esim_packages)
CREATE TABLE public.tuge_product_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  product_type TEXT,
  countries JSONB DEFAULT '[]'::jsonb,
  net_price NUMERIC NOT NULL DEFAULT 0,
  usage_period INTEGER,
  validity_period INTEGER,
  data_total NUMERIC,
  data_unit TEXT,
  data_limited BOOLEAN DEFAULT false,
  high_speed TEXT,
  limit_speed TEXT,
  card_type TEXT,
  has_topup BOOLEAN DEFAULT false,
  topup_count INTEGER DEFAULT 0,
  raw_data JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_tuge_product_cache_product_code ON public.tuge_product_cache(product_code);
CREATE INDEX idx_tuge_product_cache_countries ON public.tuge_product_cache USING GIN(countries);

-- Enable Row Level Security
ALTER TABLE public.tuge_product_cache ENABLE ROW LEVEL SECURITY;

-- Only admins can view cached products
CREATE POLICY "Admins can view cached products"
ON public.tuge_product_cache
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage cached products
CREATE POLICY "Admins can manage cached products"
ON public.tuge_product_cache
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment for documentation
COMMENT ON TABLE public.tuge_product_cache IS 'Cache table for TUGE API products. Products stored here are not visible to customers until imported to esim_packages.';