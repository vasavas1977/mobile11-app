import { useLanguage } from '@/contexts/LanguageContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';

export const HowItWorksHero = () => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      {/* Floating decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-200/30 rounded-full blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-16">
          {/* Text Content */}
          <motion.div 
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {t('howItWorksPage.hero.title') || 'How Mobile11 works'}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
              {t('howItWorksPage.hero.subtitle') || 'Learn what Mobile11 offers, how Mobile11 can help you, and how to use Mobile11 to stay connected around the world.'}
            </p>
          </motion.div>

          {/* Lottie Animation */}
          <motion.div 
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-full max-w-md lg:max-w-lg">
              <DotLottieReact
                src="/assets/lottie/office-team-hello.lottie"
                loop
                autoplay
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
