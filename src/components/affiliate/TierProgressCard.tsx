import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, Zap, Award, Crown, Star, Gem } from 'lucide-react';

interface TierConfig {
  tier_name: string;
  tier_order: number;
  min_sales: number;
  max_sales: number | null;
  commission_rate: number;
  override_rate: number;
  badge_color: string;
}

interface TierProgressCardProps {
  affiliateId: string;
  currentTier: string;
  monthlySales: number;
  loyaltyTier: string;
  loyaltyMonths: number;
}

const tierIcons: Record<string, React.ElementType> = {
  starter: Star,
  bronze: Award,
  silver: Gem,
  gold: Crown,
  platinum: Zap,
};

const loyaltyBonuses: Record<string, number> = {
  new: 0,
  established: 1,
  veteran: 2,
  elite: 3,
};

export function TierProgressCard({ 
  affiliateId, 
  currentTier, 
  monthlySales, 
  loyaltyTier,
  loyaltyMonths 
}: TierProgressCardProps) {
  const { t } = useLanguage();
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    const { data } = await supabase
      .from('affiliate_tier_config')
      .select('*')
      .order('tier_order', { ascending: true });
    
    if (data) setTiers(data as TierConfig[]);
    setLoading(false);
  };

  const currentTierConfig = tiers.find(t => t.tier_name === currentTier);
  const nextTier = tiers.find(t => t.tier_order === (currentTierConfig?.tier_order || 0) + 1);
  
  const progressToNext = nextTier 
    ? Math.min(100, (monthlySales / nextTier.min_sales) * 100)
    : 100;

  const salesToNextTier = nextTier ? nextTier.min_sales - monthlySales : 0;
  const loyaltyBonus = loyaltyBonuses[loyaltyTier] || 0;
  const effectiveRate = (currentTierConfig?.commission_rate || 8) + loyaltyBonus;

  const TierIcon = tierIcons[currentTier] || Star;

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'starter': return 'from-orange-400 to-orange-500';
      case 'bronze': return 'from-amber-500 to-orange-600';
      case 'silver': return 'from-gray-400 to-gray-500';
      case 'gold': return 'from-yellow-400 to-amber-500';
      case 'platinum': return 'from-purple-400 to-indigo-600';
      default: return 'from-orange-400 to-orange-500';
    }
  };

  const getLoyaltyLabel = (tier: string) => {
    switch (tier) {
      case 'new': return t('affiliateDashboard.tier.loyalty.new');
      case 'established': return t('affiliateDashboard.tier.loyalty.established');
      case 'veteran': return t('affiliateDashboard.tier.loyalty.veteran');
      case 'elite': return t('affiliateDashboard.tier.loyalty.elite');
      default: return tier;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="h-6 bg-gray-100 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
      {/* Tier Badge Header */}
      <div className={`bg-gradient-to-r ${getTierGradient(currentTier)} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <TierIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">{t('affiliateDashboard.tier.currentTier')}</p>
              <h3 className="text-xl font-bold capitalize">{currentTier}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{effectiveRate}%</p>
            <p className="text-sm opacity-90">{t('affiliateDashboard.tier.commission')}</p>
          </div>
        </div>
      </div>

      <CardContent className="pt-6 space-y-6">
        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t('affiliateDashboard.tier.progressTo')} <span className="capitalize font-medium text-gray-900">{nextTier.tier_name}</span>
              </span>
              <span className="font-medium text-gray-900">{monthlySales} / {nextTier.min_sales}</span>
            </div>
            <Progress value={progressToNext} className="h-3" />
            <p className="text-sm text-gray-500">
              {salesToNextTier > 0 
                ? `${salesToNextTier} ${t('affiliateDashboard.tier.salesToUnlock')}`
                : t('affiliateDashboard.tier.tierUnlocked')}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{monthlySales}</p>
            <p className="text-xs text-gray-500">{t('affiliateDashboard.tier.monthlySales')}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{loyaltyMonths}</p>
            <p className="text-xs text-gray-500">{t('affiliateDashboard.tier.activeMonths')}</p>
          </div>
        </div>

        {/* Loyalty Bonus */}
        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{t('affiliateDashboard.tier.loyaltyBonus')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {getLoyaltyLabel(loyaltyTier)}
            </Badge>
            <span className="text-green-600 font-bold">+{loyaltyBonus}%</span>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="text-sm space-y-1 pt-2 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('affiliateDashboard.tier.baseRate')}</span>
            <span className="text-gray-900">{currentTierConfig?.commission_rate || 8}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('affiliateDashboard.tier.loyaltyBonusLabel')}</span>
            <span className="text-green-600">+{loyaltyBonus}%</span>
          </div>
          <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
            <span className="text-gray-900">{t('affiliateDashboard.tier.effectiveRate')}</span>
            <span className="text-orange-500">{effectiveRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
