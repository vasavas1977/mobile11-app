import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  ShoppingCart, 
  Users, 
  UserPlus, 
  Tag, 
  MessageSquare, 
  Settings, 
  Package,
  DollarSign,
  Search,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'order': return ShoppingCart;
    case 'user': return Users;
    case 'affiliate': return UserPlus;
    case 'promo_code': return Tag;
    case 'ticket': return MessageSquare;
    case 'payout': return DollarSign;
    case 'settings': return Settings;
    case 'package': return Package;
    default: return Activity;
  }
};

const getActionBadgeVariant = (actionType: string): "default" | "secondary" | "destructive" | "outline" => {
  if (actionType.includes('delete') || actionType.includes('reject')) return 'destructive';
  if (actionType.includes('approve') || actionType.includes('create')) return 'default';
  return 'secondary';
};

export function AdminActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('entity_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as ActivityLog[]) || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    search === '' || 
    log.description.toLowerCase().includes(search.toLowerCase()) ||
    log.action_type.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Logs
            </CardTitle>
            <CardDescription>
              Track all admin actions and changes
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search activities..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="affiliate">Affiliates</SelectItem>
              <SelectItem value="promo_code">Promo Codes</SelectItem>
              <SelectItem value="ticket">Tickets</SelectItem>
              <SelectItem value="payout">Payouts</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
              <SelectItem value="package">Packages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity logs found</p>
            <p className="text-sm">Admin actions will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const Icon = getEntityIcon(log.entity_type);
                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getActionBadgeVariant(log.action_type)}>
                          {log.action_type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">
                          {log.entity_type.replace(/_/g, ' ')}
                        </span>
                        {log.entity_id && (
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                            {log.entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{log.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span title={format(new Date(log.created_at), 'PPpp')}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
