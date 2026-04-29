import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Star, Award, Trophy, Crown, Lock, Check, Loader2 } from 'lucide-react';

interface Milestone {
  id: string;
  milestone_name: string;
  sales_threshold: number;
  bonus_amount: number;
  badge_icon: string;
}

interface MilestoneAchievementsProps {
  affiliateId: string;
  totalLifetimeSales: number;
  claimedMilestones: Record<string, boolean>;
  onMilestoneClaimed: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Star: Star,
  Award: Award,
  Trophy: Trophy,
  Crown: Crown,
};

export function MilestoneAchievements({
  affiliateId,
  totalLifetimeSales,
  claimedMilestones,
  onMilestoneClaimed,
}: MilestoneAchievementsProps) {
  const { t, formatPrice } = useLanguage();
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from('affiliate_milestones')
      .select('*')
      .eq('is_active', true)
      .order('sales_threshold', { ascending: true });
    
    if (data) setMilestones(data);
    setLoading(false);
  };

  const claimMilestone = async (milestone: Milestone) => {
    if (totalLifetimeSales < milestone.sales_threshold) return;
    if (claimedMilestones[milestone.milestone_name]) return;

    setClaiming(milestone.id);
    try {
      // Insert claim record
      const { error: claimError } = await supabase
        .from('affiliate_milestone_claims')
        .insert({
          affiliate_id: affiliateId,
          milestone_id: milestone.id,
          bonus_amount: milestone.bonus_amount,
        });

      if (claimError) throw claimError;

      // Update affiliate pending earnings
      const { error: updateError } = await supabase.rpc('update_affiliate_stats', {
        p_affiliate_id: affiliateId,
        p_add_conversions: 0,
        p_add_earnings: milestone.bonus_amount,
        p_add_pending_earnings: milestone.bonus_amount,
      });

      if (updateError) throw updateError;

      // Update milestones_claimed in affiliates table
      const newClaimed = { ...claimedMilestones, [milestone.milestone_name]: true };
      await supabase
        .from('affiliates')
        .update({ milestones_claimed: newClaimed })
        .eq('id', affiliateId);

      toast({
        title: t('affiliateDashboard.milestones.claimed'),
        description: `${formatPrice(milestone.bonus_amount)} ${t('affiliateDashboard.milestones.addedToEarnings')}`,
      });

      onMilestoneClaimed();
    } catch (error: any) {
      toast({
        title: t('affiliateDashboard.milestones.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setClaiming(null);
    }
  };

  const getMilestoneStatus = (milestone: Milestone) => {
    const claimed = claimedMilestones[milestone.milestone_name];
    const achieved = totalLifetimeSales >= milestone.sales_threshold;
    
    if (claimed) return 'claimed';
    if (achieved) return 'ready';
    return 'locked';
  };

  if (loading) {
    return (
      <Card className="animate-pulse bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="h-6 bg-gray-100 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-gray-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Trophy className="h-5 w-5 text-amber-500" />
          {t('affiliateDashboard.milestones.title')}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t('affiliateDashboard.milestones.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.map((milestone) => {
          const status = getMilestoneStatus(milestone);
          const Icon = iconMap[milestone.badge_icon] || Trophy;
          const progress = Math.min(100, (totalLifetimeSales / milestone.sales_threshold) * 100);

          return (
            <div
              key={milestone.id}
              className={`relative p-4 rounded-xl border transition-all ${
                status === 'claimed'
                  ? 'bg-green-50 border-green-200'
                  : status === 'ready'
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    status === 'claimed'
                      ? 'bg-green-100'
                      : status === 'ready'
                      ? 'bg-amber-100'
                      : 'bg-gray-100'
                  }`}>
                    {status === 'claimed' ? (
                      <Check className="h-6 w-6 text-green-600" />
                    ) : status === 'locked' ? (
                      <Lock className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Icon className={`h-6 w-6 ${status === 'ready' ? 'text-amber-500' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {t(`affiliateDashboard.milestones.${milestone.milestone_name}.title`)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {milestone.sales_threshold} {t('affiliateDashboard.milestones.salesRequired')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {status === 'claimed' ? (
                    <Badge className="bg-green-100 text-green-600 border-green-200">
                      {t('affiliateDashboard.milestones.claimedBadge')}
                    </Badge>
                  ) : status === 'ready' ? (
                    <Button
                      size="sm"
                      onClick={() => claimMilestone(milestone)}
                      disabled={claiming === milestone.id}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                      {claiming === milestone.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        `${t('affiliateDashboard.milestones.claim')} ${formatPrice(milestone.bonus_amount)}`
                      )}
                    </Button>
                  ) : (
                    <div className="text-lg font-bold text-gray-400">
                      {formatPrice(milestone.bonus_amount)}
                    </div>
                  )}
                </div>
              </div>

              {status === 'locked' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{totalLifetimeSales} / {milestone.sales_threshold} {t('affiliateDashboard.milestones.sales')}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
