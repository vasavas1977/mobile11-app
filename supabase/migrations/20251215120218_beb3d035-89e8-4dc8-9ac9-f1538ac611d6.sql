-- Manually attribute affiliate sales for missed orders

-- Order 1: 527b69b7-6998-4691-93dd-3ea8166304fa ($1.00, 10% = $0.10 commission)
INSERT INTO public.affiliate_conversions (
  affiliate_id,
  order_id,
  order_amount,
  commission_rate,
  commission_amount,
  commission_type,
  status
) VALUES (
  'e01279d8-79e6-458b-9656-c037474fe4c2',
  '527b69b7-6998-4691-93dd-3ea8166304fa',
  1.00,
  10,
  0.10,
  'percentage',
  'pending'
) ON CONFLICT DO NOTHING;

-- Order 2: 3992483d-3f35-4688-b247-0fbaf10045c3 ($0.28, 10% = $0.028 commission)
INSERT INTO public.affiliate_conversions (
  affiliate_id,
  order_id,
  order_amount,
  commission_rate,
  commission_amount,
  commission_type,
  status
) VALUES (
  'e01279d8-79e6-458b-9656-c037474fe4c2',
  '3992483d-3f35-4688-b247-0fbaf10045c3',
  0.28,
  10,
  0.028,
  'percentage',
  'pending'
) ON CONFLICT DO NOTHING;

-- Update affiliate stats (add 2 conversions, 0.128 pending earnings)
UPDATE public.affiliates
SET 
  total_conversions = COALESCE(total_conversions, 0) + 2,
  pending_earnings = COALESCE(pending_earnings, 0) + 0.128,
  monthly_sales_count = COALESCE(monthly_sales_count, 0) + 2,
  total_lifetime_sales = COALESCE(total_lifetime_sales, 0) + 2,
  updated_at = now()
WHERE id = 'e01279d8-79e6-458b-9656-c037474fe4c2';