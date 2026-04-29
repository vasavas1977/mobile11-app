import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Wrench, Smartphone, CreditCard, User, Info, HelpCircle, Gift, LucideIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchHelpArticles, usePopularHelpArticles, useHelpCategoryCounts } from '@/hooks/useHelpArticles';
import { getHelpCategories } from '@/lib/helpCategoryConfig';
import { KBArticle } from '@/types/helpCenter';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';
import { HelpCategorySkeleton, HelpPopularQuestionsSkeleton } from '@/components/help-center/HelpCenterSkeleton';
import { useDebounce } from '@/hooks/useDebounce';

const iconMap: Record<string, LucideIcon> = {
  'wrench': Wrench,
  'smartphone': Smartphone,
  'credit-card': CreditCard,
  'user': User,
  'info': Info,
  'help-circle': HelpCircle,
  'gift': Gift
};

// Popular question slugs - hand-picked for maximum relevance
const popularQuestionSlugs = [
  'esim-not-activating',
  'check-data-usage',
  'refund-policy',
  'compatible-devices',
  'mobile11-money',
  'how-to-install-esim'
];

export function HelpCenterAiralo() {
  const { language, t, localizeField } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  const dbLanguage = language as string;
  const debouncedQuery = useDebounce(query, 300);
  
  // Get categories from static config
  const categories = getHelpCategories();
  
  // Fetch article counts per category
  const { data: categoryCounts, isLoading: countsLoading } = useHelpCategoryCounts(dbLanguage);
  
  // Search articles
  const { data: searchResults } = useSearchHelpArticles(debouncedQuery, dbLanguage);
  
  // Get popular articles
  const { data: popularArticles, isLoading: popularLoading } = usePopularHelpArticles(
    popularQuestionSlugs,
    dbLanguage
  );

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, []);

  const handleSelectArticle = useCallback((article: KBArticle) => {
    setShowResults(false);
    setQuery('');
    navigate(`/support/${article.category}/${article.slug}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Decorative shapes */}
        <div className="absolute top-20 right-[15%] w-20 h-28 bg-orange-300 rounded-xl rotate-12 opacity-60" />
        <div className="absolute top-32 right-[8%] w-14 h-14 bg-amber-200 rounded-full opacity-70" />
        <div className="absolute bottom-32 left-[10%] w-16 h-16 bg-emerald-200 rounded-full opacity-60" />
        <div className="absolute bottom-20 left-[20%] w-10 h-16 bg-cyan-200 rounded-lg -rotate-12 opacity-50" />
        <div className="absolute top-40 left-[5%] w-12 h-12 bg-orange-200 rounded-full opacity-50" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
              {t('helpCenter.heroTitle')}
            </h1>

            {/* Team Lottie Animation */}
            <div className="mx-auto max-w-xs md:max-w-sm mb-6">
              <LottieAnimation 
                src="/assets/lottie/team.lottie" 
                className="w-full h-auto"
                devicePixelRatio={2}
              />
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('helpCenter.searchPlaceholder') as string}
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => query.length >= 2 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  className="w-full pl-14 pr-5 py-4 md:py-5 rounded-full bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-lg text-base md:text-lg"
                />
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {searchResults.slice(0, 5).map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleSelectArticle(article)}
                      className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-gray-900 text-sm md:text-base">
                        {article.title}
                      </p>
                      {article.description && (
                        <p className="text-xs md:text-sm text-gray-500 line-clamp-1 mt-1">
                          {article.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {countsLoading ? (
            <HelpCategorySkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || HelpCircle;
                const articleCount = categoryCounts?.[category.slug] || 0;
                
                // Only show categories that have articles
                if (articleCount === 0) return null;
                
                return (
                  <Link
                    key={category.id}
                    to={`/support/${category.slug}`}
                    className="bg-white rounded-2xl p-6 md:p-8 text-center hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-200 transition-colors">
                      <Icon className="h-6 w-6 md:h-7 md:w-7 text-cyan-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight">
                      {localizeField(category, 'name')}
                    </h3>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Popular Questions Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {t('helpCenter.popularQuestions')}
            </h2>

            {popularLoading ? (
              <HelpPopularQuestionsSkeleton />
            ) : popularArticles && popularArticles.length > 0 ? (
              <div className="space-y-3">
                {popularArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/support/${article.category}/${article.slug}`}
                    className="bg-white rounded-xl p-4 md:p-5 flex items-center justify-between hover:shadow-md transition-all duration-300 group"
                  >
                    <span className="text-gray-800 font-medium text-sm md:text-base pr-4">
                      {article.title}
                    </span>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                {t('helpCenter.noPopularQuestions')}
              </p>
            )}

            {/* View All Link */}
            <div className="text-center mt-8">
              <Link
                to="/support"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {t('helpCenter.viewAllArticles')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Left: Lottie Animation */}
            <div className="w-full md:w-1/3 flex justify-center">
              <LottieAnimation 
                src="/assets/lottie/247_support.lottie" 
                className="w-48 h-48 md:w-56 md:h-56"
                devicePixelRatio={2}
              />
            </div>
            
            {/* Right: Text Content */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {t('helpCenter.stillNeedHelp')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('helpCenter.supportAvailable247')}
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openChatWidget'))}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors"
              >
                {t('helpCenter.contactSupport')}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <FooterAiralo />
    </div>
  );
}
