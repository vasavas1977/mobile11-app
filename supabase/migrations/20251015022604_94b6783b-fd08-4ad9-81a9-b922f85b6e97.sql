-- Add all Excel columns to esim_packages table
ALTER TABLE public.esim_packages
ADD COLUMN IF NOT EXISTS carrier text,
ADD COLUMN IF NOT EXISTS network_type text,
ADD COLUMN IF NOT EXISTS service_type text,
ADD COLUMN IF NOT EXISTS apn text,
ADD COLUMN IF NOT EXISTS availability text,
ADD COLUMN IF NOT EXISTS support_voice boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS support_sms boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS support_data boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS activation_note text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'regional';

COMMENT ON COLUMN public.esim_packages.carrier IS 'Network carrier/provider (e.g., Optus, Vodafone)';
COMMENT ON COLUMN public.esim_packages.network_type IS 'Network generation (e.g., 3G, 4G, 5G)';
COMMENT ON COLUMN public.esim_packages.service_type IS 'Service type (e.g., Roaming, Local)';
COMMENT ON COLUMN public.esim_packages.apn IS 'APN configuration';
COMMENT ON COLUMN public.esim_packages.availability IS 'Availability status';
COMMENT ON COLUMN public.esim_packages.support_voice IS 'Voice call support';
COMMENT ON COLUMN public.esim_packages.support_sms IS 'SMS support';
COMMENT ON COLUMN public.esim_packages.support_data IS 'Data support';
COMMENT ON COLUMN public.esim_packages.activation_note IS 'Activation instructions/notes';
COMMENT ON COLUMN public.esim_packages.category IS 'Package category (e.g., regional, global, local)';

-- Create table for display settings
CREATE TABLE IF NOT EXISTS public.package_display_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_visible boolean DEFAULT true,
  display_order integer DEFAULT 0,
  field_category text DEFAULT 'basic',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_display_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for display settings
CREATE POLICY "Admins can manage display settings"
ON public.package_display_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view display settings"
ON public.package_display_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert default display settings
INSERT INTO public.package_display_settings (field_name, display_name, is_visible, display_order, field_category) VALUES
('data_amount', 'Data Amount', true, 1, 'basic'),
('validity_days', 'Validity Period', true, 2, 'basic'),
('price', 'Price', true, 3, 'basic'),
('carrier', 'Network Carrier', false, 4, 'network'),
('network_type', 'Network Type', false, 5, 'network'),
('qos_speed', 'Speed', false, 6, 'network'),
('service_type', 'Service Type', false, 7, 'details'),
('sim_type', 'SIM Type', false, 8, 'details'),
('is_cancelable', 'Cancelable', false, 9, 'details'),
('description', 'Description', true, 10, 'details'),
('activation_note', 'Activation Notes', false, 11, 'details'),
('apn', 'APN', false, 12, 'technical'),
('support_voice', 'Voice Support', false, 13, 'features'),
('support_sms', 'SMS Support', false, 14, 'features'),
('support_data', 'Data Support', false, 15, 'features')
ON CONFLICT (field_name) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_package_display_settings_updated_at
BEFORE UPDATE ON public.package_display_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();