-- Add notification_email column to orders table for LINE users to optionally receive email copies
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notification_email text;

-- Add comment explaining the column
COMMENT ON COLUMN public.orders.notification_email IS 'Optional email for LINE users who want email copies of order confirmations';