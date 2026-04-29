-- Phase 1: Business eSIM Management Foundation

-- 1. Create enum for organization roles
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'manager', 'member');

-- 2. Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  billing_email TEXT NOT NULL,
  billing_address JSONB DEFAULT '{}',
  tax_id TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('small', 'medium', 'large', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  settings JSONB DEFAULT '{}',
  credit_limit NUMERIC DEFAULT 0,
  credit_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Create organization_members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'member',
  department TEXT,
  employee_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 4. Create organization_invitations table
CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  department TEXT,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create organization_esim_assignments table
CREATE TABLE public.organization_esim_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  assignment_note TEXT,
  trip_start_date DATE,
  trip_end_date DATE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_use', 'returned', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create organization_orders table
CREATE TABLE public.organization_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  purchased_by UUID NOT NULL REFERENCES auth.users(id),
  cost_center TEXT,
  project_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- 7. Add organization columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS purchased_for_user_id UUID REFERENCES auth.users(id);

-- 8. Create indexes for performance
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_organization_invitations_email ON public.organization_invitations(email);
CREATE INDEX idx_organization_esim_assignments_org_id ON public.organization_esim_assignments(organization_id);
CREATE INDEX idx_organization_esim_assignments_assigned_to ON public.organization_esim_assignments(assigned_to);
CREATE INDEX idx_organization_orders_org_id ON public.organization_orders(organization_id);
CREATE INDEX idx_orders_organization_id ON public.orders(organization_id);

-- 9. Create helper functions

-- Check if user is org owner/admin
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND is_active = true
  );
$$;

-- Check if user is org member
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND is_active = true
  );
$$;

-- Check if user is org owner/admin/manager
CREATE OR REPLACE FUNCTION public.is_org_manager(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'manager')
    AND is_active = true
  );
$$;

-- Get user's organization IDs
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid() AND is_active = true;
$$;

-- Generate unique slug from organization name
CREATE OR REPLACE FUNCTION public.generate_org_slug(org_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure minimum length
  IF length(base_slug) < 3 THEN
    base_slug := base_slug || '-org';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add suffix if needed
  WHILE EXISTS(SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- 10. Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_esim_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_orders ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for organizations

-- Members can view their organizations
CREATE POLICY "Members can view their organizations"
ON public.organizations FOR SELECT
USING (public.is_org_member(id));

-- Owners/Admins can update organization
CREATE POLICY "Admins can update organization"
ON public.organizations FOR UPDATE
USING (public.is_org_admin(id));

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners can delete organization
CREATE POLICY "Owners can delete organization"
ON public.organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = id
    AND user_id = auth.uid()
    AND role = 'owner'
    AND is_active = true
  )
);

-- 12. RLS Policies for organization_members

-- Members can view other members in their org
CREATE POLICY "Members can view org members"
ON public.organization_members FOR SELECT
USING (public.is_org_member(organization_id));

-- Admins can insert new members
CREATE POLICY "Admins can add members"
ON public.organization_members FOR INSERT
WITH CHECK (public.is_org_admin(organization_id));

-- Admins can update members (but not promote above their own role)
CREATE POLICY "Admins can update members"
ON public.organization_members FOR UPDATE
USING (public.is_org_admin(organization_id));

-- Admins can remove members
CREATE POLICY "Admins can remove members"
ON public.organization_members FOR DELETE
USING (public.is_org_admin(organization_id));

-- 13. RLS Policies for organization_invitations

-- Admins can view invitations
CREATE POLICY "Admins can view invitations"
ON public.organization_invitations FOR SELECT
USING (public.is_org_admin(organization_id));

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.organization_invitations FOR INSERT
WITH CHECK (public.is_org_admin(organization_id));

-- Admins can update invitations (revoke)
CREATE POLICY "Admins can update invitations"
ON public.organization_invitations FOR UPDATE
USING (public.is_org_admin(organization_id));

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.organization_invitations FOR SELECT
USING (true);

-- 14. RLS Policies for organization_esim_assignments

-- Managers+ can view all assignments in org
CREATE POLICY "Managers can view assignments"
ON public.organization_esim_assignments FOR SELECT
USING (public.is_org_manager(organization_id) OR assigned_to = auth.uid());

-- Managers+ can create assignments
CREATE POLICY "Managers can create assignments"
ON public.organization_esim_assignments FOR INSERT
WITH CHECK (public.is_org_manager(organization_id));

-- Managers+ can update assignments
CREATE POLICY "Managers can update assignments"
ON public.organization_esim_assignments FOR UPDATE
USING (public.is_org_manager(organization_id));

-- Managers+ can delete assignments
CREATE POLICY "Managers can delete assignments"
ON public.organization_esim_assignments FOR DELETE
USING (public.is_org_manager(organization_id));

-- 15. RLS Policies for organization_orders

-- Members can view their org's orders
CREATE POLICY "Members can view org orders"
ON public.organization_orders FOR SELECT
USING (public.is_org_member(organization_id));

-- Managers+ can create org orders
CREATE POLICY "Managers can create org orders"
ON public.organization_orders FOR INSERT
WITH CHECK (public.is_org_manager(organization_id));

-- 16. Create updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_esim_assignments_updated_at
  BEFORE UPDATE ON public.organization_esim_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();