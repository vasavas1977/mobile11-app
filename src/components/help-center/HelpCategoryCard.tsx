import { Link } from 'react-router-dom';
import { 
  Wrench, 
  Smartphone, 
  CreditCard, 
  User, 
  Info, 
  HelpCircle,
  Folder,
  Gift,
  Rocket,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCategoryConfig } from '@/types/helpCenter';

const iconMap: Record<string, LucideIcon> = {
  'wrench': Wrench,
  'smartphone': Smartphone,
  'credit-card': CreditCard,
  'user': User,
  'info': Info,
  'help-circle': HelpCircle,
  'folder': Folder,
  'gift': Gift,
  'rocket': Rocket
};

interface HelpCategoryCardProps {
  category: HelpCategoryConfig;
  articleCount?: number;
}

export function HelpCategoryCard({ category, articleCount = 0 }: HelpCategoryCardProps) {
  const { localizeField, t } = useLanguage();
  const Icon = iconMap[category.icon] || Folder;

  return (
    <Link
      to={`/support/${category.slug}`}
      className="block bg-card hover:bg-muted/30 border border-border rounded-xl p-5 transition-all hover:shadow-md group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {localizeField(category, 'name')}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {localizeField(category, 'description')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {articleCount} {t('helpCenter.articles')}
          </p>
        </div>
      </div>
    </Link>
  );
}
