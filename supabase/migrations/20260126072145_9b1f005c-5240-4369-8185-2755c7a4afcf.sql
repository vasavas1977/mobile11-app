-- Fix pending extension order from 2C2P payment
UPDATE orders 
SET status = 'completed', 
    payment_completed_at = now()
WHERE id = '7da7b288-4f58-4957-a64b-68a66ae87fc2';

-- Update the related payment record
UPDATE payments 
SET status = 'completed',
    payment_reference = '997742548'
WHERE order_id = '7da7b288-4f58-4957-a64b-68a66ae87fc2';