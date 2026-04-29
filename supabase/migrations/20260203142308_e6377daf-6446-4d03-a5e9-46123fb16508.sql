-- Add topup_amount to promo_codes for Mobile11 Money system
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS topup_amount numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN promo_codes.topup_amount IS 'Amount to add to user Mobile11 Money balance when code is redeemed (in THB)';