import { useState, useEffect } from 'react';
import { CreditCard, Globe, Calendar, Signal, RefreshCw, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_id: string;
  status: string;
  iccid: string | null;
  created_at: string;
  expiry_date: string | null;
  cached_usage: any;
  esim_packages: {
    name: string;
    country_name: string;
    data_amount: string;
    validity_days: number;
  } | null;
}

interface AdminCustomerEsimsProps {
  userId: string;
}

export function AdminCustomerEsims({ userId }: AdminCustomerEsimsProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEsims();
  }, [userId]);

  const fetchEsims = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_id,
          status,
          iccid,
          created_at,
          expiry_date,
          cached_usage,
          esim_packages (
            name,
            country_name,
            data_amount,
            validity_days
          )
        `)
        .eq('user_id', userId)
        .not('iccid', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching eSIMs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch eSIMs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, expiryDate: string | null) => {
    const isExpired = expiryDate && new Date(expiryDate) < new Date();
    
    if (isExpired) {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Expired</Badge>;
    }

    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const [refreshingOrderId, setRefreshingOrderId] = useState<string | null>(null);

  const refreshUsage = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshingOrderId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      await supabase.functions.invoke('check-esim-usage', {
        body: { orderId, forceRefresh: true }
      });

      await fetchEsims();
      toast({ title: 'Usage refreshed' });
    } catch (error) {
      console.error('Error refreshing usage:', error);
      toast({ title: 'Error', description: 'Failed to refresh usage', variant: 'destructive' });
    } finally {
      setRefreshingOrderId(null);
    }
  };

  const formatUsage = (cachedUsage: any) => {
    if (!cachedUsage) return null;

    let usedMb = 0;
    let totalMb = 0;

    // TUGE format: usageMb, dataTotalMB, dataUsed, totalData, percentageUsed
    if (cachedUsage.usageMb !== undefined || cachedUsage.dataUsed !== undefined || cachedUsage.dataTotalMB !== undefined) {
      // Parse used
      if (typeof cachedUsage.usageMb === 'number') {
        usedMb = cachedUsage.usageMb;
      } else if (typeof cachedUsage.dataUsed === 'string') {
        const match = cachedUsage.dataUsed.match(/([\d.]+)\s*(GB|MB)/i);
        if (match) usedMb = parseFloat(match[1]) * (match[2].toUpperCase() === 'GB' ? 1024 : 1);
      }
      // Parse total
      if (typeof cachedUsage.dataTotalMB === 'number') {
        totalMb = cachedUsage.dataTotalMB;
      } else if (typeof cachedUsage.totalData === 'string') {
        const match = cachedUsage.totalData.match(/([\d.]+)\s*(GB|MB)/i);
        if (match) totalMb = parseFloat(match[1]) * (match[2].toUpperCase() === 'GB' ? 1024 : 1);
      }
    }
    // USIMSA format: usedDataInBytes, totalDataInBytes
    else if (cachedUsage.usedDataInBytes || cachedUsage.totalDataInBytes) {
      usedMb = cachedUsage.usedDataInBytes ? cachedUsage.usedDataInBytes / (1024 * 1024) : 0;
      totalMb = cachedUsage.totalDataInBytes ? cachedUsage.totalDataInBytes / (1024 * 1024) : 0;
    }

    // If we got a direct percentageUsed from the provider, prefer it
    const percentage = cachedUsage.percentageUsed != null
      ? Math.round(cachedUsage.percentageUsed)
      : totalMb > 0 ? Math.round((usedMb / totalMb) * 100) : 0;

    return {
      used: usedMb >= 1024 ? `${(usedMb / 1024).toFixed(2)} GB` : `${usedMb.toFixed(0)} MB`,
      total: totalMb >= 1024 ? `${(totalMb / 1024).toFixed(2)} GB` : `${totalMb.toFixed(0)} MB`,
      percentage
    };
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-48" />
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No eSIMs found for this customer</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => {
          const usage = formatUsage(order.cached_usage);
          
          return (
            <Card 
              key={order.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setSelectedOrder(order);
                setDetailsOpen(true);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.esim_packages?.country_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={refreshingOrderId === order.order_id}
                      onClick={(e) => refreshUsage(order.order_id, e)}
                    >
                      <RefreshCw className={`h-3 w-3 ${refreshingOrderId === order.order_id ? 'animate-spin' : ''}`} />
                    </Button>
                    {getStatusBadge(order.status, order.expiry_date)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {order.esim_packages?.name || 'Unknown Package'}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Signal className="h-3 w-3" />
                    {order.esim_packages?.data_amount || '-'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {order.esim_packages?.validity_days || '-'} days
                  </span>
                </div>

                {usage && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Usage</span>
                      <span>{usage.used} / {usage.total}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {order.iccid && (
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    ICCID: {order.iccid}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* eSIM Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>eSIM Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedOrder.esim_packages?.name}</h3>
                {getStatusBadge(selectedOrder.status, selectedOrder.expiry_date)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Country</label>
                  <p className="font-medium">{selectedOrder.esim_packages?.country_name || '-'}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Data</label>
                  <p className="font-medium">{selectedOrder.esim_packages?.data_amount || '-'}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Validity</label>
                  <p className="font-medium">{selectedOrder.esim_packages?.validity_days || '-'} days</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Order ID</label>
                  <p className="font-mono text-xs">{selectedOrder.order_id}</p>
                </div>
              </div>

              {selectedOrder.iccid && (
                <div>
                  <label className="text-sm text-muted-foreground">ICCID</label>
                  <p className="font-mono text-sm break-all">{selectedOrder.iccid}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Purchased</label>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground">Expires</label>
                  <p className="font-medium">
                    {selectedOrder.expiry_date 
                      ? new Date(selectedOrder.expiry_date).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
              </div>

              {selectedOrder.cached_usage && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Usage</label>
                  {(() => {
                    const usage = formatUsage(selectedOrder.cached_usage);
                    if (!usage) return null;
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>{usage.used} used</span>
                          <span>{usage.total} total</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-primary h-3 rounded-full transition-all" 
                            style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                          {usage.percentage}% used
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
