export interface APIPartner {
  id: string;
  company_name: string;
  contact_email: string;
  country: string;
  territory: string;
  status: 'active' | 'sandbox' | 'suspended' | 'pending';
  environment: 'sandbox' | 'production' | 'both';
  api_key_prefix: string;
  api_secret_masked: string;
  created_at: string;
  billing_model: 'per_request' | 'per_order' | 'monthly_flat' | 'tiered';
  monthly_requests: number;
  monthly_orders: number;
  monthly_revenue: number;
  error_rate: number;
  avg_latency_ms: number;
  rate_limit_rpm: number;
  rate_limit_daily: number;
  allowed_ips: string[];
  allowed_endpoints: string[];
  webhook_url: string | null;
  webhook_events: string[];
  webhook_secret_masked: string | null;
  sandbox_key_prefix: string;
  production_key_prefix: string;
  api_version: string;
  account_manager: string;
  contract_start: string;
  contract_end: string;
  scopes: string[];
}

export const MOCK_API_PARTNERS: APIPartner[] = [
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

export const ALL_SCOPES = [
  { scope: 'packages:read', description: 'List and retrieve package details' },
  { scope: 'packages:write', description: 'Create, update, and manage packages' },
  { scope: 'orders:read', description: 'View order details and status' },
  { scope: 'orders:write', description: 'Create and manage orders' },
  { scope: 'esim:read', description: 'View eSIM details, QR codes, and activation status' },
  { scope: 'esim:write', description: 'Manage eSIM lifecycle operations' },
  { scope: 'webhooks:manage', description: 'Create, update, and delete webhook subscriptions' },
  { scope: 'billing:read', description: 'View billing and usage information' },
  { scope: 'partners:read', description: 'View partner account details' },
];

export const ALL_ENDPOINTS = [
  'packages.list', 'packages.get', 'packages.search',
  'orders.create', 'orders.status', 'orders.list', 'orders.cancel',
  'esim.qr', 'esim.status', 'esim.topup',
  'webhooks.manage', 'webhooks.list',
  'billing.usage', 'billing.invoices',
];

export const WEBHOOK_EVENTS = [
  'order.created', 'order.completed', 'order.failed', 'order.refunded',
  'esim.activated', 'esim.expired', 'esim.data_warning',
  'billing.invoice_created', 'billing.payment_received',
];

export const API_VERSIONS = [
  { version: 'v2.1', date: '2025-02-15', status: 'current' as const, changes: ['Added esim.topup endpoint', 'Improved error codes', 'Webhook retry improvements'] },
  { version: 'v2.0', date: '2024-09-01', status: 'supported' as const, changes: ['New billing endpoints', 'Breaking: changed order response format', 'Added webhook signatures'] },
  { version: 'v1.2', date: '2024-04-01', status: 'deprecated' as const, changes: ['Added package search', 'Performance improvements'] },
  { version: 'v1.0', date: '2024-01-15', status: 'sunset' as const, changes: ['Initial API release'] },
];

export const PARTNER_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sandbox: 'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};
