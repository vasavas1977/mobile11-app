
-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_area text NOT NULL,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_area)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view permissions" ON public.admin_permissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage permissions" ON public.admin_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed default permissions
INSERT INTO public.admin_permissions (role, permission_area, can_view, can_create, can_edit, can_delete) VALUES
  ('super_admin', 'dashboard', true, true, true, true),
  ('super_admin', 'orders', true, true, true, true),
  ('super_admin', 'refunds', true, true, true, true),
  ('super_admin', 'packages', true, true, true, true),
  ('super_admin', 'partners', true, true, true, true),
  ('super_admin', 'wallets', true, true, true, true),
  ('super_admin', 'settlements', true, true, true, true),
  ('super_admin', 'api_credentials', true, true, true, true),
  ('super_admin', 'contact_center', true, true, true, true),
  ('super_admin', 'kb_editing', true, true, true, true),
  ('super_admin', 'analytics', true, true, true, true),
  ('super_admin', 'settings', true, true, true, true),
  ('super_admin', 'developer_tools', true, true, true, true),
  ('admin', 'dashboard', true, true, true, true),
  ('admin', 'orders', true, true, true, true),
  ('admin', 'refunds', true, true, true, true),
  ('admin', 'packages', true, true, true, true),
  ('admin', 'partners', true, true, true, true),
  ('admin', 'wallets', true, true, true, true),
  ('admin', 'settlements', true, true, true, true),
  ('admin', 'api_credentials', true, true, true, true),
  ('admin', 'contact_center', true, true, true, true),
  ('admin', 'kb_editing', true, true, true, true),
  ('admin', 'analytics', true, true, true, true),
  ('admin', 'settings', true, true, true, true),
  ('admin', 'developer_tools', true, true, true, true),
  ('commerce_admin', 'dashboard', true, false, false, false),
  ('commerce_admin', 'orders', true, true, true, false),
  ('commerce_admin', 'refunds', true, true, true, false),
  ('commerce_admin', 'packages', true, true, true, false),
  ('commerce_admin', 'analytics', true, false, false, false),
  ('support_admin', 'dashboard', true, false, false, false),
  ('support_admin', 'orders', true, false, false, false),
  ('support_admin', 'contact_center', true, true, true, true),
  ('support_admin', 'kb_editing', true, true, true, true),
  ('support_admin', 'analytics', true, false, false, false),
  ('finance_admin', 'dashboard', true, false, false, false),
  ('finance_admin', 'orders', true, false, false, false),
  ('finance_admin', 'refunds', true, true, true, false),
  ('finance_admin', 'wallets', true, true, true, false),
  ('finance_admin', 'settlements', true, true, true, false),
  ('finance_admin', 'analytics', true, false, false, false),
  ('partner_manager', 'dashboard', true, false, false, false),
  ('partner_manager', 'partners', true, true, true, false),
  ('partner_manager', 'wallets', true, true, false, false),
  ('partner_manager', 'analytics', true, false, false, false),
  ('territory_manager', 'dashboard', true, false, false, false),
  ('territory_manager', 'partners', true, false, true, false),
  ('territory_manager', 'analytics', true, false, false, false),
  ('reseller_admin', 'dashboard', true, false, false, false),
  ('reseller_admin', 'orders', true, true, false, false),
  ('reseller_admin', 'wallets', true, false, false, false),
  ('distributor_admin', 'dashboard', true, false, false, false),
  ('distributor_admin', 'orders', true, true, false, false),
  ('distributor_admin', 'partners', true, false, true, false),
  ('distributor_admin', 'wallets', true, false, false, false),
  ('api_partner_admin', 'dashboard', true, false, false, false),
  ('api_partner_admin', 'api_credentials', true, true, true, false),
  ('api_partner_admin', 'analytics', true, false, false, false),
  ('read_only_analyst', 'dashboard', true, false, false, false),
  ('read_only_analyst', 'orders', true, false, false, false),
  ('read_only_analyst', 'analytics', true, false, false, false),
  ('supervisor', 'dashboard', true, false, false, false),
  ('supervisor', 'contact_center', true, true, true, false),
  ('supervisor', 'kb_editing', true, true, true, false),
  ('supervisor', 'analytics', true, false, false, false),
  ('agent', 'contact_center', true, true, false, false),
  ('agent', 'kb_editing', true, false, false, false)
ON CONFLICT (role, permission_area) DO NOTHING;
