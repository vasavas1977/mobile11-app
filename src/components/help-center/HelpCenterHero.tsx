import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchHelpArticles } from '@/hooks/useHelpArticles';
import { KBArticle } from '@/types/helpCenter';

export function HelpCenterHero() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  // Use database search hook
  const { language } = useLanguage();
  const { data: results = [] } = useSearchHelpArticles(query, language);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleSelectArticle = (article: KBArticle) => {
    setShowResults(false);
    setQuery('');
    navigate(`/support/${article.category}/${article.slug}`);
  };

  return (
    <div className="bg-gradient-to-br from-[#2BC0E4] via-[#42A5F5] to-[#1E88E5] py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Mobile11 Help Center
          </h1>
          <p className="text-white/90 text-lg mb-8">
            {t('helpCenterHero.subtitle')}
          </p>
          
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={t('helpCenterHero.searchPlaceholder') as string}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => query.length >= 2 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg text-base"
              />
            </div>
            
            {showResults && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background rounded-xl shadow-xl border border-border overflow-hidden z-50">
                {results.slice(0, 5).map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleSelectArticle(article)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                  >
                    <p className="font-medium text-foreground text-sm">
                      {article.title}
                    </p>
                    {article.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
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
    </div>
  );
}
