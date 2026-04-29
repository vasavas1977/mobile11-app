export interface Order {
  id: string;
  order_id: string;
  user_id: string;
  package_id: string;
  total_amount: number;
  currency: string;
  status: string;
  qr_code?: string;
  iccid?: string;
  msisdn?: string;
  webhook_data?: any;
  created_at: string;
  updated_at: string;
  expiry_date?: string | null;
  download_link?: string | null;
  smdp_address?: string | null;
  activation_code?: string | null;
  environment?: string;
  parent_order_id?: string | null;
  provider_id?: string | null;
  service_tier?: string;
  provider_order_id?: string | null;
  provider_status?: string | null;
  provider_cost?: number | null;
  discount_amount?: number | null;
  affiliate_id?: string | null;
  organization_id?: string | null;
  payment_completed_at?: string | null;
  promo_code_id?: string | null;
  short_code?: string | null;
  notification_email?: string | null;
  original_amount?: number | null;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  esim_packages?: {
    name: string;
    country_name: string;
    country_code: string;
    data_amount: string;
    cost_price?: number;
    category?: string;
  };
  esim_providers?: {
    provider_code: string;
    provider_name: string;
  };
  affiliates?: {
    affiliate_code: string;
    company_name?: string;
    affiliate_type: string;
  } | null;
}

export interface InstallationDevice {
  installTime: string | null;
  installDevice: string | null;
  eid: string | null;
}

export interface InstallationInfo {
  code: string;
  message: string;
  iccid: string;
  orderId: string;
  device: InstallationDevice;
  installCount: number;
  updateTime: string;
}

export type OrderFilterState = {
  search: string;
  status: string;
  extensionType: 'all' | 'extension' | 'original';
  tier: 'all' | 'priority' | 'economy';
  supplier: string;
  destination: string;
  channelSource: string;
  dateFrom: string;
  dateTo: string;
};

export const DEFAULT_FILTERS: OrderFilterState = {
  search: '',
  status: 'all',
  extensionType: 'all',
  tier: 'all',
  supplier: 'all',
  destination: 'all',
  channelSource: 'all',
  dateFrom: '',
  dateTo: '',
};

export const getProviderType = (order: Order): 'tuge' | 'usimsa' | 'unknown' => {
  if (order.esim_providers?.provider_code === 'tuge') return 'tuge';
  const webhook = order.webhook_data as any;
  if (webhook?.topupId || webhook?.topup_id) return 'usimsa';
  return 'unknown';
};

export const isExtensionOrder = (order: Order): boolean => {
  const webhook = order.webhook_data && typeof order.webhook_data === 'object' ? (order.webhook_data as any) : null;
  return !!(
    (order.parent_order_id && order.parent_order_id !== order.order_id) ||
    (webhook?.isExtension === true) ||
    (webhook?.originalOrderId && webhook.originalOrderId !== order.order_id) ||
    (typeof order.order_id === 'string' && order.order_id.startsWith('EXT-'))
  );
};

export const getChannelSource = (order: Order): string => {
  if (order.affiliates) {
    const type = order.affiliates.affiliate_type;
    if (type === 'reseller') return 'Reseller';
    if (type === 'distributor') return 'Distributor';
    return 'Affiliate';
  }
  if (order.organization_id) return 'B2B';
  // Check if order came through API
  if (order.webhook_data && typeof order.webhook_data === 'object') {
    const wd = order.webhook_data as any;
    if (wd.api_partner_id || wd.channel === 'api') return 'API';
  }
  return 'Direct';
};

export const getMargin = (order: Order): number | null => {
  if (order.provider_cost == null) return null;
  return order.total_amount - order.provider_cost;
};

export const getPaymentStatus = (order: Order): string => {
  if (order.payment_completed_at) return 'paid';
  if (order.total_amount === 0) return 'free';
  if (order.status === 'cancelled') return 'cancelled';
  if (order.status === 'failed') return 'failed';
  return 'pending';
};

export const getProvisioningStatus = (order: Order): string => {
  if (order.qr_code && order.iccid) return 'provisioned';
  if (order.provider_status === 'failed' || order.status === 'failed') return 'failed';
  if (order.status === 'processing') return 'processing';
  if (order.status === 'cancelled') return 'cancelled';
  return 'pending';
};
