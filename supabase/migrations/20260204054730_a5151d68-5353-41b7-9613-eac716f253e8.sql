-- Drop the existing constraint
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_type_check;

-- Add updated constraint with the new type
ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_discount_type_check 
  CHECK (discount_type = ANY (ARRAY['free', 'percentage', 'fixed_amount', 'mobile11_money_topup']));