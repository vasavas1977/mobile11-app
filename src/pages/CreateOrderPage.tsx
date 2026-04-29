import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Globe, Database, Calendar, CreditCard, Tag, QrCode, ChevronDown, Wifi, Smartphone, Signal, RotateCcw, Check, X, Zap, RefreshCw, MessageSquare, Phone, Mail, CheckCircle2, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { PackageTypeBadge } from '@/components/esim/PackageTypeBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRegionalData, getCountryCount } from '@/lib/regionalPackageUtils';
import { RegionalCountriesDialog } from '@/components/esim/RegionalCountriesDialog';
import { getAffiliateIdForCheckout, getAffiliateSessionId } from '@/hooks/useAffiliateTracking';
import { getLocalizedDescription } from '@/lib/packageDescriptionUtils';
import { convertUsdToThb } from '@/lib/currencyUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { trackBeginCheckout } from '@/lib/gtmUtils';
import { safeRedirectToPayment } from '@/lib/paymentRedirect';
import { trackCTAClick } from '@/lib/journeyTrackingUtils';
import { GuestEmailCapture } from '@/components/checkout/GuestEmailCapture';

interface EsimPackage {
  id: string;
  name: string;
  description: string;
  country_code: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  qos_speed?: string;
  is_cancelable?: boolean;
  package_type?: string;
  speed_after_limit?: string;
  carrier?: string;
  network_type?: string;
  sim_type?: string;
  daily_reset_amount?: string;
  hot_spot?: boolean;
  support_sms?: boolean;
  support_voice?: boolean;
  support_data?: boolean;
  included_countries?: any;
}

