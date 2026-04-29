import type { Json } from '@/integrations/supabase/types';

export type OrgRole = 'owner' | 'admin' | 'manager' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  billing_email: string;
  billing_address: Json;
  tax_id: string | null;
  industry: string | null;
  company_size: string | null;
  status: string;
  settings: Json;
  credit_limit: number;
  credit_balance: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OrganizationWithRole extends Organization {
  userRole: OrgRole;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  department: string | null;
  employee_id: string | null;
  is_active: boolean;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data (optional - may not always be present)
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    line_picture_url: string | null;
  } | null;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  department: string | null;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
}

export interface OrganizationEsimAssignment {
  id: string;
  organization_id: string;
  order_id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  assignment_note: string | null;
  trip_start_date: string | null;
  trip_end_date: string | null;
  status: 'assigned' | 'in_use' | 'returned' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface OrganizationOrder {
  id: string;
  organization_id: string;
  order_id: string;
  purchased_by: string;
  cost_center: string | null;
  project_code: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  billing_email: string;
  tax_id?: string;
  industry?: string;
  company_size?: string;
}
