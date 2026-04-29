import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Globe, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';

// Lottie wrapper component for slide 1 - GPU-accelerated scaling for smooth rendering
// Only renders when isActive to save bandwidth on non-visible slides
const TravelerLottie: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <div className="w-full h-full flex items-center justify-center transform-gpu lottie-smooth">
    {isActive ? (
      <LottieAnimation
        src="/assets/lottie/traveler-2.lottie"
        className="w-full h-full scale-[1.6] md:scale-[2] origin-center"
        devicePixelRatio={2}
        speed={0.85}
        useFrameInterpolation={true}
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg" />
    )}
  </div>
);

// Lottie wrapper component for slide 2 - GPU-accelerated scaling for smooth playback
// Only renders when isActive to save bandwidth on non-visible slides
const SelfieTravelerLottie: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <div className="w-full h-full flex items-center justify-center transform-gpu lottie-smooth">
    {isActive ? (
      <LottieAnimation
        src="/assets/lottie/selfie-traveler.lottie"
        className="w-full h-full scale-[1.6] md:scale-[2] origin-center"
        devicePixelRatio={2}
        speed={0.85}
        useFrameInterpolation={true}
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg" />
    )}
  </div>
);

// Lottie wrapper component for slide 3 - QR Payment animation
const QRPaymentLottie: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <div className="w-full h-full flex items-center justify-center transform-gpu lottie-smooth">
    {isActive ? (
      <LottieAnimation
        src="/assets/lottie/qr-payment.lottie"
        className="w-full h-full scale-[1.6] md:scale-[1.6] origin-center"
        devicePixelRatio={2}
        speed={0.85}
        useFrameInterpolation={true}
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg" />
    )}
  </div>
);

// Lottie wrapper component for slide 4 - Loyalty/Trophy animation
const TrophyLottie: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <div className="w-full h-full flex items-center justify-center transform-gpu lottie-smooth">
    {isActive ? (
      <LottieAnimation
        src="/assets/lottie/girl-trophy.lottie"
        className="w-full h-full scale-[2.24] md:scale-[2.24] origin-center"
        devicePixelRatio={2}
        speed={0.85}
        useFrameInterpolation={true}
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg" />
    )}
  </div>
);

// Lottie wrapper component for slide 5 - Referral animation
const ReferralLottie: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <div className="w-full h-full flex items-center justify-center transform-gpu lottie-smooth">
    {isActive ? (
      <LottieAnimation
        src="/assets/lottie/man-woman-hi.lottie"
        className="w-full h-full scale-[1.44] md:scale-[1.44] origin-center"
        devicePixelRatio={2}
        speed={0.85}
        useFrameInterpolation={true}
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg" />
    )}
  </div>
);

interface Slide {
  id: number;
  headline: string;
  subheadline: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
  illustration: React.FC<{ isActive: boolean }>;
}


