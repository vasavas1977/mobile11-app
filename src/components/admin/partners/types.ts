export type PartnerType = 'distributor' | 'reseller' | 'api_partner' | 'corporate' | 'affiliate';

export type PartnerStatus = 'active' | 'pending' | 'suspended' | 'terminated';

export type SettlementModel = 'prepaid' | 'postpaid' | 'hybrid';

export interface Partner {
  id: string;
  partner_type: PartnerType;
  company_name: string;
  country: string;
  territory: string;
  status: PartnerStatus;
  parent_partner_id: string | null;
  parent_partner_name: string | null;
  account_manager: string;
  wallet_balance: number;
  credit_limit: number;
  settlement_model: SettlementModel;
  default_pricing_plan: string;
  white_label_enabled: boolean;
  api_enabled: boolean;
  support_sla: string;
  active_customers: number;
  total_orders: number;
  monthly_revenue: number;
  monthly_margin: number;
  support_volume: number;
  contract_start: string;
  contract_end: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
}

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  distributor: 'Distributor',
  reseller: 'Reseller',
  api_partner: 'API Partner',
  corporate: 'Corporate',
  affiliate: 'Affiliate',
};

export const STATUS_STYLES: Record<PartnerStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  terminated: 'bg-gray-100 text-gray-500 border-gray-200',
};

// Re-export sample data for backward compatibility
import { SAMPLE_PARTNERS } from './sampleData';
export function generateMockPartners(): Partner[] {
  return SAMPLE_PARTNERS;
}
