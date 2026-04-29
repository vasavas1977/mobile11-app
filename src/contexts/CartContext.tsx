import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { trackAddToCart } from '@/lib/gtmUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CartItem {
  packageId: string;
  name: string;
  description?: string; // Raw description (fallback)
  price: number;
  country?: string;
  data_amount?: string;
  validity?: string;
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
  service_tier?: 'priority' | 'economy';
  initialize_policy?: string;
  activation_date?: string;
  device_imei2?: string;
  device_eid2?: string;
  provider_metadata?: Record<string, any>;
}

export interface PromoState {
  code: string;
  applied: boolean;
  discount: number;
  finalPrice: number;
  originalTotal: number; // The cart total when promo was applied
  promoCodeId: string | null;
  error: string | null;
  isTopupCodeError: boolean; // Track if error is specifically for a top-up code
  validating: boolean;
  isReferral: boolean;
  referrerUserId: string | null;
  referralCode: string | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (packageId: string) => void;
  updateQuantity: (packageId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  lastAddedItem: CartItem | null;
  // Promo code state
  promo: PromoState;
  setPromoCode: (code: string) => void;
  validatePromoCode: (code: string, itemsOverride?: CartItem[]) => Promise<void>;
  removePromoCode: () => void;
  discountedTotal: number;
  updateCartItemActivationDate: (packageId: string, date: string) => void;
  updateCartItemDeviceInfo: (packageId: string, imei2: string, eid2: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialPromoState: PromoState = {
  code: '',
  applied: false,
  discount: 0,
  finalPrice: 0,
  originalTotal: 0,
  promoCodeId: null,
  error: null,
  isTopupCodeError: false,
  validating: false,
  isReferral: false,
  referrerUserId: null,
  referralCode: null,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [promo, setPromo] = useState<PromoState>(initialPromoState);
  
  // Refs for promo validation deduplication
  const validationRequestIdRef = useRef(0);
  const lastValidatedKeyRef = useRef<string>('');
  const promoJustAppliedRef = useRef(false);
  const VALIDATION_TIMEOUT_MS = 12000; // 12 second timeout

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out invalid items (missing packageId or invalid price)
          const validItems = parsed.filter(item => 
            item.packageId && 
            typeof item.price === 'number' && 
            !isNaN(item.price)
          );
          setItems(validItems);
        }
      }
      // Load saved promo code
      const savedPromo = localStorage.getItem('cart_promo');
      if (savedPromo) {
        const parsedPromo = JSON.parse(savedPromo);
        if (parsedPromo && parsedPromo.applied) {
          setPromo(parsedPromo);
        }
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Only save to localStorage after hydration is complete
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // Save promo state to localStorage
  useEffect(() => {
    if (isHydrated) {
      if (promo.applied) {
        localStorage.setItem('cart_promo', JSON.stringify(promo));
      } else {
        localStorage.removeItem('cart_promo');
      }
    }
  }, [promo, isHydrated]);

  // Clear promo when cart changes (items added/removed)
  useEffect(() => {
    // Skip the check on the render right after promo was just applied
    if (promoJustAppliedRef.current) {
      promoJustAppliedRef.current = false;
      return;
    }
    if (promo.applied && isHydrated && promo.originalTotal > 0) {
      const newTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      console.log('[Promo] Cart-change check:', { newTotal, originalTotal: promo.originalTotal, diff: Math.abs(newTotal - promo.originalTotal) });
      if (Math.abs(newTotal - promo.originalTotal) > 0.001) {
        // Cart changed, need to revalidate
        setPromo(prev => ({
          ...prev,
          applied: false,
          discount: 0,
          finalPrice: 0,
          originalTotal: 0,
          promoCodeId: null,
          validating: false,
          error: 'Cart changed. Please re-apply promo code.'
        }));
        lastValidatedKeyRef.current = '';
      }
    }
  }, [items, promo.applied, promo.originalTotal, isHydrated]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    // Validate item has required fields
    if (!item.packageId || typeof item.price !== 'number' || isNaN(item.price)) {
      console.error('Cannot add item with invalid data:', item);
      return;
    }
    
    setItems(current => {
      const existingIndex = current.findIndex(i => i.packageId === item.packageId);
      
      if (existingIndex >= 0) {
        const updated = [...current];
        const updatedItem = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        updated[existingIndex] = updatedItem;
        setLastAddedItem(updatedItem);
        return updated;
      }
      
      const newItem: CartItem = { ...item, quantity: 1 };
      setLastAddedItem(newItem);
      return [...current, newItem];
    });
    
    // Show toast notification
    toast({
      title: "✓ Added to cart",
      description: item.name,
      duration: 2000,
    });

  };

  const removeFromCart = (packageId: string) => {
    setItems(current => current.filter(i => i.packageId !== packageId));
  };

  const updateQuantity = (packageId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(packageId);
      return;
    }
    setItems(current =>
      current.map(i =>
        i.packageId === packageId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    // Cancel any in-flight validation requests
    validationRequestIdRef.current++;
    setItems([]);
    setPromo(initialPromoState);
    localStorage.removeItem('cart_promo');
    lastValidatedKeyRef.current = '';
  };

  const setPromoCode = useCallback((code: string) => {
    // Cancel any in-flight validation when user types
    if (promo.validating) {
      validationRequestIdRef.current++;
    }
    setPromo(prev => ({ 
      ...prev, 
      code, 
      error: null,
      isTopupCodeError: false, // Reset flag when code changes
      validating: false // Stop spinner when user types new code
    }));
  }, [promo.validating]);

  const validatePromoCode = useCallback(async (code: string, itemsOverride?: CartItem[]) => {
    const effectiveItems = itemsOverride && itemsOverride.length > 0 ? itemsOverride : items;
    if (!code.trim() || code.trim().length < 3 || effectiveItems.length === 0) return;
    
    const totalAmount = effectiveItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create unique key to prevent duplicate validations
    const validationKey = `${code.trim()}:${effectiveItems.map(i => `${i.packageId}:${i.quantity}`).join(',')}:${totalAmount}`;
    if (lastValidatedKeyRef.current === validationKey && promo.applied) {
      return; // Already validated this exact combination
    }
    
    // Increment request ID for single-flight pattern
    const currentRequestId = ++validationRequestIdRef.current;
    
    console.log('[Promo] Starting validation:', { requestId: currentRequestId, code: code.trim(), totalAmount });
    
    setPromo(prev => ({ ...prev, validating: true, error: null }));
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('VALIDATION_TIMEOUT')), VALIDATION_TIMEOUT_MS);
      });
      
      // Race between actual request and timeout
      const { data, error } = await Promise.race([
        supabase.functions.invoke('validate-promo-code', {
          body: { 
            code: code.trim(), 
            packageId: effectiveItems[0].packageId,
            totalAmount: totalAmount
          }
        }),
        timeoutPromise
      ]);
      
      // Check if this is still the latest request
      if (currentRequestId !== validationRequestIdRef.current) {
        console.log('[Promo] Ignoring stale response:', currentRequestId);
        return;
      }
      
      if (error) throw error;
      
      if (data.valid) {
        console.log('[Promo] Validation successful:', data);
        lastValidatedKeyRef.current = validationKey;
        promoJustAppliedRef.current = true;
        setPromo({
          code: code.trim(),
          applied: true,
          discount: parseFloat(data.discount),
          finalPrice: parseFloat(data.finalPrice),
          originalTotal: totalAmount,
          promoCodeId: data.promoCodeId,
          error: null,
          isTopupCodeError: false,
          validating: false,
          isReferral: data.isReferral === true,
          referrerUserId: data.referrerUserId || null,
          referralCode: data.isReferral ? code.trim() : null,
        });
      } else {
        setPromo(prev => ({
          ...prev,
          applied: false,
          error: data.message || 'This promo code is not valid',
          isTopupCodeError: data.isTopupCode === true, // Capture top-up code flag from API
          validating: false,
        }));
      }
    } catch (error: any) {
      // Check if this is still the latest request
      if (currentRequestId !== validationRequestIdRef.current) {
        return;
      }
      
      if (error.message === 'VALIDATION_TIMEOUT') {
        console.log('[Promo] Validation timed out:', currentRequestId);
        setPromo(prev => ({
          ...prev,
          applied: false,
          error: 'Validation timed out. Please try again.',
          validating: false,
        }));
      } else {
        console.error('[Promo] Validation error:', error);
        setPromo(prev => ({
          ...prev,
          applied: false,
          error: error.message || 'Failed to validate promo code',
          validating: false,
        }));
      }
    }
  }, [items, promo.applied]);

  const removePromoCode = () => {
    // Cancel any in-flight validation requests
    validationRequestIdRef.current++;
    // Reset promo state and clear localStorage
    setPromo(initialPromoState);
    localStorage.removeItem('cart_promo');
    lastValidatedKeyRef.current = '';
    console.log('[Promo] Code removed, validation cancelled');
  };

  const updateCartItemActivationDate = (packageId: string, date: string) => {
    setItems(current =>
      current.map(i =>
        i.packageId === packageId ? { ...i, activation_date: date } : i
      )
    );
  };

  const updateCartItemDeviceInfo = (packageId: string, imei2: string, eid2: string) => {
    setItems(current =>
      current.map(i =>
        i.packageId === packageId ? { ...i, device_imei2: imei2, device_eid2: eid2 } : i
      )
    );
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedTotal = promo.applied ? promo.finalPrice : totalPrice;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setCartOpen,
        lastAddedItem,
        promo,
        setPromoCode,
        validatePromoCode,
        removePromoCode,
        discountedTotal,
        updateCartItemActivationDate,
        updateCartItemDeviceInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
