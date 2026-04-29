import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Megaphone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CampaignCard } from './campaigns/CampaignCard';
import { CampaignForm } from './campaigns/CampaignForm';
import { CampaignAnalytics } from './campaigns/CampaignAnalytics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  banner_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  target_audience: string;
  display_pages: string[];
  banner_content: any;
  promo_codes?: { code: string }[];
  analytics_summary?: {
    views: number;
    clicks: number;
    conversions: number;
  };
}

export function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // Fetch campaigns
      const { data: campaignsData, error } = await supabase
        .from('promo_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch linked promo codes for each campaign
      const campaignsWithData = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          // Get linked promo codes
          const { data: linkedCodes } = await supabase
            .from('campaign_promo_codes')
            .select('promo_codes(code)')
            .eq('campaign_id', campaign.id);

          // Get analytics summary
          const { data: analytics } = await supabase
            .from('campaign_analytics')
            .select('event_type')
            .eq('campaign_id', campaign.id);

          const views = analytics?.filter(e => e.event_type === 'view').length || 0;
          const clicks = analytics?.filter(e => e.event_type === 'click').length || 0;
          const conversions = analytics?.filter(e => e.event_type === 'conversion').length || 0;

          return {
            ...campaign,
            promo_codes: linkedCodes?.map(lc => lc.promo_codes).filter(Boolean) || [],
            analytics_summary: { views, clicks, conversions },
          };
        })
      );

      setCampaigns(campaignsWithData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('promo_campaigns')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Campaign deleted',
        description: 'Campaign has been deleted successfully',
      });
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaign',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' 
      || (activeTab === 'active' && campaign.status === 'active')
      || (activeTab === 'history' && ['ended', 'archived'].includes(campaign.status));
    return matchesSearch && matchesTab;
  });

  // Show analytics view
  if (analyticsId) {
    return (
      <CampaignAnalytics 
        campaignId={analyticsId} 
        onBack={() => setAnalyticsId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Promotional Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your promotional banners and track their performance
          </p>
        </div>
        <Button onClick={() => { setEditingCampaign(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Campaign Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No campaigns found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term' : 'Create your first campaign to get started'}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => { setEditingCampaign(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={() => { setEditingCampaign(campaign); setFormOpen(true); }}
              onDelete={(id) => setDeleteId(id)}
              onViewAnalytics={(id) => setAnalyticsId(id)}
            />
          ))}
        </div>
      )}

      {/* Campaign Form Dialog */}
      <CampaignForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCampaign(null); }}
        campaign={editingCampaign}
        onSuccess={fetchCampaigns}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign and all associated analytics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
