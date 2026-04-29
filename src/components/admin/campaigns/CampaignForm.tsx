import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  banner_type: z.string().default('announcement'),
  status: z.string().default('draft'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  target_audience: z.string().default('all'),
  display_pages: z.array(z.string()).default([]),
  banner_content: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    cta_text: z.string().optional(),
    cta_url: z.string().optional(),
  }).default({}),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  campaign?: any;
  onSuccess: () => void;
}

export function CampaignForm({ open, onClose, campaign, onSuccess }: CampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const [promoCodes, setPromoCodes] = useState<{ id: string; code: string }[]>([]);
  const [selectedPromoCodes, setSelectedPromoCodes] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      banner_type: 'announcement',
      status: 'draft',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      target_audience: 'all',
      display_pages: [],
      banner_content: {},
    },
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        description: campaign.description || '',
        banner_type: campaign.banner_type || 'announcement',
        status: campaign.status || 'draft',
        start_date: campaign.start_date ? format(new Date(campaign.start_date), 'yyyy-MM-dd') : '',
        end_date: campaign.end_date ? format(new Date(campaign.end_date), 'yyyy-MM-dd') : '',
        target_audience: campaign.target_audience || 'all',
        display_pages: campaign.display_pages || [],
        banner_content: campaign.banner_content || {},
      });
      // Fetch linked promo codes for this campaign
      fetchLinkedPromoCodes(campaign.id);
    } else {
      form.reset({
        name: '',
        description: '',
        banner_type: 'announcement',
        status: 'draft',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        target_audience: 'all',
        display_pages: [],
        banner_content: {},
      });
      setSelectedPromoCodes([]);
    }
  }, [campaign, form]);

  const fetchPromoCodes = async () => {
    const { data } = await supabase
      .from('promo_codes')
      .select('id, code')
      .eq('is_active', true)
      .order('code');
    if (data) setPromoCodes(data);
  };

  const fetchLinkedPromoCodes = async (campaignId: string) => {
    const { data } = await supabase
      .from('campaign_promo_codes')
      .select('promo_code_id')
      .eq('campaign_id', campaignId);
    if (data) {
      setSelectedPromoCodes(data.map(d => d.promo_code_id));
    }
  };

  const onSubmit = async (data: CampaignFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const campaignData = {
        name: data.name,
        description: data.description || null,
        banner_type: data.banner_type,
        status: data.status,
        start_date: new Date(data.start_date).toISOString(),
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        target_audience: data.target_audience,
        display_pages: data.display_pages,
        banner_content: data.banner_content,
        created_by: campaign ? undefined : user?.id,
      };

      let campaignId = campaign?.id;

      if (campaign) {
        const { error } = await supabase
          .from('promo_campaigns')
          .update(campaignData)
          .eq('id', campaign.id);
        if (error) throw error;
      } else {
        const { data: newCampaign, error } = await supabase
          .from('promo_campaigns')
          .insert(campaignData)
          .select('id')
          .single();
        if (error) throw error;
        campaignId = newCampaign.id;
      }

      // Update linked promo codes
      if (campaignId) {
        // Remove existing links
        await supabase
          .from('campaign_promo_codes')
          .delete()
          .eq('campaign_id', campaignId);

        // Add new links
        if (selectedPromoCodes.length > 0) {
          const links = selectedPromoCodes.map(promoCodeId => ({
            campaign_id: campaignId,
            promo_code_id: promoCodeId,
          }));
          await supabase.from('campaign_promo_codes').insert(links);

          // Also update promo_codes table with campaign_id
          await supabase
            .from('promo_codes')
            .update({ campaign_id: campaignId })
            .in('id', selectedPromoCodes);
        }
      }

      toast({
        title: campaign ? 'Campaign updated' : 'Campaign created',
        description: `Successfully ${campaign ? 'updated' : 'created'} campaign "${data.name}"`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePromoCode = (promoCodeId: string) => {
    setSelectedPromoCodes(prev =>
      prev.includes(promoCodeId)
        ? prev.filter(id => id !== promoCodeId)
        : [...prev, promoCodeId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Edit Campaign' : 'Create Campaign'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="e.g., Christmas 2025 Sale"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Campaign description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banner_type">Banner Type</Label>
                <Select
                  value={form.watch('banner_type')}
                  onValueChange={(value) => form.setValue('banner_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...form.register('start_date')}
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...form.register('end_date')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="target_audience">Target Audience</Label>
              <Select
                value={form.watch('target_audience')}
                onValueChange={(value) => form.setValue('target_audience', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="new_users">New Users</SelectItem>
                  <SelectItem value="returning">Returning Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Banner Content */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Banner Content</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.watch('banner_content.title') || ''}
                  onChange={(e) => form.setValue('banner_content.title', e.target.value)}
                  placeholder="Banner title"
                />
              </div>
              <div>
                <Label>CTA Text</Label>
                <Input
                  value={form.watch('banner_content.cta_text') || ''}
                  onChange={(e) => form.setValue('banner_content.cta_text', e.target.value)}
                  placeholder="e.g., Shop Now"
                />
              </div>
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={form.watch('banner_content.subtitle') || ''}
                onChange={(e) => form.setValue('banner_content.subtitle', e.target.value)}
                placeholder="Banner subtitle"
              />
            </div>
            <div>
              <Label>CTA URL</Label>
              <Input
                value={form.watch('banner_content.cta_url') || ''}
                onChange={(e) => form.setValue('banner_content.cta_url', e.target.value)}
                placeholder="/packages"
              />
            </div>
          </div>

          {/* Promo Codes */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Link Promo Codes</h3>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-muted/30">
              {promoCodes.map((pc) => (
                <Badge
                  key={pc.id}
                  variant={selectedPromoCodes.includes(pc.id) ? 'default' : 'outline'}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => togglePromoCode(pc.id)}
                >
                  {pc.code}
                  {selectedPromoCodes.includes(pc.id) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
              {promoCodes.length === 0 && (
                <p className="text-sm text-muted-foreground">No active promo codes available</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {campaign ? 'Update' : 'Create'} Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
