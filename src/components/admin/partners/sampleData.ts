import { Partner } from './types';
import { APIPartner } from './api/apiPartnerData';
import {
  LedgerEntry, Settlement, Payout, Invoice,
} from './wallets/walletMockData';

// ══════════════════════════════════════════════════════════
//  Mobile11 Partners Module — Sample Data
//  Global eSIM platform partner ecosystem preview dataset
// ══════════════════════════════════════════════════════════

// ── Partners ──────────────────────────────────────────────
export const SAMPLE_PARTNERS: Partner[] = [
  // ── Distributors ────────────────────────────────────────
  {
    id: '1', partner_type: 'distributor', company_name: 'SiamConnect Co., Ltd.', country: 'Thailand',
    territory: 'Southeast Asia', status: 'active', parent_partner_id: null, parent_partner_name: null,
    account_manager: 'Arthit S.', wallet_balance: 45200, credit_limit: 100000, settlement_model: 'postpaid',
    default_pricing_plan: 'Distributor Tier 1', white_label_enabled: true, api_enabled: true,
    support_sla: 'Premium 4h', active_customers: 342, total_orders: 12840, monthly_revenue: 89500,
    monthly_margin: 18700, support_volume: 45, contract_start: '2024-01-01', contract_end: '2025-12-31',
    contact_email: 'ops@siamconnect.co.th', contact_phone: '+66812345678', created_at: '2024-01-01', updated_at: '2025-03-20',
  },
  {
    id: '2', partner_type: 'distributor', company_name: 'LionCity Distribution Pte Ltd', country: 'Singapore',
    territory: 'Southeast Asia', status: 'active', parent_partner_id: null, parent_partner_name: null,
    account_manager: 'James W.', wallet_balance: 78400, credit_limit: 150000, settlement_model: 'postpaid',
    default_pricing_plan: 'Distributor Tier 1', white_label_enabled: true, api_enabled: true,
    support_sla: 'Premium 4h', active_customers: 480, total_orders: 18200, monthly_revenue: 124000,
    monthly_margin: 26800, support_volume: 32, contract_start: '2024-02-01', contract_end: '2026-01-31',
    contact_email: 'ops@lioncitydist.sg', contact_phone: '+6591234567', created_at: '2024-02-01', updated_at: '2025-03-22',
  },
  {
    id: '3', partner_type: 'distributor', company_name: 'MenaDigital FZCO', country: 'UAE',
    territory: 'Middle East', status: 'active', parent_partner_id: null, parent_partner_name: null,
    account_manager: 'Omar K.', wallet_balance: 67800, credit_limit: 200000, settlement_model: 'hybrid',
    default_pricing_plan: 'Distributor Tier 2', white_label_enabled: true, api_enabled: true,
    support_sla: 'Premium 4h', active_customers: 210, total_orders: 8900, monthly_revenue: 67000,
    monthly_margin: 14200, support_volume: 22, contract_start: '2024-04-01', contract_end: '2026-03-31',
    contact_email: 'ops@menadigital.ae', contact_phone: '+971501234567', created_at: '2024-04-01', updated_at: '2025-03-21',
  },

  // ── Resellers ───────────────────────────────────────────
  {
    id: '4', partner_type: 'reseller', company_name: 'TravelSIM Japan', country: 'Japan',
    territory: 'East Asia', status: 'active', parent_partner_id: '1', parent_partner_name: 'SiamConnect Co., Ltd.',
    account_manager: 'Yuki T.', wallet_balance: 8300, credit_limit: 20000, settlement_model: 'prepaid',
    default_pricing_plan: 'Reseller Standard', white_label_enabled: false, api_enabled: false,
    support_sla: 'Standard 24h', active_customers: 89, total_orders: 2340, monthly_revenue: 15200,
    monthly_margin: 3800, support_volume: 12, contract_start: '2024-06-01', contract_end: '2025-05-31',
    contact_email: 'hello@travelsim.jp', contact_phone: '+81901234567', created_at: '2024-06-01', updated_at: '2025-03-18',
  },
  {
    id: '5', partner_type: 'reseller', company_name: 'Klook Travel Tech', country: 'Hong Kong',
    territory: 'Asia Pacific', status: 'active', parent_partner_id: '2', parent_partner_name: 'LionCity Distribution Pte Ltd',
    account_manager: 'James W.', wallet_balance: 32600, credit_limit: 50000, settlement_model: 'prepaid',
    default_pricing_plan: 'Reseller Standard', white_label_enabled: true, api_enabled: true,
    support_sla: 'Premium 4h', active_customers: 1240, total_orders: 14800, monthly_revenue: 68500,
    monthly_margin: 10300, support_volume: 28, contract_start: '2024-05-01', contract_end: '2025-10-31',
    contact_email: 'connectivity@klooktravel.hk', contact_phone: '+85298765432', created_at: '2024-05-01', updated_at: '2025-03-22',
  },
  {
    id: '6', partner_type: 'reseller', company_name: 'CorporateMobile Solutions', country: 'Singapore',
    territory: 'Southeast Asia', status: 'active', parent_partner_id: '2', parent_partner_name: 'LionCity Distribution Pte Ltd',
    account_manager: 'James W.', wallet_balance: 18900, credit_limit: 40000, settlement_model: 'prepaid',
    default_pricing_plan: 'Reseller Standard', white_label_enabled: false, api_enabled: false,
    support_sla: 'Standard 24h', active_customers: 65, total_orders: 3200, monthly_revenue: 24500,
    monthly_margin: 6100, support_volume: 8, contract_start: '2024-08-01', contract_end: '2025-07-31',
    contact_email: 'ops@corpmobile.sg', contact_phone: '+6581234567', created_at: '2024-08-01', updated_at: '2025-03-20',
  },
  {
    id: '7', partner_type: 'reseller', company_name: 'KoreaConnect Mobile', country: 'South Korea',
    territory: 'East Asia', status: 'active', parent_partner_id: '1', parent_partner_name: 'SiamConnect Co., Ltd.',
    account_manager: 'Yuki T.', wallet_balance: 12400, credit_limit: 25000, settlement_model: 'prepaid',
    default_pricing_plan: 'Reseller Standard', white_label_enabled: true, api_enabled: false,
    support_sla: 'Standard 24h', active_customers: 156, total_orders: 4120, monthly_revenue: 22800,
    monthly_margin: 5700, support_volume: 18, contract_start: '2024-07-01', contract_end: '2025-06-30',
    contact_email: 'sales@koreaconnect.kr', contact_phone: '+821012345678', created_at: '2024-07-01', updated_at: '2025-03-22',
  },
  {
    id: '8', partner_type: 'reseller', company_name: 'ViaggioSIM Italia', country: 'Italy',
    territory: 'Europe', status: 'active', parent_partner_id: '3', parent_partner_name: 'MenaDigital FZCO',
    account_manager: 'Hans M.', wallet_balance: 3200, credit_limit: 15000, settlement_model: 'prepaid',
    default_pricing_plan: 'Reseller Standard', white_label_enabled: true, api_enabled: true,
    support_sla: 'Standard 24h', active_customers: 210, total_orders: 5890, monthly_revenue: 31400,
    monthly_margin: 7800, support_volume: 9, contract_start: '2024-05-01', contract_end: '2025-10-31',
    contact_email: 'info@viaggiosim.it', contact_phone: '+393401234567', created_at: '2024-05-01', updated_at: '2025-03-21',
  },
  {
    id: '9', partner_type: 'reseller', company_name: 'BangkokSIM Express', country: 'Thailand',
    territory: 'Southeast Asia', status: 'active', parent_partner_id: '1', parent_partner_name: 'SiamConnect Co., Ltd.',
    account_manager: 'Arthit S.', wallet_balance: 950, credit_limit: 8000, settlement_model: 'prepaid',
    default_pricing_plan: 'Reseller Starter', white_label_enabled: false, api_enabled: false,
    support_sla: 'Standard 24h', active_customers: 45, total_orders: 780, monthly_revenue: 6200,
    monthly_margin: 1550, support_volume: 7, contract_start: '2025-01-01', contract_end: '2025-12-31',
    contact_email: 'hello@bangkoksim.co.th', contact_phone: '+66891234567', created_at: '2025-01-01', updated_at: '2025-03-18',
  },

  // ── API Partners ────────────────────────────────────────
  {
    id: '10', partner_type: 'api_partner', company_name: 'GlobalReach API Ltd.', country: 'United Kingdom',
    territory: 'Europe', status: 'active', parent_partner_id: null, parent_partner_name: null,
    account_manager: 'James W.', wallet_balance: 120500, credit_limit: 500000, settlement_model: 'postpaid',
    default_pricing_plan: 'API Enterprise', white_label_enabled: true, api_enabled: true,
    support_sla: 'Enterprise 1h', active_customers: 1250, total_orders: 45600, monthly_revenue: 234000,
    monthly_margin: 42000, support_volume: 8, contract_start: '2024-03-01', contract_end: '2026-02-28',
    contact_email: 'api@globalreach.co.uk', contact_phone: '+442012345678', created_at: '2024-03-01', updated_at: '2025-03-22',
  },
  {
    id: '11', partner_type: 'api_partner', company_name: 'FlyConnect GmbH', country: 'Germany',
    territory: 'Europe', status: 'active', parent_partner_id: null, parent_partner_name: null,
    account_manager: 'Hans M.', wallet_balance: 34200, credit_limit: 80000, settlement_model: 'postpaid',
    default_pricing_plan: 'API Standard', white_label_enabled: false, api_enabled: true,
    support_sla: 'Standard 24h', active_customers: 430, total_orders: 12100, monthly_revenue: 52400,
    monthly_margin: 13100, support_volume: 5, contract_start: '2024-11-15', contract_end: '2025-11-14',
    contact_email: 'tech@flyconnect.de', contact_phone: '+491761234567', created_at: '2024-11-15', updated_at: '2025-03-20',
  },
  {
    id: '12', partner_type: 'api_partner', company_name: 'TripStack Inc.', country: 'Canada',
    territory: 'North America', status: 'suspended', parent_partner_id: null, parent_partner_name: null,
    account_manager: 'Sarah L.', wallet_balance: -2300, credit_limit: 50000, settlement_model: 'postpaid',
    default_pricing_plan: 'API Standard', white_label_enabled: false, api_enabled: true,
    support_sla: 'Standard 24h', active_customers: 0, total_orders: 12100, monthly_revenue: 0,
    monthly_margin: 0, support_volume: 34, contract_start: '2024-08-01', contract_end: '2025-07-31',
    contact_email: 'dev@tripstack.ca', contact_phone: '+14165551234', created_at: '2024-08-01', updated_at: '2025-03-10',
  },

  // ── Corporate Accounts ──────────────────────────────────
  {
    id: '13', partner_type: 'corporate', company_name: 'DHL Supply Chain Asia', country: 'Singapore',
    territory: 'Asia Pacific', status: 'active', parent_partner_id: '2', parent_partner_name: 'LionCity Distribution Pte Ltd',
    account_manager: 'James W.', wallet_balance: 22800, credit_limit: 60000, settlement_model: 'prepaid',
    default_pricing_plan: 'Corporate Enterprise', white_label_enabled: false, api_enabled: false,
    support_sla: 'Premium 4h', active_customers: 320, total_orders: 4860, monthly_revenue: 42000,
    monthly_margin: 8400, support_volume: 6, contract_start: '2024-06-01', contract_end: '2025-12-31',
    contact_email: 'travel-ops@dhlasia.com', contact_phone: '+6562345678', created_at: '2024-06-01', updated_at: '2025-03-22',
  },
  {
    id: '14', partner_type: 'corporate', company_name: 'Deloitte Thailand', country: 'Thailand',
    territory: 'Southeast Asia', status: 'active', parent_partner_id: '1', parent_partner_name: 'SiamConnect Co., Ltd.',
    account_manager: 'Arthit S.', wallet_balance: 15400, credit_limit: 50000, settlement_model: 'prepaid',
    default_pricing_plan: 'Corporate Enterprise', white_label_enabled: false, api_enabled: false,
    support_sla: 'Premium 4h', active_customers: 85, total_orders: 1200, monthly_revenue: 28000,
    monthly_margin: 7200, support_volume: 5, contract_start: '2024-09-01', contract_end: '2025-08-31',
    contact_email: 'travel@deloitte.co.th', contact_phone: '+66821234567', created_at: '2024-09-01', updated_at: '2025-03-19',
  },
  {
    id: '15', partner_type: 'corporate', company_name: 'Central Group Retail', country: 'Thailand',
    territory: 'Southeast Asia', status: 'active', parent_partner_id: '1', parent_partner_name: 'SiamConnect Co., Ltd.',
    account_manager: 'Arthit S.', wallet_balance: 41200, credit_limit: 80000, settlement_model: 'prepaid',
    default_pricing_plan: 'Corporate Enterprise', white_label_enabled: false, api_enabled: false,
    support_sla: 'Premium 4h', active_customers: 190, total_orders: 2840, monthly_revenue: 38500,
    monthly_margin: 9600, support_volume: 4, contract_start: '2024-10-01', contract_end: '2025-09-30',
    contact_email: 'procurement@centralgroup.co.th', contact_phone: '+66831234567', created_at: '2024-10-01', updated_at: '2025-03-21',
  },
  // ── Pending & Suspended ─────────────────────────────────
  {
    id: '16', partner_type: 'reseller', company_name: 'EuroTravel SIM GmbH', country: 'Germany',
    territory: 'Europe', status: 'pending', parent_partner_id: '3', parent_partner_name: 'MenaDigital FZCO',
    account_manager: 'Hans M.', wallet_balance: 0, credit_limit: 10000, settlement_model: 'prepaid',
    default_pricing_plan: 'Reseller Starter', white_label_enabled: false, api_enabled: false,
    support_sla: 'Standard 24h', active_customers: 0, total_orders: 0, monthly_revenue: 0,
    monthly_margin: 0, support_volume: 0, contract_start: '2025-04-01', contract_end: '2026-03-31',
    contact_email: 'info@eurotravelsim.de', contact_phone: '+491512345678', created_at: '2025-03-15', updated_at: '2025-03-15',
  },
  {
    id: '17', partner_type: 'corporate', company_name: 'McKinsey UAE', country: 'UAE',
    territory: 'Middle East', status: 'pending', parent_partner_id: '3', parent_partner_name: 'MenaDigital FZCO',
    account_manager: 'Omar K.', wallet_balance: 0, credit_limit: 25000, settlement_model: 'prepaid',
    default_pricing_plan: 'Corporate Enterprise', white_label_enabled: false, api_enabled: false,
    support_sla: 'Premium 4h', active_customers: 0, total_orders: 0, monthly_revenue: 0,
    monthly_margin: 0, support_volume: 0, contract_start: '2025-04-01', contract_end: '2026-03-31',
    contact_email: 'procurement@mckinsey.ae', contact_phone: '+971504567890', created_at: '2025-03-20', updated_at: '2025-03-20',
  },
  {
    id: '18', partner_type: 'reseller', company_name: 'NomadSIM Brasil', country: 'Brazil',
    territory: 'Latin America', status: 'suspended', parent_partner_id: null, parent_partner_name: null,
    account_manager: 'Omar K.', wallet_balance: -450, credit_limit: 8000, settlement_model: 'prepaid',
    default_pricing_plan: 'Reseller Starter', white_label_enabled: false, api_enabled: false,
    support_sla: 'Standard 24h', active_customers: 32, total_orders: 540, monthly_revenue: 0,
    monthly_margin: 0, support_volume: 14, contract_start: '2024-10-01', contract_end: '2025-09-30',
    contact_email: 'contato@nomadsim.com.br', contact_phone: '+5511987654321', created_at: '2024-10-01', updated_at: '2025-03-05',
  },
];

