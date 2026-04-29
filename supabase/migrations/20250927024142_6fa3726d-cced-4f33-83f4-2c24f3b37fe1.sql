-- Insert sample orders for testing
INSERT INTO public.orders (
  id,
  user_id,
  package_id,
  order_id,
  status,
  total_amount,
  currency,
  iccid,
  msisdn,
  qr_code
) VALUES 
-- Completed order
(
  '550e8400-e29b-41d4-a716-446655440001',
  'e64ec1e6-d220-4f4b-80fe-dffcae7f9a08',
  '24e7e181-2cc3-4755-b851-f5e48e0d3f5a',
  'ORD-001-2024',
  'completed',
  9.99,
  'USD',
  '8901260123456789012',
  '+1234567890',
  'QR_CODE_DATA_HERE'
),
-- Pending order
(
  '550e8400-e29b-41d4-a716-446655440002',
  'e64ec1e6-d220-4f4b-80fe-dffcae7f9a08',
  'b433479b-5d82-4677-9e70-32da838e476f',
  'ORD-002-2024',
  'pending',
  29.99,
  'USD',
  NULL,
  NULL,
  NULL
),
-- Failed order
(
  '550e8400-e29b-41d4-a716-446655440003',
  'e64ec1e6-d220-4f4b-80fe-dffcae7f9a08',
  'f733b76f-46c1-4f60-84c7-cbf5c7b406b0',
  'ORD-003-2024',
  'failed',
  19.99,
  'USD',
  NULL,
  NULL,
  NULL
);

-- Insert corresponding payments
INSERT INTO public.payments (
  id,
  order_id,
  amount,
  currency,
  status,
  payment_method,
  payment_intent_id
) VALUES 
-- Payment for completed order
(
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  9.99,
  'USD',
  'completed',
  'card',
  'pi_1ABC123DEF456'
),
-- Payment for pending order
(
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440002',
  29.99,
  'USD',
  'pending',
  'card',
  'pi_2ABC123DEF789'
),
-- Payment for failed order
(
  '660e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440003',
  19.99,
  'USD',
  'failed',
  'card',
  'pi_3ABC123DEF012'
);