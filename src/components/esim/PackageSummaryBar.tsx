import { TrendingUp, Globe, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface PackageSummaryBarProps {
  totalPackages: number;
  countriesCount: number;
  bestValue?: {
    name: string;
    price: number;
    validityDays: number;
  };
}

export function PackageSummaryBar({ 
  totalPackages, 
  countriesCount,
  bestValue 
}: PackageSummaryBarProps) {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{totalPackages}</div>
            <div className="text-xs text-muted-foreground">{t('packages.availablePackages')}</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{countriesCount}</div>
            <div className="text-xs text-muted-foreground">{t('packages.countriesAvailable')}</div>
          </div>
        </div>
      </div>

      {bestValue && (
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500 text-white text-xs">{t('packages.bestValue')}</Badge>
              </div>
              <div className="text-sm font-semibold text-foreground truncate mt-1">
                {bestValue.name}
              </div>
              <div className="text-xs text-muted-foreground">
                ${bestValue.price} {t('packages.for')} {bestValue.validityDays} {t('packages.days')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
