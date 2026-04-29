-- Add normal price and minimum sell price columns to esim_packages
ALTER TABLE public.esim_packages
ADD COLUMN IF NOT EXISTS normal_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_sell_price numeric DEFAULT 0;

-- Update existing records to use price as normal_price if not set
UPDATE public.esim_packages
SET normal_price = price
WHERE normal_price = 0;

COMMENT ON COLUMN public.esim_packages.normal_price IS 'Regular customer-facing price';
COMMENT ON COLUMN public.esim_packages.min_sell_price IS 'Minimum selling price';
COMMENT ON COLUMN public.esim_packages.cost_price IS 'B2B price (our cost)';
COMMENT ON COLUMN public.esim_packages.price IS 'Current selling price (shown to customers)';