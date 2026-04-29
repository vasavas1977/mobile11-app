import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getPopularDestinationsForUser, Destination } from '@/lib/popularDestinations';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useABTestVariant } from '@/hooks/useABTestVariant';
import { applyOrderingStrategy } from '@/lib/abTestUtils';


// Get or create session ID for anonymous tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export default function PopularDestinations() {
  const { language, t, localizeField } = useLanguage();
  const { userCountry, loading: locationLoading } = useUserLocation();
  const { variant, loading: variantLoading } = useABTestVariant();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [batchProgress, setBatchProgress] = useState<number[]>([0, 0, 0]); // Progress 0-1 for each batch
  const sectionRef = useRef<HTMLDivElement>(null);

  // Constants for scroll-linked animation
  // Custom batch boundaries: [0-4], [5-8], [9+]
  const BATCH_BOUNDARIES = [5, 9]; // First batch ends at index 5, second at index 9
  const FLIGHT_DISTANCE = 400; // pixels from left/right
  
  // Helper to get batch index for a card
  const getBatchIndex = (cardIndex: number): number => {
    if (cardIndex < BATCH_BOUNDARIES[0]) return 0; // Cards 0-4
    if (cardIndex < BATCH_BOUNDARIES[1]) return 1; // Cards 5-8
    return 2; // Cards 9+
  };

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Scroll-linked animation - progress tied directly to scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || prefersReducedMotion) {
        setBatchProgress([1, 1, 1]); // Show all immediately if reduced motion
        return;
      }
      
      // Check if desktop (lg breakpoint: 1024px)
      const isDesktop = window.innerWidth >= 1024;
      
      // Mobile: show immediately
      if (!isDesktop) {
        setBatchProgress([1, 1, 1]);
        return;
      }
      
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionHeight = rect.height;
      
      // Calculate overall section scroll progress
      // 0 = section just entering viewport, 1 = section fully scrolled through
      const sectionTop = rect.top;
      const scrollableDistance = viewportHeight + sectionHeight;
      const scrolled = viewportHeight - sectionTop;
      const overallProgress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
      
      // Map overall progress to 3 batch progress values
      // Desktop: faster animation (all complete by ~55% scroll, well before 75%)
      const newBatchProgress = [0, 1, 2].map(batchIndex => {
        const batchStart = batchIndex * 0.15; // 0%, 15%, 30%
        const batchEnd = batchStart + 0.25;   // 25%, 40%, 55%
        const progress = (overallProgress - batchStart) / (batchEnd - batchStart);
        return Math.max(0, Math.min(1, progress));
      });
      
      setBatchProgress(newBatchProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!locationLoading && !variantLoading && userCountry) {
      const rawDestinations = getPopularDestinationsForUser(userCountry, language);
      
      // Apply A/B test ordering strategy if variant exists
      const orderedDestinations = applyOrderingStrategy(
        rawDestinations,
        variant.config?.orderingStrategy
      );
      
      setDestinations(orderedDestinations);
      setLoading(false);
    }
  }, [userCountry, language, locationLoading, variantLoading, variant]);


  const handleDestinationClick = async (destination: Destination) => {
    // Track the click asynchronously (don't block navigation)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = user ? null : getSessionId();
      
      // Insert analytics with A/B test tracking
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('destination_analytics')
        .insert({
          destination: destination.nameEn,
          destination_type: destination.filterType,
          user_country: userCountry,
          user_language: language,
          user_id: user?.id || null,
          session_id: sessionId,
          test_id: variant.testId,
          variant_id: variant.variantId
        })
        .select('id')
        .single();

      if (!analyticsError && analyticsData) {
        // Track potential conversion (will be completed when order is created)
        await supabase.from('destination_conversions').insert({
          test_id: variant.testId,
          variant_id: variant.variantId,
          analytics_id: analyticsData.id,
          user_id: user?.id || null,
          session_id: sessionId,
          destination: destination.nameEn,
          clicked_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to track destination click:', error);
      // Don't block navigation on tracking failure
    }

    // Navigate to packages page
    if (destination.filterType === 'all') {
      navigate('/packages');
    } else {
      navigate('/packages', {
        state: {
          filterType: destination.filterType,
          filterValue: destination.filterValue
        }
      });
    }
  };

  // Filter to only destinations with images (premium feel) + view-all
  const displayDestinations = destinations.filter(d => d.image || d.id === 'view-all');

  // Loading state
  if (loading || locationLoading || variantLoading) {
    return (
      <div className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-gray-900">
            {t('landing.popularDestinations.title')}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (displayDestinations.length === 0) return null;

  return (
    <div ref={sectionRef} className="space-y-10 overflow-hidden">
      {/* Editorial header */}
      <div className="text-center space-y-3">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500/80">
          {t('landing.popularDestinations.subtitle')}
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-gray-900 leading-tight">
          {t('landing.popularDestinations.title')}
        </h2>
      </div>

      {/* Destination grid — fewer, larger, cinematic cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {displayDestinations.map((destination, index) => {
          const name = localizeField(destination, 'name');

          // Scroll-linked animation
          const batchIndex = getBatchIndex(index);
          const progress = batchProgress[batchIndex];
          const isFromLeft = batchIndex % 2 === 0;
          const translateX = prefersReducedMotion ? 0 : (1 - progress) * FLIGHT_DISTANCE * (isFromLeft ? -1 : 1);
          const translateY = prefersReducedMotion ? 0 : (1 - progress) * 150;
          const rotate = prefersReducedMotion ? 0 : (1 - progress) * 8 * (isFromLeft ? -1 : 1);
          const opacity = prefersReducedMotion ? 1 : progress;

          // View All button
          if (destination.id === 'view-all') {
            return (
              <div
                key={destination.id}
                className="col-span-2 md:col-span-3 lg:col-span-4 flex justify-center pt-2"
                style={{
                  transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
                  opacity,
                }}
              >
                <button
                  onClick={() => handleDestinationClick(destination)}
                  className="flex items-center gap-3 px-7 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl group text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>{name}</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          }

          // Destination card — tall cinematic ratio with dark overlay
          return (
            <div
              key={destination.id}
              className="relative overflow-hidden rounded-2xl cursor-pointer group aspect-[3/4]"
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
                opacity,
              }}
              onClick={() => handleDestinationClick(destination)}
            >
              {/* Photo */}
              <OptimizedImage
                src={destination.image}
                alt={destination.nameEn}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading={index < 4 ? "eager" : "lazy"}
                fetchPriority={index < 4 ? "high" : "low"}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                placeholderEmoji={destination.flag}
              />

              {/* Gradient overlay — subtle, darkens on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-500 group-hover:from-black/70" />

              {/* Bottom text */}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 flex items-end justify-between">
                <div className="space-y-0.5">
                  <span className="text-white/60 text-lg md:text-xl">{destination.flag}</span>
                  <h3 className="text-white font-bold text-base md:text-lg leading-tight drop-shadow-md transition-transform duration-300 group-hover:-translate-y-0.5">
                    {name}
                  </h3>
                </div>
                <ChevronRight className="h-4 w-4 text-white/0 group-hover:text-white/80 transition-all duration-300 group-hover:translate-x-0.5 flex-shrink-0 mb-0.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
