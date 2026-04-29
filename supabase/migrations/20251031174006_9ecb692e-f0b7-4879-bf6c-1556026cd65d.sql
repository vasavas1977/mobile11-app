-- Add PromptPay support to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS qr_code_image_url TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS qr_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'stripe';

-- Add index for quick payment reference lookups
CREATE INDEX IF NOT EXISTS idx_payments_payment_reference ON public.payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_status ON public.payments(payment_gateway, status);

-- Add comment for documentation
COMMENT ON COLUMN public.payments.payment_gateway IS 'Payment gateway used: stripe, omise, 2c2p';
COMMENT ON COLUMN public.payments.payment_reference IS 'Unique reference for QR code payments (Omise charge_id or 2C2P invoice)';
COMMENT ON COLUMN public.payments.qr_code_image_url IS 'URL to QR code image (provided by payment gateway)';
COMMENT ON COLUMN public.payments.qr_code_data IS 'Raw QR code string for custom rendering';