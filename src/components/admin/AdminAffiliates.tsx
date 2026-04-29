import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminActivityLog } from '@/hooks/useAdminActivityLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  MousePointer,
  TrendingUp,
  Eye,
  Ban,
  UserCheck,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface TierConfig {
  id: string;
  tier_name: string;
  min_sales: number;
  max_sales: number | null;
  commission_rate: number;
  override_rate: number;
  badge_color: string;
  tier_order: number;
}

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  affiliate_type: string;
  status: string;
  commission_rate: number;
  commission_type: string;
  override_rate: number | null;
  company_name: string | null;
  website_url: string | null;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  created_at: string;
  current_volume_tier: string;
  loyalty_tier: string;
  loyalty_months: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment_details: any;
  profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

interface Conversion {
  id: string;
  affiliate_id: string;
  order_id: string;
  order_amount: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  converted_at: string;
  affiliate?: {
    affiliate_code: string;
  };
}

interface Payout {
  id: string;
  affiliate_id: string;
  amount: number;
  currency: string;
  payout_method: string;
  status: string;
  requested_at: string;
  processed_at: string | null;
  reference_number: string | null;
  notes: string | null;
  affiliate?: {
    affiliate_code: string;
  };
}

const loyaltyBonuses: Record<string, number> = {
  new: 0,
  established: 1,
  veteran: 2,
  elite: 3,
};

