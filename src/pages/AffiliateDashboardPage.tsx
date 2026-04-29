import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { useAuth } from '@/hooks/useAuth';
import { useAffiliateCheck } from '@/hooks/useAffiliateCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Copy, Check, DollarSign, MousePointer, ShoppingCart, 
  TrendingUp, Link as LinkIcon, Clock, AlertCircle, Users, Briefcase, Trophy,
  BarChart3, Settings
} from 'lucide-react';
import { MarketingKitTab } from '@/components/affiliate/MarketingKitTab';
import { TierProgressCard } from '@/components/affiliate/TierProgressCard';
import { MilestoneAchievements } from '@/components/affiliate/MilestoneAchievements';
import { PaymentSettingsTab } from '@/components/affiliate/PaymentSettingsTab';
import { EarningsReportTab } from '@/components/affiliate/EarningsReportTab';

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  conversionRate: number;
  currentTier: string;
  monthlySales: number;
  loyaltyTier: string;
  loyaltyMonths: number;
  totalLifetimeSales: number;
  milestonesClaimedData: Record<string, boolean>;
}

interface Conversion {
  id: string;
  order_amount: number;
  commission_amount: number;
  status: string;
  converted_at: string;
}

interface AffiliateLink {
  id: string;
  link_code: string;
  campaign_name: string | null;
  destination_url: string;
  click_count: number;
  conversion_count: number;
  created_at: string;
}

