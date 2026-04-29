import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { ReferralHeroSection } from '@/components/referral/ReferralHeroSection';
import { ReferralHowItWorks } from '@/components/referral/ReferralHowItWorks';
import { ReferralFAQ } from '@/components/referral/ReferralFAQ';
import { SEO, getBreadcrumbStructuredData, getFAQStructuredData } from '@/components/SEO';
import { RelatedPages } from '@/components/seo/RelatedPages';
import { Award, Globe, Users } from 'lucide-react';

const BASE_URL = 'https://mobile11.com';

const ReferAndEarnPage = () => {
  const { t, language, formatPrice } = useLanguage();

  const faqStructuredData = getFAQStructuredData([
    { question: String(t('referralPage.faq.q1')), answer: String(t('referralPage.faq.a1')) },
    { question: String(t('referralPage.faq.q2')), answer: String(t('referralPage.faq.a2')) },
    { question: String(t('referralPage.faq.q3')), answer: String(t('referralPage.faq.a3')) },
    { question: String(t('referralPage.faq.q4')), answer: String(t('referralPage.faq.a4')) },
    { question: String(t('referralPage.faq.q5')), answer: String(t('referralPage.faq.a5')) },
    { question: String(t('referralPage.faq.q6')), answer: String(t('referralPage.faq.a6')) },
  ]);

  return (
    <>
      <SEO
        title={t('referAndEarn2.seoTitle')}
        description={t('referAndEarn2.seoDescription')}
        canonical={`${BASE_URL}/refer-and-earn`}
        keywords={['referral program', 'refer friends', 'mobile11 money', 'esim discount']}
        structuredData={[
          getBreadcrumbStructuredData([
            { name: 'Home', url: BASE_URL },
            { name: 'Refer & Earn', url: `${BASE_URL}/refer-and-earn` },
          ]),
          faqStructuredData,
        ]}
      />
      
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header variant="dark" />
        <main>
          <ReferralHeroSection />
          <ReferralHowItWorks />
          <ReferralFAQ />

          <RelatedPages
            items={[
              { to: '/loyalty-program', titleEn: 'Loyalty Program', titleTh: 'โปรแกรมสะสมแต้ม', descriptionEn: 'Earn cashback rewards as you travel', descriptionTh: 'รับเงินคืนเมื่อคุณเดินทาง', icon: Award },
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

export default ReferAndEarnPage;
