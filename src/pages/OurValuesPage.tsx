import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Globe, Users, Shield, Zap, Building, BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { SEO, getBreadcrumbStructuredData } from '@/components/SEO';
import { RelatedPages } from '@/components/seo/RelatedPages';

const BASE_URL = 'https://mobile11.com';
import FooterAiralo from '@/components/landing/FooterAiralo';
import ValuesDecorations from '@/components/landing/ValuesDecorations';
import { useLanguage } from '@/contexts/LanguageContext';

interface Value {
  id: string;
  translationKey: string;
  icon: React.ElementType;
  lottieUrl: string;
}

const OurValuesPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  const values: Value[] = [
    {
      id: 'global-reach',
      translationKey: 'globalReach',
      icon: Globe,
      lottieUrl: '/lottie/treasure-world.lottie',
    },
    {
      id: 'customer-first',
      translationKey: 'customerFirst',
      icon: Users,
      lottieUrl: '/lottie/trophy-success.lottie',
    },
    {
      id: 'trust-security',
      translationKey: 'trustSecurity',
      icon: Shield,
      lottieUrl: '/lottie/security.lottie',
    },
    {
      id: 'innovation',
      translationKey: 'innovation',
      icon: Zap,
      lottieUrl: '/lottie/innovation.lottie',
    },
  ];

  const activeValue = values[activeTab];
  
  // Get translated content for active value
  const getTitle = (key: string) => t(`values.${key}.title`) || key;
  const getSubtitle = (key: string) => t(`values.${key}.subtitle`) || '';
  const getDescription = (key: string) => t(`values.${key}.description`) || '';
  const getBullets = (key: string): string[] => {
    const bullets = t(`values.${key}.bullets`);
    return Array.isArray(bullets) ? bullets : [];
  };

  return (
    <>
      <SEO
        title={t('values.meta.title') || 'Our Values'}
        description={t('values.meta.description') || 'Discover the core values that drive Mobile11: Global Reach, Customer First, Trust & Security, and Innovation.'}
        canonical={`${BASE_URL}/our-values`}
        keywords={['mobile11 values', 'company values', 'esim provider values']}
        structuredData={getBreadcrumbStructuredData([
          { name: 'Home', url: BASE_URL },
          { name: 'Our Values', url: `${BASE_URL}/our-values` },
        ])}
      />

      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        
        <main className="relative overflow-hidden">
          {/* Decorative elements */}
          <ValuesDecorations />

          {/* Hero Section */}
          <section className="relative z-10 pt-24 pb-12 lg:pt-32 lg:pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left: Text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                    {t('values.hero.title') || 'Our Values'}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 max-w-lg">
                    {t('values.hero.subtitle') || 'The principles that guide everything we do at mobile11. These values shape our culture, our products, and our commitment to you.'}
                  </p>
                </motion.div>

                {/* Right: Lottie Animation */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex justify-center lg:justify-end"
                >
                  <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                    <DotLottieReact
                      src="/lottie/businessman-employees.lottie"
                      loop
                      autoplay
                      className="w-full h-full"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Tab Navigation */}
          <section className="relative z-10 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="border-b border-gray-300">
                <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
                  {values.map((value, index) => {
                    const Icon = value.icon;
                    const isActive = activeTab === index;
                    return (
                      <button
                        key={value.id}
                        onClick={() => setActiveTab(index)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-300 ${
                          isActive
                            ? 'border-gray-900 text-gray-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : ''}`} />
                        {getTitle(value.translationKey)}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </section>

          {/* Value Content */}
          <section className="relative z-10 py-12 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeValue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
                >
                  {/* Left: Lottie Animation */}
                  <div className="flex justify-center">
                    <div className="w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] bg-white rounded-3xl shadow-lg p-8 flex items-center justify-center">
                      <DotLottieReact
                        src={activeValue.lottieUrl}
                        loop
                        autoplay
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full mb-6">
                      <activeValue.icon className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">{getSubtitle(activeValue.translationKey)}</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                      {getTitle(activeValue.translationKey)}
                    </h2>
                    
                    <p className="text-lg text-gray-600 mb-8">
                      {getDescription(activeValue.translationKey)}
                    </p>

                    <ul className="space-y-4">
                      {getBullets(activeValue.translationKey).map((bullet, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center mt-0.5">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-700">{bullet}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative z-10 py-16 lg:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 shadow-xl"
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                  {t('values.cta.title') || 'Ready to experience the difference?'}
                </h2>
                <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
                  {t('values.cta.subtitle') || 'Join millions of travelers who trust mobile11 for their global connectivity needs.'}
                </p>
                <a
                  href="/packages"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 font-semibold rounded-full hover:bg-orange-50 transition-colors shadow-lg"
                >
                  {t('values.cta.button') || 'Browse eSIM Plans'}
                </a>
              </motion.div>
            </div>
          </section>

          <RelatedPages
            items={[
              { to: '/about', titleEn: 'About Us', titleTh: 'เกี่ยวกับเรา', descriptionEn: 'Learn more about Mobile11', descriptionTh: 'เรียนรู้เพิ่มเติมเกี่ยวกับ Mobile11', icon: Users },
              { to: '/business', titleEn: 'Business', titleTh: 'สำหรับธุรกิจ', descriptionEn: 'eSIM solutions for businesses', descriptionTh: 'โซลูชัน eSIM สำหรับธุรกิจ', icon: Building },
              { to: '/blog', titleEn: 'Blog', titleTh: 'บล็อก', descriptionEn: 'Latest news and travel tips', descriptionTh: 'ข่าวสารและเคล็ดลับการเดินทาง', icon: BookOpen },
            ]}
          />
        </main>

        <FooterAiralo />
      </div>
    </>
  );
};

export default OurValuesPage;
