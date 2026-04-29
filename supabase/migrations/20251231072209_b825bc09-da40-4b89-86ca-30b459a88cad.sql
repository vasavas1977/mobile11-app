-- Insert the Christmas & New Year 2025 campaign
INSERT INTO promo_campaigns (
  name,
  description,
  banner_type,
  status,
  start_date,
  end_date,
  target_audience,
  display_pages,
  banner_content
) VALUES (
  'Christmas & New Year 2025',
  '40% off all eSIM packages - Holiday special promotion',
  'announcement',
  'active',
  '2025-12-14T00:00:00Z',
  '2025-12-31T23:59:59Z',
  'all',
  ARRAY['/', '/packages'],
  '{"title": "Christmas & New Year Sale!", "subtitle": "40% OFF All eSIMs", "cta_text": "Shop Now", "promo_code": "XMAS2026", "colors": {"background": "gradient-christmas", "text": "white"}}'::jsonb
);

-- Link the XMAS2026 promo code to the campaign
INSERT INTO campaign_promo_codes (campaign_id, promo_code_id)
SELECT 
  (SELECT id FROM promo_campaigns WHERE name = 'Christmas & New Year 2025' LIMIT 1),
  '9124bc3f-853b-493d-be12-0b6c9d1333b8';

-- Backfill conversion analytics from existing orders that used the XMAS2026 promo code
INSERT INTO campaign_analytics (campaign_id, event_type, user_id, created_at, metadata)
SELECT 
  (SELECT id FROM promo_campaigns WHERE name = 'Christmas & New Year 2025' LIMIT 1),
  'conversion',
  o.user_id,
  o.created_at,
  jsonb_build_object(
    'order_id', o.id,
    'order_amount', o.total_amount,
    'discount_amount', o.discount_amount
  )
FROM orders o
WHERE o.promo_code_id = '9124bc3f-853b-493d-be12-0b6c9d1333b8';

-- Update the XMAS2026 promo code to reference the campaign
UPDATE promo_codes 
SET campaign_id = (SELECT id FROM promo_campaigns WHERE name = 'Christmas & New Year 2025' LIMIT 1)
WHERE id = '9124bc3f-853b-493d-be12-0b6c9d1333b8';