// ── Territories ───────────────────────────────────────────
export interface SampleTerritory {
  id: string;
  territory_name: string;
  country_code: string;
  country_name: string;
  region: string;
  exclusivity_model: 'exclusive' | 'semi_exclusive' | 'non_exclusive';
  contract_status: string;
  local_currency: string;
  default_language: string;
  monthly_revenue: number;
  monthly_margin: number;
  monthly_orders: number;
  monthly_support_tickets: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  distributor_id: string | null;
  distributor_name: string | null;
  active_resellers: number;
  enabled_channels: string[];
  tax_notes: string | null;
  legal_notes: string | null;
}

export const SAMPLE_TERRITORIES: SampleTerritory[] = [
  {
    id: 'T-001', territory_name: 'Thailand', country_code: 'TH', country_name: 'Thailand',
    region: 'Southeast Asia', exclusivity_model: 'exclusive', contract_status: 'active',
    local_currency: 'THB', default_language: 'th', monthly_revenue: 89500, monthly_margin: 18700,
    monthly_orders: 1240, monthly_support_tickets: 45, is_active: true,
    start_date: '2024-01-01', end_date: '2025-12-31',
    distributor_id: '1', distributor_name: 'SiamConnect Co., Ltd.', active_resellers: 2,
    enabled_channels: ['web', 'line', 'whatsapp', 'api'],
    tax_notes: 'VAT 7% applies to all domestic sales', legal_notes: null,
  },
  {
    id: 'T-002', territory_name: 'Singapore', country_code: 'SG', country_name: 'Singapore',
    region: 'Southeast Asia', exclusivity_model: 'exclusive', contract_status: 'active',
    local_currency: 'SGD', default_language: 'en', monthly_revenue: 124000, monthly_margin: 26800,
    monthly_orders: 1820, monthly_support_tickets: 32, is_active: true,
    start_date: '2024-02-01', end_date: '2026-01-31',
    distributor_id: '2', distributor_name: 'LionCity Distribution Pte Ltd', active_resellers: 2,
    enabled_channels: ['web', 'whatsapp', 'api'],
    tax_notes: 'GST 9%', legal_notes: null,
  },
  {
    id: 'T-003', territory_name: 'United Arab Emirates', country_code: 'AE', country_name: 'UAE',
    region: 'Middle East', exclusivity_model: 'exclusive', contract_status: 'active',
    local_currency: 'AED', default_language: 'ar', monthly_revenue: 67000, monthly_margin: 14200,
    monthly_orders: 890, monthly_support_tickets: 22, is_active: true,
    start_date: '2024-04-01', end_date: '2026-03-31',
    distributor_id: '3', distributor_name: 'MenaDigital FZCO', active_resellers: 1,
    enabled_channels: ['web', 'whatsapp', 'api'],
    tax_notes: 'VAT 5%', legal_notes: null,
  },
  {
    id: 'T-004', territory_name: 'Japan', country_code: 'JP', country_name: 'Japan',
    region: 'East Asia', exclusivity_model: 'semi_exclusive', contract_status: 'active',
    local_currency: 'JPY', default_language: 'ja', monthly_revenue: 56200, monthly_margin: 14000,
    monthly_orders: 820, monthly_support_tickets: 14, is_active: true,
    start_date: '2024-06-01', end_date: '2025-05-31',
    distributor_id: '1', distributor_name: 'SiamConnect Co., Ltd.', active_resellers: 1,
    enabled_channels: ['web', 'line'],
    tax_notes: 'Consumption tax 10%', legal_notes: 'MVNO registration required',
  },
  {
    id: 'T-005', territory_name: 'Malaysia', country_code: 'MY', country_name: 'Malaysia',
    region: 'Southeast Asia', exclusivity_model: 'non_exclusive', contract_status: 'active',
    local_currency: 'MYR', default_language: 'ms', monthly_revenue: 18400, monthly_margin: 4600,
    monthly_orders: 340, monthly_support_tickets: 8, is_active: true,
    start_date: '2025-01-15', end_date: '2026-01-14',
    distributor_id: '2', distributor_name: 'LionCity Distribution Pte Ltd', active_resellers: 0,
    enabled_channels: ['web', 'whatsapp'],
    tax_notes: 'SST 8%', legal_notes: 'MCMC notification required',
  },
  {
    id: 'T-006', territory_name: 'South Korea', country_code: 'KR', country_name: 'South Korea',
    region: 'East Asia', exclusivity_model: 'exclusive', contract_status: 'active',
    local_currency: 'KRW', default_language: 'ko', monthly_revenue: 22800, monthly_margin: 5700,
    monthly_orders: 412, monthly_support_tickets: 18, is_active: true,
    start_date: '2024-07-01', end_date: '2025-06-30',
    distributor_id: '1', distributor_name: 'SiamConnect Co., Ltd.', active_resellers: 1,
    enabled_channels: ['web', 'line', 'api'],
    tax_notes: 'VAT 10%', legal_notes: null,
  },
  {
    id: 'T-007', territory_name: 'United Kingdom', country_code: 'GB', country_name: 'United Kingdom',
    region: 'Europe', exclusivity_model: 'non_exclusive', contract_status: 'active',
    local_currency: 'GBP', default_language: 'en', monthly_revenue: 234000, monthly_margin: 42000,
    monthly_orders: 4200, monthly_support_tickets: 8, is_active: true,
    start_date: '2024-03-01', end_date: '2026-02-28',
    distributor_id: null, distributor_name: null, active_resellers: 0,
    enabled_channels: ['web', 'api'],
    tax_notes: 'VAT 20%', legal_notes: 'Ofcom compliance required',
  },
  {
    id: 'T-008', territory_name: 'Germany', country_code: 'DE', country_name: 'Germany',
    region: 'Europe', exclusivity_model: 'semi_exclusive', contract_status: 'active',
    local_currency: 'EUR', default_language: 'de', monthly_revenue: 52400, monthly_margin: 13100,
    monthly_orders: 1380, monthly_support_tickets: 11, is_active: true,
    start_date: '2024-11-15', end_date: '2025-11-14',
    distributor_id: '3', distributor_name: 'MenaDigital FZCO', active_resellers: 2,
    enabled_channels: ['web', 'whatsapp'],
    tax_notes: 'MwSt 19%', legal_notes: 'BNetzA notification required',
  },
  {
    id: 'T-009', territory_name: 'Italy', country_code: 'IT', country_name: 'Italy',
    region: 'Europe', exclusivity_model: 'semi_exclusive', contract_status: 'expiring',
    local_currency: 'EUR', default_language: 'it', monthly_revenue: 31400, monthly_margin: 7800,
    monthly_orders: 589, monthly_support_tickets: 9, is_active: true,
    start_date: '2024-05-01', end_date: '2025-04-30',
    distributor_id: '3', distributor_name: 'MenaDigital FZCO', active_resellers: 1,
    enabled_channels: ['web', 'whatsapp'],
    tax_notes: 'IVA 22%', legal_notes: null,
  },
  {
    id: 'T-010', territory_name: 'Brazil', country_code: 'BR', country_name: 'Brazil',
    region: 'Latin America', exclusivity_model: 'non_exclusive', contract_status: 'suspended',
    local_currency: 'BRL', default_language: 'pt', monthly_revenue: 0, monthly_margin: 0,
    monthly_orders: 0, monthly_support_tickets: 14, is_active: false,
    start_date: '2024-10-01', end_date: '2025-09-30',
    distributor_id: null, distributor_name: null, active_resellers: 1,
    enabled_channels: ['web'],
    tax_notes: null, legal_notes: 'Anatel registration pending',
  },
  {
    id: 'T-011', territory_name: 'Hong Kong', country_code: 'HK', country_name: 'Hong Kong',
    region: 'Asia Pacific', exclusivity_model: 'non_exclusive', contract_status: 'active',
    local_currency: 'HKD', default_language: 'zh', monthly_revenue: 68500, monthly_margin: 10300,
    monthly_orders: 1480, monthly_support_tickets: 28, is_active: true,
    start_date: '2024-05-01', end_date: '2025-10-31',
    distributor_id: '2', distributor_name: 'LionCity Distribution Pte Ltd', active_resellers: 1,
    enabled_channels: ['web', 'whatsapp', 'api'],
    tax_notes: 'No sales tax', legal_notes: null,
  },
];

