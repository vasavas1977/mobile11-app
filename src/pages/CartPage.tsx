import { useState, useEffect, useRef } from 'react';
import { GuestEmailCapture } from '@/components/checkout/GuestEmailCapture';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCart, CartItem } from '@/contexts/CartContext';
import { ActivationDatePicker } from '@/components/cart/ActivationDatePicker';
import { DeviceInfoForm } from '@/components/cart/DeviceInfoForm';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useCheckoutProcess } from '@/hooks/useCheckoutProcess';
import { countryToSlug, regionalToSlug } from '@/lib/countryDestinations';

import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Loader2, Link, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { parseCartUrl, generateCartUrl, debouncedCartUrlUpdate, copyCartUrlToClipboard } from '@/lib/cartUrlUtils';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CartPaymentSection, PaymentMethod } from '@/components/cart/CartPaymentSection';
import { StickyCheckoutBar } from '@/components/cart/StickyCheckoutBar';
import { trackBeginCheckout } from '@/lib/gtmUtils';

export function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const previousPath = (location.state as { from?: string })?.from || '/packages';
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    totalPrice, 
    promo, 
    setPromoCode, 
    validatePromoCode, 
    removePromoCode,
    discountedTotal,
    addToCart,
    clearCart,
    lastAddedItem,
    updateCartItemActivationDate,
    updateCartItemDeviceInfo,
  } = useCart();
  
  // Helper to get continue shopping URL based on last added item
  const getContinueShoppingUrl = (): string => {
    if (lastAddedItem?.country) {
      const country = lastAddedItem.country;
      
      // Check if it's a regional package (multi-country)
      const isRegional = country.toLowerCase().includes('global') ||
                         country.toLowerCase().includes('europe') ||
                         country.toLowerCase().includes('asia') ||
                         country.includes('/');
      
      if (isRegional) {
        return `/esim/${regionalToSlug(country)}`;
      }
      
      // Single countries go to the country landing page
      const slug = countryToSlug(country);
      return `/esim/${slug}`;
    }
    
    return previousPath;
  };
  const { user, loading: authLoading } = useAuth();
  const { t, formatPrice, language, currency, setLanguage, setCurrency } = useLanguage();
  const [enrichedItems, setEnrichedItems] = useState<CartItem[]>([]);
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const urlProcessedRef = useRef(false);
  const hasTrackedCheckout = useRef(false);
  
  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('new_card');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // Mobile11 Money state
  const [mobile11MoneyApplied, setMobile11MoneyApplied] = useState<number>(0);
  
  // Extension mode state (for top-up/extend flows from My eSIMs)
  const isExtension = (location.state as any)?.isExtension === true;
  const originalOrderId = (location.state as any)?.originalOrderId;
  const originalOrder = (location.state as any)?.originalOrder;
  const stateCartItems = (location.state as any)?.cartItems;
  
  // Persist extension state in refs so they survive history.replaceState wiping location.state
  const stateCartItemsRef = useRef(stateCartItems);
  const isExtensionRef = useRef(isExtension);
  
  // Use ref-persisted items (for extension) or cart context
  const checkoutItems = stateCartItemsRef.current?.length > 0 ? stateCartItemsRef.current : items;
  
  // Compute effective totals that work in both normal and extension mode
  const checkoutSubtotal = checkoutItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity, 0
  );
  const effectiveDiscountedTotal = promo.applied 
    ? promo.finalPrice 
    : checkoutSubtotal;
  
  // LINE user state
  const [isLineUser, setIsLineUser] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');

  // Track pending promo from URL that needs validation after items load
  const [pendingUrlPromo, setPendingUrlPromo] = useState<string | null>(null);
  
  // Track if promo should be included in URL (only after explicit share or from URL)
  const promoUrlEnabledRef = useRef(false);
  
  // Debounce promo code for auto-validation
  const debouncedPromoCode = useDebounce(promo.code, 600);
  
  // Ref to track if promo was just manually removed
  const promoRemovedRef = useRef(false);
  
  // Guest checkout email capture
  const [showGuestCapture, setShowGuestCapture] = useState(false);
  const guestCaptureRef = useRef<HTMLDivElement>(null);

  // Hide guest email capture once user is authenticated
  useEffect(() => {
    if (showGuestCapture && user) {
      setShowGuestCapture(false);
    }
  }, [user, showGuestCapture]);
  
  // Handler to remove promo and prevent auto-revalidation
  const handleRemovePromo = () => {
    promoRemovedRef.current = true;
    removePromoCode();
    setTimeout(() => {
      promoRemovedRef.current = false;
    }, 700);
  };
  
  // Auto-validate promo code when debounced value changes
  useEffect(() => {
    if (
      debouncedPromoCode.trim().length >= 3 &&
      !promo.applied &&
      !promo.validating &&
      !promo.error &&  // Don't re-validate if there's already an error for this code
      checkoutItems.length > 0 &&
      !promoRemovedRef.current
    ) {
      validatePromoCode(debouncedPromoCode, checkoutItems);
    }
  }, [debouncedPromoCode, promo.applied, promo.validating, promo.error, checkoutItems.length, validatePromoCode]);

  // Checkout processing hook
  const checkoutPromo = promo.applied ? promo : null;
  const { processCheckout, creating, redirecting, checkoutTotal, finalTotal: effectiveTotal } = useCheckoutProcess({
    checkoutItems: enrichedItems.length > 0 ? enrichedItems : checkoutItems,
    checkoutPromo,
    selectedPaymentMethod: selectedPaymentMethod as 'saved_card' | 'new_card' | 'qr_code' | 'truemoney',
    selectedCardId,
    mobile11MoneyApplied,
    isLineUser,
    notificationEmail,
    isExtension,
    originalOrderId,
  });

  // Detect LINE user
  useEffect(() => {
    const checkLineUser = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('line_user_id, email')
        .eq('user_id', user.id)
        .single();
      const isLine = !!(profile?.line_user_id || profile?.email?.startsWith('line_'));
      setIsLineUser(isLine);
    };
    checkLineUser();
  }, [user]);

  // Track begin_checkout event
  useEffect(() => {
    if (checkoutItems.length > 0 && user && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true;
      const items = checkoutItems.map((i: CartItem) => ({ 
        id: i.packageId, 
        name: i.name, 
        price: i.price, 
        quantity: i.quantity 
      }));
      const total = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + (i.price * i.quantity), 0);
      trackBeginCheckout(items, total, 'USD');
    }
  }, [checkoutItems, user]);


  // Parse URL and restore cart from URL params on mount
  useEffect(() => {
    if (urlProcessedRef.current) return;
    urlProcessedRef.current = true;
    
    const urlState = parseCartUrl(searchParams);
    
    if (urlState.items.length > 0) {
      setIsLoadingFromUrl(true);
      
      const loadUrlItems = async () => {
        const packageIds = urlState.items.map(i => i.packageId);
        
        const { data: packages } = await supabase
          .from('esim_packages')
          .select('*')
          .in('id', packageIds);
        
        if (packages && packages.length > 0) {
          clearCart();
          
          const itemsToAdd: Array<{ item: Omit<CartItem, 'quantity'>; quantity: number }> = [];
          
          for (const urlItem of urlState.items) {
            const pkg = packages.find(p => p.id === urlItem.packageId);
            if (pkg) {
              const isEconomy = urlState.tier === 'economy';
              const itemPrice = isEconomy 
                ? Math.round(pkg.price * 0.7 * 100) / 100 
                : pkg.price;
              itemsToAdd.push({
                item: {
                  packageId: pkg.id,
                  name: pkg.name,
                  price: itemPrice,
                  country: pkg.country_name,
                  service_tier: isEconomy ? 'economy' : 'priority',
                  validity: `${pkg.validity_days} days`,
                  data_amount: pkg.data_amount,
                  description: pkg.description || '',
                  package_type: pkg.package_type || undefined,
                  carrier: pkg.carrier || undefined,
                  network_type: pkg.network_type || undefined,
                  sim_type: pkg.sim_type || 'eSIM',
                  qos_speed: pkg.qos_speed || undefined,
                  speed_after_limit: pkg.speed_after_limit || undefined,
                  daily_reset_amount: pkg.daily_reset_amount || undefined,
                  hot_spot: pkg.hot_spot || false,
                  support_sms: pkg.support_sms || false,
                  support_voice: pkg.support_voice || false,
                  support_data: pkg.support_data ?? true,
                },
                quantity: urlItem.quantity
              });
            }
          }
          
          for (const { item } of itemsToAdd) {
            addToCart(item);
          }
          
          setTimeout(() => {
            for (const { item, quantity } of itemsToAdd) {
              if (quantity > 1) {
                updateQuantity(item.packageId, quantity);
              }
            }
            
            if (urlState.language) {
              setLanguage(urlState.language);
            }
            if (urlState.currency) {
              setCurrency(urlState.currency);
            }
            
            if (urlState.promo) {
              promoUrlEnabledRef.current = true;
              setPendingUrlPromo(urlState.promo);
            }
            
            setIsLoadingFromUrl(false);
          }, 100);
        } else {
          setIsLoadingFromUrl(false);
        }
      };
      
      loadUrlItems();
    }
  }, [searchParams, clearCart, addToCart, updateQuantity, setPromoCode, setLanguage, setCurrency]);

  // Apply pending promo code from URL after items are loaded
  useEffect(() => {
    if (pendingUrlPromo && items.length > 0 && !isLoadingFromUrl) {
      setPromoCode(pendingUrlPromo);
      validatePromoCode(pendingUrlPromo);
      setPendingUrlPromo(null);
    }
  }, [pendingUrlPromo, items.length, isLoadingFromUrl, setPromoCode, validatePromoCode]);

  // Update URL when cart changes
  useEffect(() => {
    if (isLoadingFromUrl || isExtensionRef.current) return;
    
    const urlItems = items.map(item => ({
      packageId: item.packageId,
      quantity: item.quantity
    }));
    
    const promoToInclude = promoUrlEnabledRef.current && promo.applied ? promo.code : undefined;
    
    const hasEconomy = items.some((item: any) => item.service_tier === 'economy');
    debouncedCartUrlUpdate(urlItems, promoToInclude, language as 'en' | 'th', currency as 'USD' | 'THB', hasEconomy ? 'economy' : undefined);
  }, [items, isLoadingFromUrl, language, currency, promo.applied, promo.code]);

  // Share cart URL handler
  const handleShareCart = async () => {
    const urlItems = items.map(item => ({
      packageId: item.packageId,
      quantity: item.quantity
    }));
    
    const promoToShare = promo.applied ? promo.code : (promo.code.trim().length >= 3 ? promo.code : undefined);
    
    const hasEconomy = items.some((item: any) => item.service_tier === 'economy');
    const cartUrl = generateCartUrl(
      urlItems, 
      promoToShare,
      language as 'en' | 'th',
      currency as 'USD' | 'THB',
      hasEconomy ? 'economy' : undefined
    );
    
    if (promoToShare) {
      promoUrlEnabledRef.current = true;
      const params = new URLSearchParams();
      if (urlItems.length > 0) {
        params.set('items', urlItems.map(i => `${i.packageId}:${i.quantity}`).join(','));
      }
      params.set('promo', promoToShare);
      if (language) params.set('lang', language);
      if (currency) params.set('currency', currency);
      if (hasEconomy) params.set('tier', 'economy');
      window.history.replaceState({}, '', `/cart?${params.toString()}`);
    }
    
    const success = await copyCartUrlToClipboard(cartUrl);
    
    if (success) {
      toast({
        title: t('cart.linkCopied') || 'Link copied!',
        description: t('cart.linkCopiedDescription') || 'Share this link to share your cart',
      });
    } else {
      toast({
        title: t('cart.copyFailed') || 'Copy failed',
        description: t('cart.copyFailedDescription') || 'Please copy the URL manually',
        variant: 'destructive',
      });
    }
  };

  // Enrich cart items with missing package details
  useEffect(() => {
    const enrichCartItems = async () => {
      const itemsMissingData = checkoutItems.filter(item => !item.carrier);
      
      if (itemsMissingData.length === 0) {
        setEnrichedItems(checkoutItems);
        return;
      }
      
      const { data: packages } = await supabase
        .from('esim_packages')
        .select('id, carrier, network_type, sim_type, daily_reset_amount, hot_spot, support_sms, support_voice, support_data, qos_speed, speed_after_limit, initialize_policy, validity_days, provider_metadata')
        .in('id', itemsMissingData.map(i => i.packageId));
      
      const enriched = checkoutItems.map(item => {
        if (item.carrier) return item;
        const pkg = packages?.find(p => p.id === item.packageId);
        if (pkg) {
          return {
            ...item,
            carrier: pkg.carrier || undefined,
            network_type: pkg.network_type || undefined,
            sim_type: pkg.sim_type || 'eSIM',
            daily_reset_amount: pkg.daily_reset_amount || undefined,
            hot_spot: pkg.hot_spot || false,
            support_sms: pkg.support_sms || false,
            support_voice: pkg.support_voice || false,
            support_data: pkg.support_data ?? true,
            qos_speed: item.qos_speed || pkg.qos_speed || undefined,
            speed_after_limit: item.speed_after_limit || pkg.speed_after_limit || undefined,
            initialize_policy: item.initialize_policy || pkg.initialize_policy || undefined,
            validity: item.validity || (pkg.validity_days ? `${pkg.validity_days} days` : undefined),
            provider_metadata: item.provider_metadata || (pkg.provider_metadata as Record<string, any>) || undefined,
          };
        }
        return item;
      });
      
      setEnrichedItems(enriched);
    };
    
    enrichCartItems();
  }, [checkoutItems]);

  // Check if all designated-date items have an activation date selected
  const hasUnselectedActivationDate = enrichedItems.some(
    item => item.initialize_policy === 'designated_date' && !item.activation_date
  );

  // Check if any items requiring device info are missing IMEI2/EID2
  const hasMissingDeviceInfo = enrichedItems.some(
    item => item.provider_metadata?.requires_device_info === true && 
    (!item.device_imei2 || !/^\d{15}$/.test(item.device_imei2) || !item.device_eid2 || !/^[0-9a-fA-F]{32}$/.test(item.device_eid2))
  );

  const handleCheckout = () => {
    if (hasUnselectedActivationDate) {
      toast({
        title: 'Activation date required',
        description: 'Please select an activation date for all designated-date packages.',
        variant: 'destructive',
      });
      return;
    }
    if (hasMissingDeviceInfo) {
      toast({
        title: 'Device information required',
        description: 'Please enter valid IMEI2 and EID2 for T-Mobile USA packages.',
        variant: 'destructive',
      });
      return;
    }
    if (!user) {
      if (showGuestCapture) {
        // Already showing email form — scroll to it and nudge the user
        guestCaptureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast({
          title: t('cart.enterEmailFirst'),
          description: t('cart.enterEmailDescription'),
        });
        return;
      }
      setShowGuestCapture(true);
      return;
    }
    processCheckout();
  };

  // Show redirecting state
  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
          <p className="text-lg font-medium text-gray-800">{t('checkout.redirectingToPayment') || 'Redirecting to payment...'}</p>
        </div>
      </div>
    );
  }


  // Loading state
  if (isLoadingFromUrl) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
            <h1 className="text-xl font-medium text-gray-900">{t('cart.loadingCart') || 'Loading cart...'}</h1>
          </div>
        </main>
      </div>
    );
  }

  // Empty cart state
  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <ShoppingCart className="h-24 w-24 text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{t('cart.emptyTitle')}</h1>
            <p className="text-gray-600 mb-6">
              {t('cart.emptyDescription')}
            </p>
            <Button 
              onClick={() => navigate('/packages')} 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8"
            >
              {t('cart.browsePackages')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#FAF7F2' }}>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Extension Banner */}
        {isExtension && originalOrder && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/20 rounded-full">
                <RefreshCw className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{t('checkout.extendingEsim') || 'Extending your eSIM'}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {originalOrder?.esim_packages?.country_name || 'eSIM'} • ICCID: ...{originalOrder?.iccid?.slice(-6) || '******'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-500 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back') || 'Back'}</span>
        </button>

        {/* Header with Share Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isExtension ? (t('checkout.extendTitle') || 'Extend Your eSIM') : t('cart.title')}
          </h1>
          {!isExtension && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareCart}
              className="gap-2 rounded-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              <Link className="h-4 w-4" />
              {t('cart.shareCart') || 'Share'}
            </Button>
          )}
        </div>

        {/* LINE User Email Input */}
        {user && isLineUser && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">{t('checkout.emailForReceipt') || 'Email for receipt'}</h3>
            </div>
            <Input
              type="email"
              placeholder={t('checkout.enterEmail') || 'Enter your email'}
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              className="bg-gray-50 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-2">
              {t('checkout.emailDescription') || 'We\'ll send your eSIM details and receipt to this email'}
            </p>
          </div>
        )}


        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {enrichedItems.map((item) => (
            <div key={item.packageId}>
              <CartItemCard
                item={item}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
              />
              {item.initialize_policy === 'designated_date' && (
                <div className="mt-2 space-y-2">
                  <ActivationDatePicker
                    validityDays={parseInt(item.validity?.replace(/\D/g, '') || '28', 10)}
                    activationDate={item.activation_date}
                    onDateChange={(date) => updateCartItemActivationDate(item.packageId, date)}
                    minAdvanceDays={item.provider_metadata?.min_advance_days || 2}
                    showCallsInfo={item.carrier === 'Vodafone' && item.country === 'Australia'}
                    activationTimeNote={
                      item.provider_metadata?.activation_timezone === 'America/New_York'
                        ? (t('cart.activationTimeNewYork') as string)
                        : undefined
                    }
                  />
                  {item.provider_metadata?.requires_device_info && (
                    <DeviceInfoForm
                      imei2={item.device_imei2 || ''}
                      eid2={item.device_eid2 || ''}
                      onImei2Change={(val) => updateCartItemDeviceInfo(item.packageId, val, item.device_eid2 || '')}
                      onEid2Change={(val) => updateCartItemDeviceInfo(item.packageId, item.device_imei2 || '', val)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Payment Method Selection */}
        <CartPaymentSection
          selectedMethod={selectedPaymentMethod}
          selectedCardId={selectedCardId}
          onMethodChange={setSelectedPaymentMethod}
          onCardSelect={setSelectedCardId}
          cartTotal={effectiveDiscountedTotal}
          mobile11MoneyApplied={mobile11MoneyApplied}
          onApplyMobile11Money={(amount) => {
            setMobile11MoneyApplied(amount);
            toast({
              title: t('cart.mobile11MoneyApplied') || 'Mobile11 Money Applied',
              description: `${formatPrice(amount)} ${t('cart.appliedToOrder') || 'applied to your order'}`,
            });
          }}
          onRemoveMobile11Money={() => setMobile11MoneyApplied(0)}
          onApplyPromoCode={(code) => {
            setPromoCode(code);
            validatePromoCode(code, checkoutItems);
          }}
          existingPromoCode={promo.code}
          promoApplied={promo.applied}
          promoDiscount={promo.discount}
          onRemovePromoCode={handleRemovePromo}
          currency={currency as 'USD' | 'THB'}
          promoError={promo.error}
          promoValidating={promo.validating}
          isTopupCodeError={promo.isTopupCodeError}
        />

        {/* Guest Email Capture */}
        {showGuestCapture && !user && (
          <div className="mt-6" ref={guestCaptureRef}>
            <GuestEmailCapture
              onSignInClick={() => {
                setShowGuestCapture(false);
                sessionStorage.setItem('post_auth_next', window.location.pathname + window.location.search);
                window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
              }}
            />
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('cart.orderSummary')}</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('cart.items')}</span>
              <span className="text-gray-900 font-medium">{checkoutItems.reduce((sum: number, item: any) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('checkout.subtotal')}</span>
              <span className="text-gray-900 font-medium">{formatPrice(checkoutSubtotal)}</span>
            </div>
            {promo.applied && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{t('checkout.discount') || 'Discount'}</span>
                <span>-{formatPrice(promo.discount)}</span>
              </div>
            )}
            {mobile11MoneyApplied > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>{t('cart.mobile11Money') || 'Mobile11 Money'}</span>
                <span>-{formatPrice(mobile11MoneyApplied)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-200">
              <span className="text-gray-900">{t('cart.total')}</span>
              <span className="text-gray-900">{formatPrice(effectiveTotal)}</span>
            </div>
          </div>
        </div>

        {/* Continue Shopping */}
        <Button
          variant="ghost"
          onClick={() => navigate(getContinueShoppingUrl())}
          className="w-full mt-4 text-gray-600 hover:text-orange-500 focus:text-orange-500 active:text-orange-600 focus:outline-none"
        >
          {t('cart.continueShopping')}
        </Button>
      </main>
      
      {/* Sticky Checkout Bar */}
      <StickyCheckoutBar 
        price={effectiveDiscountedTotal}
        mobile11MoneyApplied={mobile11MoneyApplied}
        total={effectiveTotal}
        onCheckout={handleCheckout}
        isProcessing={creating}
        buttonText={isExtension ? (t('checkout.extendNow') || 'Extend now') : showGuestCapture && !user ? t('cart.enterEmailButton') : undefined}
      />
      
      <FooterAiralo />
    </div>
  );
}
