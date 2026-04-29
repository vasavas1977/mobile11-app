import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO, getBreadcrumbStructuredData } from '@/components/SEO';

const BASE_URL = 'https://mobile11.com';
import { HelpBreadcrumbs } from '@/components/help-center/HelpBreadcrumbs';
import { HelpArticleList } from '@/components/help-center/HelpArticleList';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { getHelpCategoryBySlug } from '@/lib/helpCategoryConfig';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { HelpArticleListSkeleton } from '@/components/help-center/HelpCenterSkeleton';

export default function HelpCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { language, t, localizeField } = useLanguage();
  const dbLanguage = language as string;

  const category = categorySlug ? getHelpCategoryBySlug(categorySlug) : undefined;
  
  const { data: articles, isLoading, error } = useHelpArticles(
    categorySlug || '',
    dbLanguage
  );

  if (!categorySlug || !category) {
    return <Navigate to="/support" replace />;
  }

  const categoryName = localizeField(category, 'name');
  const categoryDescription = localizeField(category, 'description');

  return (
    <>
      <SEO
        title={`${categoryName} - Help Center`}
        description={categoryDescription}
        canonical={`${BASE_URL}/support/${categorySlug}`}
        keywords={['esim help', categoryName.toLowerCase(), 'mobile11 support']}
        structuredData={getBreadcrumbStructuredData([
          { name: 'Home', url: BASE_URL },
          { name: 'Help Center', url: `${BASE_URL}/support` },
          { name: categoryName, url: `${BASE_URL}/support/${categorySlug}` },
        ])}
      />

      <Header />
      
      <main className="min-h-screen bg-[#FAF7F2]">
        <section className="relative overflow-hidden pt-24 pb-8 md:pt-28 md:pb-12">
          <div className="absolute top-20 right-[15%] w-16 h-20 bg-orange-300 rounded-xl rotate-12 opacity-50" />
          <div className="absolute bottom-8 left-[10%] w-12 h-12 bg-emerald-200 rounded-full opacity-50" />
          <div className="absolute top-32 left-[25%] w-8 h-8 bg-amber-200 rounded-full opacity-40" />
          
          <div className="container mx-auto px-4 relative z-10">
            <HelpBreadcrumbs 
              items={[{ label: categoryName }]}
            />
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
              {categoryName}
            </h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              {categoryDescription}
            </p>
          </div>
        </section>
        
        <section className="py-8 pb-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <HelpArticleListSkeleton />
            ) : error ? (
              <div className="text-center py-12 text-gray-500">
                {t('helpCategory.failedToLoad')}
              </div>
            ) : (
              <HelpArticleList articles={articles || []} categorySlug={categorySlug} />
            )}
          </div>
        </section>
      </main>

      <FooterAiralo />
    </>
  );
}