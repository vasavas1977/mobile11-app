
-- Territories table for international expansion management
CREATE TABLE public.territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_name text NOT NULL,
  country_code text NOT NULL,
  country_name text NOT NULL,
  region text,
  distributor_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  exclusivity_model text NOT NULL DEFAULT 'non_exclusive',
  start_date date,
  end_date date,
  local_currency text NOT NULL DEFAULT 'USD',
  default_language text NOT NULL DEFAULT 'en',
  local_price_rules jsonb DEFAULT '{}',
  support_routing jsonb DEFAULT '{}',
  available_packages text[] DEFAULT '{}',
  enabled_channels text[] DEFAULT ARRAY['web', 'line', 'whatsapp'],
  tax_notes text,
  legal_notes text,
  contract_status text NOT NULL DEFAULT 'draft',
  contract_reference text,
  monthly_revenue numeric DEFAULT 0,
  monthly_orders integer DEFAULT 0,
  monthly_support_tickets integer DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view territories"
  ON public.territories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage territories"
  ON public.territories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Territory package assignments
CREATE TABLE public.territory_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id uuid REFERENCES public.territories(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES public.esim_packages(id) ON DELETE CASCADE NOT NULL,
  local_price_override numeric,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(territory_id, package_id)
);

ALTER TABLE public.territory_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view territory packages"
  ON public.territory_packages FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage territory packages"
  ON public.territory_packages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Territory partner assignments
CREATE TABLE public.territory_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id uuid REFERENCES public.territories(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid NOT NULL,
  partner_type text NOT NULL,
  role text DEFAULT 'member',
  is_active boolean DEFAULT true,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(territory_id, partner_id, partner_type)
);

ALTER TABLE public.territory_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view territory partners"
  ON public.territory_partners FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage territory partners"
  ON public.territory_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_territories_country ON public.territories(country_code);
CREATE INDEX idx_territories_contract_status ON public.territories(contract_status);
CREATE INDEX idx_territories_distributor ON public.territories(distributor_id);
CREATE INDEX idx_territory_packages_territory ON public.territory_packages(territory_id);
CREATE INDEX idx_territory_partners_territory ON public.territory_partners(territory_id);