// ── Pricing Plans ─────────────────────────────────────────
export interface SamplePricingPlan {
  id: string;
  name: string;
  tier: string;
  partner_type: string;
  assigned_partners: number;
  margin_type: 'percentage' | 'fixed' | 'tiered';
  avg_margin: number;
  channel_scope: string[];
  override_count: number;
  status: 'active' | 'draft' | 'archived';
  updated_at: string;
  discount_pct: number;
  settlement: string;
  min_commitment: number;
  partners_count: number;
  is_active: boolean;
  margins: {
    retail: number;
    reseller: number;
    distributor: number;
    api_partner: number;
    affiliate: number;
  };
  territory_rules: string[];
}

export const SAMPLE_PRICING_PLANS: SamplePricingPlan[] = [
  {
    id: '1', name: 'Distributor Tier 1', tier: 'Distributor', partner_type: 'distributor',
    assigned_partners: 2, margin_type: 'percentage', avg_margin: 21, channel_scope: ['web', 'api', 'line'],
    override_count: 3, status: 'active', updated_at: '2025-03-22',
    discount_pct: 30, settlement: 'Postpaid NET-30', min_commitment: 50000, partners_count: 2, is_active: true,
    margins: { retail: 75, reseller: 15, distributor: 30, api_partner: 0, affiliate: 5 },
    territory_rules: ['Southeast Asia', 'East Asia'],
  },
  {
    id: '2', name: 'Distributor Tier 2', tier: 'Distributor', partner_type: 'distributor',
    assigned_partners: 1, margin_type: 'percentage', avg_margin: 18, channel_scope: ['web', 'whatsapp', 'api'],
    override_count: 1, status: 'active', updated_at: '2025-03-21',
    discount_pct: 25, settlement: 'Hybrid', min_commitment: 20000, partners_count: 1, is_active: true,
    margins: { retail: 75, reseller: 15, distributor: 25, api_partner: 0, affiliate: 5 },
    territory_rules: ['Middle East', 'Europe'],
  },
  {
    id: '3', name: 'Reseller Standard', tier: 'Reseller', partner_type: 'reseller',
    assigned_partners: 5, margin_type: 'percentage', avg_margin: 15, channel_scope: ['web', 'line'],
    override_count: 0, status: 'active', updated_at: '2025-03-18',
    discount_pct: 15, settlement: 'Prepaid', min_commitment: 5000, partners_count: 5, is_active: true,
    margins: { retail: 75, reseller: 15, distributor: 0, api_partner: 0, affiliate: 3 },
    territory_rules: ['All'],
  },
  {
    id: '4', name: 'Reseller Starter', tier: 'Reseller', partner_type: 'reseller',
    assigned_partners: 1, margin_type: 'percentage', avg_margin: 10, channel_scope: ['web'],
    override_count: 0, status: 'active', updated_at: '2025-03-15',
    discount_pct: 10, settlement: 'Prepaid', min_commitment: 1000, partners_count: 1, is_active: true,
    margins: { retail: 75, reseller: 10, distributor: 0, api_partner: 0, affiliate: 2 },
    territory_rules: ['All'],
  },
  {
    id: '5', name: 'API Enterprise', tier: 'API Partner', partner_type: 'api_partner',
    assigned_partners: 1, margin_type: 'tiered', avg_margin: 25, channel_scope: ['api'],
    override_count: 5, status: 'active', updated_at: '2025-03-22',
    discount_pct: 25, settlement: 'Postpaid NET-15', min_commitment: 100000, partners_count: 1, is_active: true,
    margins: { retail: 75, reseller: 0, distributor: 0, api_partner: 25, affiliate: 0 },
    territory_rules: ['Europe', 'North America'],
  },
  {
    id: '6', name: 'API Standard', tier: 'API Partner', partner_type: 'api_partner',
    assigned_partners: 2, margin_type: 'percentage', avg_margin: 20, channel_scope: ['api'],
    override_count: 0, status: 'active', updated_at: '2025-03-10',
    discount_pct: 20, settlement: 'Postpaid NET-30', min_commitment: 10000, partners_count: 2, is_active: true,
    margins: { retail: 75, reseller: 0, distributor: 0, api_partner: 20, affiliate: 0 },
    territory_rules: ['All'],
  },
  {
    id: '7', name: 'Corporate Enterprise', tier: 'Corporate', partner_type: 'corporate',
    assigned_partners: 3, margin_type: 'fixed', avg_margin: 12, channel_scope: ['web'],
    override_count: 2, status: 'active', updated_at: '2025-03-19',
    discount_pct: 12, settlement: 'Prepaid', min_commitment: 10000, partners_count: 3, is_active: true,
    margins: { retail: 75, reseller: 0, distributor: 0, api_partner: 0, affiliate: 0 },
    territory_rules: ['Southeast Asia', 'East Asia', 'Middle East'],
  },
  {
    id: '8', name: 'Affiliate Commission', tier: 'Affiliate', partner_type: 'affiliate',
    assigned_partners: 0, margin_type: 'percentage', avg_margin: 8, channel_scope: ['web', 'social'],
    override_count: 0, status: 'draft', updated_at: '2025-03-25',
    discount_pct: 8, settlement: 'Monthly Payout', min_commitment: 0, partners_count: 0, is_active: false,
    margins: { retail: 75, reseller: 0, distributor: 0, api_partner: 0, affiliate: 8 },
    territory_rules: ['All'],
  },
];

