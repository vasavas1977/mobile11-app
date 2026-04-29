
-- Delete associated payment record first (foreign key constraint)
DELETE FROM payments WHERE order_id = '50d4fd5f-eaa4-4264-a3db-de3fc0bb1e04';

-- Delete the duplicate order record
DELETE FROM orders WHERE id = '50d4fd5f-eaa4-4264-a3db-de3fc0bb1e04';
