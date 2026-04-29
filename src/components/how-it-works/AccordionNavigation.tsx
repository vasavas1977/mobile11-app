import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, CheckCircle2, ArrowRight, Smartphone, MapPin, Package, Wifi, Globe, ArrowUpDown, QrCode } from 'lucide-react';
import LottieAnimation from '@/components/landing-v2/LottieAnimation';

type TabId = 'getting-started' | 'whats-esim' | 'why-use' | 'how-to-use';

export const AccordionNavigation = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('getting-started');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'getting-started', label: t('howItWorksPage.nav.gettingStarted') || 'Getting started with Mobile11' },
    { id: 'whats-esim', label: t('howItWorksPage.nav.whatsEsim') || "What's an eSIM?" },
    { id: 'why-use', label: t('howItWorksPage.nav.whyUse') || 'Why use Mobile11?' },
    { id: 'how-to-use', label: t('howItWorksPage.nav.howToUse') || 'How to use Mobile11' },
  ];

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  return (
    <section className="py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="sticky top-20 z-10 bg-[#FAF7F2] py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full border transition-all duration-200 text-sm md:text-base font-medium shadow-sm ${
                  activeTab === tab.id
                    ? 'bg-white border-orange-400 text-orange-600 shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {tab.label}
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    activeTab === tab.id ? 'rotate-180' : ''
                  }`} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content Panel */}
        <div className="mt-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'getting-started' && (
              <GettingStartedContent key="getting-started" t={t} />
            )}
            {activeTab === 'whats-esim' && (
              <WhatsEsimContent key="whats-esim" t={t} navigate={navigate} />
            )}
            {activeTab === 'why-use' && (
              <WhyUseContent key="why-use" t={t} />
            )}
            {activeTab === 'how-to-use' && (
              <HowToUseContent key="how-to-use" t={t} navigate={navigate} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

// Content Components
interface ContentProps {
  t: (key: string) => string | undefined;
  navigate?: (path: string) => void;
}

const contentAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const GettingStartedContent = ({ t }: ContentProps) => {
  const features = [
    { 
      icon: Globe, 
      description: t('howItWorksPage.gettingStarted.coverage') || 'Local, regional, and global coverage for 151 locations'
    },
    { 
      icon: ArrowUpDown, 
      description: t('howItWorksPage.gettingStarted.flexible') || 'Flexible packages, including unlimited data options'
    },
    { 
      icon: Smartphone, 
      description: t('howItWorksPage.gettingStarted.support') || 'EN & TH support, multiple currencies'
    },
    { 
      icon: QrCode, 
      description: t('howItWorksPage.gettingStarted.easy') || 'Easy installation and set up to get connected in minutes'
    },
  ];

  return (
    <motion.div {...contentAnimation}>
      {/* Add top padding to prevent clipping */}
      <div className="pt-12 md:pt-16 pb-8">
        <section className="why-mobile11-wrapper !bg-transparent !py-0 !overflow-visible">
          <div className="why-mobile11-inner">
            {/* Decorative illustration - left (lazy loaded, scaled down) */}
            <div className="why-mobile11-illustration why-mobile11-illustration-left scale-[0.8]" aria-hidden="true">
              <LottieAnimation
                src="/assets/lottie/skate-boy.lottie"
                className="why-mobile11-lottie"
                speed={0.85}
                devicePixelRatio={3}
                useFrameInterpolation={true}
                lazy={true}
                lazyRootMargin="400px"
              />
            </div>

            {/* Main content card */}
            <div className="why-mobile11-card">
              <h2 className="why-mobile11-title">
                {t('howItWorksPage.gettingStarted.newTitle') || 'Getting started with'} <span>Mobile11</span>
              </h2>

              <div className="why-mobile11-features">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="why-mobile11-feature">
                      <div className="why-mobile11-icon-wrapper">
                        <Icon className="why-mobile11-icon" strokeWidth={1.5} />
                      </div>
                      <p className="why-mobile11-feature-text">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decorative illustration - right (lazy loaded, scaled down) */}
            <div className="why-mobile11-illustration why-mobile11-illustration-right scale-[0.8]" aria-hidden="true">
              <LottieAnimation
                src="/assets/lottie/man-woman-hi.lottie"
                className="why-mobile11-lottie"
                speed={0.85}
                devicePixelRatio={3}
                useFrameInterpolation={true}
                lazy={true}
                lazyRootMargin="400px"
              />
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const WhatsEsimContent = ({ t, navigate }: ContentProps) => {
  return (
    <motion.div {...contentAnimation} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
      <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
        {/* Content */}
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {t('howItWorksPage.whatsEsim.title') || "What's an eSIM?"}
          </h2>
          
          <div className="space-y-3 text-gray-700 mb-6">
            <p>{t('howItWorksPage.whatsEsim.p1') || 'Every package Mobile11 offers includes an eSIM.'}</p>
            <p>{t('howItWorksPage.whatsEsim.p2') || "eSIM stands for 'embedded SIM' – it's like a digital SIM card built into your phone. Instead of inserting a physical card, you simply scan a QR code or download your eSIM directly."}</p>
            <p>{t('howItWorksPage.whatsEsim.p3') || 'By using eSIMs, Mobile11 can easily connect you to networks around the world without the hassle of swapping physical SIM cards.'}</p>
          </div>

          <Button 
            onClick={() => navigate?.('/what-is-esim')}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 py-3 h-auto text-base font-medium"
          >
            {t('howItWorksPage.whatsEsim.learnMore') || 'Learn more about eSIMs'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Device Compatibility Note */}
          <div className="mt-8 p-5 bg-orange-50 rounded-2xl border border-orange-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {t('howItWorksPage.whatsEsim.compatibility.title') || 'Device Compatibility'}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {t('howItWorksPage.whatsEsim.compatibility.description') || 'To use Mobile11, your device must support eSIMs, not be carrier-locked, and not be jailbroken or rooted.'}
                </p>
                <button 
                  onClick={() => navigate?.('/what-is-esim#compatibility')}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium inline-flex items-center gap-1"
                >
                  {t('howItWorksPage.whatsEsim.compatibility.checkDevice') || 'Check device compatibility'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lottie Animation */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xs lg:max-w-sm">
            <DotLottieReact
              src="/assets/lottie/businessman-esim.lottie"
              loop
              autoplay
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const WhyUseContent = ({ t }: ContentProps) => {
  const cards = [
    {
      lottie: '/assets/lottie/travel-location.lottie',
      title: t('howItWorksPage.whyUse.card1.title') || 'Stay connected abroad',
      subtitle: t('howItWorksPage.whyUse.card1.subtitle') || 'Access mobile networks, wherever you are',
      description: t('howItWorksPage.whyUse.card1.description') || 'Mobile11 works with network providers around the world to keep people connected when they need international mobile coverage.',
    },
    {
      lottie: '/assets/lottie/business-avoid-trap.lottie',
      title: t('howItWorksPage.whyUse.card2.title') || 'Avoid roaming charges',
      subtitle: t('howItWorksPage.whyUse.card2.subtitle') || 'Skip out on the expensive bills',
      description: t('howItWorksPage.whyUse.card2.description') || 'Most primary mobile plans put a premium on roaming. Mobile11 offers flexible packages so you can stay connected without breaking the bank.',
    },
  ];

  return (
    <motion.div {...contentAnimation} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {t('howItWorksPage.whyUse.title') || 'Why use Mobile11?'}
        </h2>
        <p className="text-gray-600">
          {t('howItWorksPage.whyUse.subtitle') || 'The smarter way to stay connected when traveling'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300"
          >
            <div className="w-full h-40 mb-4 flex items-center justify-center">
              <DotLottieReact
                src={card.lottie}
                loop
                autoplay
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{card.title}</h3>
            <p className="text-orange-600 font-medium mb-2 text-sm">{card.subtitle}</p>
            <p className="text-gray-600 text-sm">{card.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const HowToUseContent = ({ t, navigate }: ContentProps) => {
  const steps = [
    {
      number: '01',
      icon: MapPin,
      lottie: '/assets/lottie/travel-location.lottie',
      title: t('howItWorksPage.howToUse.step1.title') || 'Choose a location',
      description: t('howItWorksPage.howToUse.step1.description') || 'Mobile11 offers coverage for over 150+ locations – you can select coverage for a single country, an entire region, or even the whole globe.',
    },
    {
      number: '02',
      icon: Package,
      lottie: '/assets/lottie/add-to-cart.lottie',
      title: t('howItWorksPage.howToUse.step2.title') || 'Select a package',
      description: t('howItWorksPage.howToUse.step2.description') || 'Every package includes an amount of data valid for a period of time – many packages offer unlimited data with fair use policies.',
    },
    {
      number: '03',
      icon: Wifi,
      lottie: '/assets/lottie/boy-pointing-wifi.lottie',
      title: t('howItWorksPage.howToUse.step3.title') || 'Install and connect',
      description: t('howItWorksPage.howToUse.step3.description') || "When you're ready, install your eSIM – installing takes a few minutes and requires an internet connection. Then you're connected!",
    },
  ];

  return (
    <motion.div {...contentAnimation} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {t('howItWorksPage.howToUse.title') || 'How to use Mobile11'}
        </h2>
        <p className="text-gray-600">
          {t('howItWorksPage.howToUse.subtitle') || 'Get connected in three simple steps'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="text-center">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 aspect-square flex items-center justify-center mb-4 max-w-[180px] mx-auto">
              <DotLottieReact
                src={step.lottie}
                loop
                autoplay
                className="w-full h-full"
              />
            </div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-3xl font-bold text-orange-200">{step.number}</span>
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <step.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-600 text-sm">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button 
          onClick={() => navigate?.('/packages')}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-3 h-auto text-base font-semibold shadow-lg shadow-orange-500/25"
        >
          {t('howItWorksPage.howToUse.cta') || 'Browse eSIM Packages'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};
