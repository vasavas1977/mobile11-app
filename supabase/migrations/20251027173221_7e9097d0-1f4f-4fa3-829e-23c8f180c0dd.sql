-- Create system_settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('general', 'email', 'notifications', 'business', 'integrations')),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'text', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage all settings
CREATE POLICY "Admins can manage all settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public can view public settings
CREATE POLICY "Anyone can view public settings"
ON public.system_settings
FOR SELECT
USING (is_public = true);

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default settings
INSERT INTO public.system_settings (category, key, value, data_type, description, is_public) VALUES
-- General settings
('general', 'site_name', '"Mobile11"', 'string', 'Name of the site', true),
('general', 'site_description', '"Your trusted eSIM provider"', 'string', 'Site description for meta tags', true),
('general', 'contact_email', '"contact@mobile11.com"', 'string', 'Contact email address', false),
('general', 'support_email', '"support@mobile11.com"', 'string', 'Support email address', false),
('general', 'default_currency', '"USD"', 'string', 'Default currency for pricing', true),

-- Notification settings
('notifications', 'email_enabled', 'true', 'boolean', 'Enable email notifications', false),
('notifications', 'sms_enabled', 'false', 'boolean', 'Enable SMS notifications', false),
('notifications', 'order_confirmation_enabled', 'true', 'boolean', 'Send order confirmation emails', false),
('notifications', 'esim_delivery_enabled', 'true', 'boolean', 'Send eSIM delivery notifications', false),

-- Business settings
('business', 'refund_policy', '"Refunds are available within 7 days of purchase for unused eSIMs. Please contact support for assistance."', 'text', 'Refund policy text', true),
('business', 'terms_of_service', '"By using our service, you agree to our terms and conditions."', 'text', 'Terms of service text', true),
('business', 'privacy_policy', '"We protect your privacy and handle your data securely."', 'text', 'Privacy policy text', true);