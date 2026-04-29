-- Clean up invalid zero-amount cashback transactions
DELETE FROM mobile11_money_transactions 
WHERE amount = 0 AND type = 'earned';

-- Delete incorrect cashback for orders fully paid with Mobile11 Money
-- (where total_amount = 0, meaning 100% was paid with Mobile11 Money)
DELETE FROM mobile11_money_transactions t
WHERE t.type = 'earned'
  AND t.order_id IN (
    SELECT id FROM orders 
    WHERE total_amount = 0 AND mobile11_money_applied > 0
  );

-- Also delete any earned transactions that are duplicates or incorrect
-- for orders where the cashback was calculated on original_amount instead of total_amount
-- We'll keep the redeemed transactions, those are correct