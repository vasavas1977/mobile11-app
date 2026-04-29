import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Check, Clock, X, MapPin, Wifi, Calendar, CreditCard, Copy, Trash2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OperatorSimCard } from '@/components/my-esims/OperatorSimCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { convertThbToUsd, convertUsdToThb } from '@/lib/currencyUtils';
import { getDateLocale } from '@/lib/dateLocale';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
type PackageTypeValue = 'day_pass' | 'max_speed' | 'limitless';

const normalizePackageType = (type?: string | null): PackageTypeValue => {
  if (!type) return 'day_pass';
  const normalized = type.toLowerCase().replace(/[\s-]/g, '_');
  if (normalized.includes('limitless')) return 'limitless';
  if (normalized.includes('max') || normalized.includes('speed')) return 'max_speed';
  return 'day_pass';
};

interface OrderDetailSectionProps {
  orderId: string;
  onBack: () => void;
}

export const OrderDetailSection: React.FC<OrderDetailSectionProps> = ({ orderId, onBack }) => {
  const { t, language, currency } = useLanguage();
  const locale = getDateLocale(language);
  const [iccidCopied, setIccidCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleCopyIccid = async (iccid: string) => {
    try {
      await navigator.clipboard.writeText(iccid);
      setIccidCopied(true);
      toast.success(t('profile.orderDetail.iccidCopied'));
      setTimeout(() => setIccidCopied(false), 2000);
    } catch {
      toast.error(t('profile.orderDetail.copyFailed'));
    }
  };

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          esim_packages:package_id (
            name,
            country_name,
            country_code,
            data_amount,
            validity_days,
            carrier,
            package_type,
            price
          ),
          promo_codes:promo_code_id (
            code,
            discount_type,
            discount_value
          )
        `)
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch payment details
  const { data: payment } = useQuery({
    queryKey: ['order-payment', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Fetch cashback earned
  const { data: cashbackTransaction } = useQuery({
    queryKey: ['order-cashback', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobile11_money_transactions')
        .select('*')
        .eq('order_id', orderId)
        .eq('type', 'earned')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('profile.orderDetail.notFound')}</p>
        <Button onClick={onBack} variant="link" className="text-orange-500 mt-4">
          {t('profile.orderDetail.backToOrders')}
        </Button>
      </div>
    );
  }

  const pkg = order.esim_packages as any;
  const promoCode = order.promo_codes as any;
  const countryCode = pkg?.country_code?.toLowerCase() || 'un';

  // Calculate price breakdown
  // Package price is stored in USD in esim_packages
  const packagePriceUsd = pkg?.price || order.original_amount || (order.total_amount + (order.discount_amount || 0) + (order.mobile11_money_applied || 0));
  
  // Convert package price to display currency
  const getDisplayPrice = (amountUsd: number) => {
    if (currency === 'THB') {
      return `฿${convertUsdToThb(amountUsd)}`;
    }
    return `$${amountUsd.toFixed(2)}`;
  };

  // For amounts stored in order currency (THB or USD)
  const formatOrderAmount = (amount: number) => {
    if (order.currency === 'THB') {
      if (currency === 'THB') {
        return `฿${Math.round(amount)}`;
      }
      return `$${convertThbToUsd(amount).toFixed(2)}`;
    } else {
      if (currency === 'USD') {
        return `$${amount.toFixed(2)}`;
      }
      return `฿${convertUsdToThb(amount)}`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Check className="w-4 h-4" />
            {t('profile.orderDetail.completed')}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            {t('profile.orderDetail.pending')}
          </span>
        );
      case 'cancelled':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <X className="w-4 h-4" />
            {t('profile.orderDetail.cancelled')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodDisplay = (): { label: string; icon: React.ReactNode; type: string } | null => {
    // Case 1: Fully free order (covered by promo/M11 money)
    if (order.total_amount === 0) {
      return {
        label: t('profile.orderDetail.freeOrder'),
        icon: <Gift className="w-4 h-4 text-green-500" />,
        type: 'free'
      };
    }
    
    // Case 2: Stripe payment
    if (payment?.payment_gateway === 'stripe' || payment?.payment_method === 'card') {
      return {
        label: `VISA Card ****${payment.payment_reference?.slice(-4) || '****'}`,
        icon: <CreditCard className="w-4 h-4 text-gray-400" />,
        type: 'card'
      };
    }
    
    // Case 3: 2C2P payment
    if (payment?.payment_gateway === '2c2p') {
      return {
        label: '2C2P Payment',
        icon: <CreditCard className="w-4 h-4 text-gray-400" />,
        type: '2c2p'
      };
    }
    
    // Case 4: Fully covered by Mobile11 Money
    if (!payment && order.mobile11_money_applied && order.mobile11_money_applied > 0) {
      return {
        label: t('profile.orderDetail.paidWithMobile11Money'),
        icon: <span className="text-base">💰</span>,
        type: 'mobile11_money'
      };
    }
    
    if (payment) {
      return {
        label: payment.payment_method || 'Card',
        icon: <CreditCard className="w-4 h-4 text-gray-400" />,
        type: 'other'
      };
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">{t('profile.orderDetail.backToOrders')}</span>
      </button>

      {/* Order Details Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('profile.orderDetail.title')}</h2>

          {/* Order Information */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('profile.orderDetail.orderInfo')}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">{t('profile.orderDetail.orderId')}</span>
                <span className="text-sm font-medium text-gray-900">#{order.order_id}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">{t('profile.orderDetail.orderDate')}</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">{t('profile.orderDetail.orderStatus')}</span>
                {getStatusBadge(order.status)}
              </div>
              {order.iccid && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">ICCID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 font-mono">{order.iccid}</span>
                    <button
                      onClick={() => handleCopyIccid(order.iccid!)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      title={t('profile.orderDetail.copyIccid') as string}
                    >
                      {iccidCopied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 rounded-full bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
              asChild
            >
              <Link to={`/receipt/${order.id}`}>
                {t('profile.orderDetail.viewReceipt')}
              </Link>
            </Button>
          </div>

          {/* Package Card */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {/* Country Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gray-50">
              <span className={`fi fi-${countryCode} w-6 h-4 rounded shadow-sm`}></span>
              <span className="font-semibold text-gray-900">{pkg?.country_name || 'eSIM Package'}</span>
            </div>

            {/* Package Details */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{pkg?.carrier || 'Mobile11'}</p>
                  <p className="font-semibold text-gray-900 mb-4">{t('profile.orderDetail.package')}</p>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      <MapPin className="w-3.5 h-3.5" />
                      {pkg?.country_name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      <Wifi className="w-3.5 h-3.5" />
                      {pkg?.data_amount}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                      <Calendar className="w-3.5 h-3.5" />
                      {pkg?.validity_days} {t('profile.orders.days')}
                    </span>
                  </div>
                </div>

                {/* eSIM Card Visual */}
                <div className="flex-shrink-0 transform scale-75 origin-top-left">
                  <OperatorSimCard
                    carrier={pkg?.carrier || 'Mobile11'}
                    countryName={pkg?.country_name || 'eSIM'}
                    packageType={normalizePackageType(pkg?.package_type)}
                    networkType="4G"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile11 Money Used Banner */}
          {order.mobile11_money_applied && order.mobile11_money_applied > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">💸</span>
                </div>
                <div>
                  <p className="text-sm text-green-800">{t('profile.orderDetail.usedMobile11Money')}</p>
                  <p className="font-bold text-green-900">
                    -{currency === 'USD' 
                      ? `$${convertThbToUsd(order.mobile11_money_applied).toFixed(2)}`
                      : `฿${order.mobile11_money_applied.toFixed(0)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile11 Money Earned Banner */}
          {cashbackTransaction && cashbackTransaction.amount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-sm text-amber-800">{t('profile.orderDetail.earnedRewards')}</p>
                  <p className="font-bold text-amber-900">
                    {currency === 'USD' 
                      ? `$${convertThbToUsd(cashbackTransaction.amount).toFixed(2)}`
                      : `฿${cashbackTransaction.amount.toFixed(0)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('profile.orderDetail.paymentDetails')}</h3>
            
            <div className="space-y-3">
              {/* Package Price */}
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">{t('profile.orderDetail.packagePrice')}</span>
                <span className="text-sm font-medium text-gray-900">
                  {getDisplayPrice(packagePriceUsd)}
                </span>
              </div>

              {/* Promo Code Discount */}
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">
                    {t('profile.orderDetail.promoDiscount')}
                    {promoCode?.code && <span className="text-gray-400 ml-1">({promoCode.code})</span>}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    -{formatOrderAmount(order.discount_amount)}
                  </span>
                </div>
              )}

              {/* Mobile11 Money Used */}
              {order.mobile11_money_applied && order.mobile11_money_applied > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">{t('profile.orderDetail.mobile11MoneyUsed')}</span>
                  <span className="text-sm font-medium text-green-600">
                    -{formatOrderAmount(order.mobile11_money_applied)}
                  </span>
                </div>
              )}
              
              {/* Payment Method - show if amount > 0 or free order indication */}
              {(() => {
                const paymentInfo = getPaymentMethodDisplay();
                if (paymentInfo) {
                  return (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">{t('profile.orderDetail.paymentMethod')}</span>
                      <div className="flex items-center gap-2">
                        {paymentInfo.icon}
                        <span className={`text-sm font-medium ${paymentInfo.type === 'free' ? 'text-green-600' : 'text-gray-900'}`}>
                          {paymentInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Total */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-gray-700">{t('profile.orderDetail.total')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatOrderAmount(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Delete Order Details Button */}
          <div className="pt-4 border-t border-gray-200">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('profile.orderDetail.deleteOrderDetails')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('profile.orderDetail.deleteConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('profile.orderDetail.deleteConfirmMessage')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('profile.orderDetail.cancelButton')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600"
                    onClick={async () => {
                      setIsDeleting(true);
                      const { error } = await supabase
                        .from('orders')
                        .update({ hidden_by_user: true })
                        .eq('id', orderId);
                      
                      setIsDeleting(false);
                      
                      if (error) {
                        toast.error(t('profile.orderDetail.errorOccurred'));
                        return;
                      }
                      
                      toast.success(t('profile.orderDetail.orderDeleted'));
                      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
                      onBack();
                    }}
                  >
                    {t('profile.orderDetail.deleteConfirmButton')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        </div>
      </div>
    </div>
  );
};
