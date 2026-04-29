import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Award, Gem, Crown, Zap, ArrowRight, HelpCircle } from 'lucide-react';

interface TierConfig {
  tier_name: string;
  tier_order: number;
  min_sales: number;
  max_sales: number | null;
  commission_rate: number;
  override_rate: number;
  badge_color: string;
}

const tierIcons: Record<string, React.ElementType> = {
  starter: Star,
  bronze: Award,
  silver: Gem,
  gold: Crown,
  platinum: Zap,
};

export function TierComparisonTable() {
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

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'starter': return 'from-gray-400 to-gray-600';
      case 'bronze': return 'from-amber-600 to-orange-700';
      case 'silver': return 'from-gray-300 to-gray-500';
      case 'gold': return 'from-yellow-400 to-amber-500';
      case 'platinum': return 'from-purple-400 to-indigo-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-60 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Badge className="w-fit mx-auto mb-2 bg-primary/10 text-primary border-primary/20">
          {t('affiliateInfo.tiers.badge')}
        </Badge>
        <CardTitle className="text-2xl">{t('affiliateInfo.tiers.title')}</CardTitle>
        <CardDescription className="max-w-2xl mx-auto">
          {t('affiliateInfo.tiers.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">{t('affiliateInfo.tiers.tier')}</TableHead>
                <TableHead>{t('affiliateInfo.tiers.monthlySales')}</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {t('affiliateInfo.tiers.commission')}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:text-primary transition-colors">
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{t('affiliateInfo.tiers.commissionExplainer.title')}</h4>
                          <p className="text-sm text-muted-foreground">{t('affiliateInfo.tiers.commissionExplainer.description')}</p>
                          <p className="text-sm bg-muted p-2 rounded">{t('affiliateInfo.tiers.commissionExplainer.example')}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {t('affiliateInfo.tiers.override')}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:text-primary transition-colors">
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{t('affiliateInfo.tiers.overrideExplainer.title')}</h4>
                          <p className="text-sm text-muted-foreground">{t('affiliateInfo.tiers.overrideExplainer.description')}</p>
                          <p className="text-sm bg-muted p-2 rounded">{t('affiliateInfo.tiers.overrideExplainer.example')}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier, index) => {
                const Icon = tierIcons[tier.tier_name] || Star;
                return (
                  <TableRow key={tier.tier_name} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTierGradient(tier.tier_name)} flex items-center justify-center`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium capitalize">{tier.tier_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tier.max_sales 
                        ? `${tier.min_sales} - ${tier.max_sales}`
                        : `${tier.min_sales}+`
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-bold">
                        {tier.commission_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {tier.override_rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {tiers.map((tier, index) => {
            const Icon = tierIcons[tier.tier_name] || Star;
            return (
              <div key={tier.tier_name} className="relative">
                <div className={`p-4 rounded-xl border-2 bg-gradient-to-r ${getTierGradient(tier.tier_name)} text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold capitalize text-lg">{tier.tier_name}</span>
                        <p className="text-sm opacity-90">
                          {tier.max_sales 
                            ? `${tier.min_sales} - ${tier.max_sales} ${t('affiliateInfo.tiers.salesShort')}`
                            : `${tier.min_sales}+ ${t('affiliateInfo.tiers.salesShort')}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{tier.commission_rate}%</p>
                      <div className="flex items-center justify-end gap-1 text-xs opacity-90">
                        <span>{t('affiliateInfo.tiers.commission')}</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="hover:opacity-100 transition-opacity">
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-foreground">{t('affiliateInfo.tiers.commissionExplainer.title')}</h4>
                              <p className="text-sm text-muted-foreground">{t('affiliateInfo.tiers.commissionExplainer.description')}</p>
                              <p className="text-sm bg-muted text-foreground p-2 rounded">{t('affiliateInfo.tiers.commissionExplainer.example')}</p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-white/10 rounded-lg p-2">
                    <div className="flex items-center gap-1">
                      <span>{t('affiliateInfo.tiers.overrideShort')}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="hover:opacity-100 transition-opacity">
                            <HelpCircle className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-foreground">{t('affiliateInfo.tiers.overrideExplainer.title')}</h4>
                            <p className="text-sm text-muted-foreground">{t('affiliateInfo.tiers.overrideExplainer.description')}</p>
                            <p className="text-sm bg-muted text-foreground p-2 rounded">{t('affiliateInfo.tiers.overrideExplainer.example')}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <span className="font-bold">{tier.override_rate}%</span>
                  </div>
                </div>
                {index < tiers.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loyalty Bonus Section */}
        <div className="mt-8 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {t('affiliateInfo.tiers.loyaltyTitle')}
            <Popover>
              <PopoverTrigger asChild>
                <button className="hover:text-primary transition-colors">
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold">{t('affiliateInfo.tiers.loyaltyExplainer.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('affiliateInfo.tiers.loyaltyExplainer.description')}</p>
                  <p className="text-sm bg-muted p-2 rounded">{t('affiliateInfo.tiers.loyaltyExplainer.example')}</p>
                </div>
              </PopoverContent>
            </Popover>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-muted-foreground">{t('affiliateInfo.tiers.loyaltyNew')}</p>
              <p className="font-bold">+0%</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-muted-foreground">{t('affiliateInfo.tiers.loyaltyEstablished')}</p>
              <p className="font-bold text-green-600">+1%</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-muted-foreground">{t('affiliateInfo.tiers.loyaltyVeteran')}</p>
              <p className="font-bold text-green-600">+2%</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <p className="text-muted-foreground">{t('affiliateInfo.tiers.loyaltyElite')}</p>
              <p className="font-bold text-green-600">+3%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
