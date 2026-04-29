-- Fix stuck order that has eSIM details but status is 'processing'
UPDATE orders 
SET status = 'completed',
    updated_at = now()
WHERE id = 'fe0a39bc-af37-4523-b7a8-98555c95a3e9'
  AND status = 'processing';