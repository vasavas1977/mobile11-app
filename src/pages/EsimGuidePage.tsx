import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Smartphone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO, getBreadcrumbStructuredData } from '@/components/SEO';
import { RelatedPages } from '@/components/seo/RelatedPages';

const BASE_URL = 'https://mobile11.com';
import { GuideTabNavigation } from '@/components/guide/GuideTabNavigation';
import { ManualActivationSection } from '@/components/guide/ManualActivationSection';

export default function EsimGuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const initialSection = searchParams.get('section') || 'manual-activation';
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'manual-activation':
        return <ManualActivationSection />;
      case 'whats-esim':
      case 'qr-code-activation':
      case 'troubleshooting':
      case 'faq':
      case 'check-data-usage':
        return (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('guide.comingSoon')}</h3>
            <p className="text-muted-foreground">{t('guide.comingSoonDesc')}</p>
          </div>
        );
      default:
        return <ManualActivationSection />;
    }
  };

  return (
    <>
      <SEO
        title={t('guide.pageTitle') || 'eSIM Guide'}
        description={t('guide.metaDescription') || 'Complete guide to using eSIM for travel. Learn about activation, troubleshooting, and more.'}
        canonical={`${BASE_URL}/esim-guide`}
        keywords={['esim guide', 'esim tutorial', 'esim activation', 'esim troubleshooting']}
        structuredData={getBreadcrumbStructuredData([
          { name: 'Home', url: BASE_URL },
          { name: 'eSIM Guide', url: `${BASE_URL}/esim-guide` },
        ])}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-primary uppercase tracking-wider">
                  {t('guide.badge')}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                {t('guide.heroTitle')}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('guide.heroDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container mx-auto px-4">
          <GuideTabNavigation 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
          />
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            {renderSectionContent()}
          </div>
        </div>

        <RelatedPages
          items={[
            { to: '/installation-guide', titleEn: 'Installation Guide', titleTh: 'คู่มือการติดตั้ง', titleZh: '安装指南', titleJa: 'インストールガイド', titleKo: '설치 가이드', titleFr: 'Guide d\'installation', titleDe: 'Installationsanleitung', descriptionEn: 'Step-by-step eSIM setup instructions', descriptionTh: 'คำแนะนำการตั้งค่า eSIM ทีละขั้นตอน', descriptionZh: 'eSIM分步设置说明', descriptionJa: 'eSIMのセットアップ手順', descriptionKo: 'eSIM 설정 단계별 안내', descriptionFr: 'Instructions étape par étape', descriptionDe: 'Schritt-für-Schritt-Anleitung', icon: BookOpen },
            { to: '/what-is-esim', titleEn: 'What is an eSIM?', titleTh: 'eSIM คืออะไร?', titleZh: '什么是eSIM？', titleJa: 'eSIMとは？', titleKo: 'eSIM이란?', titleFr: 'Qu\'est-ce qu\'une eSIM ?', titleDe: 'Was ist eine eSIM?', descriptionEn: 'Learn the basics of eSIM technology', descriptionTh: 'เรียนรู้พื้นฐานเทคโนโลยี eSIM', descriptionZh: '了解eSIM技术基础', descriptionJa: 'eSIM技術の基本を学ぶ', descriptionKo: 'eSIM 기술의 기초', descriptionFr: 'Découvrez les bases de l\'eSIM', descriptionDe: 'Lernen Sie die Grundlagen der eSIM', icon: Smartphone },
            { to: '/packages', titleEn: 'Browse Packages', titleTh: 'ดูแพ็คเกจทั้งหมด', titleZh: '浏览套餐', titleJa: 'パッケージを見る', titleKo: '패키지 둘러보기', titleFr: 'Parcourir les forfaits', titleDe: 'Pakete durchsuchen', descriptionEn: 'Find the perfect eSIM plan for your trip', descriptionTh: 'ค้นหาแพ็คเกจ eSIM ที่เหมาะกับทริปของคุณ', descriptionZh: '为您的旅行找到完美的eSIM套餐', descriptionJa: '旅行に最適なeSIMプランを見つける', descriptionKo: '여행에 딱 맞는 eSIM 요금제', descriptionFr: 'Trouvez le forfait parfait', descriptionDe: 'Finden Sie den perfekten Tarif', icon: Globe },
          ]}
        />
      </div>
    </>
  );
}
