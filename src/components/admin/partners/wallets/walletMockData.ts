import { generateMockPartners, Partner } from '../types';

export type TransactionType = 'topup' | 'purchase' | 'refund' | 'adjustment' | 'commission' | 'payout' | 'invoice' | 'fee';
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutStatus = 'requested' | 'approved' | 'processing' | 'completed' | 'rejected';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface LedgerEntry {
  id: string;
  date: string;
  type: TransactionType;
  partner_id: string;
  partner_name: string;
  partner_type: string;
  description: string;
  debit: number;
  credit: number;
  balance_after: number;
  related_order_id: string | null;
  related_payout_id: string | null;
  admin_note: string | null;
  performed_by: string;
}

export interface Settlement {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_type: string;
  period: string;
  total_orders: number;
  gross_revenue: number;
  commission: number;
  net_payable: number;
  status: SettlementStatus;
  due_date: string;
  settled_at: string | null;
  reference: string | null;
}

export interface Payout {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_type: string;
  amount: number;
  method: string;
  bank_reference: string | null;
  status: PayoutStatus;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  notes: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  partner_id: string;
  partner_name: string;
  partner_type: string;
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issued_at: string;
  due_date: string;
  paid_at: string | null;
  period: string;
}

export function getActivePartners(): Partner[] {
  return generateMockPartners().filter(p => p.status !== 'terminated');
}

