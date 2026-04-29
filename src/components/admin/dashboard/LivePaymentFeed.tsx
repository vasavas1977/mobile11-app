import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, CreditCard, QrCode, Wallet, Gift, DollarSign, Loader2 } from 'lucide-react';
import { formatDistanceToNowStrict, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface PaymentEvent {
  id: string;
  amount: number;
  currency: string;
  payment_gateway: string;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  order_id: string | null;
}

interface OrderDetail {
  id: string;
  order_id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  profiles?: { first_name?: string; last_name?: string; email: string } | null;
  esim_packages?: { name: string; country_name: string; data_amount: string } | null;
}

const METHOD_CONFIG: Record<string, { icon: typeof CreditCard; label: string; color: string }> = {
  'stripe:card': { icon: CreditCard, label: 'Credit Card', color: 'text-blue-600' },
  'stripe:promo_code': { icon: Gift, label: 'Promo / Free', color: 'text-purple-600' },
  'stripe:mobile11_money': { icon: Wallet, label: 'Mobile11 Money', color: 'text-emerald-600' },
  'stripe:org_credit': { icon: DollarSign, label: 'Org Credit', color: 'text-amber-600' },
  '2c2p:redirect': { icon: QrCode, label: '2C2P QR/Redirect', color: 'text-orange-600' },
  '2c2p:promptpay_direct': { icon: QrCode, label: 'PromptPay', color: 'text-indigo-600' },
  'manual:admin_manual': { icon: DollarSign, label: 'Manual', color: 'text-gray-600' },
};

function getMethodConfig(gateway: string, method: string) {
  const key = `${gateway}:${method}`;
  return METHOD_CONFIG[key] || { icon: CreditCard, label: method || gateway, color: 'text-gray-500' };
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'failed': case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function LivePaymentFeed() {
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [, setTick] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<PaymentEvent | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load recent completed payments on mount
  useEffect(() => {
    async function loadRecent() {
      const { data } = await supabase
        .from('payments')
        .select('id, amount, currency, payment_gateway, payment_method, status, created_at, updated_at, order_id')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(15);
      if (data) setPayments(data as PaymentEvent[]);
    }
    loadRecent();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('live-payments')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments', filter: 'status=eq.completed' },
        (payload) => {
          const newPayment = payload.new as PaymentEvent;
          setPayments(prev => {
            const filtered = prev.filter(p => p.id !== newPayment.id);
            return [newPayment, ...filtered].slice(0, 15);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        (payload) => {
          const newPayment = payload.new as PaymentEvent;
          if (newPayment.status === 'completed') {
            setPayments(prev => {
              const filtered = prev.filter(p => p.id !== newPayment.id);
              return [newPayment, ...filtered].slice(0, 15);
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Update relative times every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePaymentClick = async (payment: PaymentEvent) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
    setOrderDetail(null);

    if (!payment.order_id) return;

    setLoadingDetail(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('id, order_id, status, total_amount, currency, created_at, profiles(first_name, last_name, email), esim_packages(name, country_name, data_amount)')
        .eq('id', payment.order_id)
        .single();
      if (data) setOrderDetail(data as unknown as OrderDetail);
    } finally {
      setLoadingDetail(false);
    }
  };

  const currencySymbol = (c: string) => c === 'THB' ? '฿' : '$';

  return (
    <div className="bg-white rounded-2xl border border-[#F3F0EB] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-green-50">
          <Activity className="h-4 w-4 text-green-600" />
        </div>
        <h3 className="font-semibold text-sm text-[#1A1A1A]">Live Payment Feed</h3>
        <span className="ml-auto flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Live</span>
        </span>
      </div>

      <div className="space-y-1 max-h-[320px] overflow-y-auto">
        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No completed payments yet</p>
        ) : (
          payments.map((p) => {
            const config = getMethodConfig(p.payment_gateway, p.payment_method);
            const Icon = config.icon;
            const timeAgo = formatDistanceToNowStrict(new Date(p.updated_at), { addSuffix: true });

            return (
              <div
                key={p.id}
                onClick={() => handlePaymentClick(p)}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {currencySymbol(p.currency)}{Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{config.label}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-[#F3F0EB] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">Payment Details</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {/* Payment Info */}
              <div className="bg-[#FAF7F2] rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-[#8B7E74] uppercase tracking-wide">Payment</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[#8B7E74] text-xs">Amount</p>
                    <p className="font-semibold text-[#1A1A1A]">
                      {currencySymbol(selectedPayment.currency)}{Number(selectedPayment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B7E74] text-xs">Gateway</p>
                    <p className="font-medium text-[#1A1A1A] capitalize">{selectedPayment.payment_gateway}</p>
                  </div>
                  <div>
                    <p className="text-[#8B7E74] text-xs">Method</p>
                    <p className="font-medium text-[#1A1A1A]">{getMethodConfig(selectedPayment.payment_gateway, selectedPayment.payment_method).label}</p>
                  </div>
                  <div>
                    <p className="text-[#8B7E74] text-xs">Paid At</p>
                    <p className="font-medium text-[#1A1A1A]">{format(new Date(selectedPayment.updated_at), 'dd MMM yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>

              {/* Order & Customer Info */}
              {loadingDetail ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#8B7E74]" />
                </div>
              ) : orderDetail ? (
                <>
                  <div className="bg-[#FAF7F2] rounded-xl p-3 space-y-2">
                    <p className="text-xs font-medium text-[#8B7E74] uppercase tracking-wide">Customer</p>
                    <div className="text-sm">
                      <p className="font-semibold text-[#1A1A1A]">
                        {[orderDetail.profiles?.first_name, orderDetail.profiles?.last_name].filter(Boolean).join(' ') || 'Guest'}
                      </p>
                      <p className="text-[#8B7E74] text-xs">{orderDetail.profiles?.email || '—'}</p>
                    </div>
                  </div>

                  <div className="bg-[#FAF7F2] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#8B7E74] uppercase tracking-wide">Order</p>
                      <Badge variant="outline" className={getStatusBadgeClass(orderDetail.status)}>
                        {orderDetail.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[#8B7E74] text-xs">Order ID</p>
                        <p className="font-mono text-xs text-[#1A1A1A]">{orderDetail.order_id}</p>
                      </div>
                      <div>
                        <p className="text-[#8B7E74] text-xs">Amount</p>
                        <p className="font-semibold text-[#1A1A1A]">
                          {currencySymbol(orderDetail.currency)}{Number(orderDetail.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {orderDetail.esim_packages && (
                        <>
                          <div>
                            <p className="text-[#8B7E74] text-xs">Package</p>
                            <p className="font-medium text-[#1A1A1A] text-xs">{orderDetail.esim_packages.name}</p>
                          </div>
                          <div>
                            <p className="text-[#8B7E74] text-xs">Destination</p>
                            <p className="font-medium text-[#1A1A1A] text-xs">{orderDetail.esim_packages.country_name}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : !selectedPayment.order_id ? (
                <p className="text-xs text-[#8B7E74] text-center py-3">No linked order</p>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
