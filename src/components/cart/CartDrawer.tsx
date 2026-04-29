import { useNavigate } from 'react-router-dom';
import { Check, ShoppingBag, Signal, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PackageTypeBadge } from '@/components/esim/PackageTypeBadge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryFlag } from '@/lib/countryFlags';

export function CartDrawer() {
  const { t, formatPrice } = useLanguage();
  const { 
    items, 
    totalItems, 
    totalPrice, 
    isCartOpen, 
    setCartOpen, 
    lastAddedItem 
  } = useCart();
  const navigate = useNavigate();

  const handleViewCart = () => {
    setCartOpen(false);
    navigate('/cart');
  };

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    setCartOpen(false);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 text-emerald-600">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            {t('cartDrawer.addedToCart')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          {/* Last Added Item */}
          {lastAddedItem && (
            <div className="bg-muted/50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">
                  {getCountryFlag('', lastAddedItem.country || '')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {lastAddedItem.package_type && (
                      <PackageTypeBadge 
                        packageType={lastAddedItem.package_type as 'day_pass' | 'max_speed' | 'limitless'} 
                        size="sm" 
                      />
                    )}
                  </div>
                  <h4 className="font-semibold text-sm truncate">
                    {lastAddedItem.country && !lastAddedItem.name.toLowerCase().includes(lastAddedItem.country.toLowerCase()) 
                      ? `${lastAddedItem.country} ${lastAddedItem.name}` 
                      : lastAddedItem.name}
                  </h4>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {lastAddedItem.country} • {lastAddedItem.validity}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                    {lastAddedItem.carrier && (
                      <span className="flex items-center gap-1">
                        <Signal className="w-3 h-3" />
                        {lastAddedItem.carrier}
                      </span>
                    )}
                    {lastAddedItem.qos_speed && 
                     lastAddedItem.package_type?.toLowerCase() !== 'limitless' && 
                     lastAddedItem.package_type?.toLowerCase() !== 'day_pass' && (
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {lastAddedItem.qos_speed}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-primary whitespace-nowrap">
                  {formatPrice(lastAddedItem.price)}
                </span>
              </div>
            </div>
          )}

          {/* Cart Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                {t('cartDrawer.yourCart')} ({totalItems} {t('cartDrawer.items')})
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-border">
              <span className="font-medium">{t('cartDrawer.subtotal')}</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border pt-4 space-y-3">
          <Button 
            onClick={handleCheckout} 
            className="w-full h-11"
            size="lg"
          >
            {t('cartDrawer.checkout')}
          </Button>
          <Button 
            onClick={handleViewCart} 
            variant="outline" 
            className="w-full h-11"
            size="lg"
          >
            {t('cartDrawer.viewCart')}
          </Button>
          <button
            onClick={handleContinueShopping}
            className="w-full text-center text-sm text-muted-foreground hover:text-orange-500 focus:text-orange-500 active:text-orange-600 focus:outline-none transition-colors py-2"
          >
            {t('cartDrawer.continueShopping')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
