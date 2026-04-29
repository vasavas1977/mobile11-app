import { useLanguage } from '@/contexts/LanguageContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';

export const WhyUseMobile11Section = () => {
  const { t } = useLanguage();

  const cards = [
    {
      lottie: '/assets/lottie/worldwide-tour.lottie',
      title: t('howItWorksPage.whyUse.card1.title') || 'Stay connected abroad',
      subtitle: t('howItWorksPage.whyUse.card1.subtitle') || 'Access mobile networks, wherever you are',
      description: t('howItWorksPage.whyUse.card1.description') || 'Mobile11 works with network providers around the world to keep people connected when they need international mobile coverage.',
    },
    {
      lottie: '/assets/lottie/traveler-2.lottie',
      title: t('howItWorksPage.whyUse.card2.title') || 'Avoid roaming charges',
      subtitle: t('howItWorksPage.whyUse.card2.subtitle') || 'Skip out on the expensive bills',
      description: t('howItWorksPage.whyUse.card2.description') || 'Most primary mobile plans put a premium on roaming. Mobile11 offers flexible packages so you can stay connected without breaking the bank.',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {t('howItWorksPage.whyUse.title') || 'Why use Mobile11?'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('howItWorksPage.whyUse.subtitle') || 'The smarter way to stay connected when traveling'}
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              {/* Lottie Animation */}
              <div className="w-full h-48 md:h-56 mb-6 flex items-center justify-center">
                <DotLottieReact
                  src={card.lottie}
                  loop
                  autoplay
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {card.title}
              </h3>
              <p className="text-orange-600 font-medium mb-4">
                {card.subtitle}
              </p>
              <p className="text-gray-600">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
