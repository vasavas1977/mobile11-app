-- Fix the constraint to allow 'topup', 'voucher', and 'adjustment' types
ALTER TABLE mobile11_money_transactions 
DROP CONSTRAINT IF EXISTS mobile11_money_transactions_type_check;

ALTER TABLE mobile11_money_transactions 
ADD CONSTRAINT mobile11_money_transactions_type_check 
CHECK (type = ANY (ARRAY['earned', 'redeemed', 'expired', 'bonus', 'referral', 'topup', 'voucher', 'adjustment']));

-- Backfill the missing 500 baht top-up transaction for vasavas1977@gmail.com
INSERT INTO mobile11_money_transactions (
  user_id, 
  amount, 
  type, 
  description
) VALUES (
  'e64ec1e6-d220-4f4b-80fe-dffcae7f9a08',
  500,
  'topup',
  'Redeemed code: TEXT100OBAHT'
);