import { ChevronRight, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useEffect, useState, useContext } from 'react';
import { useCart } from '@/contexts/CartContext';
import { LanguageContext } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageDetailsModal } from '@/components/my-esims/PackageDetailsModal';

export function FloatingCartButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const langContext = useContext(LanguageContext);
  const { items } = useCart();
  const [mounted, setMounted] = useState(false);
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Hide on cart, checkout, and auth pages
  const hiddenPaths = ['/cart', '/checkout', '/auth', '/create-order', '/agent', '/admin'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  if (shouldHide || itemCount === 0 || !mounted || !langContext) {
    return null;
  }

  const { formatPrice, t } = langContext;

  const portalContainer = document.getElementById('floating-cart-portal');
  if (!portalContainer) {
    return null;
  }

  // Use current date as "purchase date" for the package details modal
  const currentDate = new Date().toISOString();

  return (
    <>
      {createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[9996] bg-[#FAF7F2] border-t border-gray-200 safe-area-pb"
          >
            <div className="container mx-auto px-4 py-3 max-w-5xl">
              {/* Main row with button, message, and buy now */}
              <div className="flex items-center justify-between gap-4">
                {/* Left side - Package details button */}
                <Button
                  variant="outline"
                  onClick={() => setShowPackageDetails(true)}
                  className="flex items-center gap-2 rounded-full border-orange-400 bg-white text-gray-700 hover:bg-gray-50 shrink-0"
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {t('cart.packageDetails') || 'Package details'}
                  </span>
                </Button>
                
                {/* Center - Warning message (hidden on very small screens) */}
                <p className="hidden sm:block text-xs sm:text-sm text-orange-500 font-medium text-center flex-1 px-2">
                  {t('cart.esimCompatibilityWarning') || 'To proceed with your order, please confirm your device supports eSIM and is network-unlocked.'}
                </p>
                
                {/* Right side - Total + Buy now */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-gray-500">{t('cart.total') || 'Total'}</span>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(totalPrice)}</p>
                  </div>
                  <Button 
                    onClick={() => navigate('/cart', { state: { from: location.pathname } })}
                    className={cn(
                      "bg-orange-500 hover:bg-orange-600 text-white font-semibold",
                      "px-5 py-2 rounded-full flex items-center gap-1.5"
                    )}
                  >
                    <span>{t('cart.viewCart') || 'View Cart'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        portalContainer
      )}
      
      {/* Package Details Modal - rendered outside the portal so it's not constrained */}
      <PackageDetailsModal
        open={showPackageDetails}
        onOpenChange={setShowPackageDetails}
        purchaseDate={currentDate}
      />
    </>
  );
}
