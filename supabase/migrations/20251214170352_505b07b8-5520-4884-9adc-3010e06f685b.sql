-- Add currency column to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';

-- Add comment for clarity
COMMENT ON COLUMN public.promo_codes.currency IS 'Currency for fixed_amount discounts (USD or THB). Ignored for percentage discounts.';