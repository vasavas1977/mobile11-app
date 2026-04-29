import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HelpBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function HelpBreadcrumbs({ items }: HelpBreadcrumbsProps) {
  const { t } = useLanguage();

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 overflow-x-auto pb-2">
      <Link 
        to="/support" 
        className="flex items-center gap-1 hover:text-gray-900 transition-colors whitespace-nowrap"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">
          {t('helpBreadcrumbs.helpCenter')}
        </span>
      </Link>
      
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium whitespace-nowrap">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
