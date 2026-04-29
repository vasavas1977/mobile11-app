import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { Loader2 } from 'lucide-react';

/**
 * CheckoutPage - Now redirects to combined Cart/Checkout page
 * 
 * This page is kept for backwards compatibility with:
 * - Old bookmarks to /checkout
 * - Extension flows from My eSIMs that navigate with state
 * - Any external links to /checkout
 * 
 * All checkout logic is now handled in CartPage.tsx
 */
export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: authLoading } = useAuth();
  const { items } = useCart();
  
  // Get cart items from navigation state
  const stateCartItems = (location.state as any)?.cartItems;
  const isExtension = (location.state as any)?.isExtension === true;
  const originalOrderId = (location.state as any)?.originalOrderId;
  const originalOrder = (location.state as any)?.originalOrder;
  
  // Redirect to cart page - this page is now deprecated in favor of combined cart/checkout
  useEffect(() => {
    if (authLoading) return;
    
    // If this is an extension flow with state, redirect to cart with the state preserved
    if (isExtension && stateCartItems?.length > 0) {
      navigate('/cart', { 
        replace: true,
        state: {
          cartItems: stateCartItems,
          isExtension: true,
          originalOrderId,
          originalOrder,
        }
      });
      return;
    }
    
    // If there are items in state (from old flow), redirect to cart
    if (stateCartItems?.length > 0) {
      navigate('/cart', { replace: true });
      return;
    }
    
    // Redirect to cart (it will handle empty state)
    navigate('/cart', { replace: true });
  }, [authLoading, items.length, navigate, stateCartItems, isExtension, originalOrderId, originalOrder]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    </div>
  );
}
