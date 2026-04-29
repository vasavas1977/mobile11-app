-- Add eSIM expiry and download information columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS download_link TEXT,
ADD COLUMN IF NOT EXISTS smdp_address TEXT,
ADD COLUMN IF NOT EXISTS activation_code TEXT;

-- Add helpful comment
COMMENT ON COLUMN public.orders.expiry_date IS 'eSIM expiration date from USIMSA webhook';
COMMENT ON COLUMN public.orders.download_link IS 'Direct download link for eSIM profile from USIMSA';
COMMENT ON COLUMN public.orders.smdp_address IS 'SM-DP+ Address for manual eSIM installation';
COMMENT ON COLUMN public.orders.activation_code IS 'Activation code for manual eSIM installation';