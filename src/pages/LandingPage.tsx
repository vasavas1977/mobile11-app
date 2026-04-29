import { lazy, Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import PopularDestinations from '@/components/landing/PopularDestinations';
import { BestSellerPackages } from '@/components/esim/BestSellerPackages';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { SongkranPromoBanner } from '@/components/landing/SongkranPromoBanner';
import { SEO, SEO_CONFIG, getFAQStructuredData, getBreadcrumbStructuredData } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, CreditCard, QrCode } from 'lucide-react';
import { usePrefetchBestSellers } from '@/hooks/useBestSellerPackages';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Lazy load below-fold sections for better initial load performance
const WhyMobile11Section = lazy(() => import('@/components/landing/WhyMobile11Section'));
const RegionalPlansHero = lazy(() => import('@/components/regional/RegionalPlansHero').then(m => ({ default: m.RegionalPlansHero })));
const TestimonialSection = lazy(() => import('@/components/landing/TestimonialSection'));
const HowItWorksTabSection = lazy(() => import('@/components/landing/HowItWorksTabSection'));

export function LandingPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const prefetchBestSellers = usePrefetchBestSellers();

  // Prefetch best seller packages immediately on mount
  useEffect(() => {
    prefetchBestSellers(language);
  }, [prefetchBestSellers, language]);

  const homeFAQs = getFAQStructuredData([
    { question: 'What is an eSIM?', answer: 'An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without a physical SIM card. You simply scan a QR code to get connected instantly on your iPhone or Android device.' },
    { question: 'How do I activate my Mobile11 eSIM?', answer: 'After purchase, you receive a QR code via email. Go to your phone Settings > Cellular > Add eSIM, scan the QR code, and you are connected in under 2 minutes. No store visit needed.' },
    { question: 'Which countries does Mobile11 cover?', answer: 'Mobile11 covers 151+ countries including Japan, Korea, China, USA, Europe (42 countries), Thailand, Taiwan, Hong Kong, Singapore, Malaysia, Vietnam, Australia, and more.' },
    { question: 'Is the data really unlimited?', answer: 'Yes, Mobile11 offers truly unlimited data plans with no speed throttling and no data caps in supported countries. Stay connected without worrying about data limits.' },
    { question: 'Do I need to remove my physical SIM?', answer: 'No. eSIM works alongside your physical SIM card. You can keep your home number active for calls and texts while using Mobile11 eSIM for data abroad.' },
    { question: 'Which phones support eSIM?', answer: 'Most modern smartphones support eSIM including iPhone XS and newer, Samsung Galaxy S20 and newer, Google Pixel 3 and newer, and many other Android devices. Check our compatibility page for the full list.' }
  ]);

  const homeBreadcrumbs = getBreadcrumbStructuredData([
    { name: 'Home', url: 'https://mobile11.com/' }
  ]);

  const combinedStructuredData = [homeFAQs, homeBreadcrumbs];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEO 
        title={SEO_CONFIG.home.title}
        description={SEO_CONFIG.home.description}
        keywords={SEO_CONFIG.home.keywords}
        canonical="https://mobile11.com/"
        structuredData={combinedStructuredData}
        alternateLanguages={[
          { lang: 'en', url: 'https://mobile11.com/?lang=en' },
          { lang: 'th', url: 'https://mobile11.com/?lang=th' }
        ]}
      />
      <Header />
      
      {/* Songkran 2026 Promo Banner */}
      <SongkranPromoBanner />
      
      {/* Hero Section - Airalo-inspired Carousel */}
      <HeroCarousel />

      {/* Best Sellers with Stack-to-Spread Animation */}
      <BestSellerPackages />

      {/* How It Works & Learn with Mobile11 - Tabbed Section */}
      <Suspense fallback={<div className="py-24 animate-pulse" />}>
        <HowItWorksTabSection />
      </Suspense>

      {/* Popular Destinations */}
      <section className="py-20 md:py-28 content-visibility-auto">
        <div className="container">
          <PopularDestinations />
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section className="py-24 md:py-32 bg-white content-visibility-auto">
        <div className="container max-w-6xl">
          {/* Section header */}
          <div className="text-center mb-16 md:mb-24">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500/80 mb-5">
              {t('landing.steps.subtitle')}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-gray-900 leading-tight">
              {t('landing.steps.title')}
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              {
                step: '01',
                titleKey: 'landing.steps.step1.title',
                descKey: 'landing.steps.step1.description',
                Icon: MapPin,
              },
              {
                step: '02',
                titleKey: 'landing.steps.step2.title',
                descKey: 'landing.steps.step2.description',
                Icon: CreditCard,
              },
              {
                step: '03',
                titleKey: 'landing.steps.step3.title',
                descKey: 'landing.steps.step3.description',
                Icon: QrCode,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="px-6 md:px-10 py-10 md:py-0 flex flex-col items-center text-center"
              >
                {/* Step number */}
                <span className="text-[0.7rem] font-bold tracking-[0.3em] uppercase text-gray-300 mb-6">
                  Step {item.step}
                </span>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] flex items-center justify-center mb-6">
                  <item.Icon className="w-6 h-6 text-orange-500" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t(item.titleKey)}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-gray-400 max-w-[280px]">
                  {t(item.descKey)}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16 md:mt-24">
            <Button 
              size="lg" 
              onClick={() => navigate('/packages')}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 h-12 text-base font-semibold shadow-md shadow-orange-500/20"
            >
              {t('landing.heroCarousel.cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Value Proposition - Why Choose Mobile11 (Lazy Loaded) */}
      <Suspense fallback={<div className="py-24 animate-pulse" />}>
        <WhyMobile11Section />
      </Suspense>

      {/* Regional Plans Section (Lazy Loaded) */}
      <Suspense fallback={<div className="py-24 animate-pulse" />}>
        <RegionalPlansHero />
      </Suspense>

      {/* Testimonials Section */}
      <Suspense fallback={<div className="py-24 animate-pulse" />}>
        <TestimonialSection />
      </Suspense>

      {/* Social Proof Stats */}
      <section className="py-16 md:py-20 bg-[#FAF7F2] content-visibility-auto">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-6 md:gap-12 text-center">
              <div className="space-y-1.5">
                <div className="text-3xl md:text-5xl font-display font-bold text-gray-900">
                  <AnimatedCounter end={1} duration={2500} suffix="M+" />
                </div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">{t('landing.socialProof.happyTravelers')}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-3xl md:text-5xl font-display font-bold text-gray-900">
                  <AnimatedCounter end={151} duration={2500} />
                </div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">{t('landing.socialProof.countriesCovered')}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-3xl md:text-5xl font-display font-bold text-gray-900">
                  <AnimatedCounter end={4.9} duration={2000} decimals={1} suffix="★" />
                </div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">{t('landing.socialProof.averageRating')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA with Lottie */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden content-visibility-auto">
        <div className="container relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 max-w-5xl mx-auto">
            {/* Content */}
            <div className="text-center md:text-left space-y-5 flex-1">
              <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-gray-900 leading-tight">
                {t('landing.finalCta.title')}
              </h2>
              <p className="text-lg text-gray-500 max-w-lg">
                {t('landing.finalCta.subtitle')}
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/packages')}
                className="bg-orange-500 text-white hover:bg-orange-600 rounded-full px-8 h-12 text-base font-semibold shadow-md shadow-orange-500/20"
              >
                {t('landing.finalCta.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Lottie Animation */}
            <div className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 flex-shrink-0">
              <DotLottieReact
                src="/assets/lottie/worldwide-tour.lottie"
                loop
                autoplay
                speed={0.85}
                useFrameInterpolation={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </section>

      <FooterAiralo />
    </div>
  );
}

export default LandingPage;
