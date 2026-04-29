export type AccountType = 'end_customer' | 'corporate' | 'affiliate' | 'reseller' | 'distributor' | 'api_partner' | 'internal_admin';

export interface AccountRecord {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  user_roles?: { role: string }[];
  // Extended fields (computed/joined)
  accountType?: AccountType;
  orderCount?: number;
  totalRevenue?: number;
}

export const ACCOUNT_TABS = [
  { key: 'end_customers', label: 'End Customers', filterRoles: ['customer'] },
  { key: 'corporate', label: 'Corporate', filterRoles: ['corporate'] },
  { key: 'affiliates', label: 'Affiliates', filterRoles: ['affiliate'] },
  { key: 'resellers', label: 'Resellers', filterRoles: ['reseller'] },
  { key: 'distributors', label: 'Distributors', filterRoles: ['distributor'] },
  { key: 'api_partners', label: 'API Partners', filterRoles: ['api_partner'] },
  { key: 'internal_admins', label: 'Internal Admins', filterRoles: ['admin', 'supervisor', 'agent'] },
] as const;

export type TabKey = typeof ACCOUNT_TABS[number]['key'];

export function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'admin': return 'bg-red-500/15 text-red-600 border-red-500/20';
    case 'supervisor': return 'bg-purple-500/15 text-purple-600 border-purple-500/20';
    case 'agent': return 'bg-blue-500/15 text-blue-600 border-blue-500/20';
    case 'partner_manager': return 'bg-amber-500/15 text-amber-600 border-amber-500/20';
    case 'affiliate': return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20';
    case 'moderator': return 'bg-orange-500/15 text-orange-600 border-orange-500/20';
    case 'customer': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getUserPrimaryRole(roles?: { role: string }[]): string {
  if (!roles || roles.length === 0) return 'customer';
  const r = roles.map(x => x.role);
  if (r.includes('admin')) return 'admin';
  if (r.includes('supervisor')) return 'supervisor';
  if (r.includes('agent')) return 'agent';
  if (r.includes('partner_manager')) return 'partner_manager';
  if (r.includes('affiliate')) return 'affiliate';
  if (r.includes('moderator')) return 'moderator';
  return 'customer';
}
