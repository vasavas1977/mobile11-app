import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Gauge, Sun, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';

type PackageType = 'limitless' | 'max_speed' | 'day_pass';

interface PlanTypesInfoSectionProps {
  selectedPlanType: string | null;
  onPlanTypeClick: (type: string | null) => void;
}

export function PlanTypesInfoSection({ selectedPlanType, onPlanTypeClick }: PlanTypesInfoSectionProps) {
  const { t, language } = useLanguage();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showLite, setShowLite] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      if (carouselApi && !isPaused) {
        carouselApi.scrollNext();
      }
    }, 4000);
  }, [carouselApi, isPaused]);

  const pauseAutoPlay = useCallback(() => {
    setIsPaused(true);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const resumeAutoPlay = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (!carouselApi || isPaused) return;
    startAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [carouselApi, isPaused, startAutoPlay]);

  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
      setShowSwipeHint(false);
    };

    const onPointerDown = () => pauseAutoPlay();
    const onPointerUp = () => {
      setTimeout(resumeAutoPlay, 5000);
    };
    
    carouselApi.on('select', onSelect);
    carouselApi.on('pointerDown', onPointerDown);
    carouselApi.on('pointerUp', onPointerUp);
    
    return () => {
      carouselApi.off('select', onSelect);
      carouselApi.off('pointerDown', onPointerDown);
      carouselApi.off('pointerUp', onPointerUp);
    };
  }, [carouselApi, pauseAutoPlay, resumeAutoPlay]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const cards: Array<{
    type: PackageType;
    title: string;
    badge: string;
    subtitle: string;
    icon: React.ReactNode;
    features: string[];
    iconBgColor: string;
    checkColor: string;
    badgeColor: string;
  }> = [
    {
      type: 'day_pass',
      title: t('planTypes.dayPass.name'),
      badge: t('planTypes.dayPass.badge'),
      subtitle: t('planTypes.dayPass.tagline'),
      icon: <Sun className="w-7 h-7 text-blue-600" />,
      features: [
        t('planTypes.dayPass.feature1'),
        t('planTypes.dayPass.feature2'),
        t('planTypes.dayPass.feature3')
      ],
      iconBgColor: "bg-blue-100",
      checkColor: "text-blue-500",
      badgeColor: "bg-emerald-500",
    },
    {
      type: 'limitless',
      title: t('planTypes.limitless.name'),
      badge: t('planTypes.limitless.badge'),
      subtitle: t('planTypes.limitless.tagline'),
      icon: <Zap className="w-7 h-7 text-green-600" />,
      features: [
        t('planTypes.limitless.feature1'),
        t('planTypes.limitless.feature2'),
        t('planTypes.limitless.feature3')
      ],
      iconBgColor: "bg-green-100",
      checkColor: "text-green-500",
      badgeColor: "bg-orange-500",
    },
    {
      type: 'max_speed',
      title: t('planTypes.maxSpeed.name'),
      badge: t('planTypes.maxSpeed.badge'),
      subtitle: t('planTypes.maxSpeed.tagline'),
      icon: <Gauge className="w-7 h-7 text-orange-600" />,
      features: [
        t('planTypes.maxSpeed.feature1'),
        t('planTypes.maxSpeed.feature2'),
        t('planTypes.maxSpeed.feature3')
      ],
      iconBgColor: "bg-orange-100",
      checkColor: "text-orange-500",
      badgeColor: "bg-blue-500",
    },
  ];

  // Filter cards: hide max_speed (Lite) unless revealed
  const visibleCards = showLite ? cards : cards.filter(c => c.type !== 'max_speed');

  const handleCardClick = (type: string) => {
    if (selectedPlanType === type) {
      onPlanTypeClick(null);
    } else {
      onPlanTypeClick(type);
    }
  };

  return (
    <div className="relative bg-[#FAF7F2] flex flex-col items-center justify-center p-4 pt-8 md:p-8 md:pt-12 -mx-4 md:-mx-8 lg:-mx-12 rounded-2xl overflow-hidden">
      
      {/* Floating Decorative Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Mint diamond - top left */}
        <div className="absolute -top-4 -left-4 w-16 h-16 md:w-24 md:h-24 bg-emerald-200/40 rotate-45 rounded-xl animate-v2-float-slow" />
        {/* Peach circle - top right */}
        <div className="absolute top-8 -right-6 w-20 h-20 md:w-32 md:h-32 bg-orange-200/40 rounded-full animate-v2-float-medium" />
        {/* Sky blue diamond - bottom left */}
        <div className="absolute -bottom-4 left-12 w-12 h-12 md:w-20 md:h-20 bg-sky-200/40 rotate-45 rounded-lg animate-v2-float-fast" />
        {/* Light orange circle - bottom right */}
        <div className="absolute bottom-12 -right-8 w-16 h-16 md:w-28 md:h-28 bg-amber-200/30 rounded-full animate-v2-float-slow" />
      </div>

      {/* Header Content */}
      <div className="relative z-10 text-center mb-6 md:mb-8 max-w-2xl px-2">
        <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-gray-800 tracking-tight leading-tight">
          {t('planTypes.sectionTitle')}
        </h2>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-sm md:max-w-none mx-auto">
          <span className="font-semibold text-orange-500">{t('planTypes.allUnlimited')}</span>{' '}
          {t('planTypes.chooseStyle')}
        </p>
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden relative z-10 w-full px-1">
        <Carousel
          opts={{ align: 'center', loop: true }}
          setApi={setCarouselApi}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {visibleCards.map((card) => {
              const isSelected = selectedPlanType === card.type;
              
              return (
                <CarouselItem key={card.type} className="basis-[85%] pl-2">
                  <div className="group relative h-full">
                    {/* Badge - shown for all cards */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
                      <div className={`${card.badgeColor} text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1`}>
                        {card.badge}
                      </div>
                    </div>

                    {/* The Card */}
                    <div 
                      onClick={() => handleCardClick(card.type)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCardClick(card.type);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`
                        relative h-full p-5 rounded-2xl overflow-hidden cursor-pointer
                        bg-white shadow-md hover:shadow-xl
                        border-2 transition-all duration-300 ease-out
                        active:scale-[0.98] flex flex-col mt-3
                        ${isSelected 
                          ? 'border-orange-500 bg-orange-50/50 shadow-xl' 
                          : 'border-gray-100 hover:border-gray-200'
                        }
                      `}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 z-30 rounded-full w-6 h-6 flex items-center justify-center bg-orange-500">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}

                      {/* Icon */}
                      <div className="mb-4">
                        <div className={`
                          w-14 h-14 rounded-2xl 
                          ${card.iconBgColor}
                          flex items-center justify-center
                          transition-transform duration-300 group-hover:scale-110
                        `}>
                          {card.icon}
                        </div>
                      </div>

                      {/* Text Content */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold mb-1 text-gray-900">{card.title}</h3>
                        <p className="text-gray-500 font-medium text-sm">{card.subtitle}</p>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 flex-grow">
                        {card.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start space-x-2.5 text-gray-600">
                            <Check className={`w-4 h-4 ${card.checkColor} mt-0.5 shrink-0`} />
                            <span className="text-sm leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
        
        {/* Swipe Hint */}
        {showSwipeHint && (
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-xs animate-pulse">
            <span>←</span>
            <span>{t('common.swipeToExplore') || 'Swipe to explore'}</span>
            <span>→</span>
          </div>
        )}
        
        {/* Dot Indicators */}
        <div className={`flex justify-center gap-2 ${showSwipeHint ? 'mt-2' : 'mt-5'}`}>
          {visibleCards.map((_, index) => (
            <button
              key={index}
              onClick={() => carouselApi?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? 'bg-orange-500 w-6' 
                  : 'bg-gray-300 w-2 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Need minimal data? Show Lite link */}
        {!showLite && (
          <button
            onClick={() => setShowLite(true)}
            className="text-xs text-gray-400 hover:text-orange-500 font-medium mt-4 transition-colors"
          >
            {language === 'th'
              ? 'ต้องการเน็ตน้อย? ดูแพ็กเกจ Lite'
              : 'Need minimal data? See basic plans'}
          </button>
        )}
      </div>

      {/* Desktop/Tablet Grid */}
      <div className="hidden md:grid grid-cols-3 gap-6 relative z-10 max-w-5xl w-full" style={{ gridTemplateColumns: `repeat(${visibleCards.length}, 1fr)` }}>
        {visibleCards.map((card) => {
          const isSelected = selectedPlanType === card.type;
          
          return (
            <div
              key={card.type}
              className="group relative h-full animate-v2-fade-up"
            >
              {/* Badge - shown for all cards */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
                <div className={`${card.badgeColor} text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5`}>
                  {card.badge}
                </div>
              </div>

              {/* The Card */}
              <div 
                onClick={() => handleCardClick(card.type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(card.type);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`
                  relative h-full p-6 rounded-2xl overflow-hidden cursor-pointer
                  bg-white shadow-md hover:shadow-xl
                  border-2 transition-all duration-300 ease-out
                  group-hover:-translate-y-2 flex flex-col mt-3
                  ${isSelected 
                    ? 'border-orange-500 bg-orange-50/50 shadow-xl -translate-y-2' 
                    : 'border-gray-100 hover:border-gray-200'
                  }
                `}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 z-30 rounded-full w-7 h-7 flex items-center justify-center bg-orange-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className="mb-5">
                  <div className={`
                    w-16 h-16 rounded-2xl 
                    ${card.iconBgColor}
                    flex items-center justify-center
                    transition-transform duration-300 group-hover:scale-110
                  `}>
                    {card.icon}
                  </div>
                </div>

                {/* Text Content */}
                <div className="mb-5">
                  <h3 className="text-2xl font-bold mb-1.5 text-gray-900">{card.title}</h3>
                  <p className="text-gray-500 font-medium text-sm">{card.subtitle}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-grow">
                  {card.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-3 text-gray-600">
                      <Check className={`w-4 h-4 ${card.checkColor} mt-0.5 shrink-0`} />
                      <span className="text-sm leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Need minimal data? Show Lite link — desktop */}
      {!showLite && (
        <button
          onClick={() => setShowLite(true)}
          className="hidden md:block relative z-10 text-xs text-gray-400 hover:text-orange-500 font-medium mt-6 transition-colors"
        >
          {language === 'th'
            ? 'ต้องการเน็ตน้อย? ดูแพ็กเกจ Lite'
            : 'Need minimal data? See basic plans'}
        </button>
      )}

    </div>
  );
}
