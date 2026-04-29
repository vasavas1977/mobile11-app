-- Add loyalty_processed column to orders table to track which orders have had cashback calculated
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS loyalty_processed boolean DEFAULT false;

-- Create index for efficient querying of unprocessed orders
CREATE INDEX IF NOT EXISTS idx_orders_loyalty_processed ON public.orders(loyalty_processed) WHERE loyalty_processed = false;