export function CreateOrderPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { clearCart, items: cartItems } = useCart();
  const { t, formatPrice, currency, language } = useLanguage();
  const [packageData, setPackageData] = useState<EsimPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);
  
  // Refs to prevent duplicate operations
  const validationRequestIdRef = useRef(0);
  const lastValidatedKeyRef = useRef<string>('');
  const createOrderInFlightRef = useRef(false);
  
  // Debounce promo code for auto-validation
  const debouncedPromoCode = useDebounce(promoCode, 600);
  const [quantity, setQuantity] = useState(1);
  const [multiItems, setMultiItems] = useState<Array<{ 
    packageId: string; 
    name: string; 
    description: string;
    country: string;
    data_amount: string;
    validity: string;
    price: number; 
    quantity: number;
    package_type?: string;
    speed_after_limit?: string;
    qos_speed?: string;
    carrier?: string;
    network_type?: string;
    sim_type?: string;
    daily_reset_amount?: string;
    hot_spot?: boolean;
    support_sms?: boolean;
    support_voice?: boolean;
    support_data?: boolean;
    included_countries?: any;
  }>>([]);
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
  const [isMulti, setIsMulti] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'promptpay' | 'truemoney'>('card');
  const [redirecting, setRedirecting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  
  // LINE user detection state
  const [isLineUser, setIsLineUser] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  
  // Extension mode state
  const isExtension = (location.state as any)?.isExtension === true;
  const originalOrderId = (location.state as any)?.originalOrderId;
  const originalOrder = (location.state as any)?.originalOrder;
  
  
  // Always use production environment
  const environment = 'production';


  // useEffect must be called before any conditional returns (React Rules of Hooks)
  useEffect(() => {
    const initCheckout = async () => {
      // Don't run if still loading auth
      if (authLoading) return;
      // For guest users, we still load package data (auth not required for viewing)
      if (!user) {
        // Still load package data from location state or URL
      }
      
      try {
        // First, check if there's a saved checkout intent from pre-login
        let restoredState: any = null;
        const savedIntent = sessionStorage.getItem('checkout_intent');
        
        if (savedIntent) {
          try {
            restoredState = JSON.parse(savedIntent);
            sessionStorage.removeItem('checkout_intent'); // Clean up after use
            console.log('[CHECKOUT_INIT] Restored checkout intent from session:', restoredState);
          } catch (e) {
            console.error('[CHECKOUT_INIT] Failed to parse saved checkout intent:', e);
          }
        }
        
        // Check if package data was passed via navigation state or restored from session (single package)
        const statePackage = restoredState?.packageData || (location.state as any)?.packageData;
        const stateQuantity = restoredState?.quantity || (location.state as any)?.quantity;
        // Check if cart items were passed (cart checkout) - prefer restored state
        const stateCartItems = restoredState?.cartItems || (location.state as any)?.cartItems;
        
        // Determine which cart items to use: navigation state or context fallback
        const itemsToUse = (stateCartItems && stateCartItems.length > 0) ? stateCartItems : cartItems;
        
        // Use restored packageId if available (for DB fetch fallback)
        const effectivePackageId = restoredState?.packageId || packageId;
        
        console.log('[CHECKOUT_INIT]', { 
          packageId: effectivePackageId, 
          hasStatePackage: !!statePackage, 
          stateQuantity,
          stateCartItemsCount: stateCartItems?.length || 0,
          contextCartCount: cartItems?.length || 0,
          restoredFromSession: !!restoredState
        });
        
        if (statePackage) {
          setPackageData(statePackage);
          if (stateQuantity && stateQuantity > 1) {
            setQuantity(stateQuantity);
          }
        } else if (itemsToUse && itemsToUse.length > 0) {
          // Cart checkout: keep first item for display but store full list for Stripe
          const firstItem = itemsToUse[0];
          setPackageData({
            id: firstItem.packageId,
            name: firstItem.name,
            description: firstItem.description,
            country_code: firstItem.country || '',
            country_name: firstItem.country || '',
            data_amount: firstItem.data_amount || '',
            validity_days: parseInt(firstItem.validity || '0'),
            price: firstItem.price,
            currency: 'USD',
            package_type: firstItem.package_type,
            speed_after_limit: firstItem.speed_after_limit,
            qos_speed: firstItem.qos_speed,
            carrier: firstItem.carrier,
            network_type: firstItem.network_type,
            sim_type: firstItem.sim_type,
            daily_reset_amount: firstItem.daily_reset_amount,
            hot_spot: firstItem.hot_spot,
            support_sms: firstItem.support_sms,
            support_voice: firstItem.support_voice,
            support_data: firstItem.support_data,
          });
          setQuantity(firstItem.quantity || 1);
          setMultiItems(
            itemsToUse.map((it: any) => ({
              packageId: it.packageId,
              name: it.name,
              description: it.description || '',
              country: it.country || '',
              data_amount: it.data_amount || '',
              validity: it.validity || '',
              price: it.price,
              quantity: it.quantity || 1,
              package_type: it.package_type,
              speed_after_limit: it.speed_after_limit,
              qos_speed: it.qos_speed,
              carrier: it.carrier,
              network_type: it.network_type,
              sim_type: it.sim_type,
              daily_reset_amount: it.daily_reset_amount,
              hot_spot: it.hot_spot,
              support_sms: it.support_sms,
              support_voice: it.support_voice,
              support_data: it.support_data,
            }))
          );
          setIsMulti(itemsToUse.length > 1);
        } else if (effectivePackageId) {
          // Fetch package from database by ID
          console.log('[CHECKOUT_INIT] Fetching package from DB:', effectivePackageId);
          const { data: pkg, error } = await supabase
            .from('esim_packages')
            .select('*')
            .eq('id', effectivePackageId)
            .maybeSingle();
          
          if (error) {
            console.error('[CHECKOUT_INIT] DB fetch error:', error);
            throw error;
          }
          
          if (pkg) {
            console.log('[CHECKOUT_INIT] Package fetched:', pkg.name);
            setPackageData({
              id: pkg.id,
              name: pkg.name,
              description: pkg.description || '',
              country_code: pkg.country_code,
              country_name: pkg.country_name,
              data_amount: pkg.data_amount,
              validity_days: pkg.validity_days,
              price: pkg.price,
              currency: pkg.currency,
              qos_speed: pkg.qos_speed || undefined,
              is_cancelable: pkg.is_cancelable || undefined,
              package_type: pkg.package_type || undefined,
              speed_after_limit: pkg.speed_after_limit || undefined,
              carrier: pkg.carrier || undefined,
              network_type: pkg.network_type || undefined,
              sim_type: pkg.sim_type || undefined,
              daily_reset_amount: pkg.daily_reset_amount || undefined,
              hot_spot: pkg.hot_spot || undefined,
              support_sms: pkg.support_sms || undefined,
              support_voice: pkg.support_voice || undefined,
              support_data: pkg.support_data || undefined,
              included_countries: pkg.included_countries,
            });
          } else {
            console.log('[CHECKOUT_INIT] Package not found in DB');
            toast({
              title: "Error",
              description: "Package not found. Please select a package again.",
              variant: "destructive"
            });
            navigate('/packages');
            return;
          }
        } else {
          // No package data at all - show friendly UI instead of redirecting
          console.log('[CHECKOUT_INIT] No package data available');
        }
      } catch (error: any) {
        console.error('[CHECKOUT_INIT] Error:', error.message);
        toast({
          title: "Error",
          description: "Failed to load package. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    initCheckout();
  }, [packageId, user, authLoading, navigate, location.state, toast, cartItems]);

  // Guest checkout: no longer redirect unauthenticated users away.
  // Instead, the GuestEmailCapture component handles silent sign-up inline.

  // Detect if user is a LINE user
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
      
      if (isLine) {
        console.log('LINE user detected, will send order confirmation via LINE chat');
      }
    };
    
    checkLineUser();
  }, [user]);

  // Track begin_checkout event when checkout page loads
  const hasTrackedCheckout = useRef(false);
  useEffect(() => {
    if (packageData && !loading && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true;
      
      const items = isMulti 
        ? multiItems.map(i => ({ id: i.packageId, name: i.name, price: i.price, quantity: i.quantity }))
        : [{ id: packageData.id, name: packageData.name, price: packageData.price, quantity }];
      
      const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      trackBeginCheckout(items, total, 'USD');
      trackCTAClick('Begin Checkout');
    }
  }, [packageData, loading, isMulti, multiItems, quantity]);

  // Authentication guard - show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">{t('checkout.verifyingAuth')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Guest checkout flag - rendered conditionally in the main JSX below
  const isGuest = !user;
  const handleSignInClick = () => {
    const stateData = location.state as any;
    const checkoutIntent = {
      packageId,
      cartItems: stateData?.cartItems || cartItems,
      packageData: stateData?.packageData,
      quantity: stateData?.quantity,
      isExtension: stateData?.isExtension,
      originalOrderId: stateData?.originalOrderId,
      originalOrder: stateData?.originalOrder,
    };
    sessionStorage.setItem('checkout_intent', JSON.stringify(checkoutIntent));
    sessionStorage.setItem('post_auth_next', '/create-order');
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
  };

  const validatePromoCode = useCallback(async (code: string) => {
    // Prevent validation during order creation or if already validating
    if (!code.trim() || !packageData || code.trim().length < 3 || creating || validatingPromo) return;

    // Calculate total cart amount
    let totalAmount = 0;
    if (isMulti) {
      totalAmount = multiItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    } else {
      totalAmount = packageData.price * quantity;
    }

    // Create a unique key to prevent duplicate validations for same parameters
    const validationKey = `${code.trim()}:${packageData.id}:${quantity}:${totalAmount}`;
    if (lastValidatedKeyRef.current === validationKey && promoApplied) {
      return; // Already validated this exact combination
    }

    // Increment request ID for single-flight pattern
    const currentRequestId = ++validationRequestIdRef.current;

    setValidatingPromo(true);
    setPromoError(null);
    
    console.log('[PROMO] Starting validation for:', code.trim());
    
    try {
      // Add timeout to prevent infinite loading
      const VALIDATION_TIMEOUT_MS = 12000;
      const validationPromise = supabase.functions.invoke('validate-promo-code', {
        body: { 
          code: code.trim(), 
          packageId: packageData.id,
          totalAmount: totalAmount
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Validation timed out. Please try again.')), VALIDATION_TIMEOUT_MS)
      );
      
      const { data, error } = await Promise.race([validationPromise, timeoutPromise]) as any;

      // Check if this is still the latest request (single-flight)
      if (currentRequestId !== validationRequestIdRef.current) {
        console.log('[PROMO] Stale response ignored');
        return; // A newer request has been made, ignore this result
      }

      if (error) throw error;

      if (data.valid) {
        lastValidatedKeyRef.current = validationKey;
        setPromoApplied(true);
        setPromoError(null);
        setDiscount(parseFloat(data.discount));
        setFinalPrice(parseFloat(data.finalPrice));
        setPromoCodeId(data.promoCodeId);
        toast({
          title: "Promo Code Applied!",
          description: `You saved $${data.discount}!`,
        });
      } else {
        setPromoError(data.message || "This promo code is not valid");
      }
    } catch (error: any) {
      // Only set error if this is still the latest request
      if (currentRequestId === validationRequestIdRef.current) {
        console.log('[PROMO] Validation error or timeout:', error.message);
        setPromoError(error.message || "Failed to validate promo code");
        setValidatingPromo(false);
      }
    } finally {
      // Only clear validating state if this is still the latest request
      if (currentRequestId === validationRequestIdRef.current) {
        setValidatingPromo(false);
      }
    }
  }, [packageData, isMulti, multiItems, quantity, toast, creating, validatingPromo, promoApplied]);

  // Auto-validate promo code when user stops typing
  useEffect(() => {
    // Only auto-validate for single items (not multi-cart) and not during order creation
    if (isMulti || creating) return;
    
    if (debouncedPromoCode.length >= 3 && !promoApplied && packageData && !validatingPromo) {
      validatePromoCode(debouncedPromoCode);
    } else if (debouncedPromoCode.length === 0 && (promoApplied || promoError)) {
      // Clear state when input is emptied
      setPromoApplied(false);
      setPromoError(null);
      setDiscount(0);
      setFinalPrice(0);
      setPromoCodeId(null);
    } else if (debouncedPromoCode.length > 0 && debouncedPromoCode.length < 3) {
      setPromoError(null);
    }
  }, [debouncedPromoCode, promoApplied, promoError, packageData, isMulti, validatePromoCode, creating]);

  const removePromoCode = () => {
    setPromoCode('');
    setPromoApplied(false);
    setPromoError(null);
    setDiscount(0);
    setFinalPrice(0);
    setPromoCodeId(null);
    lastValidatedKeyRef.current = ''; // Reset so same code can be re-validated
  };

  const createOrder = async () => {
    // Prevent double order creation
    if (!packageData || !user || createOrderInFlightRef.current) return;
    
    createOrderInFlightRef.current = true;
    setCreating(true);
    try {
      // Verify session is valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Please sign in again to continue');
      }

      // Handle extension order flow
      if (isExtension && originalOrderId) {
        const { data, error } = await supabase.functions.invoke('extend-order', {
          body: { 
            orderId: originalOrderId, 
            newPackageId: packageData.id,
            promoCode: promoApplied ? promoCode : null,
            promoCodeId: promoApplied ? promoCodeId : null,
            discount: promoApplied ? discount : 0,
            currency: currency,
            language: language,
          }
        });
        
        if (error) throw error;
        
        if (data?.checkoutUrl) {
          setRedirecting(true);
          toast({
            title: t('checkout.redirectingToPayment'),
            description: t('checkout.cardRedirect'),
            duration: 2000,
          });
          const result = safeRedirectToPayment(data.checkoutUrl);
          if (result.fallbackNeeded) {
            setPaymentUrl(result.url);
          }
          return;
        } else {
          throw new Error('Payment URL not received');
        }
      }

      // Get affiliate data from cookies
      const affiliateId = getAffiliateIdForCheckout();
      const affiliateSessionId = getAffiliateSessionId();
      
      if (affiliateId) {
        console.log('Order will be attributed to affiliate:', affiliateId);
      }

      // Generate parent order ID for grouping
      const parentOrderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const orderIds: string[] = [];
      const orderRecords: any[] = [];

      // Calculate total amount and apply discount proportionally
      let totalOriginalAmount = 0;
      let remainingDiscount = promoApplied ? discount : 0;

      // Create individual orders based on cart contents
      if (isMulti) {
        // Multiple different items
        let itemIndex = 1;
        
        // First calculate total for proportional discount
        totalOriginalAmount = multiItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        for (const item of multiItems) {
          // Verify package exists
          const { data: existingPkg, error: pkgCheckError } = await supabase
            .from('esim_packages')
            .select('id, currency')
            .eq('id', item.packageId)
            .maybeSingle();
          if (pkgCheckError) throw pkgCheckError;
          if (!existingPkg) {
            throw new Error(`Package ${item.name} is no longer available.`);
          }

          // Create one order per quantity
          for (let i = 0; i < (item.quantity || 1); i++) {
            const childOrderNumber = `${parentOrderNumber}-${itemIndex}`;
            
            // Calculate proportional discount for this item
            let itemDiscount = 0;
            if (promoApplied && remainingDiscount > 0) {
              itemDiscount = Math.min(remainingDiscount, item.price);
              remainingDiscount -= itemDiscount;
            }
            
            const itemFinalPrice = item.price - itemDiscount;
            
            // Convert amounts to THB if user selected THB currency
            const storedItemFinalPrice = currency === 'THB' ? convertUsdToThb(itemFinalPrice) : itemFinalPrice;
            const storedItemOriginalPrice = currency === 'THB' ? convertUsdToThb(item.price) : item.price;
            const storedItemDiscount = currency === 'THB' ? convertUsdToThb(itemDiscount) : itemDiscount;
            
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
                original_amount: promoApplied ? storedItemOriginalPrice : null,
                discount_amount: storedItemDiscount,
                promo_code_id: promoApplied ? promoCodeId : null,
                currency: currency, // Store user's selected currency
                language: language,
                environment: environment,
                affiliate_id: affiliateId,
                affiliate_session_id: affiliateSessionId,
                notification_email: isLineUser && notificationEmail ? notificationEmail : null,
              })
              .select()
              .single();

            if (orderError) throw orderError;
            orderIds.push(order.id);
            orderRecords.push(order);
            itemIndex++;
          }
        }
      } else if (quantity > 1) {
        // Multiple quantities of same item
        const { data: existingPkg, error: pkgCheckError } = await supabase
          .from('esim_packages')
          .select('id')
          .eq('id', packageData.id)
          .maybeSingle();
        if (pkgCheckError) throw pkgCheckError;
        if (!existingPkg) {
          throw new Error('Selected package is no longer available.');
        }

        totalOriginalAmount = packageData.price * quantity;

        for (let i = 0; i < quantity; i++) {
          const childOrderNumber = `${parentOrderNumber}-${i + 1}`;
          
          // Calculate proportional discount for this item
          let itemDiscount = 0;
          if (promoApplied && remainingDiscount > 0) {
            itemDiscount = Math.min(remainingDiscount, packageData.price);
            remainingDiscount -= itemDiscount;
          }
          
          const itemFinalPrice = packageData.price - itemDiscount;
          
          // Convert amounts to THB if user selected THB currency
          const storedItemFinalPrice = currency === 'THB' ? convertUsdToThb(itemFinalPrice) : itemFinalPrice;
          const storedPkgOriginalPrice = currency === 'THB' ? convertUsdToThb(packageData.price) : packageData.price;
          const storedItemDiscount = currency === 'THB' ? convertUsdToThb(itemDiscount) : itemDiscount;
          
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: session.user.id,
              package_id: packageData.id,
              order_id: childOrderNumber,
              parent_order_id: parentOrderNumber,
              item_index: i + 1,
              status: 'pending',
              total_amount: storedItemFinalPrice,
              original_amount: promoApplied ? storedPkgOriginalPrice : null,
              discount_amount: storedItemDiscount,
              promo_code_id: promoApplied ? promoCodeId : null,
              currency: currency, // Store user's selected currency
              language: language,
              environment: environment,
              affiliate_id: affiliateId,
              affiliate_session_id: affiliateSessionId,
              notification_email: isLineUser && notificationEmail ? notificationEmail : null,
            })
            .select()
            .single();

          if (orderError) throw orderError;
          orderIds.push(order.id);
          orderRecords.push(order);
        }
      } else {
        // Single item, single quantity
        const { data: existingPkg, error: pkgCheckError } = await supabase
          .from('esim_packages')
          .select('id')
          .eq('id', packageData.id)
          .maybeSingle();
        if (pkgCheckError) throw pkgCheckError;
        if (!existingPkg) {
          throw new Error('Selected package is no longer available.');
        }

        const orderAmount = promoApplied ? finalPrice : packageData.price;
        // Convert amounts to THB if user selected THB currency
        const storedOrderAmount = currency === 'THB' ? convertUsdToThb(orderAmount) : orderAmount;
        const storedOriginalAmount = currency === 'THB' ? convertUsdToThb(packageData.price) : packageData.price;
        const storedDiscount = currency === 'THB' ? convertUsdToThb(discount) : discount;
        
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: session.user.id,
            package_id: packageData.id,
            order_id: parentOrderNumber,
            parent_order_id: parentOrderNumber,
            item_index: 1,
            status: 'pending',
            total_amount: storedOrderAmount,
            original_amount: promoApplied ? storedOriginalAmount : null,
            discount_amount: promoApplied ? storedDiscount : 0,
            promo_code_id: promoApplied ? promoCodeId : null,
            currency: currency, // Store user's selected currency
            language: language,
            environment: environment,
            affiliate_id: affiliateId,
            affiliate_session_id: affiliateSessionId,
            notification_email: isLineUser && notificationEmail ? notificationEmail : null,
          })
          .select()
          .single();

        if (orderError) throw orderError;
        orderIds.push(order.id);
        orderRecords.push(order);
      }

      // Create payment records for each order
      for (const order of orderRecords) {
        const isFree = order.total_amount === 0 && promoApplied;
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            order_id: order.id,
            amount: order.total_amount,
            currency: order.currency,
            status: isFree ? 'completed' : 'pending',
            payment_method: isFree ? 'promo_code' : 'card'
          });

        if (paymentError) throw paymentError;
      }

      const totalAmount = orderRecords.reduce((sum, o) => sum + o.total_amount, 0);

      // If all orders are free with promo code, skip Stripe and mark as completed
      if (promoApplied && totalAmount === 0) {
        // Update all orders to processing
        const { error: orderCompleteError } = await supabase
          .from('orders')
          .update({ status: 'processing' })
          .in('id', orderIds);

        if (orderCompleteError) throw orderCompleteError;

        // Update all payment statuses to completed
        const { error: paymentCompleteError } = await supabase
          .from('payments')
          .update({ status: 'completed' })
          .in('order_id', orderIds);

        if (paymentCompleteError) throw paymentCompleteError;

        // Record promo usage ONCE for the entire transaction (not per order)
        if (promoCodeId) {
          const { error: usageError } = await supabase
            .from('promo_code_usage')
            .insert({
              promo_code_id: promoCodeId,
              order_id: orderRecords[0].id, // Use first order as reference
              user_id: session.user.id,
              discount_applied: discount // Total discount applied
            });

          if (usageError) console.error('Usage record error:', usageError);
        }

        // Increment promo code usage ONCE
        if (promoCodeId) {
          await supabase.rpc('increment_promo_code_usage', { promo_id: promoCodeId });
        }

        const esimCount = orderRecords.length;

        // Show processing message
        toast({
          title: "Processing Free Order",
          description: "Creating your free eSIM order...",
        });

        // Set timeout protection (30 seconds)
        const timeoutId = setTimeout(() => {
          console.warn('Free order processing timeout - navigating anyway');
          toast({
            title: "Processing Delayed",
            description: "Your order is being processed. Check your orders page.",
          });
          clearCart();
          navigate(`/payment-success?parent_order_id=${parentOrderNumber}&method=free`, { replace: true });
        }, 30000);

        try {
          // Process eSIM orders via edge function
          const { data: processData, error: processingError } = await supabase.functions.invoke('process-free-orders', {
            body: { 
              orderIds: orderRecords.map(o => o.id),
              environment: environment
            }
          });

          clearTimeout(timeoutId);

          if (processingError) {
            console.error('Failed to start order processing:', processingError);
            toast({
              title: "Processing Delayed",
              description: "Order created but processing may be delayed. Check your orders page.",
              variant: "destructive"
            });
          } else {
            console.log('Free order processing started for', orderRecords.length, 'orders');
            toast({
              title: "Free Order Complete!",
              description: `Your ${esimCount} free eSIM${esimCount > 1 ? 's are' : ' is'} being processed. Check your email for QR code${esimCount > 1 ? 's' : ''}.`,
            });
          }

          // Clear cart since order is complete
          clearCart();

          // Navigate using React Router (reliable across all browsers)
          setTimeout(() => {
            navigate(`/payment-success?parent_order_id=${parentOrderNumber}&method=free`, { replace: true });
          }, 1500);
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('Free order processing error:', error);
          toast({
            title: "Processing Error",
            description: "Order created but processing may be delayed. Check your orders page.",
            variant: "destructive"
          });
          clearCart();
          setTimeout(() => {
            navigate(`/payment-success?parent_order_id=${parentOrderNumber}&method=free`, { replace: true });
          }, 1500);
        }
        return;
      }

      // Route payment based on ORDER's stored currency (not user's current selection)
      // This ensures payment amount matches what was stored in database
      const orderCurrency = orderRecords[0]?.currency || currency;
      
      console.log('[CHECKOUT] Payment routing check:', {
        orderCurrency,
        userCurrency: currency,
        totalAmount,
        orderCount: orderRecords.length
      });

      // Route by payment method: PromptPay/QR → 2C2P, Card → Stripe (regardless of currency)
      if (paymentMethod === 'promptpay') {
        // 2C2P for PromptPay QR payments only
        // Convert to THB if order is in USD
        const totalAmountTHB = orderCurrency === 'THB' ? Math.round(totalAmount) : Math.round(convertUsdToThb(totalAmount));
        
        console.log('[CHECKOUT] Creating 2C2P PromptPay payment', { totalAmountTHB, orderCount: orderIds.length });
        
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-2c2p-promptpay', {
          body: { 
            orderIds: orderIds,
            parentOrderId: parentOrderNumber,
            items: orderRecords.map(o => ({
              packageId: o.package_id,
              orderId: o.id,
            })),
            totalAmountTHB: totalAmountTHB,
            environment: environment
          }
        });

        if (paymentError) throw paymentError;

        if (paymentData?.webPaymentUrl) {
          const checkoutUrl = paymentData.webPaymentUrl as string;
          console.log('[CHECKOUT] Opening 2C2P payment:', checkoutUrl);
          
          clearCart();
          
          setRedirecting(true);
          const result = safeRedirectToPayment(checkoutUrl);
          if (result.fallbackNeeded) {
            setPaymentUrl(result.url);
          }
          return;
        } else {
          throw new Error('Payment URL not received from 2C2P');
        }
      } else if (paymentMethod === 'truemoney') {
        // TrueMoney Wallet via 2C2P DPAY
        const totalAmountTHB = orderCurrency === 'THB' ? Math.round(totalAmount) : Math.round(convertUsdToThb(totalAmount));
        
        console.log('[CHECKOUT] Creating 2C2P TrueMoney payment', { totalAmountTHB, orderCount: orderIds.length });
        
        const { data: tmData, error: tmError } = await supabase.functions.invoke('create-2c2p-truemoney', {
          body: { 
            orderIds: orderIds,
            parentOrderId: parentOrderNumber,
            items: orderRecords.map(o => ({
              packageId: o.package_id,
              orderId: o.id,
            })),
            totalAmountTHB: totalAmountTHB,
            environment: environment
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
      } else {
        // Stripe for card payments (USD or THB card)
        const { data: paymentData, error: stripeError } = await supabase.functions.invoke('create-payment', {
          body: { 
            orderIds: orderIds,
            parentOrderId: parentOrderNumber,
            items: orderRecords.map(o => ({
              packageId: o.package_id,
              orderId: o.id,
            })),
            environment: environment,
            language: language,
          }
        });

        if (stripeError) throw stripeError;

        if (paymentData?.url) {
          const checkoutUrl = paymentData.url as string;
          console.log('[CHECKOUT] Opening Stripe checkout:', checkoutUrl);
          
          clearCart();
          
          setRedirecting(true);
          const result = safeRedirectToPayment(checkoutUrl);
          if (result.fallbackNeeded) {
            setPaymentUrl(result.url);
          }
          return;
        } else {
          throw new Error('Payment URL not received');
        }
      }
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      const msg = error?.message || 'Failed to create order. Please try a different package or try again.';
      toast({
        title: "Payment Error",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
      createOrderInFlightRef.current = false;
    }
  };

  // Show redirecting state with fallback
  if (redirecting) {
    const handleCopyLink = () => {
      if (paymentUrl) {
        navigator.clipboard.writeText(paymentUrl);
        toast({ title: 'Link copied!', description: 'Payment link copied to clipboard.' });
      }
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          {!paymentUrl ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">{t('checkout.redirectingToPayment')}</p>
            </>
          ) : (
            <>
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Payment Ready</h2>
                <p className="text-muted-foreground">
                  Click the button below to complete your payment.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="w-full">
                  <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Continue to Payment
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Payment Link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                After payment, you'll be redirected back automatically.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-muted-foreground text-lg">Loading package details...</div>
          </div>
        </div>
      </div>
    );
  }


  if (!packageData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-md mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-4">
              <Globe className="h-16 w-16 mx-auto text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('checkout.noPackageSelected') || 'No Package Selected'}</h2>
            <p className="text-muted-foreground mb-6">
              {t('checkout.selectPackageFirst') || 'Please select a package to continue with checkout.'}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/cart')} variant="outline">
                {t('nav.cart') || 'View Cart'}
              </Button>
              <Button onClick={() => navigate('/packages')}>
                {t('nav.packages') || 'Browse Packages'}
              </Button>
            </div>
          </Card>
        </div>
        <FooterAiralo />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Guest Email Capture - shown when user is not logged in */}
          {isGuest && (
            <GuestEmailCapture onSignInClick={handleSignInClick} />
          )}

          {/* Only show checkout content when user is authenticated */}
          {!isGuest && (<>

          {/* Extension Banner */}
          {isExtension && originalOrder && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{t('checkout.extendingEsim')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('checkout.extendingOrder')}: {originalOrder.esim_packages?.name || originalOrder.order_id}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {isExtension ? t('checkout.extendTitle') : t('checkout.title')}
              </span>
            </h1>
            <p className="text-muted-foreground">
              {isExtension ? t('checkout.extendSubtitle') : t('checkout.subtitle')}
            </p>
          </div>


          {/* Package Details */}
          <Card>
            {isMulti ? (
              // Multi-item checkout
              <>
                <CardHeader>
                  <CardTitle className="text-2xl">Order Summary</CardTitle>
                  <CardDescription>
                    Review your {multiItems.reduce((sum, it) => sum + (it.quantity || 1), 0)} eSIM package{multiItems.reduce((sum, it) => sum + (it.quantity || 1), 0) > 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {multiItems.map((item, index) => (
                    <div key={item.packageId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {item.country === 'GLOBAL' ? (
                                <>
                                  <Globe className="mr-1 h-3 w-3" />
                                  Global
                                </>
                              ) : (
                                item.country
                              )}
                            </Badge>
                            {item.package_type && (
                              <PackageTypeBadge 
                                packageType={item.package_type as any}
                                size="sm"
                                showIcon={true}
                              />
                            )}
                            {item.quantity > 1 && (
                              <Badge variant="outline" className="text-xs">
                                Qty: {item.quantity}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getLocalizedDescription({
                              packageType: item.package_type || '',
                              dataAmount: item.data_amount || '',
                              speedAfterLimit: item.speed_after_limit,
                              qosSpeed: item.qos_speed
                            }, t)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-primary">
                            {formatPrice(item.price * (item.quantity || 1))}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-muted-foreground">
                              {formatPrice(item.price)} × {item.quantity}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.data_amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.validity} {t('checkout.days')}</span>
                        </div>
                      </div>
                      
                      {/* Collapsible Package Details */}
                      <Collapsible 
                        open={detailsOpen[item.packageId]} 
                        onOpenChange={(open) => setDetailsOpen(prev => ({ ...prev, [item.packageId]: open }))}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-between mt-2 text-muted-foreground hover:text-foreground">
                            <span className="text-sm">{t('checkout.viewPackageDetails')}</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${detailsOpen[item.packageId] ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3 space-y-2 text-xs sm:text-sm">
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                            {item.carrier && (
                              <div className="flex items-start gap-1.5">
                                <Signal className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                                  <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.carrier')}:</span>
                                  <span className="font-medium text-xs sm:text-sm truncate">{item.carrier}</span>
                                </div>
                              </div>
                            )}
                            {item.network_type && (
                              <div className="flex items-start gap-1.5">
                                <Wifi className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                                  <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.network')}:</span>
                                  <span className="font-medium text-xs sm:text-sm truncate">{item.network_type}</span>
                                </div>
                              </div>
                            )}
                            {item.sim_type && (
                              <div className="flex items-start gap-1.5">
                                <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                                  <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.simType')}:</span>
                                  <span className="font-medium text-xs sm:text-sm truncate">{item.sim_type}</span>
                                </div>
                              </div>
                            )}
                            {item.package_type?.toLowerCase() === 'limitless' && item.qos_speed && (
                              <div className="flex items-start gap-1.5">
                                <Signal className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                                  <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.minGuaranteedSpeed')}:</span>
                                  <span className="font-medium text-xs sm:text-sm truncate">{item.qos_speed}</span>
                                </div>
                              </div>
                            )}
                            {item.speed_after_limit && (
                              <div className="flex items-start gap-1.5">
                                <Signal className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                                  <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.afterLimitSpeed')}:</span>
                                  <span className="font-medium text-xs sm:text-sm truncate">{item.speed_after_limit}</span>
                                </div>
                              </div>
                            )}
                            {item.package_type?.toLowerCase() === 'daypass' && item.daily_reset_amount && (
                              <div className="flex items-start gap-1.5">
                                <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                                  <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.dailyReset')}:</span>
                                  <span className="font-medium text-xs sm:text-sm truncate">{item.daily_reset_amount}</span>
                                </div>
                              </div>
                            )}
                            <div className="flex items-start gap-1.5">
                              {item.hot_spot ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500 shrink-0 mt-0.5" /> : <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                              <span className={`text-xs sm:text-sm ${item.hot_spot ? 'font-medium' : 'text-muted-foreground'}`}>{t('checkout.hotspot')}</span>
                            </div>

                            {/* Regional Countries */}
                            {(() => {
                              const regionalData = getRegionalData(item);
                              if (!regionalData) return null;
                              const countryCount = getCountryCount(item);
                              return (
                                <div className="col-span-2 pt-2 border-t border-border">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <Globe className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-[10px] sm:text-xs text-muted-foreground">{t('checkout.includedCountries')}:</span>
                                      <span className="font-medium text-xs sm:text-sm">{countryCount}</span>
                                    </div>
                                    <RegionalCountriesDialog 
                                      data={regionalData}
                                      trigger={
                                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] sm:text-xs">
                                          {t('checkout.viewAllCountries')}
                                        </Button>
                                      }
                                    />
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                                    {regionalData.countries.slice(0, 8).map((c, idx) => (
                                      <span key={c.code}>
                                        {c.name}
                                        {idx < Math.min(7, regionalData.countries.length - 1) && ' • '}
                                      </span>
                                    ))}
                                    {regionalData.countries.length > 8 && (
                                      <span className="font-medium text-primary"> +{regionalData.countries.length - 8} more</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold mb-2">{t('checkout.whatsIncluded')}</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• {t('checkout.instantActivation')}</li>
                      <li>• {t('checkout.noRoaming')}</li>
                      <li>• {t('checkout.support247')}</li>
                      <li>• {t('checkout.qrSetup')}</li>
                    </ul>
                  </div>
                </CardContent>
              </>
            ) : (
              // Single item checkout
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {packageData.country_code === 'GLOBAL' ? (
                        <>
                          <Globe className="mr-1 h-3 w-3" />
                          Global
                        </>
                      ) : (
                        packageData.country_name
                      )}
                    </Badge>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        {formatPrice(packageData.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t(`currency.${currency}`)} {quantity > 1 && `× ${quantity}`}
                      </div>
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      {packageData.name}
                      {packageData.package_type && (
                        <PackageTypeBadge 
                          packageType={packageData.package_type as any}
                          size="sm"
                          showIcon={true}
                        />
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {getLocalizedDescription({
                      packageType: packageData.package_type || '',
                      dataAmount: packageData.data_amount || '',
                      speedAfterLimit: (packageData as any).speed_after_limit,
                      qosSpeed: packageData.qos_speed
                    }, t)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{packageData.data_amount}</div>
                        <div className="text-sm text-muted-foreground">{t('checkout.highSpeedData')}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{packageData.validity_days} {t('checkout.days')}</div>
                        <div className="text-sm text-muted-foreground">{t('checkout.validityPeriod')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold mb-2">{t('checkout.whatsIncluded')}</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• {t('checkout.instantActivation')}</li>
                      <li>• {t('checkout.noRoaming')}</li>
                      <li>• {t('checkout.support247')}</li>
                      <li>• {t('checkout.qrSetup')}</li>
                    </ul>
                  </div>

                  {/* Collapsible Package Details for Single Item */}
                  <Collapsible 
                    open={detailsOpen['single']} 
                    onOpenChange={(open) => setDetailsOpen(prev => ({ ...prev, single: open }))}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between mt-4 text-muted-foreground hover:text-foreground">
                        <span className="text-sm">{t('checkout.viewPackageDetails')}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${detailsOpen['single'] ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-2 text-xs sm:text-sm">
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                        {packageData.carrier && (
                          <div className="flex items-start gap-1.5">
                            <Signal className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                              <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.carrier')}:</span>
                              <span className="font-medium text-xs sm:text-sm truncate">{packageData.carrier}</span>
                            </div>
                          </div>
                        )}
                        {packageData.network_type && (
                          <div className="flex items-start gap-1.5">
                            <Wifi className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                              <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.network')}:</span>
                              <span className="font-medium text-xs sm:text-sm truncate">{packageData.network_type}</span>
                            </div>
                          </div>
                        )}
                        {packageData.sim_type && (
                          <div className="flex items-start gap-1.5">
                            <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                              <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.simType')}:</span>
                              <span className="font-medium text-xs sm:text-sm truncate">{packageData.sim_type}</span>
                            </div>
                          </div>
                        )}
                        {/* Limitless min speed */}
                        {packageData.package_type?.toLowerCase() === 'limitless' && packageData.qos_speed && (
                          <div className="flex items-start gap-1.5">
                            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                              <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.minSpeed')}:</span>
                              <span className="font-medium text-xs sm:text-sm truncate">{packageData.qos_speed}</span>
                            </div>
                          </div>
                        )}
                        {/* Max Speed/Day Pass after limit speed */}
                        {(packageData as any).speed_after_limit && packageData.package_type?.toLowerCase() !== 'limitless' && (
                          <div className="flex items-start gap-1.5">
                            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                              <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.afterLimit')}:</span>
                              <span className="font-medium text-xs sm:text-sm truncate">{(packageData as any).speed_after_limit}</span>
                            </div>
                          </div>
                        )}
                        {/* Day Pass daily reset */}
                        {(packageData as any).daily_reset_amount && (
                          <div className="flex items-start gap-1.5">
                            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                              <span className="text-muted-foreground text-[10px] sm:text-xs">{t('checkout.dailyReset')}:</span>
                              <span className="font-medium text-xs sm:text-sm truncate">{(packageData as any).daily_reset_amount}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Feature badges */}
                        <div className="col-span-2 flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                          {packageData.support_data !== false && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                              <Database className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              {t('checkout.dataIncluded')}
                            </Badge>
                          )}
                          {packageData.hot_spot && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                              <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              {t('checkout.hotspot')}
                            </Badge>
                          )}
                          {packageData.support_sms && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                              <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              SMS
                            </Badge>
                          )}
                          {packageData.support_voice && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                              <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              {t('checkout.voice')}
                            </Badge>
                          )}
                        </div>

                        {/* Regional Countries */}
                        {(() => {
                          const regionalData = getRegionalData(packageData);
                          if (!regionalData) return null;
                          const countryCount = getCountryCount(packageData);
                          return (
                            <div className="col-span-2 pt-2 border-t border-border">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">{t('checkout.includedCountries')}:</span>
                                  <span className="font-medium text-xs sm:text-sm">{countryCount}</span>
                                </div>
                                <RegionalCountriesDialog 
                                  data={regionalData}
                                  trigger={
                                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] sm:text-xs">
                                      {t('checkout.viewAllCountries')}
                                    </Button>
                                  }
                                />
                              </div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                                {regionalData.countries.slice(0, 8).map((c, idx) => (
                                  <span key={c.code}>
                                    {c.name}
                                    {idx < Math.min(7, regionalData.countries.length - 1) && ' • '}
                                  </span>
                                ))}
                                {regionalData.countries.length > 8 && (
                                  <span className="font-medium text-primary"> +{regionalData.countries.length - 8} more</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </>
            )}

              <CardContent className="pt-0 space-y-4">
                {/* THB Payment Info Banner */}
                {currency === 'THB' && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      {t('checkout.thbPaymentInfo')}
                    </p>
                  </div>
                )}

                {/* Promo Code Input with Auto-Validation */}
                {!isMulti ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('checkout.promoCodeLabel')}</label>
                    {!promoApplied ? (
                      <>
                        <div className="relative">
                          <Input
                            placeholder={t('checkout.enterPromoCode')}
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase());
                              setPromoError(null); // Clear error on new input
                            }}
                            disabled={creating || redirecting}
                            className={`pr-10 ${promoError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {validatingPromo && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {promoError && (
                          <div className="flex items-center gap-1.5 text-destructive text-xs">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{promoError}</span>
                          </div>
                        )}
                        {promoCode.length > 0 && promoCode.length < 3 && !promoError && (
                          <p className="text-xs text-muted-foreground">
                            {t('checkout.enterAtLeast3Chars') || 'Enter at least 3 characters'}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              {t('checkout.promoApplied')} {promoCode}
                            </span>
                          </div>
                          <Button
                            onClick={removePromoCode}
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            disabled={creating || redirecting}
                          >
                            {t('checkout.remove')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted/50 border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground text-center">
                      {t('checkout.promoNotAvailable')}
                    </p>
                  </div>
                )}

                {/* LINE User Email Option */}
                {isLineUser && (
                  <div className="bg-[#00B900]/10 border border-[#00B900]/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#00B900]/20 rounded-full">
                        <MessageSquare className="h-4 w-4 text-[#00B900]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{t('checkout.lineNotification')}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('checkout.lineNotificationDesc')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {t('checkout.optionalEmailLabel')}
                      </label>
                      <Input
                        type="email"
                        placeholder={t('checkout.optionalEmailPlaceholder')}
                        value={notificationEmail}
                        onChange={(e) => setNotificationEmail(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  {quantity > 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('checkout.unitPrice')}:</span>
                      <span className="text-muted-foreground">{formatPrice(packageData.price)}</span>
                    </div>
                  )}
                  {promoApplied && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('checkout.originalPrice')}:</span>
                        <span className="line-through text-muted-foreground">{formatPrice(packageData.price * quantity)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>{t('checkout.discount')}:</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t">
                    <span>{t('checkout.totalAmount')}:</span>
                    <span className="text-primary">
                      {isMulti
                        ? formatPrice(multiItems.reduce((sum, it) => sum + it.price * (it.quantity || 1), 0))
                        : formatPrice(promoApplied ? finalPrice : (packageData.price * quantity))}
                    </span>
                  </div>
                  {promoApplied && finalPrice === 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 text-center">
                      {t('checkout.freeOrder')}
                    </p>
                  )}
                </div>
              </CardContent>
          </Card>

          {/* Order Actions */}
          <div className="space-y-4">
            <Button
              onClick={createOrder}
              disabled={creating || redirecting}
              className="w-full"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isExtension ? t('checkout.extendButton') : t('checkout.createOrder')}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => isExtension && originalOrderId ? navigate(`/orders/${originalOrderId}`) : navigate('/packages')}
              className="w-full"
            >
              {isExtension ? t('common.cancel') : t('checkout.backToPackages')}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>{t('checkout.termsAgreement')}</p>
          </div>
        </>)}
        </div>
      </div>
      
      <FooterAiralo />
    </div>
  );
}