export function generateLedgerEntries(): LedgerEntry[] {
  const entries: LedgerEntry[] = [
    { id: 'L001', date: '2025-03-26T09:15:00', type: 'topup', partner_id: '2', partner_name: 'TravelSIM Japan', partner_type: 'reseller', description: 'Wallet top-up via bank transfer', debit: 0, credit: 5000, balance_after: 13300, related_order_id: null, related_payout_id: null, admin_note: 'Wire confirmed ref #TRF-88291', performed_by: 'System' },
    { id: 'L002', date: '2025-03-26T08:42:00', type: 'purchase', partner_id: '2', partner_name: 'TravelSIM Japan', partner_type: 'reseller', description: 'Order #ORD-4521 — Japan 7-Day 5GB', debit: 12.50, credit: 0, balance_after: 8300, related_order_id: 'ORD-4521', related_payout_id: null, admin_note: null, performed_by: 'System' },
    { id: 'L003', date: '2025-03-25T16:30:00', type: 'commission', partner_id: '3', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', description: 'API usage billing — Mar 2025 batch', debit: 4200, credit: 0, balance_after: 120500, related_order_id: null, related_payout_id: null, admin_note: null, performed_by: 'System' },
    { id: 'L004', date: '2025-03-25T14:00:00', type: 'refund', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', description: 'Refund for failed provisioning #ORD-4480', debit: 0, credit: 25.00, balance_after: 45225, related_order_id: 'ORD-4480', related_payout_id: null, admin_note: 'Supplier issue — USIMSA timeout', performed_by: 'Admin: Arthit' },
    { id: 'L005', date: '2025-03-25T11:20:00', type: 'adjustment', partner_id: '6', partner_name: 'TripStack Inc.', partner_type: 'api_partner', description: 'Credit adjustment — billing dispute resolution', debit: 0, credit: 800, balance_after: -1500, related_order_id: null, related_payout_id: null, admin_note: 'Approved by finance team — ticket #SUP-2291', performed_by: 'Admin: Sarah' },
    { id: 'L006', date: '2025-03-24T10:00:00', type: 'payout', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', description: 'Monthly settlement payout — Feb 2025', debit: 18700, credit: 0, balance_after: 45200, related_order_id: null, related_payout_id: 'PAY-0012', admin_note: null, performed_by: 'System' },
    { id: 'L007', date: '2025-03-24T09:30:00', type: 'topup', partner_id: '7', partner_name: 'Deloitte Thailand', partner_type: 'corporate', description: 'Corporate wallet reload — PO #DL-2025-034', debit: 0, credit: 10000, balance_after: 15400, related_order_id: null, related_payout_id: null, admin_note: 'PO approved by procurement', performed_by: 'System' },
    { id: 'L008', date: '2025-03-23T15:45:00', type: 'purchase', partner_id: '4', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', description: 'Bulk order — 50x UAE 30-Day plans', debit: 1250, credit: 0, balance_after: 67800, related_order_id: 'ORD-4499', related_payout_id: null, admin_note: null, performed_by: 'System' },
    { id: 'L009', date: '2025-03-23T12:10:00', type: 'fee', partner_id: '3', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', description: 'Platform fee — premium SLA surcharge', debit: 500, credit: 0, balance_after: 124700, related_order_id: null, related_payout_id: null, admin_note: null, performed_by: 'System' },
    { id: 'L010', date: '2025-03-22T09:00:00', type: 'invoice', partner_id: '4', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', description: 'Invoice #INV-2025-034 issued — postpaid cycle', debit: 0, credit: 0, balance_after: 69050, related_order_id: null, related_payout_id: null, admin_note: 'Net-30 terms', performed_by: 'System' },
  ];
  return entries;
}

export function generateSettlements(): Settlement[] {
  return [
    { id: 'SET-001', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', period: 'Mar 2025', total_orders: 1240, gross_revenue: 89500, commission: 18700, net_payable: 70800, status: 'pending', due_date: '2025-04-05', settled_at: null, reference: null },
    { id: 'SET-002', partner_id: '3', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', period: 'Mar 2025', total_orders: 4200, gross_revenue: 234000, commission: 42000, net_payable: 192000, status: 'processing', due_date: '2025-04-01', settled_at: null, reference: null },
    { id: 'SET-003', partner_id: '4', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', period: 'Mar 2025', total_orders: 890, gross_revenue: 67000, commission: 14200, net_payable: 52800, status: 'pending', due_date: '2025-04-10', settled_at: null, reference: null },
    { id: 'SET-004', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', period: 'Feb 2025', total_orders: 1180, gross_revenue: 82000, commission: 17100, net_payable: 64900, status: 'completed', due_date: '2025-03-05', settled_at: '2025-03-04', reference: 'TRF-77201' },
    { id: 'SET-005', partner_id: '3', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', period: 'Feb 2025', total_orders: 3900, gross_revenue: 218000, commission: 39200, net_payable: 178800, status: 'completed', due_date: '2025-03-01', settled_at: '2025-02-28', reference: 'TRF-77105' },
  ];
}

export function generatePayouts(): Payout[] {
  return [
    { id: 'PAY-0015', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', amount: 18700, method: 'Bank Transfer', bank_reference: null, status: 'requested', requested_at: '2025-03-26T08:00:00', processed_at: null, processed_by: null, notes: 'Monthly distributor margin payout' },
    { id: 'PAY-0014', partner_id: '3', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', amount: 42000, method: 'Wire Transfer', bank_reference: null, status: 'approved', requested_at: '2025-03-25T10:00:00', processed_at: null, processed_by: null, notes: 'API partner revenue share — Mar 2025' },
    { id: 'PAY-0013', partner_id: '4', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', amount: 14200, method: 'Bank Transfer', bank_reference: null, status: 'processing', requested_at: '2025-03-24T09:00:00', processed_at: null, processed_by: null, notes: null },
    { id: 'PAY-0012', partner_id: '1', partner_name: 'SiamConnect Co., Ltd.', partner_type: 'distributor', amount: 17100, method: 'Bank Transfer', bank_reference: 'TRF-77201', status: 'completed', requested_at: '2025-03-01T08:00:00', processed_at: '2025-03-04T14:30:00', processed_by: 'Admin: Arthit', notes: 'Feb 2025 settlement' },
    { id: 'PAY-0011', partner_id: '3', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', amount: 39200, method: 'Wire Transfer', bank_reference: 'TRF-77105', status: 'completed', requested_at: '2025-02-25T10:00:00', processed_at: '2025-02-28T16:00:00', processed_by: 'Admin: James', notes: 'Feb 2025 API revenue share' },
  ];
}

export function generateInvoices(): Invoice[] {
  return [
    { id: 'INV-001', invoice_number: 'INV-2025-038', partner_id: '4', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', amount: 52800, tax: 0, total: 52800, status: 'sent', issued_at: '2025-03-26', due_date: '2025-04-25', paid_at: null, period: 'Mar 2025' },
    { id: 'INV-002', invoice_number: 'INV-2025-037', partner_id: '6', partner_name: 'TripStack Inc.', partner_type: 'api_partner', amount: 12100, tax: 1573, total: 13673, status: 'overdue', issued_at: '2025-02-28', due_date: '2025-03-15', paid_at: null, period: 'Feb 2025' },
    { id: 'INV-003', invoice_number: 'INV-2025-034', partner_id: '4', partner_name: 'MenaDigital FZCO', partner_type: 'distributor', amount: 48500, tax: 0, total: 48500, status: 'paid', issued_at: '2025-02-26', due_date: '2025-03-28', paid_at: '2025-03-20', period: 'Feb 2025' },
    { id: 'INV-004', invoice_number: 'INV-2025-030', partner_id: '3', partner_name: 'GlobalReach API Ltd.', partner_type: 'api_partner', amount: 178800, tax: 0, total: 178800, status: 'paid', issued_at: '2025-02-01', due_date: '2025-03-01', paid_at: '2025-02-28', period: 'Jan 2025' },
  ];
}

export const TX_TYPE_STYLES: Record<TransactionType, { label: string; color: string }> = {
  topup: { label: 'Top-up', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  purchase: { label: 'Purchase', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  refund: { label: 'Refund', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  adjustment: { label: 'Adjustment', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  commission: { label: 'Commission', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  payout: { label: 'Payout', color: 'bg-red-50 text-red-700 border-red-200' },
  invoice: { label: 'Invoice', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  fee: { label: 'Fee', color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

export const SETTLEMENT_STATUS_STYLES: Record<SettlementStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

export const PAYOUT_STATUS_STYLES: Record<PayoutStatus, string> = {
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-sky-50 text-sky-700 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-50 text-gray-600 border-gray-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};
