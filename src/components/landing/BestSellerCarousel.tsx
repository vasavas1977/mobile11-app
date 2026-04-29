import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, ChevronRight, Flame, Star, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { getCountryFlag } from '@/lib/countryFlags';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { PackageQuickViewDialog } from '@/components/esim/PackageQuickViewDialog';

// Same best-seller IDs as BestSellerPackages
const BEST_SELLER_IDS = [
  '69687f42-cfcf-412d-963f-d6b160c25941', // Singapore 3 Days 5Mbps
  'd8264ece-d88a-465b-852e-1a043bbb7127', // Japan 5 Days 5Mbps
  '77d64e29-97c1-4952-aa8a-5a80c3ef2df5', // Korea 5 Days 5Mbps
  'c826c177-c1ac-4c3d-bdc2-dafa12f77396', // China 5 Days 5Mbps
  '3f40a548-aa6c-4eff-8005-36ae1d48b2ef', // Hong Kong/Macau 3 Days 5Mbps
  'edeb7762-0186-4364-b27e-7bc63b74d817', // Australia 5 Days 1Mbps
  '68701b92-8f94-4c7a-9393-2951d391c5e1', // Europe 42 Countries 5 Days 5Mbps Limitless
  'fe25cb9f-8e73-4884-980f-2946b2d712b1', // USA/Canada 7 Days 1Mbps Limitless
];

// Badge types for different cards
const CARD_BADGES: Record<number, { type: 'hot' | 'popular' | 'value' | 'trending'; label: string }> = {
  0: { type: 'hot', label: '🔥 HOT' },
  1: { type: 'popular', label: '⭐ POPULAR' },
  2: { type: 'value', label: '💎 BEST VALUE' },
  5: { type: 'trending', label: '📈 TRENDING' },
};

interface Package {
  id: string;
  name: string;
  country_name: string;
  country_code: string;
  price: number;
  validity_days: number;
  data_amount: string;
  qos_speed: string | null;
  package_type: string | null;
  description: string | null;
  speed_after_limit: string | null;
  carrier: string | null;
  network_type: string | null;
  sim_type: string | null;
  daily_reset_amount: string | null;
  support_data: boolean | null;
  support_sms: boolean | null;
  support_voice: boolean | null;
  hot_spot: boolean | null;
}

