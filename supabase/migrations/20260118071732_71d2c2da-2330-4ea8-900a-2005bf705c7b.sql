-- Add balance expiration tracking column
ALTER TABLE user_loyalty 
ADD COLUMN IF NOT EXISTS balance_expires_at TIMESTAMP WITH TIME ZONE;

-- Set initial expiration for existing users with balance (1 year from their last order)
UPDATE user_loyalty ul
SET balance_expires_at = (
  SELECT COALESCE(MAX(created_at) + INTERVAL '1 year', now() + INTERVAL '1 year')
  FROM orders o
  WHERE o.user_id = ul.user_id
  AND o.status IN ('completed', 'active')
)
WHERE ul.mobile11_money_balance > 0
AND ul.balance_expires_at IS NULL;