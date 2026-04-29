import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { blogArticles } from '@/lib/blogArticles';
import { ArrowRight, Search, X } from 'lucide-react';
import { getDateLocale } from '@/lib/dateLocale';

export function BlogPage() {
  const { language, t, localizeField } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories with their Thai translations
  const categoryMap = new Map<string, string>();
  blogArticles.forEach(a => {
    if (!categoryMap.has(a.category)) {
      categoryMap.set(a.category, a.categoryTh);
    }
  });
  const categories = Array.from(categoryMap.entries());

  // Filter articles
  const filteredArticles = blogArticles.filter(article => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchLower) ||
      article.titleTh.toLowerCase().includes(searchLower) ||
      article.description.toLowerCase().includes(searchLower) ||
      article.descriptionTh.toLowerCase().includes(searchLower) ||
      article.keywords.some(k => k.toLowerCase().includes(searchLower));
    
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEO 
        title="eSIM Travel Blog | Tips, Guides & News"
        description="Expert travel tips, eSIM guides, and destination advice. Learn how to use eSIM in Japan, Korea, Europe, USA and 151+ countries. Stay connected while traveling."
        keywords={['esim blog', 'travel tips', 'esim guide', 'travel sim advice', 'international travel tips', 'mobile data abroad']}
        canonical="https://mobile11.com/blog"
      />
      <Header />
      
      {/* Hero Section - Simple & Clean */}
      <section className="pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              {t('blogPage.title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('blogPage.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-6">
        <div className="container">
          <div className="max-w-xl mx-auto space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('blogPage.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 bg-white border-gray-200 rounded-full shadow-sm focus:border-orange-500 focus:ring-orange-500 text-gray-900"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('blogPage.all')}
              </button>
              {categories.map(([category, categoryTh]) => {
                const categoryLabel = localizeField({ categoryEn: category, categoryTh }, 'category');
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {categoryLabel}
                  </button>
                );
              })}
            </div>

            {/* Results count */}
            {(searchQuery || selectedCategory) && filteredArticles.length > 0 && (
              <p className="text-center text-sm text-gray-500">
                {(t('blogPage.foundArticles') as string).replace('{n}', String(filteredArticles.length))}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Articles List - Airalo Style */}
      <section className="py-8 pb-16">
        <div className="container">
          {filteredArticles.length > 0 ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {filteredArticles.map((article) => (
                <Link key={article.slug} to={`/blog/${article.slug}`} className="block group">
                  <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Image with arch/rounded top styling */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={article.image} 
                        alt={localizeField(article, 'title')}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Decorative dots */}
                      <div className="absolute left-4 bottom-4 flex flex-col gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
                        ))}
                      </div>
                      <div className="absolute right-4 bottom-4 flex flex-col gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 space-y-4">
                      {/* Date & Read Time */}
                      <div className="text-sm text-gray-500">
                        {new Date(article.publishedAt).toLocaleDateString(getDateLocale(language), {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                        <span className="mx-2">|</span>
                        {article.readTime} {t('blogPage.minuteRead')}
                      </div>
                      
                      {/* Title */}
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                        {localizeField(article, 'title')}
                      </h2>
                      
                      {/* Read Post Link */}
                      <div className="flex items-center gap-2 text-gray-900 font-medium pt-2 group-hover:gap-3 transition-all">
                        {t('blogPage.readPost')}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            /* No Results State */
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {t('blogPage.noArticlesFound')}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {t('blogPage.noArticlesDescription')}
              </p>
              <Button 
                variant="outline" 
                onClick={clearFilters} 
                className="mt-4 rounded-full border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                {t('blogPage.clearFilters')}
              </Button>
            </div>
          )}
        </div>
      </section>

      <FooterAiralo />
    </div>
  );
}
