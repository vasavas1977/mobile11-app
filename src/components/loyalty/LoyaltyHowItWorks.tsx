import { ShoppingCart, Coins, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LoyaltyHowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: ShoppingCart,
      title: t('loyaltyProgram.howItWorks.steps.purchase.title'),
      description: t('loyaltyProgram.howItWorks.steps.purchase.description'),
    },
    {
      icon: Coins,
      title: t('loyaltyProgram.howItWorks.steps.earn.title'),
      description: t('loyaltyProgram.howItWorks.steps.earn.description'),
    },
    {
      icon: TrendingUp,
      title: t('loyaltyProgram.howItWorks.steps.levelUp.title'),
      description: t('loyaltyProgram.howItWorks.steps.levelUp.description'),
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          {t('loyaltyProgram.howItWorks.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center mb-6">
                  <IconComponent className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
