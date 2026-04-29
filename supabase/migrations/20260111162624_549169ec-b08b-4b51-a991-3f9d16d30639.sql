-- Add column to track Mobile11 Money applied to each order
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS mobile11_money_applied numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.mobile11_money_applied IS 'Amount of Mobile11 Money (in order currency) applied to this order';