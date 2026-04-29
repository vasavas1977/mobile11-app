import { useLanguage } from '@/contexts/LanguageContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export const GettingStartedSection = () => {
  const { t } = useLanguage();

  const bulletPoints = [
    t('howItWorksPage.gettingStarted.point1') || 'People use Mobile11 for international mobile coverage when they travel',
    t('howItWorksPage.gettingStarted.point2') || 'We offer flexible data packages – some have unlimited data with fair use policies',
    t('howItWorksPage.gettingStarted.point3') || "You'll need a device that supports eSIMs to use Mobile11",
    t('howItWorksPage.gettingStarted.point4') || 'You can buy, install, and manage eSIMs from our website or app',
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Lottie Animation */}
          <motion.div 
            className="flex-1 flex justify-center order-1 lg:order-none"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-full max-w-sm lg:max-w-md">
              <DotLottieReact
                src="/assets/lottie/passport-explorer.lottie"
                loop
                autoplay
                className="w-full h-auto"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              {t('howItWorksPage.gettingStarted.title') || 'Getting started with Mobile11'}
            </h2>
            
            <ul className="space-y-5">
              {bulletPoints.map((point, index) => (
                <motion.li 
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-gray-700">{point}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
