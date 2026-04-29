import { PassportIllustration } from './illustrations/PassportIllustration';
import { SuitcaseIllustration } from './illustrations/SuitcaseIllustration';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';
import { useLanguage } from '@/contexts/LanguageContext';

export const LoyaltyTierCards = () => {
  const { t } = useLanguage();

  const tiers = [
    {
      name: t('loyaltyProgram.tiers.explorer.name'),
      cashback: '5%',
      requirement: t('loyaltyProgram.tiers.explorer.requirement'),
      description: t('loyaltyProgram.tiers.explorer.description'),
      lottieSrc: '/assets/lottie/passport-explorer.lottie',
      reverse: false,
    },
    {
      name: t('loyaltyProgram.tiers.silver.name'),
      cashback: '7%',
      requirement: t('loyaltyProgram.tiers.silver.requirement'),
      description: t('loyaltyProgram.tiers.silver.description'),
      Illustration: PassportIllustration,
      reverse: true,
    },
    {
      name: t('loyaltyProgram.tiers.gold.name'),
      cashback: '10%',
      requirement: t('loyaltyProgram.tiers.gold.requirement'),
      description: t('loyaltyProgram.tiers.gold.description'),
      Illustration: SuitcaseIllustration,
      reverse: false,
    },
    {
      name: t('loyaltyProgram.tiers.platinum.name'),
      cashback: '15%',
      requirement: t('loyaltyProgram.tiers.platinum.requirement'),
      description: t('loyaltyProgram.tiers.platinum.description'),
      Illustration: SuitcaseIllustration,
      reverse: true,
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-4">
          {t('loyaltyProgram.tiers.title')}
        </h2>
        <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto text-lg">
          {t('loyaltyProgram.tiers.subtitle')}
        </p>

        <div className="space-y-16 md:space-y-24">
          {tiers.map((tier, index) => {
            const Illustration = tier.Illustration as React.ComponentType | undefined;
            return (
              <div 
                key={index}
                className={`flex flex-col ${tier.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-16`}
              >
                {/* Text Content */}
                <div className="flex-1 text-center md:text-left">
                  {/* Floating decorative shapes */}
                  <div className="relative inline-block">
                    {index === 0 && (
                      <>
                        <div className="absolute -top-4 -left-8 w-6 h-6 bg-orange-200 rounded-full opacity-60" />
                        <div className="absolute -top-8 left-12 w-4 h-4 bg-teal-200 rotate-45 opacity-60" />
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <div className="absolute -top-6 -right-4 w-5 h-5 bg-amber-200 rounded-full opacity-60" />
                        <div className="absolute top-0 -left-10 w-4 h-4 bg-orange-300 rotate-45 opacity-60" />
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <div className="absolute -top-4 right-0 w-6 h-6 bg-amber-300 rounded-full opacity-60" />
                        <div className="absolute -top-8 -left-6 w-5 h-5 bg-teal-200 rotate-45 opacity-60" />
                      </>
                    )}
                    
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                      {tier.name}
                    </h3>
                  </div>
                  
                  <p className="text-xl md:text-2xl text-gray-700 mb-4">
                    <span className="font-bold text-orange-500">{tier.cashback} {t('loyaltyProgram.tiers.cashbackSuffix')}</span> {t('loyaltyProgram.tiers.inMobile11Money')}
                  </p>
                  
                  <p className="text-sm text-orange-500 font-medium mb-4 uppercase tracking-wide">
                    {tier.requirement}
                  </p>
                  
                  <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto md:mx-0">
                    {tier.description}
                  </p>
                </div>

                {/* Illustration */}
                <div className="flex-1 w-full max-w-md md:max-w-lg relative">
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-teal-50 rounded-3xl transform rotate-2 scale-105 opacity-50" />
                  
                  <div className="relative bg-gradient-to-br from-orange-50/80 to-amber-50/80 rounded-3xl p-6 md:p-8">
                    {tier.lottieSrc ? (
                      <LottieAnimation
                        src={tier.lottieSrc}
                        className="w-full aspect-square"
                        loop={true}
                        autoplay={true}
                        speed={0.8}
                      />
                    ) : tier.Illustration ? (
                      <tier.Illustration />
                    ) : null}
                  </div>
                  
                  {/* Floating coins decoration */}
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-white font-bold text-sm">$</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
