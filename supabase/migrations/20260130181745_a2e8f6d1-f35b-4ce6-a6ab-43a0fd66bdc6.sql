-- Update existing tiers
UPDATE loyalty_tier_config SET cashback_rate = 5, min_spent = 0 WHERE tier_name = 'explorer';
UPDATE loyalty_tier_config SET cashback_rate = 7, min_spent = 1750 WHERE tier_name = 'silver';
UPDATE loyalty_tier_config SET cashback_rate = 10, min_spent = 3500, tier_display_name = 'Gold Explorer' WHERE tier_name = 'gold';

-- Add Platinum tier
INSERT INTO loyalty_tier_config (tier_name, tier_display_name, cashback_rate, min_spent, tier_order, icon_name, badge_color)
VALUES ('platinum', 'Platinum Explorer', 15, 7000, 4, 'Gem', '#a855f7')
ON CONFLICT (tier_name) DO UPDATE SET
  cashback_rate = 15,
  min_spent = 7000,
  tier_display_name = 'Platinum Explorer',
  tier_order = 4,
  icon_name = 'Gem',
  badge_color = '#a855f7';