export function BestSellerCarousel() {
  const { t, formatPrice } = useLanguage();
  const { addToCart, items } = useCart();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('esim_packages')
        .select('id, name, country_name, country_code, price, validity_days, data_amount, qos_speed, package_type, description, speed_after_limit, carrier, network_type, sim_type, daily_reset_amount, support_data, support_sms, support_voice, hot_spot')
        .in('id', BEST_SELLER_IDS)
        .eq('is_active', true);

      if (!error && data) {
        const sorted = BEST_SELLER_IDS
          .map(id => data.find(p => p.id === id))
          .filter(Boolean) as Package[];
        setPackages(sorted);
      }
      setLoading(false);
    };

    fetchPackages();
  }, []);

  const handleAddToCart = (pkg: Package) => {
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
      support_data: pkg.support_data ?? true,
    });

    setAddedIds(prev => new Set(prev).add(pkg.id));

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

  const getBadgeColors = (type: string) => {
    switch (type) {
      case 'hot':
        return 'bg-red-500';
      case 'popular':
        return 'bg-orange-500';
      case 'value':
        return 'bg-emerald-500';
      case 'trending':
        return 'bg-violet-500';
      default:
        return 'bg-orange-500';
    }
  };

  if (loading) {
    return (
      <section className="py-12 md:py-20 relative overflow-hidden bg-[#FAF7F2]">
        <div className="container">
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[280px] h-60 rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (packages.length === 0) return null;

  return (
    <section 
      ref={sectionRef}
      className="py-16 md:py-28 relative overflow-hidden bg-[#FAF7F2]"
    >
      {/* Floating Decorative Shapes - matching Plan Types section */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-4 -left-4 w-16 h-16 md:w-24 md:h-24 bg-emerald-200/40 rotate-45 rounded-xl animate-v2-float-slow" />
        <div className="absolute top-8 -right-6 w-20 h-20 md:w-32 md:h-32 bg-orange-200/40 rounded-full animate-v2-float-medium" />
        <div className="absolute -bottom-4 left-12 w-12 h-12 md:w-20 md:h-20 bg-sky-200/40 rotate-45 rounded-lg animate-v2-float-fast" />
        <div className="absolute bottom-12 -right-8 w-16 h-16 md:w-28 md:h-28 bg-amber-200/30 rounded-full animate-v2-float-slow" />
      </div>
      
      <div className="container relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 md:mb-12 lg:mb-16">
          <div className="relative">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="relative">
                <Flame className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-orange-500" />
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 text-amber-400" />
              </div>
              <h2 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-display font-bold text-[#1a1a1a]">
                {t('landing.bestSellers.title')}
              </h2>
            </div>
            <p className="text-[#4a4a4a] text-xs md:text-sm lg:text-base xl:text-lg max-w-xl">
              {t('landing.bestSellers.subtitle')}
            </p>
            {/* Underline */}
            <div className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full w-24 md:w-32 lg:w-48" />
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/packages')}
            className="hidden sm:flex items-center gap-2 group bg-white border-gray-200 hover:border-orange-300 hover:bg-white transition-all duration-300"
          >
            <span className="text-orange-500 font-semibold">
              {t('landing.bestSellers.viewAll')}
            </span>
            <ChevronRight className="h-4 w-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Carousel with premium cards */}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 md:-ml-5 lg:-ml-6">
            {packages.map((pkg, index) => {
              const added = justAdded(pkg.id);
              const inCart = isInCart(pkg.id);
              const badge = CARD_BADGES[index];

              return (
                <CarouselItem 
                  key={pkg.id} 
                  className="pl-4 md:pl-5 lg:pl-6 basis-[80%] sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <div className="h-full">
                    {/* White card matching Plan Types section */}
                    <div className="group relative h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                      {/* Badge */}
                      {badge && (
                        <div className={`${getBadgeColors(badge.type)} text-white text-xs font-bold text-center py-1.5 md:py-2`}>
                          {badge.label}
                        </div>
                      )}

                      <div className={`p-4 md:p-5 lg:p-6 flex flex-col h-full ${badge ? '' : 'pt-4'}`}>
                        {/* Flag + Info button */}
                        <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                          <span className="text-3xl md:text-4xl lg:text-5xl group-hover:scale-110 transition-transform duration-300 inline-block">
                            {getCountryFlag(pkg.country_code, pkg.country_name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm md:text-base lg:text-lg leading-tight text-[#1a1a1a] group-hover:text-orange-500 transition-colors">
                              {pkg.country_name}
                            </h3>
                            <span className="text-gray-500 text-xs md:text-sm lg:text-base flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400" />
                              {pkg.validity_days} {t('packages.days')}
                            </span>
                          </div>
                          {/* Info button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full border border-gray-200 hover:border-orange-300 hover:bg-orange-50 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPackage(pkg);
                              setDialogOpen(true);
                            }}
                            aria-label={t('packages.quickView.title')}
                          >
                            <Info className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>

                        {/* Unlimited badge + Value tagline */}
                        <div className="mb-4 md:mb-5 space-y-1.5">
                          <span className="inline-flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs md:text-sm font-semibold border border-emerald-200">
                            <span className="text-base md:text-lg">∞</span>
                            {t('packages.unlimitedData')}
                          </span>
                          <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                            <span className="text-amber-500">💡</span>
                            {pkg.package_type === 'limitless' 
                              ? (t('packages.valueTagline.limitless'))
                              : pkg.package_type === 'max_speed'
                                ? (t('packages.valueTagline.maxSpeed'))
                                : (t('packages.valueTagline.dayPass'))
                            }
                          </p>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Price + Button */}
                        <div className="flex flex-col gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-100">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1a1a]">
                              {formatPrice(pkg.price)}
                            </span>
                            <span className="text-gray-400 text-xs md:text-sm line-through">
                              {formatPrice(pkg.price * 1.5)}
                            </span>
                          </div>
                          
                          <Button
                            onClick={() => handleAddToCart(pkg)}
                            disabled={added}
                            className={`w-full h-10 md:h-11 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
                              added 
                                ? 'bg-orange-600 hover:bg-orange-600 text-white' 
                                : inCart 
                                  ? 'bg-orange-400 hover:bg-orange-500 text-white' 
                                  : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                          >
                            {added ? (
                              <span className="flex items-center justify-center gap-2">
                                <Check className="w-4 h-4 md:w-5 md:h-5" />
                                {t('packages.added')}
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                                {t('packages.addToCart')}
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          {/* Navigation arrows */}
          <CarouselPrevious className="hidden md:flex -left-5 lg:-left-7 w-12 h-12 bg-white border-gray-200 hover:border-orange-300 hover:bg-white shadow-lg transition-all" />
          <CarouselNext className="hidden md:flex -right-5 lg:-right-7 w-12 h-12 bg-white border-gray-200 hover:border-orange-300 hover:bg-white shadow-lg transition-all" />
        </Carousel>

        {/* Mobile View All button */}
        <div className="flex justify-center mt-12 sm:hidden">
          <Button 
            onClick={() => navigate('/packages')}
            className="w-full max-w-xs h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base shadow-lg"
          >
            {t('landing.bestSellers.viewAll')}
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Quick View Dialog */}
      <PackageQuickViewDialog
        package={selectedPackage}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddToCart={handleAddToCart}
        isInCart={selectedPackage ? isInCart(selectedPackage.id) : false}
        justAdded={selectedPackage ? justAdded(selectedPackage.id) : false}
      />
    </section>
  );
}
