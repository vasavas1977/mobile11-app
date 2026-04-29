import { useLanguage } from '@/contexts/LanguageContext';
import { Share2, Gift, Coins } from 'lucide-react';

// Referral reward values
const REFERRAL_REWARD_USD = 5;
const REFERRAL_REWARD_THB = 175;
const REFERRAL_REWARD_JPY = 750;

export const ReferralHowItWorks = () => {
  const { t, formatPrice } = useLanguage();

  const rewardAmount = formatPrice(REFERRAL_REWARD_USD);

  const steps = [
    {
      icon: Share2,
      number: '1',
      title: t('referralPage.howItWorks.step1Title'),
      description: t('referralPage.howItWorks.step1Description'),
    },
    {
      icon: Gift,
      number: '2',
      title: t('referralPage.howItWorks.step2Title'),
      description: (t('referralPage.howItWorks.step2Description') as string).replace(/\{reward\}/g, rewardAmount),
    },
    {
      icon: Coins,
      number: '3',
      title: t('referralPage.howItWorks.step3Title'),
      description: (t('referralPage.howItWorks.step3Description') as string).replace(/\{reward\}/g, rewardAmount),
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('referralPage.howItWorks.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('referralPage.howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative bg-[#FAF7F2] rounded-3xl p-8 text-center transition-transform hover:scale-105"
            >
              {/* Step number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center shadow-sm">
                <step.icon className="w-8 h-8 text-orange-500" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connection lines (desktop only) */}
        <div className="hidden md:flex justify-center items-center -mt-32 mb-8 pointer-events-none">
          <div className="flex-1 max-w-xs">
            <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-orange-300" />
          </div>
          <div className="flex-1 max-w-xs">
            <div className="h-px bg-gradient-to-r from-orange-300 via-orange-300 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
};
