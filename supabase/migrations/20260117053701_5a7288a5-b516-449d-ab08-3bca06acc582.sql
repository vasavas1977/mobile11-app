-- Backfill missing redemption transactions for orders that used Mobile11 Money
-- These orders already had the balance deducted but the transaction record failed due to wrong type

-- Order d461dd3f-1b53-4fca-86b1-2328d61916ca: 45 THB (Jan 17, 2026)
INSERT INTO mobile11_money_transactions (user_id, order_id, amount, type, description, created_at)
VALUES ('e64ec1e6-d220-4f4b-80fe-dffcae7f9a08', 'd461dd3f-1b53-4fca-86b1-2328d61916ca', -45, 'redeemed', 'Used Mobile11 Money for order', '2026-01-17 04:32:37.386274+00')
ON CONFLICT DO NOTHING;

-- Order 755a2a67-bc9f-452e-b302-dd1c05a76c8c: 1.30 USD = 45.5 THB (Jan 11, 2026)
INSERT INTO mobile11_money_transactions (user_id, order_id, amount, type, description, created_at)
VALUES ('e64ec1e6-d220-4f4b-80fe-dffcae7f9a08', '755a2a67-bc9f-452e-b302-dd1c05a76c8c', -45.5, 'redeemed', 'Used Mobile11 Money for order', '2026-01-11 19:40:09.539307+00')
ON CONFLICT DO NOTHING;

-- Order 9d1ec8b6-1334-4a58-8bb8-9b2e8c073b52: 1.00 USD = 35 THB (Jan 11, 2026)
INSERT INTO mobile11_money_transactions (user_id, order_id, amount, type, description, created_at)
VALUES ('e64ec1e6-d220-4f4b-80fe-dffcae7f9a08', '9d1ec8b6-1334-4a58-8bb8-9b2e8c073b52', -35, 'redeemed', 'Used Mobile11 Money for order', '2026-01-11 16:56:17.834859+00')
ON CONFLICT DO NOTHING;