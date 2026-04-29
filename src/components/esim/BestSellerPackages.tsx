import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { PackageQuickViewDialog } from './PackageQuickViewDialog';
import { useBestSellerPackages, BestSellerPackage } from '@/hooks/useBestSellerPackages';
import { getLocalizedCountryName } from '@/lib/countryTranslations';

// No badges — clean, uniform cards

interface BestSellerPackagesProps {
  variant?: 'default' | 'packages';
  layout?: 'standalone' | 'embedded';
}

export function BestSellerPackages({ variant = 'default', layout = 'standalone' }: BestSellerPackagesProps) {
  const {
    t,
    formatPrice,
    language
  } = useLanguage();
  const {
    addToCart,
    items
  } = useCart();
  const {
    toast
  } = useToast();
  const {
    data: packages = [],
    isLoading: loading
  } = useBestSellerPackages(language);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<BestSellerPackage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Calculate transform offsets to move each card to center (FLIP technique)
  useEffect(() => {
    if (loading || packages.length === 0 || !gridRef.current) return;
    const calculateCenterOffsets = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const cards = grid.querySelectorAll('.bestseller-card');
      const gridRect = grid.getBoundingClientRect();
      const centerX = gridRect.width / 2;
      const centerY = gridRect.height / 2;
      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left - gridRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top - gridRect.top + cardRect.height / 2;

        // Calculate transform to move card to center
        const offsetX = centerX - cardCenterX;
        const offsetY = centerY - cardCenterY;
        (card as HTMLElement).style.setProperty('--to-center-x', `${offsetX}px`);
        (card as HTMLElement).style.setProperty('--to-center-y', `${offsetY}px`);
      });
    };

    // Calculate after render
    requestAnimationFrame(calculateCenterOffsets);

    // Recalculate on resize
    window.addEventListener('resize', calculateCenterOffsets);
    return () => window.removeEventListener('resize', calculateCenterOffsets);
  }, [packages, loading]);

  // Intersection Observer for stack-to-spread animation
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || loading || packages.length === 0) return;

    // Small delay to ensure stacked state is visible first
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Wait 500ms to show the stacked state before spreading
            setTimeout(() => setIsVisible(true), 500);
            observer.disconnect(); // Only trigger once
          }
        });
      }, {
        threshold: 0.2
      });
      observer.observe(section);
      return () => observer.disconnect();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [loading, packages.length]);
  const handleAddToCart = (pkg: BestSellerPackage) => {
    addToCart({
      packageId: pkg.id,
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      country: pkg.country_name,
      data_amount: pkg.data_amount,
      validity: `${pkg.validity_days} days`,
      package_type: pkg.package_type || undefined,
      speed_after_limit: pkg.speed_after_limit || undefined,
      qos_speed: pkg.qos_speed || undefined,
      carrier: pkg.carrier || undefined,
      network_type: pkg.network_type || undefined,
      sim_type: pkg.sim_type || 'eSIM',
      daily_reset_amount: pkg.daily_reset_amount || undefined,
      hot_spot: pkg.hot_spot || false,
      support_sms: pkg.support_sms || false,
      support_voice: pkg.support_voice || false,
      support_data: pkg.support_data ?? true
    });
    setAddedIds(prev => new Set(prev).add(pkg.id));
    toast({
      title: t('packages.addedToCart'),
      description: pkg.name
    });

    // Reset button after 2 seconds
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(pkg.id);
        return next;
      });
    }, 2000);
  };
  const isInCart = (pkgId: string) => items.some(item => item.packageId === pkgId);
  const justAdded = (pkgId: string) => addedIds.has(pkgId);
  if (loading) {
    return <section className="py-16 md:py-24">
        <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(8)].map((_, i) => <div key={i} className="h-56 rounded-2xl bg-white animate-pulse border border-gray-100" />)}
          </div>
        </div>
      </section>;
  }
  if (packages.length === 0) return null;

  const content = (
    <>
      {/* Section header */}
      <div className="text-center mb-8 md:mb-12">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500/80 mb-3">
          {t('packages.bestSellersSubtitle')}
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-gray-900 leading-tight">
          {t('packages.bestSellers')}
        </h2>
      </div>

      {/* Cards grid */}
      <div className={`bestseller-wrapper ${variant === 'packages' ? 'pb-28' : ''}`}>
          <div ref={gridRef} className={`bestseller-grid ${isVisible ? 'is-spread' : 'is-stacked'}`}>
            {packages.map((pkg, index) => {
            const added = justAdded(pkg.id);
            const inCart = isInCart(pkg.id);
            const staggerDelay = index * 250;

            return (
              <div
                key={pkg.id}
                className={`bestseller-card ${isVisible ? 'is-visible' : ''} group relative rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col`}
                style={{ '--stagger-delay': `${staggerDelay}ms` } as React.CSSProperties}
              >
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  {/* Flag + Country + Duration */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <FlagIcon countryCode={pkg.country_code} countryName={pkg.country_name} size="lg" className="flex-shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm leading-snug text-gray-900 truncate">
                        {getLocalizedCountryName(pkg.country_name, language)}
                      </h3>
                      <span className="text-gray-400 text-[11px] font-medium">
                        {pkg.validity_days} {t('packages.days')}
                      </span>
                    </div>
                  </div>

                  {/* Data pill */}
                  <div className="mb-auto">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium">
                      ∞ {t('packages.unlimitedData')}
                    </span>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-gray-100/80">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                      {formatPrice(pkg.price)}
                    </span>
                    <Button
                      onClick={() => handleAddToCart(pkg)}
                      disabled={added}
                      size="sm"
                      className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        added
                          ? 'bg-gray-800 hover:bg-gray-800'
                          : inCart
                            ? 'bg-orange-400 hover:bg-orange-500'
                            : 'bg-orange-500 hover:bg-orange-600'
                      } text-white`}
                    >
                      {added ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <ShoppingCart className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>

                  {/* Info link */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPackage(pkg);
                      setDialogOpen(true);
                    }}
                    className="text-[10px] text-gray-400 hover:text-orange-500 transition-colors mt-2 text-left font-medium"
                  >
                    {t('packages.quickView.title')} →
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>

      <PackageQuickViewDialog package={selectedPackage} open={dialogOpen} onOpenChange={setDialogOpen} onAddToCart={handleAddToCart} isInCart={selectedPackage ? isInCart(selectedPackage.id) : false} justAdded={selectedPackage ? justAdded(selectedPackage.id) : false} />
    </>
  );

  // Embedded layout: no section/container wrapper (used when already inside a container)
  if (layout === 'embedded') {
    return (
      <div ref={sectionRef as React.RefObject<HTMLDivElement>} className="relative">
        {content}
      </div>
    );
  }

  // Standalone layout: full section with container (default, used on Home page)
  return (
    <section ref={sectionRef} className="py-16 md:py-24 relative overflow-hidden bg-[#FAF7F2]">
      <div className="container relative">
        {content}
      </div>
    </section>
  );
}