// ── API Partners ──────────────────────────────────────────
export const SAMPLE_API_PARTNERS: APIPartner[] = [
  {
    id: 'AP-001', company_name: 'GlobalReach API Ltd.', contact_email: 'api@globalreach.co.uk',
    country: 'United Kingdom', territory: 'Europe', status: 'active', environment: 'production',
    api_key_prefix: 'gr_live_8kF2', api_secret_masked: '••••••••xQ9m',
    created_at: '2024-03-01', billing_model: 'per_order', monthly_requests: 136800,
    monthly_orders: 4200, monthly_revenue: 234000, error_rate: 0.3, avg_latency_ms: 142,
    rate_limit_rpm: 1000, rate_limit_daily: 500000,
    allowed_ips: ['52.14.88.0/24', '18.220.0.0/16', '203.0.113.42'],
    allowed_endpoints: ['packages.list', 'packages.get', 'orders.create', 'orders.status', 'esim.qr', 'esim.status', 'webhooks.manage'],
    webhook_url: 'https://api.globalreach.co.uk/webhooks/mobile11',
    webhook_events: ['order.created', 'order.completed', 'order.failed', 'esim.activated', 'esim.expired'],
    webhook_secret_masked: '••••••••wh_sec', sandbox_key_prefix: 'gr_test_3pY1',
    production_key_prefix: 'gr_live_8kF2', api_version: 'v2.1',
    account_manager: 'James W.', contract_start: '2024-03-01', contract_end: '2026-02-28',
    scopes: ['packages:read', 'orders:write', 'orders:read', 'esim:read', 'webhooks:manage'],
  },
  {
    id: 'AP-002', company_name: 'TripStack Inc.', contact_email: 'dev@tripstack.ca',
    country: 'Canada', territory: 'North America', status: 'suspended', environment: 'production',
    api_key_prefix: 'ts_live_9mK4', api_secret_masked: '••••••••vR7n',
    created_at: '2024-08-01', billing_model: 'tiered', monthly_requests: 0,
    monthly_orders: 0, monthly_revenue: 0, error_rate: 4.2, avg_latency_ms: 0,
    rate_limit_rpm: 500, rate_limit_daily: 100000,
    allowed_ips: ['35.203.0.0/16'],
    allowed_endpoints: ['packages.list', 'packages.get', 'orders.create', 'orders.status'],
    webhook_url: 'https://hooks.tripstack.ca/esim',
    webhook_events: ['order.created', 'order.completed'],
    webhook_secret_masked: '••••••••wh_ts', sandbox_key_prefix: 'ts_test_2bH7',
    production_key_prefix: 'ts_live_9mK4', api_version: 'v2.0',
    account_manager: 'Sarah L.', contract_start: '2024-08-01', contract_end: '2025-07-31',
    scopes: ['packages:read', 'orders:write', 'orders:read'],
  },
  {
    id: 'AP-003', company_name: 'NomadTech SaaS', contact_email: 'integrations@nomadtech.io',
    country: 'Singapore', territory: 'Asia Pacific', status: 'sandbox', environment: 'sandbox',
    api_key_prefix: 'nt_test_5cD3', api_secret_masked: '••••••••pL8k',
    created_at: '2025-03-10', billing_model: 'per_request', monthly_requests: 2340,
    monthly_orders: 0, monthly_revenue: 0, error_rate: 1.8, avg_latency_ms: 95,
    rate_limit_rpm: 100, rate_limit_daily: 10000,
    allowed_ips: [],
    allowed_endpoints: ['packages.list', 'packages.get', 'orders.create'],
    webhook_url: null, webhook_events: [],
    webhook_secret_masked: null, sandbox_key_prefix: 'nt_test_5cD3',
    production_key_prefix: '', api_version: 'v2.1',
    account_manager: 'James W.', contract_start: '2025-03-10', contract_end: '2026-03-09',
    scopes: ['packages:read', 'orders:write'],
  },
  {
    id: 'AP-004', company_name: 'FlyConnect GmbH', contact_email: 'tech@flyconnect.de',
    country: 'Germany', territory: 'Europe', status: 'active', environment: 'both',
    api_key_prefix: 'fc_live_7jN2', api_secret_masked: '••••••••mW5x',
    created_at: '2024-11-15', billing_model: 'monthly_flat', monthly_requests: 45200,
    monthly_orders: 1380, monthly_revenue: 52400, error_rate: 0.5, avg_latency_ms: 168,
    rate_limit_rpm: 600, rate_limit_daily: 200000,
    allowed_ips: ['85.214.0.0/16', '195.201.0.0/16'],
    allowed_endpoints: ['packages.list', 'packages.get', 'orders.create', 'orders.status', 'esim.qr', 'esim.status'],
    webhook_url: 'https://api.flyconnect.de/v1/callbacks/mobile11',
    webhook_events: ['order.created', 'order.completed', 'order.failed', 'esim.activated'],
    webhook_secret_masked: '••••••••wh_fc', sandbox_key_prefix: 'fc_test_4hR9',
    production_key_prefix: 'fc_live_7jN2', api_version: 'v2.1',
    account_manager: 'Hans M.', contract_start: '2024-11-15', contract_end: '2025-11-14',
    scopes: ['packages:read', 'orders:write', 'orders:read', 'esim:read'],
  },
];

