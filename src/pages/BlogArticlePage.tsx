import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO, getBreadcrumbStructuredData } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { getArticleBySlug, getRelatedArticles } from '@/lib/blogArticles';
import { Calendar, Clock, ArrowLeft, ArrowRight, User, BookOpen, Share2, ShoppingBag, Smartphone, Settings } from 'lucide-react';
import { getDateLocale } from '@/lib/dateLocale';
import { RelatedPages } from '@/components/seo/RelatedPages';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Europe42Explorer } from '@/components/blog/Europe42Explorer';

export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, language, localizeField } = useLanguage();
  
  const article = slug ? getArticleBySlug(slug) : undefined;
  const relatedArticles = slug ? getRelatedArticles(slug, 3) : [];

  const locale = getDateLocale(language);

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-24 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {t('blog.articleNotFound')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('blog.articleNotFoundDesc')}
          </p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('blog.backToBlog')}
          </Button>
        </div>
        <FooterAiralo />
      </div>
    );
  }

  const title = localizeField(article, 'title');
  const description = localizeField(article, 'description');
  const content = localizeField(article, 'content');
  const category = localizeField(article, 'category');

  const breadcrumbData = getBreadcrumbStructuredData([
    { name: 'Home', url: 'https://mobile11.com/' },
    { name: 'Blog', url: 'https://mobile11.com/blog' },
    { name: title, url: `https://mobile11.com/blog/${article.slug}` }
  ]);

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Organization",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Mobile11",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mobile11.com/favicon-512.png"
      }
    },
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://mobile11.com/blog/${article.slug}`
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: title,
        text: description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getAlternateUrl = () => {
    const thaiToEnglishMap: Record<string, string> = {
      'esim-คืออะไร-2025': 'esim-vs-sim-comparison',
      'ซิมญี่ปุ่น-ค่ายไหนดี-2025': 'best-esim-japan-travel-2025',
      'โรมมิ่ง-vs-esim-2025': 'esim-vs-sim-comparison',
      'ซิมต่างประเทศ-ยอดนิยม-2025': 'blog'
    };
    
    const englishToThaiMap: Record<string, string> = {
      'esim-vs-sim-comparison': 'esim-คืออะไร-2025',
      'best-esim-japan-travel-2025': 'ซิมญี่ปุ่น-ค่ายไหนดี-2025'
    };
    
    if (thaiToEnglishMap[article.slug]) {
      return { th: article.slug, en: thaiToEnglishMap[article.slug] };
    }
    if (englishToThaiMap[article.slug]) {
      return { en: article.slug, th: englishToThaiMap[article.slug] };
    }
    return null;
  };
  
  const alternateUrls = getAlternateUrl();
  const alternateLanguages = alternateUrls ? [
    { lang: 'en', url: `https://mobile11.com/blog/${alternateUrls.en}` },
    { lang: 'th', url: `https://mobile11.com/blog/${alternateUrls.th}` }
  ] : [];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEO 
        title={title}
        description={description}
        keywords={article.keywords}
        canonical={`https://mobile11.com/blog/${article.slug}`}
        type="article"
        structuredData={{
          ...articleStructuredData,
          ...breadcrumbData
        }}
        alternateLanguages={alternateLanguages}
      />
      <Header />
      
      {/* Breadcrumb */}
      <div className="container py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            {t('blog.home')}
          </Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-gray-900 transition-colors">
            {t('blog.blog')}
          </Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px]">{title}</span>
        </nav>
      </div>

      {/* Hero Image */}
      <div className="container max-w-5xl py-6">
        <div className="relative aspect-[21/9] rounded-3xl overflow-hidden bg-white shadow-sm">
          <img 
            src={article.image} 
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Article Header */}
      <section className="py-8 md:py-12">
        <div className="container max-w-4xl">
          <div className="space-y-6">
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              {category}
            </Badge>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
              {title}
            </h1>
            
            <p className="text-xl text-gray-600">
              {description}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {article.author}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(article.updatedAt).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {article.readTime} {t('blog.minRead')}
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare} className="ml-auto text-gray-600 hover:text-gray-900">
                <Share2 className="h-4 w-4 mr-2" />
                {t('blog.share')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="pb-16">
        <div className="container max-w-4xl">
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-10">
            <style>{`
              .blog-article-content { color: #374151 !important; }
              .blog-article-content h1, .blog-article-content h2, .blog-article-content h3, .blog-article-content h4 { color: #111827 !important; }
              .blog-article-content p, .blog-article-content li, .blog-article-content td { color: #374151 !important; }
              .blog-article-content strong, .blog-article-content th { color: #111827 !important; }
              .blog-article-content a { color: #ea580c !important; }
              .blog-article-content blockquote { color: #374151 !important; }
            `}</style>
            <article className="blog-article-content prose prose-lg max-w-none 
              prose-headings:font-black
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 
              prose-p:leading-relaxed 
              prose-a:no-underline hover:prose-a:underline 
              prose-strong:font-semibold
              prose-li:marker:text-orange-500
              prose-blockquote:border-l-orange-500 prose-blockquote:bg-orange-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-table:border prose-table:border-gray-200 
              prose-th:bg-gray-100 prose-th:p-3 prose-th:font-semibold
              prose-td:p-3 prose-td:border prose-td:border-gray-200
              prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8 prose-img:w-full
              prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal
              prose-hr:border-gray-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ node, ...props }) => {
                  if (props.src && props.src === article.image) return null;
                  return (
                    <img
                      {...props}
                      loading="lazy"
                      className="rounded-xl shadow-lg my-8 w-full object-cover"
                    />
                  );
                },
                p: ({ node, children, ...props }) => {
                  const childText = String(children);
                  if (childText.includes('[Interactive Europe42Explorer Component Renders Here]')) {
                    return null;
                  }
                  return <p {...props}>{children}</p>;
                }
              }}
            >
              {content}
            </ReactMarkdown>
            
            {slug === 'europe-42-countries-esim-guide' && (
              <div className="not-prose my-12">
                <Europe42Explorer />
              </div>
            )}
            </article>
          </div>
          
          {/* CTA */}
          <Card className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-black text-white">
                {t('blog.readyToConnect')}
              </h3>
              <p className="text-white/90">
                {t('blog.readyToConnectDesc')}
              </p>
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100" onClick={() => navigate('/packages')}>
                {t('blog.browseEsimPlans')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          <div className="mt-8">
            <RelatedPages
              titleEn="Quick Links"
              titleTh="ลิงก์ด่วน"
              items={[
                { to: '/packages', titleEn: 'Browse eSIM Plans', titleTh: 'ดูแพ็คเกจ eSIM', descriptionEn: 'Find the best plan for your trip', descriptionTh: 'ค้นหาแพ็คเกจที่ดีที่สุดสำหรับทริปของคุณ', icon: ShoppingBag },
                { to: '/what-is-esim', titleEn: 'What is eSIM?', titleTh: 'eSIM คืออะไร?', descriptionEn: 'Learn about eSIM technology', descriptionTh: 'เรียนรู้เกี่ยวกับเทคโนโลยี eSIM', icon: Smartphone },
                { to: '/how-it-works', titleEn: 'How It Works', titleTh: 'วิธีใช้งาน', descriptionEn: 'See our simple 3-step process', descriptionTh: 'ดูขั้นตอนง่ายๆ 3 ขั้นตอน', icon: Settings },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-8">
              {t('blog.relatedArticles')}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link key={related.slug} to={`/blog/${related.slug}`}>
                  <Card className="h-full bg-white hover:shadow-lg transition-all hover:border-orange-200 group overflow-hidden rounded-3xl border-0 shadow-sm">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={related.image} 
                        alt={localizeField(related, 'title')}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        {localizeField(related, 'category')}
                      </Badge>
                      <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                        {localizeField(related, 'title')}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {localizeField(related, 'description')}
                      </p>
                      <div className="flex items-center gap-2 text-orange-600 text-sm font-medium">
                        {t('blog.readMore')}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <FooterAiralo />
    </div>
  );
}
