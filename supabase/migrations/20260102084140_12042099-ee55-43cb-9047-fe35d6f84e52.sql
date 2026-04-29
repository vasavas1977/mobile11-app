-- Loyalty tier configuration
CREATE TABLE loyalty_tier_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT UNIQUE NOT NULL,
  tier_order INT NOT NULL,
  tier_display_name TEXT NOT NULL,
  min_spent NUMERIC NOT NULL DEFAULT 0,
  cashback_rate NUMERIC NOT NULL,
  icon_name TEXT,
  badge_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert tier data (Explorer 5%, Silver 10%, Gold 15%)
INSERT INTO loyalty_tier_config (tier_name, tier_order, tier_display_name, min_spent, cashback_rate, icon_name, badge_color) VALUES
('explorer', 1, 'Explorer', 0, 5, 'Compass', '#F97316'),
('silver', 2, 'Silver Explorer', 700, 10, 'Medal', '#94A3B8'),
('gold', 3, 'Gold Explorer', 2500, 15, 'Crown', '#EAB308');

-- User loyalty tracking
CREATE TABLE user_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT DEFAULT 'explorer',
  total_spent NUMERIC DEFAULT 0,
  mobile11_money_balance NUMERIC DEFAULT 0,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_loyalty_user_id_unique UNIQUE (user_id),
  CONSTRAINT user_loyalty_tier_fkey FOREIGN KEY (tier) REFERENCES loyalty_tier_config(tier_name)
);

-- Mobile11 Money transactions history
CREATE TABLE mobile11_money_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id),
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus', 'referral')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User referrals tracking
CREATE TABLE user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Trusted devices tracking
CREATE TABLE trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location TEXT,
  is_current BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE loyalty_tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile11_money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_tier_config (public read)
CREATE POLICY "Anyone can view tier config" ON loyalty_tier_config FOR SELECT USING (true);

-- RLS Policies for user_loyalty
CREATE POLICY "Users can view own loyalty" ON user_loyalty FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loyalty" ON user_loyalty FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loyalty" ON user_loyalty FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all loyalty" ON user_loyalty FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for mobile11_money_transactions
CREATE POLICY "Users can view own transactions" ON mobile11_money_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all transactions" ON mobile11_money_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_referrals
CREATE POLICY "Users can view own referrals as referrer" ON user_referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can view own referrals as referred" ON user_referrals FOR SELECT USING (auth.uid() = referred_id);
CREATE POLICY "Admins can manage all referrals" ON user_referrals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for trusted_devices
CREATE POLICY "Users can view own devices" ON trusted_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devices" ON trusted_devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own devices" ON trusted_devices FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all devices" ON trusted_devices FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'MOBILE' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM user_loyalty WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Trigger to auto-generate referral code on user_loyalty insert
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON user_loyalty
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- Function to update user tier based on total_spent
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tier text;
BEGIN
  SELECT tier_name INTO new_tier
  FROM loyalty_tier_config
  WHERE NEW.total_spent >= min_spent
  ORDER BY min_spent DESC
  LIMIT 1;
  
  IF new_tier IS NOT NULL AND new_tier != NEW.tier THEN
    NEW.tier := new_tier;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_tier
BEFORE UPDATE ON user_loyalty
FOR EACH ROW
EXECUTE FUNCTION update_user_tier();