// ── Contracts ─────────────────────────────────────────────
export interface SampleContract {
  id: string;
  contract_name: string;
  partner_id: string;
  partner_name: string;
  partner_type: string;
  country: string;
  territory: string;
  status: 'active' | 'expired' | 'suspended' | 'draft';
  signature_status: 'signed' | 'pending_signature' | 'countersigned' | 'unsigned';
  start_date: string;
  end_date: string;
  renewal_status: 'auto_renew' | 'manual_review' | 'renewal_pending' | 'not_due';
  account_manager: string;
  version: number;
  notes: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  // Distributors
  { id: 'CON-001', contract_name: 'Distributor Master Agreement — Thailand', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', country: 'Thailand', territory: 'Southeast Asia', status: 'active', signature_status: 'signed', start_date: '2024-01-01', end_date: '2025-12-31', renewal_status: 'auto_renew', account_manager: 'Arthit S.', version: 3, notes: 'Renewed with updated SLA terms' },
  { id: 'CON-002', contract_name: 'Distributor Master Agreement — Singapore', partner_id: '2', partner_name: 'LionCity Distribution Pte Ltd', partner_type: 'distributor', country: 'Singapore', territory: 'Southeast Asia', status: 'active', signature_status: 'countersigned', start_date: '2024-02-01', end_date: '2026-01-31', renewal_status: 'not_due', account_manager: 'James W.', version: 2, notes: 'Multi-year distribution agreement with Malaysia expansion clause' },
  { id: 'CON-003', contract_name: 'Distributor Agreement — MENA', partner_id: '3', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', country: 'UAE', territory: 'Middle East', status: 'active', signature_status: 'signed', start_date: '2024-04-01', end_date: '2026-03-31', renewal_status: 'not_due', account_manager: 'Omar K.', version: 1, notes: '' },
  // Resellers
  { id: 'CON-004', contract_name: 'Reseller Agreement — Japan', partner_id: '4', partner_name: 'TravelSIM Japan', partner_type: 'reseller', country: 'Japan', territory: 'East Asia', status: 'active', signature_status: 'signed', start_date: '2024-06-01', end_date: '2025-05-31', renewal_status: 'renewal_pending', account_manager: 'Yuki T.', version: 1, notes: 'First-year contract, renewal discussion scheduled' },
  { id: 'CON-005', contract_name: 'OTA Reseller Agreement — Hong Kong', partner_id: '5', partner_name: 'Klook Travel Tech', partner_type: 'reseller', country: 'Hong Kong', territory: 'Asia Pacific', status: 'active', signature_status: 'countersigned', start_date: '2024-05-01', end_date: '2025-10-31', renewal_status: 'auto_renew', account_manager: 'James W.', version: 2, notes: 'White-label enabled with API integration' },
  { id: 'CON-006', contract_name: 'Enterprise Reseller Agreement — Singapore', partner_id: '6', partner_name: 'CorporateMobile Solutions', partner_type: 'reseller', country: 'Singapore', territory: 'Southeast Asia', status: 'active', signature_status: 'signed', start_date: '2024-08-01', end_date: '2025-07-31', renewal_status: 'renewal_pending', account_manager: 'James W.', version: 1, notes: '' },
  { id: 'CON-007', contract_name: 'Reseller Agreement — Korea', partner_id: '7', partner_name: 'KoreaConnect Mobile', partner_type: 'reseller', country: 'South Korea', territory: 'East Asia', status: 'active', signature_status: 'pending_signature', start_date: '2024-07-01', end_date: '2025-06-30', renewal_status: 'renewal_pending', account_manager: 'Yuki T.', version: 2, notes: 'Amendment v2 sent for counter-signature' },
  { id: 'CON-008', contract_name: 'Reseller Agreement — Italy', partner_id: '8', partner_name: 'ViaggioSIM Italia', partner_type: 'reseller', country: 'Italy', territory: 'Europe', status: 'active', signature_status: 'signed', start_date: '2024-05-01', end_date: '2025-10-31', renewal_status: 'auto_renew', account_manager: 'Hans M.', version: 1, notes: '' },
  { id: 'CON-009', contract_name: 'SME Reseller Agreement — Thailand', partner_id: '9', partner_name: 'BangkokSIM Express', partner_type: 'reseller', country: 'Thailand', territory: 'Southeast Asia', status: 'active', signature_status: 'signed', start_date: '2025-01-01', end_date: '2025-12-31', renewal_status: 'not_due', account_manager: 'Arthit S.', version: 1, notes: '' },
  { id: 'CON-010', contract_name: 'Reseller Agreement — Germany', partner_id: '16', partner_name: 'EuroTravel SIM GmbH', partner_type: 'reseller', country: 'Germany', territory: 'Europe', status: 'draft', signature_status: 'unsigned', start_date: '2025-04-01', end_date: '2026-03-31', renewal_status: 'not_due', account_manager: 'Hans M.', version: 1, notes: 'Pending legal review' },
  { id: 'CON-011', contract_name: 'Reseller Agreement — Brazil', partner_id: '18', partner_name: 'NomadSIM Brasil', partner_type: 'reseller', country: 'Brazil', territory: 'Latin America', status: 'expired', signature_status: 'signed', start_date: '2024-10-01', end_date: '2025-03-15', renewal_status: 'manual_review', account_manager: 'Omar K.', version: 1, notes: 'Contract expired — partner suspended' },
  // API Partners
  { id: 'CON-012', contract_name: 'API Enterprise License', partner_id: '10', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', country: 'United Kingdom', territory: 'Europe', status: 'active', signature_status: 'countersigned', start_date: '2024-03-01', end_date: '2026-02-28', renewal_status: 'auto_renew', account_manager: 'James W.', version: 2, notes: 'Multi-year enterprise deal' },
  { id: 'CON-013', contract_name: 'API Standard License — Germany', partner_id: '11', partner_name: 'FlyConnect GmbH', partner_type: 'api_partner', country: 'Germany', territory: 'Europe', status: 'active', signature_status: 'signed', start_date: '2024-11-15', end_date: '2025-11-14', renewal_status: 'not_due', account_manager: 'Hans M.', version: 1, notes: '' },
  { id: 'CON-014', contract_name: 'API Standard License — Canada', partner_id: '12', partner_name: 'TripStack Inc.', partner_type: 'api_partner', country: 'Canada', territory: 'North America', status: 'suspended', signature_status: 'signed', start_date: '2024-08-01', end_date: '2025-07-31', renewal_status: 'manual_review', account_manager: 'Sarah L.', version: 1, notes: 'Suspended due to billing dispute' },
  // Corporate Accounts
  { id: 'CON-015', contract_name: 'Corporate Logistics Agreement', partner_id: '13', partner_name: 'DHL Supply Chain Asia', partner_type: 'corporate', country: 'Singapore', territory: 'Asia Pacific', status: 'active', signature_status: 'countersigned', start_date: '2024-06-01', end_date: '2025-12-31', renewal_status: 'auto_renew', account_manager: 'James W.', version: 1, notes: '320 active users across APAC' },
  { id: 'CON-016', contract_name: 'Corporate Enterprise Agreement — Thailand', partner_id: '14', partner_name: 'Deloitte Thailand', partner_type: 'corporate', country: 'Thailand', territory: 'Southeast Asia', status: 'active', signature_status: 'signed', start_date: '2024-09-01', end_date: '2025-08-31', renewal_status: 'renewal_pending', account_manager: 'Arthit S.', version: 2, notes: 'Renewal with expanded user count' },
  { id: 'CON-017', contract_name: 'Corporate Retail Agreement — Thailand', partner_id: '15', partner_name: 'Central Group Retail', partner_type: 'corporate', country: 'Thailand', territory: 'Southeast Asia', status: 'active', signature_status: 'signed', start_date: '2024-10-01', end_date: '2025-09-30', renewal_status: 'not_due', account_manager: 'Arthit S.', version: 1, notes: 'Staff connectivity for 190 travelers' },
  { id: 'CON-018', contract_name: 'Corporate Agreement — UAE', partner_id: '17', partner_name: 'McKinsey UAE', partner_type: 'corporate', country: 'UAE', territory: 'Middle East', status: 'draft', signature_status: 'unsigned', start_date: '2025-04-01', end_date: '2026-03-31', renewal_status: 'not_due', account_manager: 'Omar K.', version: 1, notes: 'New onboarding — contract under review' },
];

// ── Wallet: Ledger ────────────────────────────────────────
export const SAMPLE_LEDGER: LedgerEntry[] = [
  { id: 'L001', date: '2025-03-26T09:15:00', type: 'topup', partner_id: '4', partner_name: 'TravelSIM Japan', partner_type: 'reseller', description: 'Wallet top-up via bank transfer', debit: 0, credit: 5000, balance_after: 13300, related_order_id: null, related_payout_id: null, admin_note: 'Wire confirmed ref #TRF-88291', performed_by: 'System' },
  { id: 'L002', date: '2025-03-26T08:42:00', type: 'purchase', partner_id: '4', partner_name: 'TravelSIM Japan', partner_type: 'reseller', description: 'Order #ORD-4521 — Japan 7-Day 5GB', debit: 12.50, credit: 0, balance_after: 8300, related_order_id: 'ORD-4521', related_payout_id: null, admin_note: null, performed_by: 'System' },
  { id: 'L003', date: '2025-03-25T16:30:00', type: 'commission', partner_id: '10', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', description: 'API usage billing — Mar 2025 batch', debit: 4200, credit: 0, balance_after: 120500, related_order_id: null, related_payout_id: null, admin_note: null, performed_by: 'System' },
  { id: 'L004', date: '2025-03-25T14:00:00', type: 'refund', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', description: 'Refund for failed provisioning #ORD-4480', debit: 0, credit: 25.00, balance_after: 45225, related_order_id: 'ORD-4480', related_payout_id: null, admin_note: 'Supplier issue — USIMSA timeout', performed_by: 'Admin: Arthit' },
  { id: 'L005', date: '2025-03-25T11:20:00', type: 'adjustment', partner_id: '12', partner_name: 'TripStack Inc.', partner_type: 'api_partner', description: 'Credit adjustment — billing dispute resolution', debit: 0, credit: 800, balance_after: -1500, related_order_id: null, related_payout_id: null, admin_note: 'Approved by finance team — ticket #SUP-2291', performed_by: 'Admin: Sarah' },
  { id: 'L006', date: '2025-03-24T10:00:00', type: 'payout', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', description: 'Monthly settlement payout — Feb 2025', debit: 18700, credit: 0, balance_after: 45200, related_order_id: null, related_payout_id: 'PAY-0012', admin_note: null, performed_by: 'System' },
  { id: 'L007', date: '2025-03-24T09:30:00', type: 'topup', partner_id: '14', partner_name: 'Deloitte Thailand', partner_type: 'corporate', description: 'Corporate wallet reload — PO #DL-2025-034', debit: 0, credit: 10000, balance_after: 15400, related_order_id: null, related_payout_id: null, admin_note: 'PO approved by procurement', performed_by: 'System' },
  { id: 'L008', date: '2025-03-23T15:45:00', type: 'purchase', partner_id: '3', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', description: 'Bulk order — 50x UAE 30-Day plans', debit: 1250, credit: 0, balance_after: 67800, related_order_id: 'ORD-4499', related_payout_id: null, admin_note: null, performed_by: 'System' },
  { id: 'L009', date: '2025-03-23T12:10:00', type: 'fee', partner_id: '10', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', description: 'Platform fee — premium SLA surcharge', debit: 500, credit: 0, balance_after: 124700, related_order_id: null, related_payout_id: null, admin_note: null, performed_by: 'System' },
  { id: 'L010', date: '2025-03-22T09:00:00', type: 'invoice', partner_id: '3', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', description: 'Invoice #INV-2025-034 issued — postpaid cycle', debit: 0, credit: 0, balance_after: 69050, related_order_id: null, related_payout_id: null, admin_note: 'Net-30 terms', performed_by: 'System' },
  { id: 'L011', date: '2025-03-22T08:15:00', type: 'topup', partner_id: '2', partner_name: 'LionCity Distribution Pte Ltd', partner_type: 'distributor', description: 'Quarterly credit top-up — wire transfer', debit: 0, credit: 30000, balance_after: 78400, related_order_id: null, related_payout_id: null, admin_note: 'Wire ref #TRF-89112', performed_by: 'System' },
  { id: 'L012', date: '2025-03-21T16:00:00', type: 'purchase', partner_id: '5', partner_name: 'Klook Travel Tech', partner_type: 'reseller', description: 'Bulk order — 200x Asia Multi-Country plans', debit: 3400, credit: 0, balance_after: 32600, related_order_id: 'ORD-4510', related_payout_id: null, admin_note: null, performed_by: 'System' },
  { id: 'L013', date: '2025-03-21T11:30:00', type: 'topup', partner_id: '15', partner_name: 'Central Group Retail', partner_type: 'corporate', description: 'Corporate wallet reload — PO #CG-2025-018', debit: 0, credit: 20000, balance_after: 41200, related_order_id: null, related_payout_id: null, admin_note: 'Monthly reload', performed_by: 'System' },
  { id: 'L014', date: '2025-03-20T14:20:00', type: 'purchase', partner_id: '13', partner_name: 'DHL Supply Chain Asia', partner_type: 'corporate', description: 'Batch order — 80x APAC 30-Day plans for field staff', debit: 2800, credit: 0, balance_after: 22800, related_order_id: 'ORD-4505', related_payout_id: null, admin_note: null, performed_by: 'System' },
];

// ── Wallet: Settlements ───────────────────────────────────
export const SAMPLE_SETTLEMENTS: Settlement[] = [
  { id: 'SET-001', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', period: 'Mar 2025', total_orders: 1240, gross_revenue: 89500, commission: 18700, net_payable: 70800, status: 'pending', due_date: '2025-04-05', settled_at: null, reference: null },
  { id: 'SET-002', partner_id: '10', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', period: 'Mar 2025', total_orders: 4200, gross_revenue: 234000, commission: 42000, net_payable: 192000, status: 'processing', due_date: '2025-04-01', settled_at: null, reference: null },
  { id: 'SET-003', partner_id: '3', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', period: 'Mar 2025', total_orders: 890, gross_revenue: 67000, commission: 14200, net_payable: 52800, status: 'pending', due_date: '2025-04-10', settled_at: null, reference: null },
  { id: 'SET-004', partner_id: '2', partner_name: 'LionCity Distribution Pte Ltd', partner_type: 'distributor', period: 'Mar 2025', total_orders: 1820, gross_revenue: 124000, commission: 26800, net_payable: 97200, status: 'pending', due_date: '2025-04-08', settled_at: null, reference: null },
  { id: 'SET-005', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', period: 'Feb 2025', total_orders: 1180, gross_revenue: 82000, commission: 17100, net_payable: 64900, status: 'completed', due_date: '2025-03-05', settled_at: '2025-03-04', reference: 'TRF-77201' },
  { id: 'SET-006', partner_id: '10', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', period: 'Feb 2025', total_orders: 3900, gross_revenue: 218000, commission: 39200, net_payable: 178800, status: 'completed', due_date: '2025-03-01', settled_at: '2025-02-28', reference: 'TRF-77105' },
  { id: 'SET-007', partner_id: '2', partner_name: 'LionCity Distribution Pte Ltd', partner_type: 'distributor', period: 'Feb 2025', total_orders: 1650, gross_revenue: 112000, commission: 24200, net_payable: 87800, status: 'completed', due_date: '2025-03-08', settled_at: '2025-03-07', reference: 'TRF-77340' },
];

// ── Wallet: Payouts ───────────────────────────────────────
export const SAMPLE_PAYOUTS: Payout[] = [
  { id: 'PAY-0015', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', amount: 18700, method: 'Bank Transfer', bank_reference: null, status: 'requested', requested_at: '2025-03-26T08:00:00', processed_at: null, processed_by: null, notes: 'Monthly distributor margin payout' },
  { id: 'PAY-0014', partner_id: '10', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', amount: 42000, method: 'Wire Transfer', bank_reference: null, status: 'approved', requested_at: '2025-03-25T10:00:00', processed_at: null, processed_by: null, notes: 'API partner revenue share — Mar 2025' },
  { id: 'PAY-0013', partner_id: '3', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', amount: 14200, method: 'Bank Transfer', bank_reference: null, status: 'processing', requested_at: '2025-03-24T09:00:00', processed_at: null, processed_by: null, notes: null },
  { id: 'PAY-0016', partner_id: '2', partner_name: 'LionCity Distribution Pte Ltd', partner_type: 'distributor', amount: 26800, method: 'Bank Transfer', bank_reference: null, status: 'requested', requested_at: '2025-03-26T09:00:00', processed_at: null, processed_by: null, notes: 'Monthly distributor margin payout' },
  { id: 'PAY-0012', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', amount: 17100, method: 'Bank Transfer', bank_reference: 'TRF-77201', status: 'completed', requested_at: '2025-03-01T08:00:00', processed_at: '2025-03-04T14:30:00', processed_by: 'Admin: Arthit', notes: 'Feb 2025 settlement' },
  { id: 'PAY-0011', partner_id: '10', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', amount: 39200, method: 'Wire Transfer', bank_reference: 'TRF-77105', status: 'completed', requested_at: '2025-02-25T10:00:00', processed_at: '2025-02-28T16:00:00', processed_by: 'Admin: James', notes: 'Feb 2025 API revenue share' },
  { id: 'PAY-0010', partner_id: '2', partner_name: 'LionCity Distribution Pte Ltd', partner_type: 'distributor', amount: 24200, method: 'Bank Transfer', bank_reference: 'TRF-77340', status: 'completed', requested_at: '2025-03-05T08:00:00', processed_at: '2025-03-07T15:00:00', processed_by: 'Admin: James', notes: 'Feb 2025 settlement' },
];

// ── Wallet: Invoices ──────────────────────────────────────
export const SAMPLE_INVOICES: Invoice[] = [
  { id: 'INV-001', invoice_number: 'INV-2025-038', partner_id: '3', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', amount: 52800, tax: 0, total: 52800, status: 'sent', issued_at: '2025-03-26', due_date: '2025-04-25', paid_at: null, period: 'Mar 2025' },
  { id: 'INV-002', invoice_number: 'INV-2025-037', partner_id: '12', partner_name: 'TripStack Inc.', partner_type: 'api_partner', amount: 12100, tax: 1573, total: 13673, status: 'overdue', issued_at: '2025-02-28', due_date: '2025-03-15', paid_at: null, period: 'Feb 2025' },
  { id: 'INV-003', invoice_number: 'INV-2025-034', partner_id: '3', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', amount: 48500, tax: 0, total: 48500, status: 'paid', issued_at: '2025-02-26', due_date: '2025-03-28', paid_at: '2025-03-20', period: 'Feb 2025' },
  { id: 'INV-004', invoice_number: 'INV-2025-030', partner_id: '10', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', amount: 178800, tax: 0, total: 178800, status: 'paid', issued_at: '2025-02-01', due_date: '2025-03-01', paid_at: '2025-02-28', period: 'Jan 2025' },
  { id: 'INV-005', invoice_number: 'INV-2025-039', partner_id: '2', partner_name: 'LionCity Distribution Pte Ltd', partner_type: 'distributor', amount: 97200, tax: 8748, total: 105948, status: 'sent', issued_at: '2025-03-26', due_date: '2025-04-25', paid_at: null, period: 'Mar 2025' },
  { id: 'INV-006', invoice_number: 'INV-2025-040', partner_id: '11', partner_name: 'FlyConnect GmbH', partner_type: 'api_partner', amount: 52400, tax: 9956, total: 62356, status: 'sent', issued_at: '2025-03-27', due_date: '2025-04-26', paid_at: null, period: 'Mar 2025' },
];
