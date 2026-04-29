import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectedEarnings } from '@/hooks/usePartnerEarningsReport';
import { TrendingUp, Target, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProjectedEarningsCardProps {
  projections: ProjectedEarnings | null;
  loading: boolean;
}

export function ProjectedEarningsCard({ projections, loading }: ProjectedEarningsCardProps) {
  const { t, currency, formatPrice } = useLanguage();

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('affiliateDashboard.earningsReport.projectedEarnings')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!projections) return null;

  const potentialIncrease = projections.projectedAtNextTier - projections.currentMonthlyRate;
  const increasePercent = projections.currentMonthlyRate > 0 
    ? (potentialIncrease / projections.currentMonthlyRate) * 100 
    : 0;

  const displayCurrent = currency === 'THB' 
    ? projections.currentMonthlyRate * 35 
    : projections.currentMonthlyRate;
  const displayProjected = currency === 'THB' 
    ? projections.projectedAtNextTier * 35 
    : projections.projectedAtNextTier;
  const displayDaily = currency === 'THB'
    ? projections.averageDailyCommission * 35
    : projections.averageDailyCommission;

  return (
    <Card className="relative overflow-hidden bg-white border-gray-200 shadow-sm">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full" />
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Sparkles className="h-5 w-5 text-orange-500" />
          {t('affiliateDashboard.earningsReport.projectedEarnings')}
        </CardTitle>
        <CardDescription className="text-gray-600">{t('affiliateDashboard.earningsReport.projectedDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Pace */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('affiliateDashboard.earningsReport.atCurrentPace')}
            </span>
            <span className="text-2xl font-bold text-orange-600">
              {formatPrice(displayCurrent)}/mo
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {t('affiliateDashboard.earningsReport.avgDaily')}: {formatPrice(displayDaily)}/day
          </p>
        </div>

        {/* At Next Tier */}
        {projections.nextTierName !== 'Maximum' && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                {t('affiliateDashboard.earningsReport.atNextTier')} ({projections.nextTierName})
              </span>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(displayProjected)}/mo
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">
                +{increasePercent.toFixed(0)}% {t('affiliateDashboard.earningsReport.potentialIncrease')}
              </span>
            </div>

            {projections.daysUntilNextTier && (
              <p className="text-xs text-gray-500 mt-2">
                {t('affiliateDashboard.earningsReport.estimatedDays')}: ~{projections.daysUntilNextTier} {t('affiliateDashboard.earningsReport.days')}
              </p>
            )}
          </div>
        )}

        {/* Max tier message */}
        {projections.nextTierName === 'Maximum' && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-amber-700">
                {t('affiliateDashboard.earningsReport.maxTierReached')}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {t('affiliateDashboard.earningsReport.maxTierMessage')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
