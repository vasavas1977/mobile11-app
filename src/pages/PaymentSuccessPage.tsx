import { useEffect, useState, useRef } from 'react';
import { isGuestAutoCreated } from '@/utils/guestCheckout';
import { SetPasswordPrompt } from '@/components/checkout/SetPasswordPrompt';
import { PostPaymentEmailVerify } from '@/components/checkout/PostPaymentEmailVerify';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  Smartphone,
  Coins,
  Share2,
  Download,
  ShieldAlert,
  ExternalLink,
  CreditCard,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PackageTypeBadge } from '@/components/esim/PackageTypeBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackPurchase } from '@/lib/gtmUtils';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { DecorationShapes } from '@/components/my-esims/DecorationShapes';
import { OperatorSimCard } from '@/components/my-esims/OperatorSimCard';
import { QuickActionsRow } from '@/components/my-esims/QuickActionsRow';
import { getLocalizedCountryName } from '@/lib/countryTranslations';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { t, formatPrice, currency: userCurrency, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [nextPollIn, setNextPollIn] = useState<number | null>(null);
  const [paymentIncomplete, setPaymentIncomplete] = useState(false);
  const hasTrackedPurchase = useRef(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [promoCode, setPromoCode] = useState<{ code: string; discount_type: string } | null>(null);
  const [isGuest, setIsGuest] = useState(isGuestAutoCreated());
  const [emailVerified, setEmailVerified] = useState(!isGuestAutoCreated());
  const [userId, setUserId] = useState<string>('');
  const [showSaveCardPrompt, setShowSaveCardPrompt] = useState(true);
  const [savingCard, setSavingCard] = useState(false);
  // Support both Stripe (session_id) and 2C2P (parent_order_id only) flows
  const sessionId = searchParams.get('session_id');
  const parentOrderId = searchParams.get('parent_order_id');
  const paymentMethod = searchParams.get('method'); // 'stripe' or '2c2p' or 'free'

  // Refresh session on page load to ensure user is authenticated
  useEffect(() => {
    const refreshSession = async () => {
      console.log('[PAYMENT-SUCCESS] Refreshing session on page load');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[PAYMENT-SUCCESS] Session error:', sessionError);
          return;
        }
        
        if (!session) {
          console.warn('[PAYMENT-SUCCESS] No session found, attempting refresh');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[PAYMENT-SUCCESS] Session refresh error:', refreshError);
          } else if (refreshedSession) {
            console.log('[PAYMENT-SUCCESS] Session refreshed successfully');
            if (refreshedSession.user?.email) {
              setUserEmail(refreshedSession.user.email);
              setUserId(refreshedSession.user.id);
            }
          }
        } else {
          console.log('[PAYMENT-SUCCESS] Session exists:', session.user.email);
          if (session.user?.email) {
            setUserEmail(session.user.email);
            setUserId(session.user.id);
          }
        }
      } catch (err) {
        console.error('[PAYMENT-SUCCESS] Error refreshing session:', err);
      }
    };
    
    refreshSession();
  }, []);

  useEffect(() => {
    if (parentOrderId) {
      console.log('[PAYMENT-SUCCESS] Processing payment', { 
        method: paymentMethod || 'stripe', 
        hasSessionId: !!sessionId,
        parentOrderId 
      });

      // If we have a session_id (Stripe Checkout flow), verify and finalize immediately
      if (sessionId && paymentMethod !== 'direct') {
        console.log('[PAYMENT-SUCCESS] Stripe Checkout flow detected, calling confirm-checkout-payment');
        supabase.functions.invoke('confirm-checkout-payment', {
          body: { sessionId, parentOrderId }
        }).then(({ data, error }) => {
          if (error) {
            console.error('[PAYMENT-SUCCESS] confirm-checkout-payment error:', error);
          } else {
            console.log('[PAYMENT-SUCCESS] confirm-checkout-payment result:', data);
          }
          // Proceed to poll/load orders regardless
          updateOrderStatus();
        });
      } else {
        updateOrderStatus();
      }
    } else {
      console.log('[PAYMENT-SUCCESS] Missing parent_order_id, redirecting to my-esims');
      navigate('/my-esims');
    }
  }, [parentOrderId]);

  const updateOrderStatus = async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Fetching orders for parent_order_id:`, parentOrderId);
    
    try {
      setError(null);
      
      const { data: ordersData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          esim_packages(name, country_name, country_code, data_amount, validity_days, package_type, carrier, kyc)
        `)
        .eq('parent_order_id', parentOrderId)
        .order('item_index');

      if (fetchError) {
        console.error(`[${timestamp}] Fetch error:`, fetchError);
        throw fetchError;
      }

      console.log(`[${timestamp}] Orders fetched:`, ordersData?.length || 0, 'orders');
      
      if (!ordersData || ordersData.length === 0) {
        console.warn(`[${timestamp}] No orders found, will retry...`);
        setError('Orders are being processed. This may take a moment...');
        setLoading(false);
        return;
      }

      const orderIds = ordersData.map(o => o.id);
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('order_id', orderIds);

      if (paymentsError) {
        console.error(`[${timestamp}] Payments fetch error:`, paymentsError);
      }

      setOrders(ordersData);
      setPayments(paymentsData || []);

      // Detect guest from order data (sessionStorage may be lost after 2C2P redirect)
      if (ordersData[0]?.guest_email) {
        setIsGuest(true);
        if (!userEmail) {
          setUserEmail(ordersData[0].guest_email);
        }
        if (!userId && ordersData[0].user_id) {
          setUserId(ordersData[0].user_id);
        }
        if (ordersData[0].email_verified) {
          setEmailVerified(true);
        } else {
          setEmailVerified(false);
        }
      }

      const allOrdersPending = ordersData.every(o => o.status === 'pending');
      const allPaymentsPending = paymentsData?.every(p => p.status === 'pending') ?? true;
      
      if (allOrdersPending && allPaymentsPending) {
        // Race condition: webhook may not have fired yet.
        // Direct card payments (3DS) need longer polling since webhook must fire after bank confirmation.
        const isDirect = paymentMethod === 'direct';
        const maxRetries = isDirect ? 8 : 10;
        const retryDelay = isDirect ? 2000 : 3000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          console.log(`[${new Date().toISOString()}] Payment still pending, polling attempt ${attempt}/${maxRetries}...`);
          setNextPollIn(Math.ceil((retryDelay / 1000)));
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          const { data: retryOrders } = await supabase
            .from('orders')
            .select('id, status')
            .eq('parent_order_id', parentOrderId);
          
          const { data: retryPayments } = await supabase
            .from('payments')
            .select('id, status')
            .in('order_id', (retryOrders || []).map(o => o.id));
          
          const stillAllPending = retryOrders?.every(o => o.status === 'pending') ?? true;
          const paymentsStillPending = retryPayments?.every(p => p.status === 'pending') ?? true;
          
          if (!stillAllPending || !paymentsStillPending) {
            console.log(`[${new Date().toISOString()}] Payment status updated on attempt ${attempt}, reloading full data...`);
            setNextPollIn(null);
            // Status changed — restart the full flow to pick up all data
            updateOrderStatus();
            return;
          }
        }
        
        // Exhausted all retries — genuinely incomplete
        console.log(`[${timestamp}] Payment incomplete after ${maxRetries} retries`);
        setPaymentIncomplete(true);
        setNextPollIn(null);
        setLoading(false);
        return;
      }
      
      setPaymentIncomplete(false);
      clearCart();

      if (ordersData && ordersData.length > 0 && !hasTrackedPurchase.current) {
        hasTrackedPurchase.current = true;
        trackPurchase({
          id: parentOrderId || '',
          revenue: ordersData.reduce((sum: number, o: any) => sum + o.total_amount, 0),
          currency: ordersData[0]?.currency || 'USD',
          items: ordersData.map((order: any) => ({
            id: order.package_id,
            name: order.esim_packages?.name || '',
            price: order.total_amount,
            quantity: 1,
          })),
        });
      }

      if (ordersData && ordersData.length > 0) {
        const sessionId = sessionStorage.getItem('analytics_session_id');
        ordersData.forEach(async (order) => {
          try {
            await supabase.functions.invoke('track-conversion', {
              body: { orderId: order.id },
              headers: sessionId ? { 'x-session-id': sessionId } : {}
            });
          } catch (err) {
            console.error('Failed to track conversion:', err);
          }
        });
        
        // Fetch promo code if applied
        if (ordersData[0]?.promo_code_id) {
          const { data: promoData } = await supabase
            .from('promo_codes')
            .select('code, discount_type')
            .eq('id', ordersData[0].promo_code_id)
            .maybeSingle();
          
          if (promoData) {
            setPromoCode(promoData);
          }
        }
      }

      const totalOrders = ordersData.length;
      const completedOrders = ordersData.filter(o => o.status === 'completed' && o.qr_code).length;
      const processingOrders = ordersData.filter(o => o.status === 'processing').length;
      
      console.log(`[${timestamp}] Status: ${completedOrders}/${totalOrders} completed, ${processingOrders} processing`);

      if (completedOrders === totalOrders) {
        toast({
          title: t('paymentSuccess.allEsimsReady'),
          description: t('paymentSuccess.esimActivated'),
        });
        setLoading(false);
      } else if (processingOrders > 0 || completedOrders < totalOrders) {
        toast({
          title: t('paymentSuccess.paymentConfirmed'),
          description: `${t('checkout.processing')} ${totalOrders} eSIM${totalOrders > 1 ? 's' : ''}...`,
        });
        setLoading(false);
        
        let pollCount = 0;
        const maxPolls = 60;
        const pollIntervals = [5, 5, 10, 10, 15];
        
        const scheduleNextPoll = () => {
          const intervalIndex = Math.min(pollCount, pollIntervals.length - 1);
          const interval = pollIntervals[intervalIndex] * 1000;
          
          let countdown = pollIntervals[intervalIndex];
          setNextPollIn(countdown);
          
          const countdownInterval = setInterval(() => {
            countdown--;
            setNextPollIn(countdown);
            if (countdown <= 0) {
              clearInterval(countdownInterval);
            }
          }, 1000);
          
          return setTimeout(async () => {
            clearInterval(countdownInterval);
            pollCount++;
            
            console.log(`[${new Date().toISOString()}] Poll ${pollCount}/${maxPolls}`);
            
            const { data: updatedOrders } = await supabase
              .from('orders')
              .select(`
                *,
                esim_packages(name, country_name, country_code, data_amount, validity_days, package_type, carrier, kyc)
              `)
              .eq('parent_order_id', parentOrderId)
              .order('item_index');

            const updatedCompleted = updatedOrders?.filter(o => o.status === 'completed' && o.qr_code).length || 0;
            const failedOrders = updatedOrders?.filter(o => o.status === 'failed' || o.status === 'needs_attention') || [];
            
            console.log(`[${new Date().toISOString()}] Poll result: ${updatedCompleted}/${totalOrders} completed, ${failedOrders.length} failed/needs_attention`);

            // Stop polling if any orders failed or need attention
            if (failedOrders.length > 0) {
              setOrders(updatedOrders || []);
              setNextPollIn(null);
              toast({
                title: t('paymentSuccess.processingIssue') || 'Processing Issue',
                description: t('paymentSuccess.contactSupport') || 'We\'re experiencing a temporary issue. Our team has been notified.',
                variant: 'destructive',
              });
              return;
            }

            if (updatedCompleted === totalOrders) {
              setOrders(updatedOrders || []);
              setNextPollIn(null);
              toast({
                title: t('paymentSuccess.allEsimsActivated'),
                description: t('paymentSuccess.esimsReady'),
              });
            } else if (pollCount >= maxPolls) {
              setOrders(updatedOrders || []);
              setNextPollIn(null);
              toast({
                title: t('paymentSuccess.stillProcessing'),
                description: t('paymentSuccess.checkEmailForUpdates'),
              });
            } else {
              setOrders(updatedOrders || []);
              scheduleNextPoll();
            }
          }, interval);
        };
        
        scheduleNextPoll();
      } else {
        setLoading(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${timestamp}] Error:`, errorMsg);
      
      setError(t('paymentSuccess.unableToLoad'));
      toast({
        title: t('paymentSuccess.loadingError'),
        description: t('paymentSuccess.loadingErrorDescription'),
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError(null);
    updateOrderStatus();
  };

  // Format price based on order's stored currency
  const formatOrderPrice = (amount: number, orderCurrency: string) => {
    if (orderCurrency === 'THB') {
      return `฿${Math.round(amount).toLocaleString()}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalOriginal = orders.reduce((sum, o) => sum + (o.original_amount || o.total_amount), 0);
    const totalDiscount = orders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
    const totalMobile11Money = orders.reduce((sum, o) => sum + (o.mobile11_money_applied || 0), 0);
    return { totalAmount, totalOriginal, totalDiscount, totalMobile11Money };
  };

  // Get payment method display based on actual payment data
  const getPaymentMethodDisplay = () => {
    const payment = payments[0];
    
    // Check actual payment method from database first
    if (payment?.payment_method === 'mobile11_money') {
      return 'Mobile11 Money';
    }
    if (payment?.payment_method === 'promptpay' || payment?.payment_gateway === '2c2p') {
      return 'PromptPay';
    }
    if (payment?.payment_method === 'card') {
      return t('paymentSuccess.cardPayment') || 'Card Payment';
    }
    
    // Fallback to URL parameter
    if (paymentMethod === 'free') return 'Mobile11 Money';
    if (paymentMethod === '2c2p') return 'PromptPay';
    return t('paymentSuccess.cardPayment') || 'Card Payment';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="container py-8 max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <div className="text-gray-700 text-lg font-medium">{t('paymentSuccess.processing')}</div>
            <div className="text-sm text-gray-500">{t('paymentSuccess.processingSubtitle')}</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="container py-8 max-w-3xl mx-auto px-4">
          <div className="space-y-6">
            {/* Email verification gate for guests - show even in error state */}
            {isGuest && !emailVerified && userEmail && userId && parentOrderId && (
              <PostPaymentEmailVerify
                email={userEmail}
                userId={userId}
                parentOrderId={parentOrderId}
                onVerified={() => setEmailVerified(true)}
                onEmailChanged={(newEmail) => setUserEmail(newEmail)}
              />
            )}

            <Alert className="bg-white border-gray-200">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-700">
                {error}
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t('paymentSuccess.paymentConfirmed')}</h2>
              <p className="text-sm text-gray-600 mb-6">
                {t('paymentSuccess.paymentConfirmedDescription')}
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={handleRetry} 
                  variant="outline" 
                  className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-12"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('paymentSuccess.refreshStatus')}
                </Button>
                <Button 
                  onClick={() => navigate('/my-esims')} 
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {t('paymentSuccess.viewOrders')}
                </Button>
              </div>
              
              {retryCount > 2 && (
                <details className="text-xs text-gray-500 mt-4">
                  <summary className="cursor-pointer hover:text-gray-700">{t('paymentSuccess.debugInfo')}</summary>
                  <div className="mt-2 space-y-1 font-mono bg-gray-50 p-2 rounded-lg">
                    <div>Session ID: {sessionId?.slice(0, 20)}...</div>
                    <div>Parent Order ID: {parentOrderId}</div>
                    <div>Retry Count: {retryCount}</div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment incomplete state
  if (paymentIncomplete && orders.length > 0) {
    const orderCurrency = orders[0]?.currency || 'USD';
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="container py-8 max-w-3xl mx-auto px-4">
          <div className="space-y-6">
            {/* Email verification gate for guests - show in incomplete state */}
            {isGuest && !emailVerified && userEmail && userId && parentOrderId && (
              <PostPaymentEmailVerify
                email={userEmail}
                userId={userId}
                parentOrderId={parentOrderId}
                onVerified={() => setEmailVerified(true)}
                onEmailChanged={(newEmail) => setUserEmail(newEmail)}
              />
            )}

            {/* Payment Incomplete Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-amber-100 rounded-full">
                  <AlertCircle className="h-12 w-12 text-amber-600" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-800">
                {t('paymentSuccess.paymentIncomplete') || 'Payment Incomplete'}
              </h1>
              <p className="text-gray-600">
                {t('paymentSuccess.paymentIncompleteSubtitle') || 'Your order is awaiting payment. Please complete your payment to activate your eSIM.'}
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">{t('paymentSuccess.orderSummary')}</h2>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">{t('paymentSuccess.parentOrderId')}</div>
                  <div className="font-mono text-xs text-gray-800">{parentOrderId}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('paymentSuccess.amountDue') || 'Amount Due'}</div>
                  <div className="font-semibold text-orange-500">{formatOrderPrice(orders.reduce((sum, o) => sum + o.total_amount, 0), orderCurrency)}</div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-500 mb-3">{t('paymentSuccess.esimPackages')} ({orders.length})</div>
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-sm text-gray-800">{order.esim_packages?.name}</div>
                          {order.esim_packages?.package_type && (
                            <PackageTypeBadge 
                              packageType={order.esim_packages.package_type as any}
                              size="sm"
                              showIcon={true}
                            />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.esim_packages?.country_name} • {order.esim_packages?.data_amount}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-amber-600">{t('orderDetail.status.pending') || 'Awaiting Payment'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate(`/order/${orders[0]?.id}`)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 font-semibold"
              >
                {t('paymentSuccess.viewOrderDetails') || 'View Order Details'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/my-esims')}
                className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-12"
              >
                {t('paymentSuccess.viewOrders')}
              </Button>
            </div>
          </div>
        </div>
        <FooterAiralo />
      </div>
    );
  }

  const orderCurrency = orders[0]?.currency || 'USD';
  const { totalAmount, totalOriginal, totalDiscount, totalMobile11Money } = calculateTotals();

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative">
      <Header />
      <DecorationShapes />
      
      <div className="container py-8 max-w-3xl mx-auto px-4 relative z-10 pb-32">
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-800">
              {t('paymentSuccess.thankYou')}
            </h1>
            
            {/* Polling status */}
            {nextPollIn !== null && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>{t('paymentSuccess.checkingStatus')} {nextPollIn}s...</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRetry}
                  className="h-6 px-2 text-xs text-gray-600 hover:text-gray-800"
                >
                  {t('paymentSuccess.checkNow')}
                </Button>
              </div>
            )}
          </div>

          {/* Order Confirmation Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            {/* Email confirmation */}
            {userEmail && emailVerified && (
              <div className="text-center pb-2">
                <p className="text-gray-500 text-sm">{t('paymentSuccess.confirmationSent')}</p>
                <p className="font-semibold text-gray-800 text-lg">{userEmail}</p>
              </div>
            )}
            
            <div className="border-t border-gray-100" />
            
            {/* Order ID row */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('paymentSuccess.orderId')}</span>
              <span className="font-medium text-gray-800 font-mono text-sm">{parentOrderId}</span>
            </div>
            
            {/* Payment method row */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('paymentSuccess.paymentMethod')}</span>
              <span className="font-medium text-gray-800">{getPaymentMethodDisplay()}</span>
            </div>
            
            {/* Mobile11 Money discount row */}
            {totalMobile11Money > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{t('paymentSuccess.discount')}</span>
                <span className="font-medium text-green-600">-{formatOrderPrice(totalMobile11Money, orderCurrency)}</span>
              </div>
            )}
            
            {/* Promo code row */}
            {promoCode && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{t('paymentSuccess.promoCode')}</span>
                <span className="font-medium text-green-600">{promoCode.code}</span>
              </div>
            )}
            
            <div className="border-t border-gray-100" />
            
            {/* Total row */}
            <div className="flex justify-between items-center">
              <span className="text-gray-800 font-semibold">{t('paymentSuccess.total')}</span>
              <span className="font-bold text-orange-500 text-xl">{formatOrderPrice(totalAmount, orderCurrency)}</span>
            </div>
            
            {/* Earned rewards banner */}
            {totalAmount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-700 text-sm">{t('paymentSuccess.earnedRewards')}</p>
                  <p className="font-bold text-amber-700">
                    {formatOrderPrice(totalAmount * 0.05, orderCurrency)} Mobile11 Money
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Card Prompt - show after successful card payment for non-guests */}
          {!isGuest && showSaveCardPrompt && getPaymentMethodDisplay() === (t('paymentSuccess.cardPayment') || 'Card Payment') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{t('paymentSuccess.saveCardTitle') || 'Save your card?'}</h3>
                  <p className="text-sm text-gray-500">{t('paymentSuccess.saveCardDescription') || 'Save this card for faster checkout next time'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    setSavingCard(true);
                    try {
                      const { data: sessionData } = await supabase.auth.getSession();
                      const { data, error } = await supabase.functions.invoke('create-setup-session', {
                        headers: {
                          Authorization: `Bearer ${sessionData.session?.access_token}`,
                        },
                        body: { language },
                      });
                      if (error) throw error;
                      if (data?.url) {
                        window.location.href = data.url;
                      }
                    } catch (err) {
                      console.error('Error creating setup session:', err);
                      toast({
                        title: 'Error',
                        description: 'Could not start card save process.',
                        variant: 'destructive',
                      });
                    } finally {
                      setSavingCard(false);
                    }
                  }}
                  disabled={savingCard}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 font-semibold"
                >
                  {savingCard ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('cart.redirecting') || 'Redirecting...'}
                    </>
                  ) : (
                    t('paymentSuccess.saveCard') || 'Save Card'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveCardPrompt(false)}
                  className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-11"
                >
                  {t('paymentSuccess.noThanks') || 'No thanks'}
                </Button>
              </div>
            </div>
          )}

          {/* Guest password setup prompt */}
          {isGuest && emailVerified && (
            <SetPasswordPrompt />
          )}

          {/* Email verification gate for guests */}
          {isGuest && !emailVerified && userEmail && userId && parentOrderId && (
            <PostPaymentEmailVerify
              email={userEmail}
              userId={userId}
              parentOrderId={parentOrderId}
              onVerified={() => setEmailVerified(true)}
              onEmailChanged={(newEmail) => setUserEmail(newEmail)}
            />
          )}

          {emailVerified && <>
          {/* What Next Section - Mint Green */}
          <div className="bg-[#E8F5E9] rounded-2xl overflow-hidden p-4">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-5 h-5 text-gray-700" />
              <h3 className="font-bold text-gray-800">
                {t('paymentSuccess.whatNext')}
              </h3>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-3">
              {/* When to install - separate white card */}
              <AccordionItem value="when-install" className="bg-white rounded-xl border-0 overflow-hidden">
                <AccordionTrigger className="px-4 py-4 font-semibold text-gray-800 hover:no-underline">
                  {t('paymentSuccess.whenToInstall')}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-gray-600 space-y-3">
                  <p>{t('paymentSuccess.whenToInstallPara1')}</p>
                  <p>{t('paymentSuccess.whenToInstallPara2')}</p>
                </AccordionContent>
              </AccordionItem>
              
              {/* Avoid roaming - separate white card */}
              <AccordionItem value="avoid-roaming" className="bg-white rounded-xl border-0 overflow-hidden">
                <AccordionTrigger className="px-4 py-4 font-semibold text-gray-800 hover:no-underline">
                  {t('paymentSuccess.avoidRoaming')}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-gray-600 space-y-3">
                  <p>{t('paymentSuccess.avoidRoamingIntro')}</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>{t('paymentSuccess.avoidRoamingStep1')}</li>
                    <li>{t('paymentSuccess.avoidRoamingStep2')}</li>
                    <li>{t('paymentSuccess.avoidRoamingStep3')}</li>
                    <li>{t('paymentSuccess.avoidRoamingStep4')}</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Package Details Cards */}
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Country header with flag */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <FlagIcon 
                  countryCode={order.esim_packages?.country_code} 
                  countryName={order.esim_packages?.country_name}
                  size="lg" 
                />
                <span className="font-bold text-gray-800 text-lg">
                  {getLocalizedCountryName(order.esim_packages?.country_name || '', language)}
                </span>
                {order.esim_packages?.package_type && (
                  <PackageTypeBadge 
                    packageType={order.esim_packages.package_type as any}
                    size="sm"
                    showIcon={true}
                  />
                )}
              </div>
              
              {/* Package details */}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{order.esim_packages?.name}</h3>
                    <span className="text-gray-500 text-sm">{t('paymentSuccess.packageLabel')}</span>
                    
                    {/* Package info pills */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <div className="border border-gray-200 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-500 block">{t('paymentSuccess.coverageLabel')}</span>
                        <p className="font-medium text-gray-800 text-sm">{getLocalizedCountryName(order.esim_packages?.country_name || '', language)}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-500 block">{t('paymentSuccess.dataLabel')}</span>
                        <p className="font-medium text-gray-800 text-sm">{order.esim_packages?.data_amount}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-500 block">{t('paymentSuccess.validityLabel')}</span>
                        <p className="font-medium text-gray-800 text-sm">{order.esim_packages?.validity_days} {t('paymentSuccess.daysUnit')}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* eSIM card visual - using OperatorSimCard component */}
                  <div className="w-28 shrink-0 ml-4">
                    <OperatorSimCard 
                      carrier={order.esim_packages?.carrier || 'mobile11'}
                      countryName={order.esim_packages?.country_name || ''}
                      packageType={order.esim_packages?.package_type || 'day_pass'}
                      networkType="4G"
                    />
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t('paymentSuccess.statusLabel')}</span>
                  <div className="flex items-center gap-2">
                    {order.status === 'completed' && order.qr_code && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium text-sm">{t('paymentSuccess.ready')}</span>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <>
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-blue-600 font-medium text-sm">{t('checkout.processing')}...</span>
                      </>
                    )}
                    {order.status === 'failed' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 font-medium text-sm">{t('paymentSuccess.failed')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* KYC Verification Notice - Show if any order requires KYC */}
          {orders.some(order => order.esim_packages?.kyc) && (() => {
            const kycOrder = orders.find(o => o.esim_packages?.kyc);
            const carrier = kycOrder?.esim_packages?.carrier || '';
            const isCmlink = carrier.toUpperCase().includes('CMHK') || carrier.toUpperCase().includes('CTM') || carrier.toUpperCase().includes('CMCC');
            const kycUrl = isCmlink ? 'https://global.cmlink.com/en/real-name' : 'https://kyc.cloud.ais.th';
            const kycTitle = isCmlink ? t('paymentSuccess.cmlinkRequired') : t('paymentSuccess.kycRequired');
            const kycDesc = isCmlink ? t('paymentSuccess.cmlinkDescription') : t('paymentSuccess.kycDescription');
            const kycButton = isCmlink ? t('paymentSuccess.cmlinkButtonText') : t('paymentSuccess.kycButtonText');
            
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-800 text-lg mb-2">
                      {kycTitle}
                    </h3>
                    <p className="text-orange-700 text-sm mb-4">
                      {kycDesc}
                    </p>
                    <a
                      href={kycUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      {kycButton}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Actions - Never run out of data (hide for DOCOMO/TUGE eSIMs) */}
          {orders.length > 0 && orders[0].status === 'completed' && orders[0].esim_packages?.carrier !== 'DOCOMO' && (
            <QuickActionsRow 
              order={{
                id: orders[0].id,
                total_amount: orders[0].total_amount,
                original_amount: orders[0].original_amount,
                discount_amount: orders[0].discount_amount,
                currency: orders[0].currency,
                promo_code_id: orders[0].promo_code_id,
                auto_renewal_enabled: orders[0].auto_renewal_enabled,
                renewal_payment_method_id: orders[0].renewal_payment_method_id,
                esim_packages: orders[0].esim_packages
              }}
              isInstalled={false}
            />
          )}

          {/* Refresh button if still processing */}
          {orders.some(o => o.status === 'processing') && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-12"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('paymentSuccess.refreshStatus')}
            </Button>
          )}
          </>}
        </div>
      </div>
      
      {/* Sticky Action Bar - only show when email is verified */}
      {emailVerified && (
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-4 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <p className="text-gray-600 text-sm hidden md:block">
            {t('paymentSuccess.installFromDetails')}
          </p>
          <Button
            onClick={() => navigate(`/my-esims/${orders[0]?.id}?install=true`)}
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-full h-12"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('paymentSuccess.installOrShare')}
          </Button>
        </div>
      </div>
      )}
      
      <FooterAiralo />
    </div>
  );
}
