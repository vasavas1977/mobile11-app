import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCenterHero } from '@/components/help-center/HelpCenterHero';
import { HelpCategoryCard } from '@/components/help-center/HelpCategoryCard';
import { getHelpCategories } from '@/lib/helpCategoryConfig';
import { useHelpCategoryCounts } from '@/hooks/useHelpArticles';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { RelatedPages } from '@/components/seo/RelatedPages';
import { Smartphone, BookOpen, Mail } from 'lucide-react';
import { SEO, getFAQStructuredData, getBreadcrumbStructuredData } from '@/components/SEO';

const BASE_URL = 'https://mobile11.com';

export default function HelpCenterPage() {
  const { language, t } = useLanguage();
  const { data: categoryCounts = {} } = useHelpCategoryCounts(language);
  const categories = getHelpCategories();

  return (
    <>
      <SEO
        title={t('helpCenter.seoTitle')}
        description={t('helpCenter.seoDescription')}
        canonical={`${BASE_URL}/support`}
        keywords={['help center', 'esim help', 'esim faq', 'mobile11 support']}
        structuredData={[
          getFAQStructuredData([
            { question: t('helpCenter.faqWhatIsEsim'), answer: t('helpCenter.faqWhatIsEsimAnswer') },
            { question: t('helpCenter.faqHowInstall'), answer: t('helpCenter.faqHowInstallAnswer') },
            { question: t('helpCenter.faqWhichDevices'), answer: t('helpCenter.faqWhichDevicesAnswer') },
          ]),
          getBreadcrumbStructuredData([
            { name: 'Home', url: BASE_URL },
            { name: 'Help Center', url: `${BASE_URL}/support` },
          ]),
        ]}
      />

      <Header />
      
      <main className="min-h-screen bg-background">
        <HelpCenterHero />
        
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {t('helpCenter.allCollections')}
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <HelpCategoryCard 
                key={category.id} 
                category={category} 
                articleCount={categoryCounts[category.slug] || 0}
              />
            ))}
          </div>

          <RelatedPages
            titleKey="helpCenter.moreResources"
            items={[
              { to: '/what-is-esim', titleKey: 'helpCenter.whatIsEsim', descriptionKey: 'helpCenter.whatIsEsimDesc', icon: Smartphone },
              { to: '/installation-guide', titleKey: 'helpCenter.installationGuide', descriptionKey: 'helpCenter.installationGuideDesc', icon: BookOpen },
              { to: '/contact', titleKey: 'helpCenter.contactUs', descriptionKey: 'helpCenter.contactUsDesc', icon: Mail },
            ]}
          />
        </div>
      </main>

      <FooterAiralo />
    </>
  );
}
