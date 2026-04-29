-- ============================================================
-- Customer Identity Foundation for Outbound AI Automation
-- ============================================================

-- 1. customer_profiles
CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  country TEXT,
  timezone TEXT,
  identity_status TEXT NOT NULL DEFAULT 'unverified',
  identity_resolution_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  original_lead_source TEXT,
  latest_lead_source TEXT,
  last_inbound_at TIMESTAMPTZ,
  last_outbound_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_identity_status CHECK (identity_status IN ('unverified','partial','verified','merged','archived')),
  CONSTRAINT chk_identity_confidence CHECK (identity_resolution_confidence >= 0 AND identity_resolution_confidence <= 1)
);

CREATE INDEX idx_customer_profiles_user_id ON public.customer_profiles(user_id);
CREATE INDEX idx_customer_profiles_primary_email ON public.customer_profiles(primary_email);
CREATE INDEX idx_customer_profiles_identity_status ON public.customer_profiles(identity_status);
CREATE INDEX idx_customer_profiles_latest_lead_source ON public.customer_profiles(latest_lead_source);

-- 2. customer_channel_identities
CREATE TABLE public.customer_channel_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,
  channel_display_name TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_reachable BOOLEAN NOT NULL DEFAULT true,
  is_opted_in BOOLEAN NOT NULL DEFAULT false,
  sendability_status TEXT NOT NULL DEFAULT 'unknown',
  sendability_reason TEXT,
  last_inbound_at TIMESTAMPTZ,
  last_outbound_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_channel_type CHECK (channel_type IN ('web','line','email','facebook','whatsapp','instagram','tiktok','voice')),
  CONSTRAINT chk_sendability_status CHECK (sendability_status IN ('sendable','blocked','rate_limited','expired','unknown')),
  CONSTRAINT uq_channel_identity UNIQUE (channel_type, channel_user_id)
);

CREATE INDEX idx_cci_customer_profile_id ON public.customer_channel_identities(customer_profile_id);
CREATE INDEX idx_cci_channel_type ON public.customer_channel_identities(channel_type);
CREATE INDEX idx_cci_channel_user_id ON public.customer_channel_identities(channel_user_id);
CREATE INDEX idx_cci_sendability_status ON public.customer_channel_identities(sendability_status);

-- 3. customer_profile_contacts (bridge)
CREATE TABLE public.customer_profile_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'primary',
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_relationship_type CHECK (relationship_type IN ('primary','merged','alias','linked')),
  CONSTRAINT uq_profile_contact UNIQUE (customer_profile_id, contact_id)
);

CREATE INDEX idx_cpc_customer_profile_id ON public.customer_profile_contacts(customer_profile_id);
CREATE INDEX idx_cpc_contact_id ON public.customer_profile_contacts(contact_id);

-- 4. updated_at triggers
CREATE TRIGGER trg_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_customer_channel_identities_updated_at
  BEFORE UPDATE ON public.customer_channel_identities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_channel_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profile_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view customer profiles"
  ON public.customer_profiles FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Agents can view channel identities"
  ON public.customer_channel_identities FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Agents can view profile contacts"
  ON public.customer_profile_contacts FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage customer profiles"
  ON public.customer_profiles FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage channel identities"
  ON public.customer_channel_identities FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage profile contacts"
  ON public.customer_profile_contacts FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));