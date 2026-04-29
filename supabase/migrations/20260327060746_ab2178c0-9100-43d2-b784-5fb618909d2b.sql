-- Fix stuck 3DS orders where payment was completed but backend was never notified
-- Order: ORD-1774591202459-27XJU5V9N (pi_3TFTRBHwtbvnDkxz0BIJjxR5)
UPDATE public.orders 
SET status = 'processing', 
    payment_completed_at = now()
WHERE parent_order_id = 'ORD-1774591202459-27XJU5V9N' 
  AND status = 'pending';

UPDATE public.payments 
SET status = 'completed'
WHERE order_id IN (
  SELECT id FROM public.orders WHERE parent_order_id = 'ORD-1774591202459-27XJU5V9N'
) AND status = 'pending';

-- Also fix previous stuck order: ORD-1774590256343-6RT1G3Q32
UPDATE public.orders 
SET status = 'processing', 
    payment_completed_at = now()
WHERE parent_order_id = 'ORD-1774590256343-6RT1G3Q32' 
  AND status = 'pending';

UPDATE public.payments 
SET status = 'completed'
WHERE order_id IN (
  SELECT id FROM public.orders WHERE parent_order_id = 'ORD-1774590256343-6RT1G3Q32'
) AND status = 'pending';