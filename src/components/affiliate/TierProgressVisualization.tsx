import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { TierInfo } from '@/hooks/usePartnerEarningsReport';
import { Check, ChevronRight, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierProgressVisualizationProps {
  tiers: TierInfo[];
  currentTier: string;
  monthlySales: number;
  loading: boolean;
}

export function TierProgressVisualization({ tiers, currentTier, monthlySales, loading }: TierProgressVisualizationProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('affiliateDashboard.earningsReport.tierJourney')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const currentTierIndex = tiers.findIndex(t => t.tierName === currentTier);
  const nextTier = tiers[currentTierIndex + 1];
  const salesToNext = nextTier ? nextTier.minSales - monthlySales : 0;
  const progressPercent = nextTier 
    ? ((monthlySales - tiers[currentTierIndex]?.minSales) / (nextTier.minSales - tiers[currentTierIndex]?.minSales)) * 100
    : 100;

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">{t('affiliateDashboard.earningsReport.tierJourney')}</CardTitle>
        <CardDescription className="text-gray-600">{t('affiliateDashboard.earningsReport.tierJourneyDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">{t('affiliateDashboard.tier.monthlySales')}: {monthlySales}</span>
            {nextTier && (
              <span className="text-gray-600">
                {salesToNext} {t('affiliateDashboard.tier.salesToUnlock')} {nextTier.tierName}
              </span>
            )}
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Tier timeline */}
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
          
          {tiers.map((tier, index) => {
            const isCompleted = index < currentTierIndex;
            const isCurrent = tier.tierName === currentTier;
            const isFuture = index > currentTierIndex;
            
            return (
              <div key={tier.tierName} className="flex flex-col items-center relative z-10">
                {/* Circle */}
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-orange-500 border-orange-500",
                    isCurrent && "bg-orange-500 border-orange-500 ring-4 ring-orange-200 scale-110",
                    isFuture && "bg-white border-gray-300"
                  )}
                  style={isCurrent ? { backgroundColor: tier.badgeColor, borderColor: tier.badgeColor } : 
                         isCompleted ? { backgroundColor: tier.badgeColor, borderColor: tier.badgeColor } : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : isCurrent ? (
                    <Star className="h-5 w-5 text-white fill-white" />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">{tier.minSales}+</span>
                  )}
                </div>
                
                {/* Label */}
                <div className={cn(
                  "mt-2 text-center",
                  isCurrent && "font-bold text-orange-600",
                  isFuture && "text-gray-400",
                  isCompleted && "text-gray-700"
                )}>
                  <p className="text-xs sm:text-sm capitalize">{tier.tierName}</p>
                  <p className="text-xs text-gray-500">{tier.commissionRate}%</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current tier highlight */}
        <div className="mt-6 p-4 rounded-lg bg-orange-50 border border-orange-200">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: tiers[currentTierIndex]?.badgeColor || '#f97316' }}
            />
            <span className="font-medium text-gray-900">
              {t('affiliateDashboard.tier.currentTier')}: 
              <span className="capitalize ml-1">{currentTier}</span>
            </span>
            <span className="text-orange-600 font-bold ml-auto">
              {tiers[currentTierIndex]?.commissionRate}% {t('affiliateDashboard.tier.commission')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
