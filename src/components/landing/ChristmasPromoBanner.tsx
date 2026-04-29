import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Copy, Check, Gift, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const CAMPAIGN_START = new Date('2025-12-14T00:00:00');
const CAMPAIGN_END = new Date('2025-12-31T23:59:59');
const PROMO_CODE = 'XMAS2026';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const ChristmasPromoBanner = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const bannerRef = useRef<HTMLElement>(null);

  // Memoize random snowflake positions to prevent re-renders
  const snowflakeStyles = useMemo(() => 
    [...Array(10)].map(() => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${5 + Math.random() * 5}s`,
      fontSize: `${8 + Math.random() * 8}px`,
    })), []
  );

  // Memoize sparkle positions
  const sparkleStyles = useMemo(() => 
    [...Array(5)].map(() => ({
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      animationDelay: `${Math.random() * 2}s`,
      width: `${14 + Math.random() * 10}px`,
      height: `${14 + Math.random() * 10}px`,
    })), []
  );

  useEffect(() => {
    const checkVisibility = () => {
      const now = new Date();
      setIsVisible(now >= CAMPAIGN_START && now <= CAMPAIGN_END);
    };

    checkVisibility();
    const interval = setInterval(checkVisibility, 60000);
    return () => clearInterval(interval);
  }, []);

  // Optimized countdown: only update every second when in viewport
  useEffect(() => {
    if (!isVisible) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = CAMPAIGN_END.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    // Update every second when visible, every 30s when off-screen
    const interval = isInViewport ? 1000 : 30000;
    const timer = setInterval(calculateTimeLeft, interval);
    return () => clearInterval(timer);
  }, [isVisible, isInViewport]);

  // Step 2: Pause animations when banner is off-screen
  useEffect(() => {
    if (!bannerRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    observer.observe(bannerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      toast({
        title: t('christmasPromo.copied'),
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <section 
      ref={bannerRef}
      className={`relative overflow-hidden py-3 sm:py-4 md:py-6 lg:py-10 ${!isInViewport ? 'animation-paused' : ''}`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 christmas-gradient animate-gradient-shift" />
      
      {/* Snowflakes - GPU accelerated with memoized positions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
        {snowflakeStyles.map((style, i) => (
          <div
            key={i}
            className="snowflake absolute text-white/80 will-change-transform"
            style={style}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Sparkle Effects - GPU accelerated with memoized positions */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {sparkleStyles.map((style, i) => (
          <Sparkles
            key={i}
            className="absolute text-cyan-300/60 animate-sparkle will-change-transform"
            style={style}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-3 sm:px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Left: Discount Badge */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="christmas-badge-glow w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex flex-col items-center justify-center shadow-xl transform hover:scale-105 transition-transform">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-lg">
                  {t('christmasPromo.discount')}
                </span>
                <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white/90">
                  {t('christmasPromo.discountOff')}
                </span>
              </div>
              <Gift className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-cyan-300 animate-bounce" />
            </div>
          </div>

          {/* Center: Title & Promo Code */}
          <div className="flex-1 text-center md:text-left">
            {/* Badge - hidden on mobile */}
            <span className="hidden sm:inline-block px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold mb-2 border border-white/30">
              {t('christmasPromo.badge')}
            </span>

            {/* Title */}
            <h2 className="text-base sm:text-lg md:text-xl lg:text-3xl font-black text-white mb-1 drop-shadow-lg">
              {t('christmasPromo.title')}
            </h2>
            
            {/* Subtitle - hidden on very small screens */}
            <p className="hidden sm:block text-white/90 text-xs md:text-sm lg:text-base mb-2 max-w-xl">
              {t('christmasPromo.subtitle')}
            </p>

            {/* Promo Code Box */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 border border-cyan-400/30">
              <span className="text-white/80 text-xs hidden sm:inline">{t('christmasPromo.codeLabel')}</span>
              <code className="text-sm sm:text-base md:text-lg lg:text-xl font-mono font-bold text-cyan-300 tracking-wider">
                {PROMO_CODE}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="text-white hover:bg-white/20 h-6 px-2 sm:h-7 sm:px-2.5"
              >
                {copied ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span className="ml-1 text-xs hidden sm:inline">{copied ? t('christmasPromo.copied') : t('christmasPromo.copyButton')}</span>
              </Button>
            </div>

            {/* Valid Period & Buy Now Use Later - simplified on mobile */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 mt-1.5">
              <p className="text-white/70 text-[10px] sm:text-xs">
                {t('christmasPromo.validPeriod')}
              </p>
              <span className="hidden sm:inline text-white/40">•</span>
              
              {/* Info Trigger with Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-0.5 text-cyan-300/90 text-[10px] sm:text-xs font-medium hover:text-cyan-200 transition-colors cursor-pointer group">
                    {t('christmasPromo.buyNowUseLater')}
                    <Info className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 sm:w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border-cyan-500/30 text-white p-3 sm:p-4 max-h-[70vh] overflow-y-auto">
                  {/* How It Works Title */}
                  <h4 className="font-bold text-base sm:text-lg text-cyan-300 mb-2 sm:mb-3">
                    {t('christmasPromo.howItWorksTitle')}
                  </h4>
                  
                  {/* Step-by-Step List */}
                  <ol className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    {[
                      t('christmasPromo.howItWorksStep1'),
                      t('christmasPromo.howItWorksStep2'),
                      t('christmasPromo.howItWorksStep3'),
                      t('christmasPromo.howItWorksStep4'),
                      t('christmasPromo.howItWorksStep5'),
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/80">
                        <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] sm:text-xs flex items-center justify-center font-semibold">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  
                  {/* Buy Now Use Later Explanation */}
                  <div className="bg-cyan-500/10 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-cyan-500/20">
                    <h5 className="font-semibold text-cyan-300 text-xs sm:text-sm mb-1">
                      {t('christmasPromo.buyNowUseLaterTitle')}
                    </h5>
                    <p className="text-white/70 text-[10px] sm:text-xs leading-relaxed">
                      {t('christmasPromo.buyNowUseLaterDetails')}
                    </p>
                  </div>
                  
                  {/* Pro Tip */}
                  <div className="bg-purple-500/10 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-purple-500/20">
                    <h5 className="font-semibold text-purple-300 text-xs sm:text-sm mb-1">
                      {t('christmasPromo.tipTitle')}
                    </h5>
                    <p className="text-white/70 text-[10px] sm:text-xs leading-relaxed">
                      {t('christmasPromo.tipDetails')}
                    </p>
                  </div>
                  
                  {/* Terms & Conditions */}
                  <div className="border-t border-white/10 pt-2 sm:pt-3">
                    <h5 className="font-semibold text-white/60 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                      {t('christmasPromo.termsTitle')}
                    </h5>
                    <ul className="space-y-0.5 sm:space-y-1">
                      {[
                        t('christmasPromo.term1'),
                        t('christmasPromo.term2'),
                        t('christmasPromo.term3'),
                        t('christmasPromo.term4'),
                        t('christmasPromo.term5'),
                        t('christmasPromo.term6'),
                      ].map((term, i) => (
                        <li key={i} className="text-white/50 text-[10px] sm:text-xs flex items-start gap-1">
                          <span className="text-white/30">•</span>
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Right: Countdown & CTA */}
          <div className="flex flex-row md:flex-col items-center gap-2 sm:gap-3 md:gap-4">
            {/* Countdown */}
            <div className="text-center">
              <p className="text-white/80 text-[10px] sm:text-xs mb-1">{t('christmasPromo.endsIn')}</p>
              <div className="flex gap-1 sm:gap-1.5 md:gap-2">
                {[
                  { value: timeLeft.days, label: t('christmasPromo.days') },
                  { value: timeLeft.hours, label: t('christmasPromo.hours') },
                  { value: timeLeft.minutes, label: t('christmasPromo.minutes') },
                  { value: timeLeft.seconds, label: t('christmasPromo.seconds') },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-md md:rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-cyan-400/30">
                      <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white countdown-flip">
                        {String(item.value).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-white/70 text-[8px] sm:text-[10px] md:text-xs mt-0.5">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => navigate('/packages')}
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold shadow-[0_0_15px_hsla(195,100%,50%,0.3)] hover:shadow-[0_0_25px_hsla(195,100%,50%,0.5)] transform hover:scale-105 transition-all px-3 sm:px-4 md:px-6 lg:px-8 text-xs sm:text-sm md:text-base h-7 sm:h-8 md:h-9 lg:h-10"
            >
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-1.5 md:mr-2" />
              {t('christmasPromo.shopNow')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
