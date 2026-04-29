-- Fix pending extension order for the user
UPDATE orders 
SET status = 'completed', 
    payment_completed_at = now()
WHERE id = 'bc8853a2-83e4-4d6c-b0e8-617209142754';

-- Update the related payment record
UPDATE payments 
SET status = 'completed'
WHERE order_id = 'bc8853a2-83e4-4d6c-b0e8-617209142754';