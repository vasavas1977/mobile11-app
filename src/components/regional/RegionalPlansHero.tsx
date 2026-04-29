import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect, useRef } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { useRegionalImages } from '@/hooks/useRegionalImages';
import { regionalToSlug } from '@/lib/countryDestinations';

export function RegionalPlansHero() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { images } = useRegionalImages();

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

  const regionalOptions = [
    {
      region: 'europe' as const,
      emoji: '🇪🇺',
      countries: 42,
      sampleCountries: 'UK, France, Germany, Italy, Spain, Netherlands, Switzerland, Austria, Greece, Portugal…',
      packageName: 'Europe Premium 42 + Stopover',
      imagePosition: 'object-[30%_100%]'
    },
    {
      region: 'asia' as const,
      emoji: '🌏',
      countries: 13,
      sampleCountries: 'Japan, Korea, Singapore, Thailand, Vietnam, Malaysia, Indonesia, Philippines, Taiwan…',
      packageName: 'Asia 13 Countries',
      imagePosition: 'object-[20%_100%]'
    },
    {
      region: 'global' as const,
      emoji: '🌍',
      countries: 151,
      sampleCountries: 'USA, UK, Japan, Australia, Germany, France, Canada, Brazil, Mexico, India, UAE +140 more',
      packageName: 'Global 151 Countries',
      imagePosition: 'object-center'
    }
  ];

  const handleViewPlans = (packageName: string) => {
    navigate(`/esim/${regionalToSlug(packageName)}`);
  };

  const renderCard = (option: typeof regionalOptions[0], index: number) => (
    <div 
      key={option.region} 
      className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-white
        border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        transition-all duration-500 hover:-translate-y-1
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{
        transitionDelay: `${index * (isMobile ? 60 : 100)}ms`
      }}
      onClick={() => handleViewPlans(option.packageName)}
    >
      {/* Photo area */}
      <div className="relative h-44 md:h-52 overflow-hidden">
        <img 
          src={images[option.region]} 
          alt={t(`landing.regionalPlans.regions.${option.region}`)}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${option.imagePosition}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Country count badge on image */}
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-[11px] font-bold px-3 py-1 rounded-full">
            {option.countries} {t('landing.regionalPlans.countries')}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="p-5 md:p-6 space-y-4">
        <div>
          <h3 className="text-xl font-display font-bold text-gray-900 leading-tight mb-1.5">
            {t(`landing.regionalPlans.regions.${option.region}`)}
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
            {option.sampleCountries}
          </p>
        </div>

        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 rounded-xl h-11 text-sm font-semibold shadow-sm shadow-orange-500/20"
          onClick={(e) => {
            e.stopPropagation();
            handleViewPlans(option.packageName);
          }}
        >
          <span className="flex items-center justify-center gap-2">
            {t('landing.regionalPlans.viewPlans').replace('{{region}}', '')}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 md:py-28 overflow-hidden bg-white"
    >
      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14 space-y-3">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500/80">
            {t('landing.regionalPlans.badge')}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-gray-900 leading-tight">
            {t('landing.regionalPlans.title')}
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            {t('landing.regionalPlans.subtitle')}
          </p>
        </div>

        {isMobile ? (
          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {regionalOptions.map((option, index) => (
                <CarouselItem key={option.region} className="pl-4 basis-[80%]">
                  {renderCard(option, index)}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
            {regionalOptions.map((option, index) => renderCard(option, index))}
          </div>
        )}
      </div>
    </section>
  );
}
