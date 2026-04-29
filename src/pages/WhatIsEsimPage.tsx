import { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO, SEO_CONFIG, getFAQStructuredData } from '@/components/SEO';
import { Smartphone, Globe, CheckCircle2, ArrowRight, ArrowDown, ChevronDown, Wifi, Lock, HelpCircle, Hash, ShieldCheck, Laptop, AlertTriangle, Settings, BookOpen, ShoppingBag } from 'lucide-react';
import { RelatedPages } from '@/components/seo/RelatedPages';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { COMPATIBLE_DEVICES, getPhoneBrands, getLaptopBrands, type DeviceBrand } from '@/constants/compatibleDevices';

// Floating Geometric Shapes - Airalo Style
const FloatingShapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Beige/amber diamonds */}
    <div className="absolute top-24 right-[18%] w-16 h-8 bg-amber-200/50 rotate-[25deg] rounded-sm" />
    <div className="absolute top-56 left-[8%] w-12 h-6 bg-amber-200/40 rotate-[12deg] rounded-sm" />
    <div className="absolute top-[40%] right-[6%] w-20 h-10 bg-orange-200/30 rotate-[30deg] rounded-sm" />
    
    {/* Teal/mint diamonds */}
    <div className="absolute top-40 left-[28%] w-10 h-10 bg-teal-300/35 rotate-45 rounded-sm" />
    <div className="absolute top-[52%] right-[22%] w-14 h-14 bg-teal-200/25 rotate-45 rounded-sm" />
    <div className="absolute bottom-[40%] left-[5%] w-16 h-8 bg-teal-100/30 -rotate-[18deg] rounded-sm" />
    
    {/* Green/emerald diamonds */}
    <div className="absolute bottom-[32%] left-[14%] w-12 h-12 bg-emerald-200/35 rotate-45 rounded-sm" />
    <div className="absolute bottom-36 right-[10%] w-8 h-4 bg-emerald-200/40 -rotate-[12deg] rounded-sm" />
    <div className="absolute top-[65%] left-[32%] w-10 h-5 bg-emerald-100/30 rotate-[20deg] rounded-sm" />
  </div>
);

