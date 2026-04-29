import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StickyCheckoutBarProps {
  price: number;
  mobile11MoneyApplied?: number;
  total: number;
  onCheckout: () => void;
  isProcessing?: boolean;
  buttonText?: string;
}

export function StickyCheckoutBar({ 
  price, 
  mobile11MoneyApplied = 0, 
  total, 
  onCheckout, 
  isProcessing,
  buttonText 
}: StickyCheckoutBarProps) {
  const { t, formatPrice } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 z-50 safe-area-pb">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-3xl">
        <div className="flex items-center gap-3 text-sm">
          {/* Only show price breakdown if Mobile11 Money discount is applied */}
          {mobile11MoneyApplied > 0 && (
            <>
              <div>
                <span className="text-gray-500 text-xs">{t('cart.price') || 'Price'}</span>
                <p className="font-semibold text-gray-900">{formatPrice(price)}</p>
              </div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-lg">🪙</span>
                <div>
                  <span className="text-gray-500 text-xs">{t('cart.mobile11Money') || 'Mobile11 Money'}</span>
                  <p className="font-semibold text-orange-600">-{formatPrice(mobile11MoneyApplied)}</p>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-gray-500 text-xs">{t('cart.total') || 'Total'}</span>
            <p className="text-xl font-bold text-gray-900">{formatPrice(total)}</p>
          </div>
          <Button 
            onClick={onCheckout}
            disabled={isProcessing}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-full"
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              buttonText || t('cart.buyNow') || 'Buy now'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
