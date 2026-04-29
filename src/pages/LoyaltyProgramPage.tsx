import { LoyaltyHeroSection } from '@/components/loyalty/LoyaltyHeroSection';
import { LoyaltyHowItWorks } from '@/components/loyalty/LoyaltyHowItWorks';
import { LoyaltyTierCards } from '@/components/loyalty/LoyaltyTierCards';
import { LoyaltyHelpArticles } from '@/components/loyalty/LoyaltyHelpArticles';
import { LoyaltyFAQ } from '@/components/loyalty/LoyaltyFAQ';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO, getBreadcrumbStructuredData, getFAQStructuredData } from '@/components/SEO';
import { RelatedPages } from '@/components/seo/RelatedPages';
import { Gift, Globe, Users } from 'lucide-react';

const BASE_URL = 'https://mobile11.com';

const LoyaltyProgramPage = () => {
  const { t } = useLanguage();

  const faqStructuredData = getFAQStructuredData([
    { question: String(t('loyaltyFaq.q1')), answer: String(t('loyaltyFaq.a1')) },
    { question: String(t('loyaltyFaq.q2')), answer: String(t('loyaltyFaq.a2')) },
    { question: String(t('loyaltyFaq.q3')), answer: String(t('loyaltyFaq.a3')) },
    { question: String(t('loyaltyFaq.q4')), answer: String(t('loyaltyFaq.a4')) },
    { question: String(t('loyaltyFaq.q5')), answer: String(t('loyaltyFaq.a5')) },
  ]);

  return (
    <>
      <SEO
        title={t('loyaltyProgram.meta.title') || 'Loyalty Program'}
        description={t('loyaltyProgram.meta.description') || 'Earn cashback rewards with Mobile11 Loyalty Program. The more you travel, the more you save.'}
        canonical={`${BASE_URL}/loyalty-program`}
        keywords={['loyalty program', 'esim rewards', 'cashback', 'mobile11 loyalty']}
        structuredData={[
          getBreadcrumbStructuredData([
            { name: 'Home', url: BASE_URL },
            { name: 'Loyalty Program', url: `${BASE_URL}/loyalty-program` },
          ]),
          faqStructuredData,
        ]}
      />
      
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header variant="dark" />
        <main>
          <LoyaltyHeroSection />
          <LoyaltyHowItWorks />
          <LoyaltyTierCards />
          <LoyaltyHelpArticles />
          <LoyaltyFAQ />

          <RelatedPages
            items={[
              { to: '/refer-and-earn', titleEn: 'Refer & Earn', titleTh: 'แนะนำเพื่อน', descriptionEn: 'Earn rewards by referring friends', descriptionTh: 'รับรางวัลจากการแนะนำเพื่อน', icon: Gift },
              { to: '/packages', titleEn: 'Browse Packages', titleTh: 'ดูแพ็คเกจทั้งหมด', descriptionEn: 'Find the perfect eSIM plan', descriptionTh: 'ค้นหาแพ็คเกจ eSIM ที่เหมาะสม', icon: Globe },
              { to: '/about', titleEn: 'About Us', titleTh: 'เกี่ยวกับเรา', descriptionEn: 'Learn more about Mobile11', descriptionTh: 'เรียนรู้เพิ่มเติมเกี่ยวกับ Mobile11', icon: Users },
            ]}
          />
        </main>
        <FooterAiralo />
      </div>
    </>
  );
};

export default LoyaltyProgramPage;
