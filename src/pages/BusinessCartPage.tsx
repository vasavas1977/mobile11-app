import { useNavigate } from 'react-router-dom';
import { useBusinessCart } from '@/contexts/BusinessCartContext';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useOrganizationCredit } from '@/hooks/useOrganizationCredit';
import { useLanguage } from '@/contexts/LanguageContext';

import { BusinessPortalNav } from '@/components/business/BusinessPortalNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { StickyCheckoutBar } from '@/components/cart/StickyCheckoutBar';
import { ShoppingCart, Loader2, CreditCard, AlertCircle, ArrowRight } from 'lucide-react';

export default function BusinessCartPage() {
  const navigate = useNavigate();
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    totalPrice,
    totalItems
  } = useBusinessCart();
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading, isOrgAdmin, isOrgManager } = useOrganizationContext();
  const { data: creditData, isLoading: creditLoading } = useOrganizationCredit(currentOrg?.id || null);
  const { t, formatPrice } = useLanguage();

  const creditBalance = creditData?.credit_balance || 0;
  const hasEnoughCredit = creditBalance >= totalPrice;
  const shortfall = totalPrice - creditBalance;

  const handleCheckout = () => {
    if (!hasEnoughCredit) {
      navigate('/business/transactions');
      return;
    }
    navigate('/business/checkout');
  };

  // Loading state
  if (authLoading || orgLoading || creditLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <BusinessPortalNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </main>
      </div>
    );
  }

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <BusinessPortalNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <p className="text-gray-600 mb-4">Please sign in to access your cart.</p>
            <Button onClick={() => navigate('/auth')} className="bg-orange-500 hover:bg-orange-600">
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Org check
  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <BusinessPortalNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <p className="text-gray-600 mb-4">No organization selected.</p>
            <Button onClick={() => navigate('/business')} className="bg-orange-500 hover:bg-orange-600">
              Go to Business Portal
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Permission check
  if (!isOrgAdmin && !isOrgManager) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <BusinessPortalNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <p className="text-gray-600 mb-4">Only admins and managers can purchase eSIMs.</p>
            <Button onClick={() => navigate('/business/esims')} className="bg-orange-500 hover:bg-orange-600">
              Back to eSIMs
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <BusinessPortalNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <ShoppingCart className="h-24 w-24 text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{t('cart.emptyTitle') || 'Your cart is empty'}</h1>
            <p className="text-gray-600 mb-6">
              {t('cart.emptyDescription') || 'Add some eSIM packages to get started'}
            </p>
            <Button 
              onClick={() => navigate('/business/purchase')} 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8"
            >
              Browse Packages
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Map business cart items to CartItemCard format
  const cartItems = items.map(item => ({
    packageId: item.packageId,
    name: item.name,
    description: item.description,
    price: item.price,
    country: item.country,
    data_amount: item.data_amount,
    validity: item.validity,
    quantity: item.quantity,
    package_type: item.package_type,
    speed_after_limit: item.speed_after_limit,
    qos_speed: item.qos_speed,
    carrier: item.carrier,
    network_type: item.network_type,
    sim_type: item.sim_type,
    daily_reset_amount: item.daily_reset_amount,
    hot_spot: item.hot_spot,
    support_sms: item.support_sms,
    support_voice: item.support_voice,
    support_data: item.support_data,
  }));

  return (
    <div className="min-h-screen pb-24 bg-[#FAF7F2]">
      <BusinessPortalNav />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('cart.title') || 'Your Cart'}</h1>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cartItems.map((item) => (
            <CartItemCard
              key={item.packageId}
              item={item}
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>

        {/* Organization Credit Section */}
        <Card className="bg-white rounded-2xl shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Organization Credit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Available Balance</span>
              <span className={`text-xl font-bold ${hasEnoughCredit ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(creditBalance)}
              </span>
            </div>
            
            {!hasEnoughCredit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Insufficient Credit</p>
                  <p className="text-xs text-red-600 mt-1">
                    You need {formatPrice(shortfall)} more credit to complete this purchase.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-red-700 border-red-300 hover:bg-red-50"
                    onClick={() => navigate('/business/transactions')}
                  >
                    Top Up Credit
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('cart.orderSummary') || 'Order Summary'}</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('cart.items') || 'Items'}</span>
              <span className="text-gray-900 font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('checkout.subtotal') || 'Subtotal'}</span>
              <span className="text-gray-900 font-medium">{formatPrice(totalPrice)}</span>
            </div>
            {hasEnoughCredit && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Organization Credit</span>
                <span>-{formatPrice(totalPrice)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-200">
              <span className="text-gray-900">{t('cart.total') || 'Total'}</span>
              <span className="text-gray-900">{hasEnoughCredit ? formatPrice(0) : formatPrice(totalPrice)}</span>
            </div>
            {hasEnoughCredit && (
              <p className="text-xs text-gray-500 text-center">
                Payment will be deducted from organization credit
              </p>
            )}
          </div>
        </div>

        {/* Continue Shopping */}
        <Button
          variant="ghost"
          onClick={() => navigate('/business/purchase')}
          className="w-full mt-4 text-gray-600 hover:text-orange-500"
        >
          {t('cart.continueShopping') || 'Continue Shopping'}
        </Button>
      </main>
      
      {/* Sticky Checkout Bar */}
      <StickyCheckoutBar 
        price={totalPrice}
        mobile11MoneyApplied={hasEnoughCredit ? totalPrice : 0}
        total={hasEnoughCredit ? 0 : totalPrice}
        onCheckout={handleCheckout}
        isProcessing={false}
      />
    </div>
  );
}
