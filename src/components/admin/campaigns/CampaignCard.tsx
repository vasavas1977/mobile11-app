import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Eye, MoreVertical, Trash2, BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  banner_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  promo_codes?: { code: string }[];
  analytics_summary?: {
    views: number;
    clicks: number;
    conversions: number;
  };
}

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onViewAnalytics: (id: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  ended: 'bg-red-500/10 text-red-600 border-red-500/20',
  archived: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function CampaignCard({ campaign, onEdit, onDelete, onViewAnalytics }: CampaignCardProps) {
  const summary = campaign.analytics_summary || { views: 0, clicks: 0, conversions: 0 };
  const ctr = summary.views > 0 ? ((summary.clicks / summary.views) * 100).toFixed(1) : '0';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
            {campaign.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {campaign.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColors[campaign.status] || ''}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAnalytics(campaign.id)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(campaign.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {format(new Date(campaign.start_date), 'MMM d, yyyy')}
            {campaign.end_date && ` - ${format(new Date(campaign.end_date), 'MMM d, yyyy')}`}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">{summary.views.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{summary.clicks.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{ctr}%</div>
            <div className="text-xs text-muted-foreground">CTR</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{summary.conversions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Conversions</div>
          </div>
        </div>

        {/* Linked Promo Codes */}
        {campaign.promo_codes && campaign.promo_codes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {campaign.promo_codes.slice(0, 3).map((pc: { code: string }) => (
              <Badge key={pc.code} variant="secondary" className="text-xs">
                {pc.code}
              </Badge>
            ))}
            {campaign.promo_codes.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{campaign.promo_codes.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
