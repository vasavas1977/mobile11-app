-- Backfill payment records for existing manual TUGE orders that have no payment
INSERT INTO public.payments (order_id, amount, currency, status, payment_method, payment_gateway, payment_intent_id)
SELECT o.id, 0, o.currency, 'succeeded', 'admin_manual', 'manual', 'admin_' || o.order_id
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
WHERE o.order_id LIKE 'TUGE-%' AND p.id IS NULL;