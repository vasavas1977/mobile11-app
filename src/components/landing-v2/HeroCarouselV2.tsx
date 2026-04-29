import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Wifi, Zap } from 'lucide-react';
import { FloatingDecorations } from './FloatingDecorations';
import { LottieAnimation } from './LottieAnimation';
import { useLanguage } from '@/contexts/LanguageContext';

interface SlideIllustration {
  id: number;
  illustration: React.ReactNode;
}

const slideIllustrations: SlideIllustration[] = [
  {
    id: 1,
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-72 h-72 md:w-96 md:h-96">
          <LottieAnimation
            src="/assets/lottie/traveler.lottie"
            className="w-full h-full"
          />
        </div>
      </div>
    ),
  },
  {
    id: 2,
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-[hsl(199,95%,88%)] to-[hsl(199,89%,75%)] flex items-center justify-center">
            <div className="text-center">
              <Wifi className="w-20 h-20 md:w-24 md:h-24 text-[hsl(199,89%,50%)] mx-auto mb-4" />
              <p className="text-[hsl(20,14%,10%)] font-semibold text-lg" data-slide-label="speed" />
            </div>
          </div>
          <div className="absolute -top-2 -left-4 w-10 h-10 bg-[hsl(25,95%,53%)] rotate-45 rounded-sm animate-v2-float-medium" />
          <div className="absolute -bottom-4 -right-2 w-8 h-8 bg-[hsl(142,76%,45%)] rounded-full animate-v2-float-slow" />
        </div>
      </div>
    ),
  },
  {
    id: 3,
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-[hsl(142,69%,85%)] to-[hsl(142,76%,65%)] flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-20 h-20 md:w-24 md:h-24 text-[hsl(142,76%,35%)] mx-auto mb-4" />
              <p className="text-[hsl(20,14%,10%)] font-semibold text-lg" data-slide-label="setup" />
            </div>
          </div>
          <div className="absolute -top-4 right-0 w-8 h-8 bg-[hsl(30,100%,72%)] rounded-full animate-v2-float-slow" />
          <div className="absolute bottom-0 -left-6 w-6 h-6 bg-[hsl(25,95%,53%)] rotate-45 rounded-sm animate-v2-float-medium" />
        </div>
      </div>
    ),
  },
];

export const HeroCarouselV2: React.FC = () => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      ...slideIllustrations[0],
      headline: t('heroCarousel.slide1.headline'),
      subheadline: t('heroCarousel.slide1.subheadline'),
      description: t('heroCarousel.slide1.description'),
      ctaPrimary: t('heroCarousel.slide1.ctaPrimary'),
      ctaSecondary: t('heroCarousel.slide1.ctaSecondary'),
    },
    {
      ...slideIllustrations[1],
      headline: t('heroCarousel.slide2.headline'),
      subheadline: t('heroCarousel.slide2.subheadline'),
      description: t('heroCarousel.slide2.description'),
      ctaPrimary: t('heroCarousel.slide2.ctaPrimary'),
      ctaSecondary: t('heroCarousel.slide2.ctaSecondary'),
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-[hsl(199,95%,88%)] to-[hsl(199,89%,75%)] flex items-center justify-center">
              <div className="text-center">
                <Wifi className="w-20 h-20 md:w-24 md:h-24 text-[hsl(199,89%,50%)] mx-auto mb-4" />
                <p className="text-[hsl(20,14%,10%)] font-semibold text-lg">{t('heroCarousel.slide2.speedLabel')}</p>
              </div>
            </div>
            <div className="absolute -top-2 -left-4 w-10 h-10 bg-[hsl(25,95%,53%)] rotate-45 rounded-sm animate-v2-float-medium" />
            <div className="absolute -bottom-4 -right-2 w-8 h-8 bg-[hsl(142,76%,45%)] rounded-full animate-v2-float-slow" />
          </div>
        </div>
      ),
    },
    {
      ...slideIllustrations[2],
      headline: t('heroCarousel.slide3.headline'),
      subheadline: t('heroCarousel.slide3.subheadline'),
      description: t('heroCarousel.slide3.description'),
      ctaPrimary: t('heroCarousel.slide3.ctaPrimary'),
      ctaSecondary: t('heroCarousel.slide3.ctaSecondary'),
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-[hsl(142,69%,85%)] to-[hsl(142,76%,65%)] flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-20 h-20 md:w-24 md:h-24 text-[hsl(142,76%,35%)] mx-auto mb-4" />
                <p className="text-[hsl(20,14%,10%)] font-semibold text-lg">{t('heroCarousel.slide3.setupLabel')}</p>
              </div>
            </div>
            <div className="absolute -top-4 right-0 w-8 h-8 bg-[hsl(30,100%,72%)] rounded-full animate-v2-float-slow" />
            <div className="absolute bottom-0 -left-6 w-6 h-6 bg-[hsl(25,95%,53%)] rotate-45 rounded-sm animate-v2-float-medium" />
          </div>
        </div>
      ),
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
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const slide = slides[currentSlide];

  return (
    <section 
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-[hsl(35,33%,96%)]"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <FloatingDecorations />

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="order-2 md:order-1 text-center md:text-left animate-v2-fade-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(20,14%,10%)] mb-2 leading-tight">
              {slide.headline}
            </h1>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(25,95%,53%)] mb-6 leading-tight">
              {slide.subheadline}
            </h2>
            <p className="text-lg md:text-xl text-[hsl(20,6%,45%)] mb-8 max-w-lg mx-auto md:mx-0">
              {slide.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
              <button className="btn-v2-primary text-base px-8 py-3">
                {slide.ctaPrimary}
              </button>
              <button className="btn-v2-outline text-base px-8 py-3">
                {slide.ctaSecondary}
              </button>
            </div>
          </div>

          <div className="order-1 md:order-2 flex justify-center animate-v2-slide-right">
            {slide.illustration}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-105"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-[hsl(20,14%,10%)]" />
          </button>

          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-[hsl(25,95%,53%)] w-8'
                    : 'bg-[hsl(20,14%,10%)]/20 hover:bg-[hsl(20,14%,10%)]/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-105"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-[hsl(20,14%,10%)]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroCarouselV2;
