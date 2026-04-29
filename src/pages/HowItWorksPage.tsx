import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO, getFAQStructuredData, getBreadcrumbStructuredData } from '@/components/SEO';
import { HowItWorksHero } from '@/components/how-it-works/HowItWorksHero';
import { AccordionNavigation } from '@/components/how-it-works/AccordionNavigation';
import { RelatedPages } from '@/components/seo/RelatedPages';
import { Smartphone, Globe, BookOpen } from 'lucide-react';

const BASE_URL = 'https://mobile11.com';

const HowItWorksPage = () => {
  const { t, language } = useLanguage();

  const faqData = [
    { question: t('howItWorksPage2.faq1q'), answer: t('howItWorksPage2.faq1a') },
    { question: t('howItWorksPage2.faq2q'), answer: t('howItWorksPage2.faq2a') },
    { question: t('howItWorksPage2.faq3q'), answer: t('howItWorksPage2.faq3a') },
    { question: t('howItWorksPage2.faq4q'), answer: t('howItWorksPage2.faq4a') },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEO 
        title={t('howItWorksPage.meta.title') || 'How Mobile11 Works | eSIM Guide'}
        description={t('howItWorksPage.meta.description') || 'Learn how Mobile11 works, what an eSIM is, and how to stay connected worldwide with our easy 3-step process.'}
        canonical={`${BASE_URL}/how-it-works`}
        keywords={['how esim works', 'esim guide', 'esim setup', 'mobile11 how it works']}
        structuredData={[
          getFAQStructuredData(faqData),
          getBreadcrumbStructuredData([
            { name: 'Home', url: BASE_URL },
            { name: 'How It Works', url: `${BASE_URL}/how-it-works` },
          ]),
        ]}
      />
      <Header variant="dark" />
      
      <main className="pt-32 md:pt-36">
        {/* Hero Section */}
        <HowItWorksHero />
        
        {/* Accordion Navigation with Inline Content */}
        <AccordionNavigation />
      </main>

      <RelatedPages
        items={[
          { to: '/what-is-esim', titleEn: 'What is an eSIM?', titleTh: 'eSIM คืออะไร?', titleZh: '什么是eSIM？', titleJa: 'eSIMとは？', titleKo: 'eSIM이란?', titleFr: 'Qu\'est-ce qu\'une eSIM ?', titleDe: 'Was ist eine eSIM?', descriptionEn: 'Learn the basics of eSIM technology', descriptionTh: 'เรียนรู้พื้นฐานเทคโนโลยี eSIM', descriptionZh: '了解eSIM技术基础', descriptionJa: 'eSIM技術の基本を学ぶ', descriptionKo: 'eSIM 기술의 기초를 배워보세요', descriptionFr: 'Découvrez les bases de la technologie eSIM', descriptionDe: 'Lernen Sie die Grundlagen der eSIM-Technologie', icon: Smartphone },
          { to: '/installation-guide', titleEn: 'Installation Guide', titleTh: 'คู่มือการติดตั้ง', titleZh: '安装指南', titleJa: 'インストールガイド', titleKo: '설치 가이드', titleFr: 'Guide d\'installation', titleDe: 'Installationsanleitung', descriptionEn: 'Step-by-step eSIM setup instructions', descriptionTh: 'คำแนะนำการตั้งค่า eSIM ทีละขั้นตอน', descriptionZh: 'eSIM分步设置说明', descriptionJa: 'eSIMのセットアップ手順', descriptionKo: 'eSIM 설정 단계별 안내', descriptionFr: 'Instructions de configuration eSIM étape par étape', descriptionDe: 'Schritt-für-Schritt-Anleitung zur eSIM-Einrichtung', icon: BookOpen },
          { to: '/packages', titleEn: 'Browse Packages', titleTh: 'ดูแพ็คเกจทั้งหมด', titleZh: '浏览套餐', titleJa: 'パッケージを見る', titleKo: '패키지 둘러보기', titleFr: 'Parcourir les forfaits', titleDe: 'Pakete durchsuchen', descriptionEn: 'Find the perfect eSIM plan for your trip', descriptionTh: 'ค้นหาแพ็คเกจ eSIM ที่เหมาะกับทริปของคุณ', descriptionZh: '为您的旅行找到完美的eSIM套餐', descriptionJa: '旅行に最適なeSIMプランを見つける', descriptionKo: '여행에 딱 맞는 eSIM 요금제를 찾아보세요', descriptionFr: 'Trouvez le forfait eSIM parfait pour votre voyage', descriptionDe: 'Finden Sie den perfekten eSIM-Tarif für Ihre Reise', icon: Globe },
        ]}
      />
      
      <FooterAiralo />
    </div>
  );
};

export default HowItWorksPage;
