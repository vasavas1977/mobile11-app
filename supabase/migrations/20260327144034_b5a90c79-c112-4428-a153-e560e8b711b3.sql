UPDATE orders o
SET payment_completed_at = p.created_at
FROM payments p
WHERE p.order_id = o.id
  AND p.payment_gateway = '2c2p'
  AND p.status = 'completed'
  AND o.payment_completed_at IS NULL;