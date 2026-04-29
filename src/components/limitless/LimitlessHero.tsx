import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';

export const LimitlessHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-[#FAF7F2]">
      {/* Floating Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full opacity-60 animate-pulse" />
        <div className="absolute top-40 right-20 w-6 h-6 bg-amber-300 rotate-45 opacity-50" />
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-orange-300 rounded-full opacity-40" />
        <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-yellow-400 rotate-45 opacity-30" />
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-orange-500 rounded-full opacity-50 animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left order-2 md:order-1"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-2 leading-tight">
              {t('limitless.hero.title') || 'Feel the freedom'}
            </h1>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-orange-500 mb-6 leading-tight">
              {t('limitless.hero.titleHighlight') || 'of unlimited data'}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-xl">
              {t('limitless.hero.description') || 'Go ahead and watch that video, listen to that song, download that app - get unlimited data for uninterrupted connection.'}
            </p>
          </motion.div>

          {/* Lottie Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center order-1 md:order-2"
          >
            <div className="w-full max-w-md lg:max-w-lg">
              <LottieAnimation
                src="/assets/lottie/5g-internet.lottie"
                className="w-full h-auto"
                devicePixelRatio={2}
                speed={0.85}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LimitlessHero;