// Animated Section Wrapper
const AnimatedSection = ({ 
  children, 
  className = "",
  delay = 0,
  direction = "up" 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const initial = { 
    opacity: 0, 
    y: direction === "up" ? 40 : 0,
    x: direction === "left" ? -40 : direction === "right" ? 40 : 0
  };
  
  const animate = isInView ? { 
    opacity: 1, 
    y: 0,
    x: 0,
    transition: { 
      duration: 0.5, 
      delay,
      ease: "easeOut" as const
    }
  } : initial;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Use shared device data from constants
const deviceData = COMPATIBLE_DEVICES;

// Device Brand Accordion Component
const DeviceBrandAccordion = ({ 
  brandKey, 
  brand, 
  isExpanded, 
  onToggle, 
  icon,
  language 
}: { 
  brandKey: string;
  brand: DeviceBrand;
  isExpanded: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  language: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <button
      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <span className="font-semibold text-gray-900">{brand.name}</span>
        <span className="text-sm text-gray-500">({brand.devices.length} devices)</span>
      </div>
      <ChevronDown 
        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
          isExpanded ? 'rotate-180' : ''
        }`} 
      />
    </button>
    
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5 pt-2 border-t border-gray-100">
            {/* Brand Warnings */}
            {brand.hasWarning && brand.warningMessages && brand.warningMessages.length > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                {brand.warningMessages.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-800">
                      {(warning as any)[language] || warning.en}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {brand.devices.map((device, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-700"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {device}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export function WhatIsEsimPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language, localizeField } = useLanguage();
  const [expandedBrands, setExpandedBrands] = useState<string[]>([]);

  // Sync activeTab with URL query param
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl === 'compatibility' ? 'device-compatibility' : 'what-is-esim';

  const handleTabChange = (tab: 'what-is-esim' | 'device-compatibility') => {
    if (tab === 'device-compatibility') {
      setSearchParams({ tab: 'compatibility' });
    } else {
      setSearchParams({});
    }
  };

  const toggleBrand = (brand: string) => {
    setExpandedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const faqs = [{
    question: t('whatIsEsim.faq.q1.question'),
    answer: t('whatIsEsim.faq.q1.answer')
  }, {
    question: t('whatIsEsim.faq.q2.question'),
    answer: t('whatIsEsim.faq.q2.answer')
  }, {
    question: t('whatIsEsim.faq.q3.question'),
    answer: t('whatIsEsim.faq.q3.answer')
  }, {
    question: t('whatIsEsim.faq.q4.question'),
    answer: t('whatIsEsim.faq.q4.answer')
  }, {
    question: t('whatIsEsim.faq.q5.question'),
    answer: t('whatIsEsim.faq.q5.answer')
  }];

  const deviceFaqs = [
    {
      question: t('whatIsEsim.deviceCompatibility.faqs.q1.question'),
      answer: t('whatIsEsim.deviceCompatibility.faqs.q1.answer')
    },
    {
      question: t('whatIsEsim.deviceCompatibility.faqs.q2.question'),
      answer: t('whatIsEsim.deviceCompatibility.faqs.q2.answer')
    },
    {
      question: t('whatIsEsim.deviceCompatibility.faqs.q3.question'),
      answer: t('whatIsEsim.deviceCompatibility.faqs.q3.answer')
    },
    {
      question: t('whatIsEsim.deviceCompatibility.faqs.q4.question'),
      answer: t('whatIsEsim.deviceCompatibility.faqs.q4.answer')
    }
  ];

  const faqStructuredData = getFAQStructuredData(faqs);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEO 
        title={SEO_CONFIG.whatIsEsim.title}
        description={SEO_CONFIG.whatIsEsim.description}
        keywords={SEO_CONFIG.whatIsEsim.keywords}
        canonical="https://mobile11.com/what-is-esim"
        structuredData={faqStructuredData}
        alternateLanguages={[
          { lang: 'en', url: 'https://mobile11.com/what-is-esim?lang=en' },
          { lang: 'th', url: 'https://mobile11.com/what-is-esim?lang=th' }
        ]}
      />
      <Header />
      
      {/* Tab Navigation - Airalo Style */}
      <section className="relative pt-28 md:pt-32 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3">
            <button 
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'what-is-esim' 
                  ? 'bg-white border border-gray-200 text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => handleTabChange('what-is-esim')}
            >
              {t('whatIsEsim.tabs.whatIsEsim') || 'What is an eSIM?'}
            </button>
            <button 
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'device-compatibility' 
                  ? 'bg-white border border-gray-200 text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => handleTabChange('device-compatibility')}
            >
              {t('whatIsEsim.tabs.deviceCompatibility') || 'Device compatibility'}
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'what-is-esim' ? (
          <motion.div
            key="what-is-esim"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* What is eSIM Hero */}
            <section className="relative overflow-hidden py-12 md:py-20">
              <FloatingShapes />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                  {/* Text Content */}
                  <motion.div 
                    className="flex-1 text-center lg:text-left"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                      {t('whatIsEsim.hero.title')} {t('whatIsEsim.hero.titleHighlight')}?
                    </h1>
                    <p className="text-xl md:text-2xl font-medium text-gray-900 mb-4">
                      {t('whatIsEsim.explanation.subtitle') || "It's just like a regular SIM card, only digital."}
                    </p>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                      {t('whatIsEsim.hero.subtitle')}
                    </p>
                  </motion.div>

                  {/* Lottie Animation */}
                  <motion.div 
                    className="flex-1 flex justify-center"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="w-full max-w-sm lg:max-w-md">
                      <DotLottieReact
                        src="/assets/lottie/esim-wireless-freedom.lottie"
                        loop
                        autoplay
                        className="w-full h-auto"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                  <button 
                    className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
                    onClick={() => scrollToSection('esim-benefits')}
                  >
                    <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {t('whatIsEsim.nav.benefits') || 'What are the benefits of eSIMs?'}
                    </span>
                    <ArrowDown className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </button>
                  
                  <button 
                    className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
                    onClick={() => scrollToSection('how-mobile11-uses')}
                  >
                    <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {t('whatIsEsim.nav.howMobile11Uses') || 'How does Mobile11 use eSIMs?'}
                    </span>
                    <ArrowDown className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </button>
                  
                  <button 
                    className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
                    onClick={() => scrollToSection('esim-faq')}
                  >
                    <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {t('whatIsEsim.nav.faqs') || 'eSIM FAQs'}
                    </span>
                    <ArrowDown className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </button>
                </div>
              </div>
            </section>

            {/* Benefits Section */}
            <section id="esim-benefits" className="relative py-16 lg:py-24 overflow-hidden">
              <FloatingShapes />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                  {/* Lottie Animation */}
                  <AnimatedSection className="flex-1 flex justify-center" direction="left">
                    <div className="w-full max-w-sm lg:max-w-md">
                      <DotLottieReact
                        src="/assets/lottie/benefit.lottie"
                        loop
                        autoplay
                        className="w-full h-auto"
                      />
                    </div>
                  </AnimatedSection>

                  {/* Content */}
                  <AnimatedSection className="flex-1" direction="right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                      {t('whatIsEsim.benefitsSection.title') || 'What are the benefits of eSIMs?'}
                    </h2>
                    <p className="text-xl font-medium text-gray-800 mb-4">
                      {t('whatIsEsim.benefitsSection.subtitle') || 'Get flexible, affordable and convenient mobile coverage.'}
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      {t('whatIsEsim.benefitsSection.description') || "You can buy and install an eSIM in minutes — all you need is internet connection. And because it's digital, there's no plastic involved, which makes it better for the planet. Plus, eSIMs are incredibly flexible. You can store multiple eSIM profiles on one device and switch between them based on your needs."}
                    </p>
                  </AnimatedSection>
                </div>
              </div>
            </section>

            {/* How Mobile11 Uses eSIMs */}
            <section id="how-mobile11-uses" className="relative py-16 lg:py-24 overflow-hidden">
              <FloatingShapes />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
                  {/* Lottie Animation */}
                  <AnimatedSection className="flex-1 flex justify-center" direction="right">
                    <div className="w-full max-w-sm lg:max-w-md">
                      <DotLottieReact
                        src="/assets/lottie/travel-around-the-world.lottie"
                        loop
                        autoplay
                        className="w-full h-auto"
                      />
                    </div>
                  </AnimatedSection>

                  {/* Content */}
                  <AnimatedSection className="flex-1" direction="left">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                      {t('whatIsEsim.mobile11Section.title') || 'How does Mobile11 use eSIMs?'}
                    </h2>
                    <p className="text-xl font-medium text-gray-800 mb-4">
                      {t('whatIsEsim.mobile11Section.subtitle') || 'Stay connected in 150+ countries with Mobile11.'}
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {t('whatIsEsim.mobile11Section.description') || "Mobile11 offers access to mobile networks around the world. All our packages include an eSIM, which you can install by scanning a QR code after purchase. Simply connect to any available network and you're online — it's that easy."}
                    </p>
                    <Button 
                      onClick={() => navigate('/packages')} 
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 px-6 text-base gap-2"
                    >
                      {t('whatIsEsim.mobile11Section.browsePackages') || 'Browse eSIM Packages'} 
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </AnimatedSection>
                </div>
              </div>
            </section>

            {/* What You Need Section */}
            <section className="relative py-16 lg:py-24 overflow-hidden">
              <FloatingShapes />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                  {/* Lottie Animation */}
                  <AnimatedSection className="flex-1 flex justify-center" direction="left">
                    <div className="w-full max-w-sm lg:max-w-md">
                      <DotLottieReact
                        src="/assets/lottie/esim-technology.lottie"
                        loop
                        autoplay
                        className="w-full h-auto"
                      />
                    </div>
                  </AnimatedSection>

                  {/* Content */}
                  <AnimatedSection className="flex-1" direction="right">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                      {t('whatIsEsim.needSection.title') || 'What do I need to use an eSIM?'}
                    </h2>
                    <p className="text-xl font-medium text-gray-800 mb-4">
                      {t('whatIsEsim.needSection.subtitle') || "You'll need a device that supports eSIMs."}
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {t('whatIsEsim.needSection.description') || "Many mobile phones and tablets support eSIMs — even some laptops and smartwatches do, too. You'll also need to make sure your device is not carrier-locked. Check out our list of devices that support eSIMs."}
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => handleTabChange('device-compatibility')} 
                      className="rounded-full h-12 px-6 text-base gap-2 border-gray-300"
                    >
                      {t('whatIsEsim.needSection.checkDevices') || 'Check Device Compatibility'} 
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </AnimatedSection>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="esim-faq" className="py-16 lg:py-24">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatedSection className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {t('whatIsEsim.faq.title')}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {t('whatIsEsim.faq.subtitle')}
                  </p>
                </AnimatedSection>

                <Accordion type="single" collapsible className="space-y-4 mb-8">
                  {faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`} 
                      className="bg-white border border-gray-100 rounded-xl px-6 hover:border-orange-200 transition-colors shadow-sm"
                    >
                      <AccordionTrigger className="text-left font-semibold hover:text-orange-600 text-base py-5 text-gray-900">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 leading-relaxed pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/support')} 
                    className="rounded-full h-12 px-6 text-base gap-2 border-gray-300"
                  >
                    {t('whatIsEsim.faq.ctaCard.button')} <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </section>

            <RelatedPages
              items={[
                { to: '/how-it-works', titleEn: 'How Mobile11 Works', titleTh: 'Mobile11 ทำงานอย่างไร', descriptionEn: 'See our simple 3-step process', descriptionTh: 'ดูขั้นตอนง่ายๆ 3 ขั้นตอน', icon: Settings },
                { to: '/packages', titleEn: 'Browse eSIM Packages', titleTh: 'ดูแพ็คเกจ eSIM', descriptionEn: 'Find plans for 150+ countries', descriptionTh: 'ค้นหาแพ็คเกจสำหรับ 150+ ประเทศ', icon: ShoppingBag },
                { to: '/blog', titleEn: 'Travel Guides', titleTh: 'คู่มือการเดินทาง', descriptionEn: 'Read our latest travel tips', descriptionTh: 'อ่านเคล็ดลับการเดินทางล่าสุด', icon: BookOpen },
              ]}
            />

            {/* Final CTA */}
            <section className="py-16 lg:py-24 bg-orange-500">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {t('whatIsEsim.cta.title')}
                </h2>
                <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
                  {t('whatIsEsim.cta.description')}
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    size="lg"
                    onClick={() => navigate('/packages')} 
                    className="bg-white text-orange-600 hover:bg-orange-50 rounded-full h-12 px-8 text-base font-semibold"
                  >
                    {t('whatIsEsim.cta.browsePlans')}
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/support')} 
                    className="border-white text-white hover:bg-orange-600 rounded-full h-12 px-8 text-base"
                  >
                    {t('whatIsEsim.cta.contactSupport')}
                  </Button>
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="device-compatibility"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Device Compatibility Hero */}
            <section className="relative overflow-hidden py-12 md:py-20">
              <FloatingShapes />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                  {/* Text Content */}
                  <motion.div 
                    className="flex-1 text-center lg:text-left"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                      {t('whatIsEsim.deviceCompatibility.title') || 'Device compatibility'}
                    </h1>
                    <p className="text-xl md:text-2xl font-medium text-gray-900 mb-4">
                      {t('whatIsEsim.deviceCompatibility.subtitle') || 'Every package Mobile11 offers includes an eSIM.'}
                    </p>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                      {t('whatIsEsim.deviceCompatibility.description') || "You'll need to make sure your device supports eSIMs and has no carrier restrictions to use Mobile11."}
                    </p>
                  </motion.div>

                  {/* Lottie Animation */}
                  <motion.div 
                    className="flex-1 flex justify-center"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
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

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                  <button 
                    className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
                    onClick={() => scrollToSection('how-to-check')}
                  >
                    <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {t('whatIsEsim.deviceCompatibility.nav.howToCheck') || 'How to check if you can use Mobile11'}
                    </span>
                    <ArrowDown className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </button>
                  
                  <button 
                    className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
                    onClick={() => scrollToSection('supported-devices')}
                  >
                    <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {t('whatIsEsim.deviceCompatibility.nav.supportedDevices') || 'What devices support eSIMs?'}
                    </span>
                    <ArrowDown className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </button>
                  
                  <button 
                    className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
                    onClick={() => scrollToSection('device-faqs')}
                  >
                    <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {t('whatIsEsim.deviceCompatibility.nav.faqs') || 'Device compatibility FAQs'}
                    </span>
                    <ArrowDown className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </button>
                </div>
              </div>
            </section>

            {/* Three Conditions Section */}
            <section className="relative py-8 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">
                    {t('whatIsEsim.deviceCompatibility.conditions.intro') || 'To use a Mobile11 eSIM, your device must meet the following conditions:'}
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      {t('whatIsEsim.deviceCompatibility.conditions.condition1') || 'The device supports eSIMs'}
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      {t('whatIsEsim.deviceCompatibility.conditions.condition2') || 'The device is not carrier or network-locked'}
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      {t('whatIsEsim.deviceCompatibility.conditions.condition3') || 'The device is not jailbroken (iOS) or rooted (Android)'}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How to Check Section */}
            <section id="how-to-check" className="relative py-16 lg:py-24 overflow-hidden">
              <FloatingShapes />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatedSection className="mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {t('whatIsEsim.deviceCompatibility.howToCheck.title') || 'How to check if you can use Mobile11'}
                  </h2>
                </AnimatedSection>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Check eSIM Support */}
                  <Card className="bg-white border border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-teal-100 flex-shrink-0">
                          <Smartphone className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {t('whatIsEsim.deviceCompatibility.checkSupport.title') || 'Make sure your device supports eSIMs'}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {t('whatIsEsim.deviceCompatibility.checkSupport.description') || "You can usually check by going to the SIMs section of your device's settings — we also have a list of devices that support eSIMs."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Check Carrier Lock */}
                  <Card className="bg-white border border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-orange-100 flex-shrink-0">
                          <Lock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {t('whatIsEsim.deviceCompatibility.checkCarrierLock.title') || 'Make sure your device is not carrier-locked'}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {t('whatIsEsim.deviceCompatibility.checkCarrierLock.description') || "You can check your device's settings to see if it is carrier or network-locked. Alternatively, contact your primary mobile provider to ask."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Check EID Number */}
                  <Card className="bg-white border border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 flex-shrink-0">
                          <Hash className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {t('whatIsEsim.deviceCompatibility.checkEid.title') || 'Check for EID number'}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {t('whatIsEsim.deviceCompatibility.checkEid.description') || "Open your phone app and dial *#06#. Look for a 32-digit number labeled 'EID'. If the EID exists, your device supports eSIM."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Not Jailbroken/Rooted */}
                  <Card className="bg-white border border-gray-100 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 flex-shrink-0">
                          <ShieldCheck className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {t('whatIsEsim.deviceCompatibility.checkJailbreak.title') || 'Not jailbroken or rooted'}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {t('whatIsEsim.deviceCompatibility.checkJailbreak.description') || 'Jailbroken (iOS) or rooted (Android) devices may have issues with eSIM activation. Use stock/unmodified software.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Supported Devices Section */}
            <section id="supported-devices" className="py-16 lg:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatedSection className="mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {t('whatIsEsim.deviceCompatibility.supportedDevices.title') || 'What devices support eSIMs?'}
                  </h2>
                  <p className="text-lg text-gray-600 mb-2">
                    {t('whatIsEsim.deviceCompatibility.supportedDevices.description') || 'Click on a brand to see all supported devices.'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('whatIsEsim.deviceCompatibility.listDisclaimer') || "Our list is updated regularly, but not exhaustive — if you don't see your device, check with the manufacturer to confirm it supports eSIMs."}
                  </p>
                </AnimatedSection>

                {/* Smartphones & Tablets Section */}
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-teal-100">
                      <Smartphone className="h-5 w-5 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {t('whatIsEsim.deviceCompatibility.categories.smartphones') || 'Smartphones & Tablets'}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {getPhoneBrands().map(([key, brand]) => (
                      <DeviceBrandAccordion 
                        key={key}
                        brandKey={key}
                        brand={brand}
                        isExpanded={expandedBrands.includes(key)}
                        onToggle={() => toggleBrand(key)}
                        icon={<Smartphone className="h-5 w-5 text-gray-600" />}
                        language={language}
                      />
                    ))}
                  </div>
                </div>

                {/* Windows Laptops Section */}
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Laptop className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {t('whatIsEsim.deviceCompatibility.categories.laptops') || 'Windows 10 / Windows 11 Laptops'}
                    </h3>
                  </div>

                  {/* Windows Requirements Warning */}
                  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 space-y-1">
                        <p><strong>{t('whatIsEsim.deviceCompatibility.warnings.windows') || 'For Windows 10: Your PC needs Windows 10 version 1703 or later. The device also needs to be LTE-ready.'}</strong></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {getLaptopBrands().map(([key, brand]) => (
                      <DeviceBrandAccordion 
                        key={key}
                        brandKey={key}
                        brand={brand}
                        isExpanded={expandedBrands.includes(key)}
                        onToggle={() => toggleBrand(key)}
                        icon={<Laptop className="h-5 w-5 text-gray-600" />}
                        language={language}
                      />
                    ))}
                  </div>
                </div>

                {/* General Disclaimer */}
                <motion.div
                  className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gray-200 flex-shrink-0">
                      <HelpCircle className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">
                        {t('whatIsEsim.deviceCompatibility.disclaimerTitle') || 'Important Information'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t('whatIsEsim.deviceCompatibility.listDisclaimer') || "Our list is updated regularly, but not exhaustive — if you don't see your device, check with the manufacturer to confirm it supports eSIMs."}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Device FAQs */}
            <section id="device-faqs" className="py-16 lg:py-24 bg-white/50">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatedSection className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {t('whatIsEsim.deviceCompatibility.faqs.title') || 'Device compatibility FAQs'}
                  </h2>
                </AnimatedSection>

                <Accordion type="single" collapsible className="space-y-4">
                  {deviceFaqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`device-faq-${index}`} 
                      className="bg-white border border-gray-100 rounded-xl px-6 hover:border-orange-200 transition-colors shadow-sm"
                    >
                      <AccordionTrigger className="text-left font-semibold hover:text-orange-600 text-base py-5 text-gray-900">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 leading-relaxed pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 lg:py-24 bg-orange-500">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {t('whatIsEsim.deviceCompatibility.cta.title') || 'Ready to get connected?'}
                </h2>
                <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
                  {t('whatIsEsim.deviceCompatibility.cta.description') || 'Your device is compatible — now explore our eSIM packages for 150+ countries.'}
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    size="lg"
                    onClick={() => navigate('/packages')} 
                    className="bg-white text-orange-600 hover:bg-orange-50 rounded-full h-12 px-8 text-base font-semibold"
                  >
                    {t('whatIsEsim.cta.browsePlans')}
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/support')} 
                    className="border-white text-white hover:bg-orange-600 rounded-full h-12 px-8 text-base"
                  >
                    {t('whatIsEsim.cta.contactSupport')}
                  </Button>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <FooterAiralo />
    </div>
  );
}
