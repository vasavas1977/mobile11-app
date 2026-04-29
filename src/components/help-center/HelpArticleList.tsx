import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { KBArticle } from '@/types/helpCenter';

interface HelpArticleListProps {
  articles: KBArticle[];
  categorySlug: string;
}

export function HelpArticleList({ articles, categorySlug }: HelpArticleListProps) {
  const { language, t } = useLanguage();

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('helpCategory.noArticlesFound')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <Link
          key={article.id}
          to={`/support/${categorySlug}/${article.slug}`}
          className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all group"
        >
          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 group-hover:text-cyan-600 transition-colors">
              {article.title}
            </h3>
            {article.description && (
              <p className="text-sm text-gray-500 line-clamp-1">
                {article.description}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-cyan-600 transition-colors flex-shrink-0" />
        </Link>
      ))}
    </div>
  );
}
