import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';

export const LoyaltyHeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleViewMembership = () => {
    if (user) {
      navigate('/profile');
    } else {
      sessionStorage.setItem('post_auth_next', '/profile');
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
    }
  };

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Decorative floating shapes */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-orange-200/40 rounded-full blur-xl" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-teal-200/30 rounded-full blur-xl" />
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-orange-300/30 rotate-45 blur-lg" />
      <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-amber-200/40 rotate-12 blur-lg" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {t('loyaltyProgram.hero.title')}
            </h1>
            <p className="text-lg text-orange-500 font-medium">
              {t('loyaltyProgram.hero.subtitle')}
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('loyaltyProgram.hero.description')}
            </p>
            <Button 
              onClick={handleViewMembership}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full"
            >
              {t('loyaltyProgram.hero.viewMembership')}
            </Button>
          </div>

          {/* Right Illustration */}
          <div className="relative flex justify-center -mb-4 md:mb-0">
            <div className="relative w-full max-w-xs md:max-w-md lg:max-w-xl xl:max-w-2xl">
              {/* Lottie Animation */}
              <LottieAnimation
                src="/assets/lottie/successful-target.lottie"
                className="w-full aspect-square scale-90 md:scale-110 lg:scale-125 xl:scale-150"
                loop={true}
                autoplay={true}
                speed={0.8}
              />
              
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">15%</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {t('loyaltyProgram.hero.maxCashback')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
