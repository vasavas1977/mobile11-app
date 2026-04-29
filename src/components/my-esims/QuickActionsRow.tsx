import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowUpDown, Calendar, Tag, RefreshCw, ToggleLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';
import { useQueryClient } from '@tanstack/react-query';
import { ManagePaymentDialog } from './ManagePaymentDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
interface QuickActionsRowProps {
  order: {
    id: string;
    total_amount: number;
    original_amount?: number;
    discount_amount?: number;
    currency: string;
    promo_code_id?: string;
    auto_renewal_enabled?: boolean;
    renewal_payment_method_id?: string | null;
    renewal_failure_count?: number;
    renewal_failure_reason?: string | null;
    esim_packages?: {
      data_amount: string;
      validity_days: number;
    };
  };
  isInstalled: boolean;
}

export function QuickActionsRow({ order, isInstalled }: QuickActionsRowProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [renewalsEnabled, setRenewalsEnabled] = useState(order.auto_renewal_enabled ?? false);
  const [toggling, setToggling] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [retryingRenewal, setRetryingRenewal] = useState(false);
  
  // Check if renewal is locked (3+ failures)
  const isRenewalLocked = (order.renewal_failure_count ?? 0) >= 3 && renewalsEnabled;

  // Check for saved payment methods on mount
  useEffect(() => {
    checkPaymentMethod();
  }, []);

  // Sync local state when order prop changes (e.g., navigating from PaymentSuccessPage)
  useEffect(() => {
    setRenewalsEnabled(order.auto_renewal_enabled ?? false);
  }, [order.auto_renewal_enabled]);

  const checkPaymentMethod = async () => {
    try {
      const { data } = await supabase.functions.invoke('list-payment-methods');
      setHasPaymentMethod((data?.cards?.length || 0) > 0);
    } catch (error) {
      setHasPaymentMethod(false);
    } finally {
      setCheckingPayment(false);
    }
  };
  
  const handleManagePayment = () => {
    setPaymentDialogOpen(true);
  };

  const handlePaymentMethodSet = () => {
    // Refresh payment method status and enable auto-renewal
    checkPaymentMethod();
    setRenewalsEnabled(true);
    // Update in database
    supabase
      .from('orders')
      .update({ auto_renewal_enabled: true })
      .eq('id', order.id)
      .then(() => {
      queryClient.invalidateQueries({ queryKey: ['user-esims'] });
      queryClient.invalidateQueries({ queryKey: ['esim-detail', order.id] });
      });
  };

  const handleToggleRenewal = async (enabled: boolean) => {
    // If trying to enable but no payment method, prompt to add one
    if (enabled && !hasPaymentMethod) {
      toast({
        title: t('myEsims.paymentRequired'),
        description: t('myEsims.paymentRequiredDesc'),
      });
      setPaymentDialogOpen(true);
      return;
    }

    setToggling(true);
    const previousValue = renewalsEnabled;
    setRenewalsEnabled(enabled);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ auto_renewal_enabled: enabled })
        .eq('id', order.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['user-esims'] });
      queryClient.invalidateQueries({ queryKey: ['esim-detail', order.id] });
      toast({
        title: enabled ? t('myEsims.renewalEnabled') : t('myEsims.renewalDisabled'),
        description: enabled ? t('myEsims.renewalEnabledDesc') : t('myEsims.renewalDisabledDesc'),
      });
    } catch (error: any) {
      setRenewalsEnabled(previousValue);
      toast({
        title: t('myEsims.error'),
        description: error.message || t('myEsims.renewalToggleError'),
        variant: 'destructive',
      });
    } finally {
      setToggling(false);
    }
  };

  const handleRetryRenewal = async () => {
    setRetryingRenewal(true);
    try {
      const { data, error } = await supabase.functions.invoke('retry-auto-renewal', {
        body: { orderId: order.id }
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['user-esims'] });
      queryClient.invalidateQueries({ queryKey: ['esim-detail', order.id] });
      
      toast({
        title: t('myEsims.renewalRetrySuccess'),
        description: t('myEsims.renewalRetrySuccessDesc'),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('myEsims.renewalRetryError');
      toast({
        title: t('myEsims.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setRetryingRenewal(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return currency === 'THB' ? `฿${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: Never run out of data card */}
      <div className="bg-[#F5F1EC] rounded-2xl p-6 flex flex-col">
        {/* Lottie Animation */}
        <div className="flex justify-center mb-4">
          <LottieAnimation
            src="/assets/lottie/unlimited-data.lottie"
            className="w-32 h-32"
            loop={true}
            autoplay={true}
          />
        </div>
        
        <h3 className="font-semibold text-gray-800 text-lg mb-2">
          {t('myEsims.neverRunOut')}
        </h3>
        <p className="text-gray-600 text-sm mb-6 flex-grow">
          {t('myEsims.renewalDescription')}
        </p>
        
        {/* Divider + Toggle */}
        <div className="border-t border-gray-300 pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-lg">
              {t('myEsims.renewalsAre')} {renewalsEnabled ? t('myEsims.on') : t('myEsims.off')}
            </span>
            <Switch
              checked={renewalsEnabled}
              onCheckedChange={handleToggleRenewal}
              disabled={toggling || isRenewalLocked}
              className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-300"
            />
          </div>
          
          {/* Renewal Locked Warning + Retry Button */}
          {isRenewalLocked && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm mb-2">
                {t('myEsims.renewalPaused')}
              </p>
              {order.renewal_failure_reason && (
                <p className="text-amber-600 text-xs mb-3 line-clamp-2">
                  {order.renewal_failure_reason.substring(0, 100)}...
                </p>
              )}
              <Button
                onClick={handleRetryRenewal}
                disabled={retryingRenewal}
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {retryingRenewal ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {t('myEsims.retryRenewal')}
              </Button>
            </div>
          )}
        </div>
        
        {/* How renewals work button - mobile only, outside the card visually but inside the beige area */}
        {isMobile && (
          <button
            onClick={() => navigate('/how-renewals-work')}
            className="w-full mt-4 py-4 bg-white rounded-full border border-gray-300 text-gray-800 font-medium text-base hover:border-gray-400 transition-colors"
          >
            {t('myEsims.howRenewalsWork')}
          </button>
        )}
      </div>
      
      {/* Right Column - conditionally render based on renewalsEnabled */}
      {renewalsEnabled ? (
        // Show Current Package + Manage Payment when renewals are ON
        <div className="flex flex-col gap-4">
          {/* Current Package Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-base mb-4">
              {t('myEsims.currentPackage')}
            </h3>
            
            <div className="space-y-3">
              {/* Data Row */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <ArrowUpDown className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-gray-600 text-sm">{t('myEsims.data')}</span>
                </div>
                <span className="font-medium text-gray-800">
                  {order.esim_packages?.data_amount || '-'}
                </span>
              </div>
              
              {/* Validity Row */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-gray-600 text-sm">{t('myEsims.validity')}</span>
                </div>
                <span className="font-medium text-gray-800">
                  {order.esim_packages?.validity_days 
                    ? `${order.esim_packages.validity_days} ${t('myEsims.days')}`
                    : '-'}
                </span>
              </div>
              
              {/* Price Row */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-gray-600 text-sm">{t('myEsims.price')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {order.original_amount && order.original_amount > order.total_amount && (
                    <span className="text-gray-400 line-through text-sm">
                      {formatPrice(order.original_amount, order.currency)}
                    </span>
                  )}
                  <span className="font-medium text-gray-800">
                    {formatPrice(order.total_amount, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Manage Payment Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-base mb-1">
                  {t('myEsims.managePaymentMethod')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('myEsims.paymentDescription')}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleManagePayment}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 w-full"
            >
              {t('myEsims.managePayment')}
            </Button>
          </div>
        </div>
      ) : (
        // Show feature cards when renewals are OFF
        <div className="flex flex-col gap-3">
          {/* Low data charge */}
          <div className="bg-[#F5F1EC] rounded-2xl p-4">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center mb-3">
              <ArrowUpDown className="w-4 h-4 text-gray-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-base mb-1">
              {t('myEsims.lowDataCharge')}
            </h4>
            <p className="text-gray-600 text-sm">
              {t('myEsims.lowDataChargeDesc')}
            </p>
          </div>
          
          {/* Auto renewal */}
          <div className="bg-[#F5F1EC] rounded-2xl p-4">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center mb-3">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-base mb-1">
              {t('myEsims.autoRenewal')}
            </h4>
            <p className="text-gray-600 text-sm">
              {t('myEsims.autoRenewalDesc')}
            </p>
          </div>
          
          {/* Switch anytime */}
          <div className="bg-[#F5F1EC] rounded-2xl p-4">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center mb-3">
              <ToggleLeft className="w-4 h-4 text-gray-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-base mb-1">
              {t('myEsims.switchAnytime')}
            </h4>
            <p className="text-gray-600 text-sm">
              {t('myEsims.switchAnytimeDesc')}
            </p>
          </div>
        </div>
      )}

      <ManagePaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        orderId={order.id}
        currentPaymentMethodId={order.renewal_payment_method_id}
        onPaymentMethodSet={handlePaymentMethodSet}
      />
    </div>
  );
}
