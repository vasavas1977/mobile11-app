-- 1. Create correction transaction using 'redeemed' type (negative amount = deduction)
INSERT INTO mobile11_money_transactions (
  user_id, 
  amount, 
  type, 
  description
) VALUES (
  'e64ec1e6-d220-4f4b-80fe-dffcae7f9a08',
  -34.03,
  'redeemed',
  'Balance correction: removed cashback incorrectly awarded for 100% free promo orders (Jan 2, 8, 11 2026)'
);

-- 2. Update user loyalty balance
UPDATE user_loyalty 
SET mobile11_money_balance = mobile11_money_balance - 34.03,
    updated_at = now()
WHERE user_id = 'e64ec1e6-d220-4f4b-80fe-dffcae7f9a08';