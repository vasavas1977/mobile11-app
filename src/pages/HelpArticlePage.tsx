import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO, getBreadcrumbStructuredData } from '@/components/SEO';

const BASE_URL = 'https://mobile11.com';
import { HelpBreadcrumbs } from '@/components/help-center/HelpBreadcrumbs';
import { HelpArticleContent } from '@/components/help-center/HelpArticleContent';
import { useHelpArticle, incrementArticleViewCount } from '@/hooks/useHelpArticles';
import { getHelpCategoryBySlug } from '@/lib/helpCategoryConfig';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { HelpArticleContentSkeleton } from '@/components/help-center/HelpCenterSkeleton';

export default function HelpArticlePage() {
  const { categorySlug, articleSlug } = useParams<{ categorySlug: string; articleSlug: string }>();
  const { language, localizeField } = useLanguage();
  const dbLanguage = language as string;

  const category = categorySlug ? getHelpCategoryBySlug(categorySlug) : undefined;
  
  const { data: article, isLoading, error } = useHelpArticle(
    categorySlug || '',
    articleSlug || '',
    dbLanguage
  );

  useEffect(() => {
    if (article?.id) {
      incrementArticleViewCount(article.id);
    }
  }, [article?.id]);

  if (!categorySlug || !articleSlug) {
    return <Navigate to="/support" replace />;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#FAF7F2]">
          <section className="relative overflow-hidden pt-24 pb-6 md:pt-28 md:pb-8">
            <div className="container mx-auto px-4 relative z-10">
              <HelpBreadcrumbs items={[{ label: '...' }]} />
            </div>
          </section>
          <section className="py-8 pb-16">
            <div className="container mx-auto px-4">
              <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-sm">
                <HelpArticleContentSkeleton />
              </div>
            </div>
          </section>
        </main>
        <FooterAiralo />
      </>
    );
  }

  if (error || !article || !category) {
    return <Navigate to="/support" replace />;
  }

  const categoryName = localizeField(category, 'name');
  const articleTitle = article.title;
  const articleDescription = article.description || '';

  return (
    <>
      <SEO
        title={`${articleTitle} - Help Center`}
        description={articleDescription}
        canonical={`${BASE_URL}/support/${categorySlug}/${articleSlug}`}
        keywords={['esim help', categoryName.toLowerCase(), 'mobile11']}
        type="article"
        structuredData={getBreadcrumbStructuredData([
          { name: 'Home', url: BASE_URL },
          { name: 'Help Center', url: `${BASE_URL}/support` },
          { name: categoryName, url: `${BASE_URL}/support/${categorySlug}` },
          { name: articleTitle, url: `${BASE_URL}/support/${categorySlug}/${articleSlug}` },
        ])}
      />

      <Header />
      
      <main className="min-h-screen bg-[#FAF7F2]">
        <section className="relative overflow-hidden pt-24 pb-6 md:pt-28 md:pb-8">
          <div className="absolute top-16 right-[10%] w-12 h-16 bg-amber-200 rounded-lg rotate-12 opacity-40" />
          <div className="absolute bottom-4 left-[8%] w-10 h-10 bg-cyan-200 rounded-full opacity-40" />
          <div className="absolute top-24 right-[30%] w-6 h-6 bg-emerald-200 rounded-full opacity-30" />
          
          <div className="container mx-auto px-4 relative z-10">
            <HelpBreadcrumbs 
              items={[
                { label: categoryName, href: `/support/${categorySlug}` },
                { label: articleTitle }
              ]}
            />
          </div>
        </section>
        
        <section className="py-8 pb-16">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-sm">
              <HelpArticleContent article={article} />
            </div>
          </div>
        </section>
      </main>

      <FooterAiralo />
    </>
  );
}