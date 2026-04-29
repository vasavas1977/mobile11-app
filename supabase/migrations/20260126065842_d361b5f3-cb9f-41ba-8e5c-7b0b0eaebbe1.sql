-- Update the pending order for vasavas1977@gmail.com to completed
UPDATE orders 
SET status = 'completed', 
    payment_completed_at = now()
WHERE id = '23f7bb42-a96d-4fb2-b739-aa6a779918fe';

-- Update the related payment record
UPDATE payments 
SET status = 'completed'
WHERE order_id = '23f7bb42-a96d-4fb2-b739-aa6a779918fe';