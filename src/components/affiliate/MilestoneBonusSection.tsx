import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Award, Trophy, Crown, Gift } from 'lucide-react';

interface Milestone {
  id: string;
  milestone_name: string;
  sales_threshold: number;
  bonus_amount: number;
  badge_icon: string;
}

const iconMap: Record<string, React.ElementType> = {
  Star: Star,
  Award: Award,
  Trophy: Trophy,
  Crown: Crown,
};

export function MilestoneBonusSection() {
  const { t, formatPrice } = useLanguage();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getMilestoneColor = (index: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-amber-500 to-orange-500',
      'from-emerald-500 to-teal-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Badge className="w-fit mx-auto mb-2 bg-amber-500/10 text-amber-600 border-amber-500/20">
          <Gift className="h-3 w-3 mr-1" />
          {t('affiliateInfo.milestones.badge')}
        </Badge>
        <CardTitle className="text-2xl">{t('affiliateInfo.milestones.title')}</CardTitle>
        <CardDescription className="max-w-2xl mx-auto">
          {t('affiliateInfo.milestones.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {milestones.map((milestone, index) => {
            const Icon = iconMap[milestone.badge_icon] || Trophy;
            return (
              <div
                key={milestone.id}
                className={`relative p-4 rounded-xl bg-gradient-to-br ${getMilestoneColor(index)} text-white text-center overflow-hidden`}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold">{formatPrice(milestone.bonus_amount)}</p>
                  <p className="text-sm opacity-90 mt-1">
                    {t('affiliateInfo.milestones.at')} {milestone.sales_threshold} {t('affiliateInfo.milestones.sales')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('affiliateInfo.milestones.description')}
        </p>
      </CardContent>
    </Card>
  );
}
