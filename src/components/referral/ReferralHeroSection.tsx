import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';

// Referral reward values
const REFERRAL_REWARD_USD = 5;
const REFERRAL_REWARD_THB = 175;
const REFERRAL_REWARD_JPY = 750;

export const ReferralHeroSection = () => {
  const { t, formatPrice } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReferClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      sessionStorage.setItem('post_auth_next', '/profile');
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
    }
  };

  const rewardAmount = formatPrice(REFERRAL_REWARD_USD);

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden lg:overflow-visible">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-orange-200/30 rounded-full blur-2xl" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-orange-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-yellow-200/30 rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                {t('referralPage.hero.badge')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('referralPage.hero.titleLine1')}<br />
              <span className="text-orange-500">{t('referralPage.hero.titleHighlight')}</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
              {(t('referralPage.hero.description') as string).replace(/\{reward\}/g, rewardAmount)}
            </p>

            {/* CTA Button */}
            <Button 
              size="lg" 
              onClick={handleReferClick}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              {t('referralPage.hero.cta')}
            </Button>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-8 mt-10">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{rewardAmount}</p>
                <p className="text-sm text-gray-500">
                  {t('referralPage.hero.forYou')}
                </p>
              </div>
              <div className="w-px h-10 bg-gray-300" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{rewardAmount}</p>
                <p className="text-sm text-gray-500">
                  {t('referralPage.hero.forFriend')}
                </p>
              </div>
            </div>
          </div>

          {/* Right illustration - Lottie Animation */}
          <div className="relative flex items-center justify-center overflow-visible lg:-mr-16 xl:-mr-28 -mb-4 lg:mb-0">
            <div className="w-[100%] sm:w-[120%] md:w-[140%] lg:w-[230%] max-w-none transform translate-x-0 lg:translate-x-16 scale-100 md:scale-110 lg:scale-[1.52] origin-center">
              <LottieAnimation 
                src="/assets/lottie/banner-marketing.lottie"
                className="w-full h-auto"
                loop={true}
                autoplay={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
