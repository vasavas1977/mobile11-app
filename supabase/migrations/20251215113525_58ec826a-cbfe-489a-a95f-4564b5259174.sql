-- Add language column to orders table to store user's language preference at checkout
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Add comment for documentation
COMMENT ON COLUMN public.orders.language IS 'User language preference at time of purchase (en or th)';