export function AdminAffiliates() {
  const { toast } = useToast();
  const { logActivity } = useAdminActivityLog();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [tierConfig, setTierConfig] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    pendingApprovals: 0,
    totalCommissions: 0,
    pendingPayouts: 0
  });

  const getEffectiveCommissionRate = (affiliate: Affiliate) => {
    const tier = tierConfig.find(t => t.tier_name === affiliate.current_volume_tier);
    const baseRate = tier?.commission_rate || 8;
    const loyaltyBonus = loyaltyBonuses[affiliate.loyalty_tier] || 0;
    return baseRate + loyaltyBonus;
  };

  const getTierBadgeColor = (tierName: string) => {
    const tier = tierConfig.find(t => t.tier_name === tierName);
    return tier?.badge_color || '#6B7280';
  };

  useEffect(() => {
    fetchTierConfig();
    fetchData();
  }, []);

  const fetchTierConfig = async () => {
    const { data } = await supabase
      .from('affiliate_tier_config')
      .select('*')
      .order('tier_order', { ascending: true });
    if (data) setTierConfig(data);
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAffiliates(),
      fetchConversions(),
      fetchPayouts()
    ]);
    setLoading(false);
  };

  const fetchAffiliates = async () => {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch affiliates', variant: 'destructive' });
      return;
    }

    // Fetch profiles for each affiliate
    const affiliatesWithProfiles = await Promise.all(
      (data || []).map(async (affiliate) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('user_id', affiliate.user_id)
          .maybeSingle();
        return { ...affiliate, profile };
      })
    );

    setAffiliates(affiliatesWithProfiles);

    // Calculate stats
    const active = affiliatesWithProfiles.filter(a => a.status === 'active').length;
    const pending = affiliatesWithProfiles.filter(a => a.status === 'pending').length;
    const totalCommissions = affiliatesWithProfiles.reduce((sum, a) => sum + (a.total_earnings || 0), 0);

    setStats(prev => ({
      ...prev,
      totalAffiliates: affiliatesWithProfiles.length,
      activeAffiliates: active,
      pendingApprovals: pending,
      totalCommissions
    }));
  };

  const fetchConversions = async () => {
    const { data, error } = await supabase
      .from('affiliate_conversions')
      .select(`
        *,
        affiliate:affiliates!affiliate_conversions_affiliate_id_fkey(affiliate_code)
      `)
      .order('converted_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setConversions(data as unknown as Conversion[]);
    }
  };

  const fetchPayouts = async () => {
    const { data, error } = await supabase
      .from('affiliate_payouts')
      .select(`
        *,
        affiliate:affiliates!affiliate_payouts_affiliate_id_fkey(affiliate_code)
      `)
      .order('requested_at', { ascending: false });

    if (!error && data) {
      setPayouts(data as unknown as Payout[]);
      const pendingAmount = data
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);
      setStats(prev => ({ ...prev, pendingPayouts: pendingAmount }));
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, newStatus: string) => {
    setProcessingId(affiliateId);
    
    // Find the affiliate to get their details for the email
    const affiliate = affiliates.find(a => a.id === affiliateId);
    const oldStatus = affiliate?.status;
    
    const { error } = await supabase
      .from('affiliates')
      .update({ 
        status: newStatus,
        approved_at: newStatus === 'active' ? new Date().toISOString() : null
      })
      .eq('id', affiliateId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      // Log the activity
      const actionType = newStatus === 'active' ? 'affiliate_approve' : 
                        newStatus === 'rejected' ? 'affiliate_reject' : 
                        newStatus === 'suspended' ? 'affiliate_suspend' : 'affiliate_status_change';
      await logActivity({
        actionType,
        entityType: 'affiliate',
        entityId: affiliateId,
        oldValue: { status: oldStatus },
        newValue: { status: newStatus },
        description: `Affiliate ${affiliate?.affiliate_code || affiliateId} status changed from ${oldStatus} to ${newStatus}`,
      });

      const language = affiliate?.payment_details?.preferredLanguage || 'en';
      const email = affiliate?.profile?.email;
      const displayName = affiliate?.profile?.first_name || affiliate?.affiliate_code || 'Partner';

      // Send status-specific emails and admin notifications
      try {
        if (newStatus === 'active' && email) {
          await supabase.functions.invoke('send-affiliate-approval', {
            body: {
              email,
              affiliateCode: affiliate.affiliate_code,
              commissionRate: affiliate.commission_rate,
              companyName: affiliate.company_name,
              firstName: affiliate.profile?.first_name,
              language,
            }
          });
        } else if (newStatus === 'rejected' && email) {
          await supabase.functions.invoke('send-affiliate-rejection', {
            body: {
              email,
              displayName,
              affiliateCode: affiliate?.affiliate_code,
              language,
            }
          });
        } else if (newStatus === 'suspended' && email) {
          await supabase.functions.invoke('send-affiliate-suspension', {
            body: {
              email,
              displayName,
              affiliateCode: affiliate?.affiliate_code,
              language,
            }
          });
        }

        // Send admin notification for all status changes
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            action: `Affiliate ${newStatus === 'active' ? 'Approved' : newStatus === 'rejected' ? 'Rejected' : 'Suspended'}`,
            entityType: 'affiliate',
            entityId: affiliate?.affiliate_code,
            details: `Status changed from ${oldStatus} to ${newStatus}`,
            metadata: {
              affiliateCode: affiliate?.affiliate_code,
              email: affiliate?.profile?.email,
              previousStatus: oldStatus,
              newStatus,
            }
          }
        });

        const statusMessage = newStatus === 'active' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'suspended';
        toast({ title: 'Success', description: `Affiliate ${statusMessage} and notifications sent!` });
      } catch (emailError) {
        console.error('Failed to send notification emails:', emailError);
        toast({ title: 'Success', description: `Affiliate status updated (some notifications failed)` });
      }
      
      fetchAffiliates();
    }
    setProcessingId(null);
  };

  const updateCommissionRate = async (affiliateId: string, rate: number) => {
    const { error } = await supabase
      .from('affiliates')
      .update({ commission_rate: rate })
      .eq('id', affiliateId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update commission rate', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Commission rate updated' });
      fetchAffiliates();
    }
  };

  const approveConversion = async (conversionId: string) => {
    setProcessingId(conversionId);
    
    const { error } = await supabase.rpc('approve_affiliate_conversion', {
      conversion_id: conversionId,
      admin_user_id: (await supabase.auth.getUser()).data.user?.id
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to approve conversion', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Conversion approved' });
      fetchConversions();
      fetchAffiliates();
    }
    setProcessingId(null);
  };

  const processPayout = async (payoutId: string, referenceNumber?: string) => {
    setProcessingId(payoutId);
    
    const { error } = await supabase.rpc('process_affiliate_payout', {
      p_payout_id: payoutId,
      p_admin_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_reference_number: referenceNumber || null
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to process payout', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Payout processed' });
      fetchPayouts();
      fetchAffiliates();
    }
    setProcessingId(null);
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.affiliate_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Suspended</Badge>;
      case 'rejected':
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliate Management</h1>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Affiliates</p>
                <p className="text-2xl font-bold">{stats.totalAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.activeAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Commissions</p>
                <p className="text-2xl font-bold">${stats.totalCommissions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold">${stats.pendingPayouts.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="mt-4">
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Affiliates Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {affiliate.profile?.first_name} {affiliate.profile?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{affiliate.profile?.email}</p>
                        {affiliate.company_name && (
                          <p className="text-xs text-muted-foreground">{affiliate.company_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{affiliate.affiliate_code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{affiliate.affiliate_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="capitalize text-xs"
                          style={{ borderColor: getTierBadgeColor(affiliate.current_volume_tier), color: getTierBadgeColor(affiliate.current_volume_tier) }}
                        >
                          {affiliate.current_volume_tier}
                        </Badge>
                        <span className="font-medium text-green-500">{getEffectiveCommissionRate(affiliate)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3 text-muted-foreground" />
                          <span>{affiliate.total_clicks || 0} clicks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span>{affiliate.total_conversions || 0} conversions</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <p className="font-medium">${(affiliate.total_earnings || 0).toFixed(2)}</p>
                        <p className="text-muted-foreground">
                          ${(affiliate.pending_earnings || 0).toFixed(2)} pending
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedAffiliate(affiliate)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Affiliate Details</DialogTitle>
                            </DialogHeader>
                            {selectedAffiliate && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-muted-foreground">Email</label>
                                    <p>{selectedAffiliate.profile?.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm text-muted-foreground">Display Name</label>
                                    <p>{selectedAffiliate.company_name || 'N/A'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-sm text-muted-foreground">Social Channels</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {selectedAffiliate.payment_details?.socialChannels ? (
                                        Object.entries(selectedAffiliate.payment_details.socialChannels as Record<string, string>)
                                          .filter(([_, value]) => value && String(value).trim() !== '')
                                          .map(([platform, url]) => (
                                            <Badge key={platform} variant="outline" className="capitalize">
                                              {platform}: {String(url)}
                                            </Badge>
                                          ))
                                      ) : selectedAffiliate.website_url ? (
                                        <p>{selectedAffiliate.website_url}</p>
                                      ) : (
                                        <p className="text-muted-foreground">N/A</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm text-muted-foreground">Joined</label>
                                    <p>{format(new Date(selectedAffiliate.created_at), 'PPP')}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm text-muted-foreground">Commission Rate</label>
                                    <div className="space-y-1 mt-1">
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant="outline" 
                                          className="capitalize"
                                          style={{ borderColor: getTierBadgeColor(selectedAffiliate.current_volume_tier), color: getTierBadgeColor(selectedAffiliate.current_volume_tier) }}
                                        >
                                          {selectedAffiliate.current_volume_tier}
                                        </Badge>
                                        <span className="text-lg font-bold text-green-500">
                                          {getEffectiveCommissionRate(selectedAffiliate)}%
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Base: {tierConfig.find(t => t.tier_name === selectedAffiliate.current_volume_tier)?.commission_rate || 8}% 
                                        + Loyalty ({selectedAffiliate.loyalty_tier}): +{loyaltyBonuses[selectedAffiliate.loyalty_tier] || 0}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {affiliate.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-500 hover:text-green-600"
                              onClick={() => updateAffiliateStatus(affiliate.id, 'active')}
                              disabled={processingId === affiliate.id}
                            >
                              {processingId === affiliate.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => updateAffiliateStatus(affiliate.id, 'rejected')}
                              disabled={processingId === affiliate.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {affiliate.status === 'active' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-orange-500 hover:text-orange-600"
                            onClick={() => updateAffiliateStatus(affiliate.id, 'suspended')}
                            disabled={processingId === affiliate.id}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {affiliate.status === 'suspended' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-500 hover:text-green-600"
                            onClick={() => updateAffiliateStatus(affiliate.id, 'active')}
                            disabled={processingId === affiliate.id}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Order Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((conversion) => (
                    <TableRow key={conversion.id}>
                      <TableCell>{format(new Date(conversion.converted_at), 'PPp')}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {conversion.affiliate?.affiliate_code}
                        </code>
                      </TableCell>
                      <TableCell>${conversion.order_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="font-medium">${conversion.commission_amount.toFixed(2)}</span>
                        <span className="text-muted-foreground text-sm ml-1">
                          ({conversion.commission_rate}%)
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(conversion.status)}</TableCell>
                      <TableCell>
                        {conversion.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveConversion(conversion.id)}
                            disabled={processingId === conversion.id}
                          >
                            {processingId === conversion.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Approve'
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{format(new Date(payout.requested_at), 'PPp')}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {payout.affiliate?.affiliate_code}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${payout.amount.toFixed(2)} {payout.currency}
                      </TableCell>
                      <TableCell className="capitalize">{payout.payout_method.replace('_', ' ')}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>{payout.reference_number || '-'}</TableCell>
                      <TableCell>
                        {payout.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processPayout(payout.id)}
                            disabled={processingId === payout.id}
                          >
                            {processingId === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Process'
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
