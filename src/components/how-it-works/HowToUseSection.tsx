import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Package, Wifi } from 'lucide-react';

export const HowToUseSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const steps = [
    {
      number: '01',
      icon: MapPin,
      lottie: '/assets/lottie/worldwide-tour.lottie',
      title: t('howItWorksPage.howToUse.step1.title') || 'Choose a location',
      description: t('howItWorksPage.howToUse.step1.description') || 'Mobile11 offers coverage for over 150+ locations – you can select coverage for a single country, an entire region, or even the whole globe.',
    },
    {
      number: '02',
      icon: Package,
      lottie: '/assets/lottie/unlimited-data.lottie',
      title: t('howItWorksPage.howToUse.step2.title') || 'Select a package',
      description: t('howItWorksPage.howToUse.step2.description') || 'Every package includes an amount of data valid for a period of time – many packages offer unlimited data with fair use policies.',
    },
    {
      number: '03',
      icon: Wifi,
      lottie: '/assets/lottie/qr-payment.lottie',
      title: t('howItWorksPage.howToUse.step3.title') || 'Install and connect',
      description: t('howItWorksPage.howToUse.step3.description') || "When you're ready, install your eSIM – installing takes a few minutes and requires an internet connection. Then you're connected!",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white/50">
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
            {t('howItWorksPage.howToUse.title') || 'How to use Mobile11'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('howItWorksPage.howToUse.subtitle') || 'Get connected in three simple steps'}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12 md:space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Lottie Animation */}
              <div className="flex-1 w-full max-w-sm lg:max-w-md">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 aspect-square flex items-center justify-center">
                  <DotLottieReact
                    src={step.lottie}
                    loop
                    autoplay
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                {/* Step Number */}
                <div className="inline-flex items-center gap-3 mb-4">
                  <span className="text-6xl md:text-7xl font-bold text-orange-200">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div 
          className="text-center mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button 
            onClick={() => navigate('/packages')}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-4 h-auto text-lg font-semibold shadow-lg shadow-orange-500/25"
          >
            {t('howItWorksPage.howToUse.cta') || 'Browse eSIM Packages'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
