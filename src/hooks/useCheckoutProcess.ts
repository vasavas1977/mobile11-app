import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart, CartItem, PromoState } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { getAffiliateIdForCheckout, getAffiliateSessionId } from '@/hooks/useAffiliateTracking';
import { convertUsdToThb } from '@/lib/currencyUtils';
import { safeRedirectToPayment } from '@/lib/paymentRedirect';
import { isGuestAutoCreated } from '@/utils/guestCheckout';
import { getStripe } from '@/lib/stripe';

interface UseCheckoutProcessProps {
  checkoutItems: CartItem[];
  checkoutPromo: PromoState | null;
  selectedPaymentMethod: 'saved_card' | 'new_card' | 'qr_code' | 'truemoney';
  selectedCardId: string | null;
  mobile11MoneyApplied: number;
  isLineUser?: boolean;
  notificationEmail?: string;
  isExtension?: boolean;
  originalOrderId?: string;
}

export function useCheckoutProcess({
  checkoutItems,
  checkoutPromo,
  selectedPaymentMethod,
  selectedCardId,
  mobile11MoneyApplied,
  isLineUser = false,
  notificationEmail = '',
  isExtension = false,
  originalOrderId,
}: UseCheckoutProcessProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { t, formatPrice, currency, language } = useLanguage();
  const { user } = useAuth();
  
  const [creating, setCreating] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  
  const createOrderInFlightRef = useRef(false);
  const environment = 'production';

  // Calculate totals
  const checkoutTotal = checkoutItems.reduce(
    (sum, item) => sum + (item.price * (item.quantity || 1)), 
    0
  );
  const promoDiscount = checkoutPromo?.discount || 0;
  const finalTotal = Math.max(0, checkoutTotal - promoDiscount - mobile11MoneyApplied);

  const processCheckout = useCallback(async () => {
    if (!user || createOrderInFlightRef.current || checkoutItems.length === 0) return;
    
    createOrderInFlightRef.current = true;
    setCreating(true);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Please sign in again to continue');
      }

      // Handle extension mode - call extend-order edge function
      if (isExtension && originalOrderId && checkoutItems.length === 1) {
        console.log('[CHECKOUT] Extension mode - calling extend-order');
        
        const { data: extendData, error: extendError } = await supabase.functions.invoke('extend-order', {
          body: {
            orderId: originalOrderId,
            newPackageId: checkoutItems[0].packageId,
            promoCode: checkoutPromo?.code || null,
            promoCodeId: checkoutPromo?.promoCodeId || null,
            discount: checkoutPromo?.discount || 0,
            currency: currency,
            mobile11MoneyApplied: mobile11MoneyApplied,
            language,
          }
        });

        if (extendError) throw extendError;
        
        if (!extendData?.success) {
          if (extendData?.error === 'extension_not_supported') {
            toast({
              title: t('checkout.extensionNotSupported') || 'Extension Not Available',
              description: t('checkout.extensionNotSupportedDesc') || 
                'This package cannot extend your existing eSIM. You will need to purchase and install a new eSIM.',
              variant: "destructive"
            });
            setCreating(false);
            createOrderInFlightRef.current = false;
            return;
          }
          if (extendData?.error === 'data_amount_mismatch') {
            toast({
              title: t('checkout.dataAmountMismatch') || 'Invalid Extension Package',
              description: extendData?.message || 
                'For this plan type, only the number of days can be extended.',
              variant: "destructive"
            });
            setCreating(false);
            createOrderInFlightRef.current = false;
            return;
          }
          throw new Error(extendData?.error || 'Failed to create extension order');
        }

        // Free extension (fully covered by promo + Mobile11 Money)
        if (extendData?.requiresPayment === false) {
          toast({
            title: t('checkout.freeOrderComplete'),
            description: t('checkout.freeOrderDescription'),
          });
          clearCart();
          navigate(`/payment-success?parent_order_id=${extendData.extensionOrderId}&method=free`, { replace: true });
          return;
        }

        if (extendData?.checkoutUrl) {
          clearCart();
          setRedirecting(true);
          const result = safeRedirectToPayment(extendData.checkoutUrl);
          if (result.fallbackNeeded) {
            setPaymentUrl(result.url);
          }
          return;
        }
        
        throw new Error('No payment URL received');
      }

      const affiliateId = getAffiliateIdForCheckout();
      const affiliateSessionId = getAffiliateSessionId();
      const parentOrderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const orderIds: string[] = [];
      const orderRecords: any[] = [];
      
      let remainingDiscount = promoDiscount;
      let remainingMobile11Money = mobile11MoneyApplied;
      
      let itemIndex = 1;
      for (const item of checkoutItems) {
        const { data: existingPkg, error: pkgCheckError } = await supabase
          .from('esim_packages')
          .select('id, currency')
          .eq('id', item.packageId)
          .maybeSingle();
        if (pkgCheckError) throw pkgCheckError;
        if (!existingPkg) {
          throw new Error(`Package ${item.name} is no longer available.`);
        }

        for (let i = 0; i < (item.quantity || 1); i++) {
          const childOrderNumber = `${parentOrderNumber}-${itemIndex}`;
          
          let itemDiscount = 0;
          if (remainingDiscount > 0) {
            itemDiscount = Math.min(remainingDiscount, item.price);
            remainingDiscount -= itemDiscount;
          }
          
          let itemMobile11Money = 0;
          if (remainingMobile11Money > 0) {
            const priceAfterPromo = item.price - itemDiscount;
            itemMobile11Money = Math.min(remainingMobile11Money, priceAfterPromo);
            remainingMobile11Money -= itemMobile11Money;
          }
          
          const itemFinalPrice = item.price - itemDiscount - itemMobile11Money;
          const storedItemFinalPrice = currency === 'THB' ? convertUsdToThb(itemFinalPrice) : itemFinalPrice;
          const storedItemOriginalPrice = currency === 'THB' ? convertUsdToThb(item.price) : item.price;
          const storedItemDiscount = currency === 'THB' ? convertUsdToThb(itemDiscount) : itemDiscount;
          const storedMobile11Money = currency === 'THB' ? convertUsdToThb(itemMobile11Money) : itemMobile11Money;
          
          // Build webhook_data with referral info if applicable
          const webhookData: Record<string, any> = {};
          if (checkoutPromo?.isReferral && checkoutPromo.referrerUserId) {
            webhookData.is_referral_order = true;
            webhookData.referrer_user_id = checkoutPromo.referrerUserId;
            webhookData.referral_code_used = checkoutPromo.referralCode;
          }

          // Add designated-date activation info if present
          if (item.activation_date && item.initialize_policy === 'designated_date') {
            webhookData.designated_activate = true;
            webhookData.activation_date = item.activation_date;
            // Calculate end date
            const startDate = new Date(item.activation_date);
            const validityDays = parseInt(item.validity?.replace(/\D/g, '') || '28', 10);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + validityDays);
            webhookData.activation_end_date = endDate.toISOString().split('T')[0];
          }

          // Add device info (IMEI2/EID2) if present
          if (item.device_imei2) {
            webhookData.device_imei2 = item.device_imei2;
          }
          if (item.device_eid2) {
            webhookData.device_eid2 = item.device_eid2;
          }

          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: session.user.id,
              package_id: item.packageId,
              order_id: childOrderNumber,
              parent_order_id: parentOrderNumber,
              item_index: itemIndex,
              status: 'pending',
              total_amount: storedItemFinalPrice,
              original_amount: checkoutPromo?.applied || mobile11MoneyApplied > 0 ? storedItemOriginalPrice : null,
              discount_amount: storedItemDiscount,
              mobile11_money_applied: storedMobile11Money,
              promo_code_id: checkoutPromo?.promoCodeId || null,
              currency: currency,
              language: language,
              environment: environment,
              affiliate_id: affiliateId,
              affiliate_session_id: affiliateSessionId,
              notification_email: isLineUser && notificationEmail ? notificationEmail : null,
              service_tier: item.service_tier || 'priority',
              webhook_data: Object.keys(webhookData).length > 0 ? webhookData : null,
              email_verified: !isGuestAutoCreated(),
            } as any)
            .select()
            .single();

          if (orderError) throw orderError;
          orderIds.push(order.id);
          orderRecords.push(order);
          itemIndex++;
        }
      }

      // Create payment records
      for (const order of orderRecords) {
        const isFree = order.total_amount === 0;
        await supabase.from('payments').insert({
          order_id: order.id,
          amount: order.total_amount,
          currency: order.currency,
          status: isFree ? 'completed' : 'pending',
          payment_method: isFree ? (mobile11MoneyApplied > 0 ? 'mobile11_money' : 'promo_code') : 'card'
        });
      }

      const totalAmount = orderRecords.reduce((sum: number, o: any) => sum + o.total_amount, 0);
      const totalMobile11MoneyApplied = orderRecords.reduce((sum: number, o: any) => sum + (o.mobile11_money_applied || 0), 0);

      // Handle free orders
      if (totalAmount === 0 && (checkoutPromo?.applied || mobile11MoneyApplied > 0)) {
        await supabase.from('orders').update({ status: 'processing' }).in('id', orderIds);
        await supabase.from('payments').update({ status: 'completed' }).in('order_id', orderIds);
        
        if (checkoutPromo?.promoCodeId) {
          await supabase.from('promo_code_usage').insert({
            promo_code_id: checkoutPromo.promoCodeId,
            order_id: orderRecords[0].id,
            user_id: session.user.id,
            discount_applied: checkoutPromo.discount
          });
          await supabase.rpc('increment_promo_code_usage', { promo_id: checkoutPromo.promoCodeId });
        }

        if (totalMobile11MoneyApplied > 0) {
          const USD_TO_THB_RATE = 35;
          const amountThb = currency === 'USD' 
            ? totalMobile11MoneyApplied * USD_TO_THB_RATE 
            : totalMobile11MoneyApplied;
          
          try {
            await supabase.functions.invoke('deduct-mobile11-money', {
              body: { 
                user_id: session.user.id,
                order_id: orderRecords[0].id,
                amount_thb: amountThb
              }
            });
          } catch (e) {
            console.error('Failed to deduct Mobile11 Money:', e);
          }
        }

        await supabase.functions.invoke('process-free-orders', {
          body: { orderIds: orderRecords.map(o => o.id), environment }
        });

        // Process referral reward if applicable
        if (checkoutPromo?.isReferral && checkoutPromo.referrerUserId) {
          try {
            await supabase.functions.invoke('process-referral-reward', {
              body: { order_id: orderRecords[0].id }
            });
            console.log('[CHECKOUT] Referral reward processed for free order');
          } catch (e) {
            console.error('[CHECKOUT] Failed to process referral reward:', e);
          }
        }

        toast({
          title: t('checkout.freeOrderComplete'),
          description: t('checkout.freeOrderDescription'),
        });
        clearCart();
        navigate(`/payment-success?parent_order_id=${parentOrderNumber}&method=free`, { replace: true });
        return;
      }

      const orderCurrency = orderRecords[0]?.currency || currency;
      
      // QR Code payment via 2C2P (on-site branded flow with fallback)
      if (selectedPaymentMethod === 'qr_code') {
        const thbAmount = orderCurrency === 'THB' ? totalAmount : convertUsdToThb(totalAmount);
        
        // Try direct QR flow first (on-site branded experience)
        try {
          const { data: qrDirectData, error: qrDirectError } = await supabase.functions.invoke('create-2c2p-qr-direct', {
            body: { 
              orderIds,
              parentOrderId: parentOrderNumber,
              items: orderRecords.map(o => ({ packageId: o.package_id, orderId: o.id })),
              totalAmountTHB: Math.round(thbAmount),
              environment
            }
          });

          if (!qrDirectError && qrDirectData && !qrDirectData.fallback && qrDirectData.qrImageUrl) {
            // Success: navigate to branded QR payment page
            clearCart();
            navigate('/qr-payment', { 
              state: { 
                qrImageUrl: qrDirectData.qrImageUrl,
                paymentToken: qrDirectData.paymentToken,
                parentOrderId: parentOrderNumber,
                totalAmount: Math.round(thbAmount),
                expiryTimer: qrDirectData.expiryTimer || 900,
              },
              replace: true 
            });
            return;
          }
          
          // Log fallback reason
          console.log('[CHECKOUT] QR direct fallback:', qrDirectData?.error || qrDirectError?.message || 'Unknown');
        } catch (e) {
          console.log('[CHECKOUT] QR direct failed, falling back to redirect:', e);
        }

        // Fallback: use existing 2C2P redirect flow
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-2c2p-promptpay', {
          body: { 
            orderIds,
            parentOrderId: parentOrderNumber,
            items: orderRecords.map(o => ({ packageId: o.package_id, orderId: o.id })),
            totalAmountTHB: Math.round(thbAmount),
            environment
          }
        });

        if (paymentError) throw paymentError;
        if (!paymentData?.webPaymentUrl) throw new Error('Payment URL not received');
        
        clearCart();
        setRedirecting(true);
        const result = safeRedirectToPayment(paymentData.webPaymentUrl);
        if (result.fallbackNeeded) {
          setPaymentUrl(result.url);
        }
        return;
      }

      // TrueMoney Wallet payment via 2C2P
      if (selectedPaymentMethod === 'truemoney') {
        const thbAmount = orderCurrency === 'THB' ? totalAmount : convertUsdToThb(totalAmount);
        
        console.log('[CHECKOUT] Creating 2C2P TrueMoney payment', { thbAmount, orderCount: orderIds.length });
        
        const { data: tmData, error: tmError } = await supabase.functions.invoke('create-2c2p-truemoney', {
          body: { 
            orderIds,
            parentOrderId: parentOrderNumber,
            items: orderRecords.map(o => ({ packageId: o.package_id, orderId: o.id })),
            totalAmountTHB: Math.round(thbAmount),
            environment
          }
        });

        if (tmError) throw tmError;
        if (tmData?.error) throw new Error(tmData.error);
        if (!tmData?.redirectUrl) throw new Error('TrueMoney redirect URL not received');
        
        clearCart();
        setRedirecting(true);
        const result = safeRedirectToPayment(tmData.redirectUrl);
        if (result.fallbackNeeded) {
          setPaymentUrl(result.url);
        }
        return;
      }

      // Card payment via Stripe
      const { data: paymentData, error: stripeError } = await supabase.functions.invoke('create-payment', {
        body: { 
          orderIds,
          parentOrderId: parentOrderNumber,
          items: orderRecords.map(o => ({ packageId: o.package_id, orderId: o.id })),
          environment,
          savedCardId: selectedPaymentMethod === 'saved_card' ? selectedCardId : undefined,
          language,
        }
      });

      if (stripeError) throw stripeError;
      
      // Check if the edge function returned an error in the response body
      if (paymentData?.error) {
        throw new Error(paymentData.error);
      }

      // Direct payment with saved card - skip Stripe Checkout redirect
      if (paymentData?.directPayment) {
        console.log('[CHECKOUT] Direct payment succeeded, redirecting to success');
        clearCart();
        navigate(`/payment-success?parent_order_id=${paymentData.parentOrderId}&method=direct`, { replace: true });
        return;
      }

      // 3DS required for saved card - handle in-browser
      if (paymentData?.requires3DS && paymentData?.clientSecret) {
        console.log('[CHECKOUT] 3DS required, launching bank verification');
        const stripe = await getStripe();
        if (!stripe) throw new Error('Failed to load payment processor');
        
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(paymentData.clientSecret);
        
        if (confirmError) {
          console.error('[CHECKOUT] 3DS verification failed:', confirmError.message);
          throw new Error(confirmError.message || 'Bank verification failed');
        }
        
        if (paymentIntent?.status === 'succeeded') {
          console.log('[CHECKOUT] 3DS succeeded, calling confirm-3ds-payment to finalize');
          
          // Call backend to run post-payment pipeline immediately
          try {
            const { data: confirmData, error: confirmErr } = await supabase.functions.invoke('confirm-3ds-payment', {
              body: { 
                paymentIntentId: paymentIntent.id, 
                parentOrderId: paymentData.parentOrderId 
              }
            });
            
            if (confirmErr) {
              console.error('[CHECKOUT] confirm-3ds-payment error:', confirmErr);
              // Don't throw — still navigate to success page, polling will handle it
            } else {
              console.log('[CHECKOUT] confirm-3ds-payment result:', confirmData);
            }
          } catch (e) {
            console.error('[CHECKOUT] confirm-3ds-payment exception:', e);
            // Don't throw — still navigate to success page
          }
          
          clearCart();
          navigate(`/payment-success?parent_order_id=${paymentData.parentOrderId}&method=direct`, { replace: true });
          return;
        }
        
        throw new Error('Payment verification incomplete. Please try again.');
      }
      
      if (!paymentData?.url) throw new Error('Payment URL not received');
      
      clearCart();
      setRedirecting(true);
      const result = safeRedirectToPayment(paymentData.url);
      if (result.fallbackNeeded) {
        setPaymentUrl(result.url);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: t('checkout.error'),
        description: error.message || 'Failed to process checkout',
        variant: "destructive"
      });
    } finally {
      setCreating(false);
      createOrderInFlightRef.current = false;
    }
  }, [user, checkoutItems, checkoutPromo, currency, language, isLineUser, notificationEmail, clearCart, navigate, toast, t, isExtension, originalOrderId, selectedPaymentMethod, selectedCardId, mobile11MoneyApplied, promoDiscount]);

  return {
    processCheckout,
    creating,
    redirecting,
    paymentUrl,
    checkoutTotal,
    promoDiscount,
    finalTotal,
  };
}