export default function AffiliateDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAffiliate, status, affiliateId, affiliateCode, isPartnerManager, loading: affiliateLoading } = useAffiliateCheck();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newCampaign, setNewCampaign] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('post_auth_next', '/affiliate/dashboard');
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!affiliateLoading && !isAffiliate) {
      navigate('/affiliate/register');
    }
  }, [isAffiliate, affiliateLoading, navigate]);

  useEffect(() => {
    if (affiliateId) {
      fetchDashboardData();
    }
  }, [affiliateId]);

  const fetchDashboardData = async () => {
    if (!affiliateId) return;
    
    setLoading(true);
    try {
      // Fetch affiliate stats including tier info
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('total_clicks, total_conversions, total_earnings, pending_earnings, paid_earnings, current_volume_tier, monthly_sales_count, loyalty_tier, loyalty_months, total_lifetime_sales, milestones_claimed')
        .eq('id', affiliateId)
        .single();

      if (affiliateData) {
        setStats({
          totalClicks: affiliateData.total_clicks || 0,
          totalConversions: affiliateData.total_conversions || 0,
          totalEarnings: affiliateData.total_earnings || 0,
          pendingEarnings: affiliateData.pending_earnings || 0,
          paidEarnings: affiliateData.paid_earnings || 0,
          conversionRate: affiliateData.total_clicks > 0 
            ? (affiliateData.total_conversions / affiliateData.total_clicks) * 100 
            : 0,
          currentTier: affiliateData.current_volume_tier || 'starter',
          monthlySales: affiliateData.monthly_sales_count || 0,
          loyaltyTier: affiliateData.loyalty_tier || 'new',
          loyaltyMonths: affiliateData.loyalty_months || 0,
          totalLifetimeSales: affiliateData.total_lifetime_sales || 0,
          milestonesClaimedData: (affiliateData.milestones_claimed as Record<string, boolean>) || {},
        });
      }

      // Fetch recent conversions
      const { data: conversionData } = await supabase
        .from('affiliate_conversions')
        .select('id, order_amount, commission_amount, status, converted_at')
        .eq('affiliate_id', affiliateId)
        .order('converted_at', { ascending: false })
        .limit(10);

      setConversions(conversionData || []);

      // Fetch affiliate links
      const { data: linkData } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      setLinks(linkData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async (code?: string) => {
    const linkCode = code || affiliateCode;
    const url = `https://mobile11.com?ref=${linkCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ 
      title: t('affiliateDashboard.toast.linkCopied'), 
      description: t('affiliateDashboard.toast.linkCopiedDescription') 
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const createNewLink = async () => {
    if (!affiliateId) return;
    
    setCreatingLink(true);
    try {
      // Generate link code
      const { data: codeData } = await supabase.rpc('generate_link_code');
      
      const { error } = await supabase
        .from('affiliate_links')
        .insert({
          affiliate_id: affiliateId,
          link_code: codeData || Math.random().toString(36).substring(2, 8),
          campaign_name: newCampaign.trim() || null,
          destination_url: '/',
        });

      if (error) throw error;

      toast({ 
        title: t('affiliateDashboard.toast.linkCreated'), 
        description: t('affiliateDashboard.toast.linkCreatedDescription') 
      });
      setNewCampaign('');
      fetchDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreatingLink(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">{t('affiliateDashboard.status.pending')}</Badge>;
      case 'approved': return <Badge variant="default">{t('affiliateDashboard.status.approved')}</Badge>;
      case 'paid': return <Badge className="bg-green-500">{t('affiliateDashboard.status.paid')}</Badge>;
      case 'rejected': return <Badge variant="destructive">{t('affiliateDashboard.status.rejected')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || affiliateLoading || !affiliateId) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  // Pending status view
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <main className="container py-8 md:py-12">
          <Card className="max-w-lg mx-auto text-center bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <CardTitle className="text-gray-900">{t('affiliateDashboard.pending.title')}</CardTitle>
              <CardDescription className="text-gray-600">
                {t('affiliateDashboard.pending.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                {t('affiliateDashboard.pending.waitTime')}
              </p>
              <Button variant="outline" onClick={() => navigate('/')} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                {t('affiliateDashboard.pending.returnHome')}
              </Button>
            </CardContent>
          </Card>
        </main>
        <FooterAiralo />
      </div>
    );
  }

  // Suspended/Rejected status view
  if (status === 'suspended' || status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <main className="container py-8 md:py-12">
          <Card className="max-w-lg mx-auto text-center bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-gray-900">
                {t('affiliateDashboard.suspended.title')} {status === 'suspended' 
                  ? t('affiliateDashboard.suspended.suspended') 
                  : t('affiliateDashboard.suspended.notApproved')}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {status === 'suspended' 
                  ? t('affiliateDashboard.suspended.suspendedMessage')
                  : t('affiliateDashboard.suspended.rejectedMessage')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate('/support')} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                {t('affiliateDashboard.suspended.contactSupport')}
              </Button>
            </CardContent>
          </Card>
        </main>
        <FooterAiralo />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      
      <main className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('affiliateDashboard.header.title')}</h1>
            <p className="text-gray-600">
              {t('affiliateDashboard.header.affiliateCode')}: <span className="font-mono font-bold text-orange-500">{affiliateCode}</span>
              {isPartnerManager && <Badge className="ml-2 bg-orange-500">{t('affiliateDashboard.header.partnerManager')}</Badge>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => copyReferralLink()} variant="outline" className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {t('affiliateDashboard.header.copyReferralLink')}
            </Button>
          </div>
        </div>

        {/* Tier Progress & Milestones */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {stats && (
            <>
              <TierProgressCard
                affiliateId={affiliateId}
                currentTier={stats.currentTier}
                monthlySales={stats.monthlySales}
                loyaltyTier={stats.loyaltyTier}
                loyaltyMonths={stats.loyaltyMonths}
              />
              <MilestoneAchievements
                affiliateId={affiliateId}
                totalLifetimeSales={stats.totalLifetimeSales}
                claimedMilestones={stats.milestonesClaimedData}
                onMilestoneClaimed={fetchDashboardData}
              />
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{t('affiliateDashboard.stats.totalClicks')}</CardTitle>
              <MousePointer className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{t('affiliateDashboard.stats.conversions')}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.totalConversions}</div>
              <p className="text-xs text-gray-500">
                {loading ? '' : `${stats?.conversionRate.toFixed(1)}% ${t('affiliateDashboard.stats.rate')}`}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{t('affiliateDashboard.stats.totalEarnings')}</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${loading ? '...' : stats?.totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{t('affiliateDashboard.stats.pendingPayout')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">${loading ? '...' : stats?.pendingEarnings.toFixed(2)}</div>
              <p className="text-xs text-gray-500">
                ${loading ? '' : stats?.paidEarnings.toFixed(2)} {t('affiliateDashboard.stats.paid')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="links" className="space-y-4">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="links" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <LinkIcon className="h-4 w-4 mr-2" />
              {t('affiliateDashboard.tabs.trackingLinks')}
            </TabsTrigger>
            <TabsTrigger value="conversions" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t('affiliateDashboard.tabs.conversions')}
            </TabsTrigger>
            <TabsTrigger value="marketing" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Briefcase className="h-4 w-4 mr-2" />
              {t('affiliateDashboard.tabs.marketingKit')}
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              {t('affiliateDashboard.tabs.paymentSettings')}
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('affiliateDashboard.tabs.earningsReport')}
            </TabsTrigger>
            {isPartnerManager && (
              <TabsTrigger value="team" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                {t('affiliateDashboard.tabs.myTeam')}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-4">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">{t('affiliateDashboard.links.createTitle')}</CardTitle>
                <CardDescription className="text-gray-600">{t('affiliateDashboard.links.createDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('affiliateDashboard.links.campaignPlaceholder')}
                    value={newCampaign}
                    onChange={(e) => setNewCampaign(e.target.value)}
                    className="border-gray-300"
                  />
                  <Button onClick={createNewLink} disabled={creatingLink} className="bg-orange-500 hover:bg-orange-600 text-white">
                    {creatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : t('affiliateDashboard.links.createButton')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">{t('affiliateDashboard.links.yourLinks')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">{t('affiliateDashboard.links.campaign')}</TableHead>
                      <TableHead className="text-gray-600">{t('affiliateDashboard.links.link')}</TableHead>
                      <TableHead className="text-gray-600">{t('affiliateDashboard.links.clicks')}</TableHead>
                      <TableHead className="text-gray-600">{t('affiliateDashboard.links.conversions')}</TableHead>
                      <TableHead className="text-gray-600">{t('affiliateDashboard.links.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{t('affiliateDashboard.links.default')}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-700">?ref={affiliateCode}</TableCell>
                      <TableCell className="text-gray-700">{stats?.totalClicks || 0}</TableCell>
                      <TableCell className="text-gray-700">{stats?.totalConversions || 0}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => copyReferralLink()} className="text-gray-600 hover:text-gray-900">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {links.map((link) => (
                      <TableRow key={link.id} className="border-gray-200">
                        <TableCell className="font-medium text-gray-900">{link.campaign_name || t('affiliateDashboard.links.unnamed')}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-700">?link={link.link_code}</TableCell>
                        <TableCell className="text-gray-700">{link.click_count}</TableCell>
                        <TableCell className="text-gray-700">{link.conversion_count}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => copyReferralLink(link.link_code)} className="text-gray-600 hover:text-gray-900">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversions Tab */}
          <TabsContent value="conversions">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">{t('affiliateDashboard.conversions.recentTitle')}</CardTitle>
                <CardDescription className="text-gray-600">{t('affiliateDashboard.conversions.recentDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {conversions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('affiliateDashboard.conversions.noConversions')}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">{t('affiliateDashboard.conversions.date')}</TableHead>
                        <TableHead className="text-gray-600">{t('affiliateDashboard.conversions.orderAmount')}</TableHead>
                        <TableHead className="text-gray-600">{t('affiliateDashboard.conversions.commission')}</TableHead>
                        <TableHead className="text-gray-600">{t('affiliateDashboard.conversions.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversions.map((conversion) => (
                        <TableRow key={conversion.id} className="border-gray-200">
                          <TableCell className="text-gray-700">
                            {new Date(conversion.converted_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-gray-700">${conversion.order_amount.toFixed(2)}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            +${conversion.commission_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{getStatusBadge(conversion.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Kit Tab */}
          <TabsContent value="marketing">
            <MarketingKitTab isPartnerManager={isPartnerManager} affiliateCode={affiliateCode || ''} />
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment">
            <PaymentSettingsTab affiliateId={affiliateId} />
          </TabsContent>

          {/* Earnings Report Tab */}
          <TabsContent value="report">
            <EarningsReportTab affiliateId={affiliateId} />
          </TabsContent>

          {/* Team Tab (Partner Managers only) */}
          {isPartnerManager && (
            <TabsContent value="team">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">{t('affiliateDashboard.team.title')}</CardTitle>
                  <CardDescription className="text-gray-600">{t('affiliateDashboard.team.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('affiliateDashboard.team.comingSoon')}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <FooterAiralo />
    </div>
  );
}
