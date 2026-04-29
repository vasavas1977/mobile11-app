import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { LimitlessHero } from '@/components/limitless/LimitlessHero';
import { LimitlessCountriesGrid } from '@/components/limitless/LimitlessCountriesGrid';
import { LimitlessFAQ } from '@/components/limitless/LimitlessFAQ';
import { SEO, getFAQStructuredData } from '@/components/SEO';

export const LimitlessPage: React.FC = () => {
  const { t } = useLanguage();

  const faqStructuredData = getFAQStructuredData([
    { question: String(t('limitless.faq.q1.question') || 'Do unlimited data packages have any limits?'), answer: String(t('limitless.faq.q1.answer') || '') },
    { question: String(t('limitless.faq.q2.question') || 'What is the fair use policy?'), answer: String(t('limitless.faq.q2.answer') || '') },
    { question: String(t('limitless.faq.q3.question') || 'Can I use hotspot/tethering with unlimited data?'), answer: String(t('limitless.faq.q3.answer') || '') },
    { question: String(t('limitless.faq.q4.question') || 'When does my unlimited data plan start?'), answer: String(t('limitless.faq.q4.answer') || '') },
    { question: String(t('limitless.faq.q5.question') || 'What speeds can I expect?'), answer: String(t('limitless.faq.q5.answer') || '') },
  ]);

  return (
    <>
      <SEO
        title={String(t('limitless.meta.title') || 'Unlimited Data eSIM Packages | Mobile11')}
        description={String(t('limitless.meta.description') || 'Get unlimited eSIM data for 109+ countries. No throttling, no data caps. Stay connected with truly unlimited mobile data wherever you travel.')}
        keywords={['unlimited esim', 'unlimited data', 'global esim', 'travel data', 'international data', 'mobile data']}
        canonical="https://mobile11.com/limitless"
        structuredData={faqStructuredData}
      />

      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        
        <main>
          <LimitlessHero />
          <LimitlessCountriesGrid />
          <LimitlessFAQ />
        </main>

        <FooterAiralo />
      </div>
    </>
  );
};

export default LimitlessPage;