export const HeroCarousel: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      headline: t('landing.heroTitle') || "Stay Connected",
      subheadline: t('landing.heroSubtitle') || "Wherever You Go",
      description: t('landing.heroDescription') || "Get instant eSIM data for 150+ countries. No physical SIM needed.",
      ctaPrimary: t('landing.viewAllPlans') || "View All Plans",
      ctaSecondary: t('landing.howItWorks') || "How It Works",
      illustration: TravelerLottie,
    },
    {
      id: 2,
      headline: t('landing.slide2.headline') || "Feel the freedom",
      subheadline: t('landing.slide2.subheadline') || "of unlimited data",
      description: t('landing.slide2.description') || "Go ahead and watch that video, listen to that song, download that app — get unlimited data for uninterrupted connection.",
      ctaPrimary: t('landing.slide2.ctaPrimary') || "About unlimited packages",
      ctaSecondary: t('landing.howItWorks') || "How It Works",
      illustration: SelfieTravelerLottie,
    },
    {
      id: 3,
      headline: t('landing.slide3.headline') || "Instant Setup",
      subheadline: t('landing.slide3.subheadline') || "QR Activation",
      description: t('landing.slide3.description') || "Scan, install, and connect in minutes. It's that simple.",
      ctaPrimary: t('landing.slide3.ctaPrimary') || "Get Started",
      ctaSecondary: t('landing.slide3.ctaSecondary') || "View Demo",
      illustration: QRPaymentLottie,
    },
    {
      id: 4,
      headline: t('landing.slide4.headline') || "Level up with every",
      subheadline: t('landing.slide4.subheadline') || "purchase",
      description: t('landing.slide4.description') || "Get 5% of each purchase amount in Mobile11 Money — you can level up to 10% and 15% cashback.",
      ctaPrimary: t('landing.slide4.ctaPrimary') || "View membership levels",
      ctaSecondary: t('landing.howItWorks') || "How It Works",
      illustration: TrophyLottie,
    },
    {
      id: 5,
      headline: t('landing.slide5.headline') || "Refer friends.",
      subheadline: t('landing.slide5.subheadline') || "Earn rewards.",
      description: t('landing.slide5.description') || "Get $5 USD in Mobile11 Money for each referral that makes a purchase — your friend will receive $5 too.",
      ctaPrimary: t('landing.slide5.ctaPrimary') || "Refer friends now",
      ctaSecondary: t('landing.howItWorks') || "How It Works",
      illustration: ReferralLottie,
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 7000);
  };

  // Progress bar animation
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    setProgress(0);
    const duration = 8000;
    const intervalMs = 50;
    const increment = (intervalMs / duration) * 100;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + increment;
      });
    }, intervalMs);

    const slideInterval = setInterval(nextSlide, duration);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [isAutoPlaying, nextSlide, currentSlide]);

  const slide = slides[currentSlide];

  return (
    <section 
      className="relative min-h-[90vh] flex items-center overflow-x-hidden bg-[#FAF7F2]"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content - with staggered animations, flipped order for slide 2 */}
          <div key={currentSlide} className={`text-center md:text-left pt-12 md:pt-0 ${currentSlide === 1 ? 'order-2 md:order-2' : 'order-2 md:order-1'}`}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gray-800 mb-2 leading-tight animate-slide-in-left opacity-0" style={{ animationFillMode: 'forwards' }}>
              {slide.headline}
            </h1>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-orange-500 mb-6 leading-tight animate-slide-in-left opacity-0 animate-delay-100" style={{ animationFillMode: 'forwards' }}>
              {slide.subheadline}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-lg mx-auto md:mx-0 animate-slide-up-fade opacity-0 animate-delay-200" style={{ animationFillMode: 'forwards' }}>
              {slide.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-6 animate-slide-up-fade opacity-0 animate-delay-300" style={{ animationFillMode: 'forwards' }}>
              <Button 
                size="lg"
                onClick={() => {
                  if (currentSlide === 1) navigate('/limitless');
                  else if (currentSlide === 3) navigate('/loyalty-program');
                  else if (currentSlide === 4) navigate('/refer-and-earn');
                  else navigate('/packages');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {slide.ctaPrimary}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => {
                  if (currentSlide === 3) navigate('/loyalty-program');
                  else if (currentSlide === 4) navigate('/refer-and-earn');
                  else navigate('/what-is-esim');
                }}
                className="border-2 border-gray-800 bg-gray-800 text-white hover:bg-gray-900 px-8 py-3 rounded-full font-semibold"
              >
                {slide.ctaSecondary}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start animate-slide-up-fade opacity-0 animate-delay-400" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Globe className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">151+ Countries</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="text-sm font-medium">4.9 Rating</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Instant Setup</span>
              </div>
            </div>

          </div>

          {/* Right Illustration - animated cartoon, flipped order for slide 2 */}
          <div
            key={`illustration-${currentSlide}`}
            className={`flex justify-center opacity-0 transform-gpu ${currentSlide === 0 ? 'animate-opacity-in' : 'animate-scale-in-bounce'} ${currentSlide === 1 ? 'order-1 md:order-1' : 'order-1 md:order-2'}`}
            style={{ animationFillMode: 'forwards' }}
          >
            <div
              className={`w-full max-w-md lg:max-w-lg xl:max-w-xl transform-gpu ${currentSlide === 0 ? '' : 'animate-gentle-float'} ${currentSlide === 0 ? 'mt-16 md:mt-0' : ''} ${currentSlide === 1 ? 'mt-16 mb-12 md:mt-0 md:mb-0' : ''}`}
            >
              <slide.illustration isActive={currentSlide === slide.id - 1} />
            </div>
          </div>
        </div>

        {/* Progress Bar Navigation (Airalo-style) */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 shadow-md transition-all hover:scale-105"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Progress Bar Segments */}
          <div className="flex gap-2 flex-1 max-w-md">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="h-1.5 flex-1 bg-foreground/10 rounded-full overflow-hidden transition-all hover:bg-foreground/20"
                aria-label={`Go to slide ${index + 1}`}
              >
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-100 ease-linear"
                  style={{ 
                    width: index === currentSlide 
                      ? `${progress}%` 
                      : index < currentSlide 
                        ? '100%' 
                        : '0%' 
                  }}
                />
              </button>
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 shadow-md transition-all hover:scale-105"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
