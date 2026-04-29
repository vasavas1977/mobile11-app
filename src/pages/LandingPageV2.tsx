import React from 'react';
import { SEO, getFAQStructuredData } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';

// Import V2 theme styles
import '../styles/theme-v2.css';

// Import V2 components
import {
  HeaderV2,
  HeroCarouselV2,
  WhyMobile11V2,
  PopularDestinationsV2,
  FAQSectionV2,
} from '@/components/landing-v2';
import { FooterAiralo } from '@/components/landing/FooterAiralo';

const LandingPageV2: React.FC = () => {
  const { t } = useLanguage();

  const faqStructuredData = getFAQStructuredData([
    { question: String(t('faqV2.q1')), answer: String(t('faqV2.a1')) },
    { question: String(t('faqV2.q2')), answer: String(t('faqV2.a2')) },
    { question: String(t('faqV2.q3')), answer: String(t('faqV2.a3')) },
    { question: String(t('faqV2.q4')), answer: String(t('faqV2.a4')) },
    { question: String(t('faqV2.q5')), answer: String(t('faqV2.a5')) },
  ]);

  return (
    <div className="theme-v2 min-h-screen">
      <SEO
        title="Mobile11 - Global eSIM Connectivity | Preview"
        description="Stay connected worldwide with Mobile11 eSIM."
        noindex={true}
        structuredData={faqStructuredData}
      />

      {/* V2 Header */}
      <HeaderV2 />

      {/* Main Content */}
      <main>
        {/* Hero Section with Carousel */}
        <HeroCarouselV2 />

        {/* Why Mobile11 Section */}
        <WhyMobile11V2 />

        {/* Popular Destinations Section */}
        <PopularDestinationsV2 />

        {/* FAQ Section */}
        <FAQSectionV2 />
      </main>

      {/* V2 Footer */}
      <FooterAiralo />
    </div>
  );
};

export default LandingPageV2;
