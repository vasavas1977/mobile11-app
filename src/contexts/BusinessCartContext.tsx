import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface BusinessCartItem {
  packageId: string;
  name: string;
  description?: string;
  price: number;
  country?: string;
  countryCode?: string;
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
}

interface BusinessCartContextType {
  items: BusinessCartItem[];
  addToCart: (item: Omit<BusinessCartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (packageId: string) => void;
  updateQuantity: (packageId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const BusinessCartContext = createContext<BusinessCartContextType | undefined>(undefined);

const STORAGE_KEY = 'business_cart_v2';

export function BusinessCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BusinessCartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter(item => 
            item.packageId && 
            typeof item.price === 'number' && 
            !isNaN(item.price)
          );
          setItems(validItems);
        }
      }
    } catch (e) {
      console.error('Failed to load business cart from localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage after hydration
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  const addToCart = useCallback((item: Omit<BusinessCartItem, 'quantity'>, quantity: number = 1) => {
    if (!item.packageId || typeof item.price !== 'number' || isNaN(item.price)) {
      console.error('Cannot add item with invalid data:', item);
      return;
    }
    
    setItems(current => {
      const existingIndex = current.findIndex(i => i.packageId === item.packageId);
      
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }
      
      const newItem: BusinessCartItem = { ...item, quantity };
      return [...current, newItem];
    });
    
    toast({
      title: "✓ Added to cart",
      description: `${item.name} x${quantity}`,
      duration: 2000,
    });
  }, []);

  const removeFromCart = useCallback((packageId: string) => {
    setItems(current => current.filter(i => i.packageId !== packageId));
  }, []);

  const updateQuantity = useCallback((packageId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(packageId);
      return;
    }
    setItems(current =>
      current.map(i =>
        i.packageId === packageId ? { ...i, quantity } : i
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <BusinessCartContext.Provider
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
      }}
    >
      {children}
    </BusinessCartContext.Provider>
  );
}

export function useBusinessCart() {
  const context = useContext(BusinessCartContext);
  if (context === undefined) {
    throw new Error('useBusinessCart must be used within a BusinessCartProvider');
  }
  return context;
}
