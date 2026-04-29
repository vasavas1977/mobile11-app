-- Update loyalty tier thresholds to $100/$500 USD (3500/17500 THB)
UPDATE loyalty_tier_config SET min_spent = 3500 WHERE tier_name = 'silver';
UPDATE loyalty_tier_config SET min_spent = 17500 WHERE tier_name = 'gold';