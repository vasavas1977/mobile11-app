import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Smartphone } from 'lucide-react';

export const WhatsEsimSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
          {/* Content */}
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('howItWorksPage.whatsEsim.title') || "What's an eSIM?"}
            </h2>
            
            <div className="space-y-4 text-lg text-gray-700 mb-8">
              <p>
                {t('howItWorksPage.whatsEsim.p1') || 'Every package Mobile11 offers includes an eSIM.'}
              </p>
              <p>
                {t('howItWorksPage.whatsEsim.p2') || "eSIM stands for 'embedded SIM' – it's like a digital SIM card built into your phone. Instead of inserting a physical card, you simply scan a QR code or download your eSIM directly."}
              </p>
              <p>
                {t('howItWorksPage.whatsEsim.p3') || 'By using eSIMs, Mobile11 can easily connect you to networks around the world without the hassle of swapping physical SIM cards.'}
              </p>
            </div>

            <Button 
              onClick={() => navigate('/what-is-esim')}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 py-3 h-auto text-base font-medium"
            >
              {t('howItWorksPage.whatsEsim.learnMore') || 'Learn more about eSIMs'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {/* Device Compatibility Note */}
            <motion.div 
              className="mt-10 p-6 bg-orange-50 rounded-2xl border border-orange-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t('howItWorksPage.whatsEsim.compatibility.title') || 'Device Compatibility'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {t('howItWorksPage.whatsEsim.compatibility.description') || 'To use Mobile11, your device must support eSIMs, not be carrier-locked, and not be jailbroken or rooted.'}
                  </p>
                  <button 
                    onClick={() => navigate('/what-is-esim#compatibility')}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium inline-flex items-center gap-1"
                  >
                    {t('howItWorksPage.whatsEsim.compatibility.checkDevice') || 'Check device compatibility'}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Lottie Animation */}
          <motion.div 
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-full max-w-sm lg:max-w-md">
              <DotLottieReact
                src="/assets/lottie/businessman-esim.lottie"
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
