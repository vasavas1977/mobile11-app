import { useState, useEffect, useMemo } from 'react';
import { Download, PlusCircle, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AlertCircle, Activity, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TugeOrderDialog } from './TugeOrderDialog';
import { OrderKPIStrip } from './orders/OrderKPIStrip';
import { OrderFilters } from './orders/OrderFilters';
import { OrdersTable } from './orders/OrdersTable';
import { OrderDetailDrawer } from './orders/OrderDetailDrawer';
import { Order, OrderFilterState, DEFAULT_FILTERS, isExtensionOrder, getChannelSource } from './orders/types';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilterState>({ ...DEFAULT_FILTERS });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const { toast } = useToast();

  // Manual order creation states
  const [manualOrderDialogOpen, setManualOrderDialogOpen] = useState(false);
  const [tugeOrderDialogOpen, setTugeOrderDialogOpen] = useState(false);
  const [optionId, setOptionId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderEnvironment, setOrderEnvironment] = useState<'test' | 'production'>('test');
  const [manualOrderLoading, setManualOrderLoading] = useState(false);
  const [previewPackage, setPreviewPackage] = useState<any>(null);
  const [createdOrderResult, setCreatedOrderResult] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Export dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportIncludeCost, setExportIncludeCost] = useState(false);
  const [exportIncludeIccid, setExportIncludeIccid] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .order('email', { ascending: true });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Single joined query instead of N+1 individual lookups
      const PAGE_SIZE = 1000;
      let from = 0;
      let allOrders: Order[] = [];
      
      while (true) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            esim_packages!orders_package_id_fkey(name, country_name, country_code, data_amount, cost_price, category),
            esim_providers!orders_provider_id_fkey(provider_code, provider_name),
            affiliates!orders_affiliate_id_fkey(affiliate_code, company_name, affiliate_type)
          `)
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        
        const batch = (data || []) as unknown as Order[];
        allOrders = allOrders.concat(batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      // Batch-fetch profiles for all unique user_ids (no FK exists)
      const userIds = [...new Set(allOrders.map(o => o.user_id).filter(Boolean))];
      const profileMap = new Map<string, { first_name?: string; last_name?: string; email: string }>();
      
      // Fetch in chunks of 200 to stay within query limits
      for (let i = 0; i < userIds.length; i += 200) {
        const chunk = userIds.slice(i, i + 200);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', chunk);
        (profiles || []).forEach(p => profileMap.set(p.user_id, { first_name: p.first_name, last_name: p.last_name, email: p.email }));
      }

      const enriched = allOrders.map(o => ({
        ...o,
        profiles: profileMap.get(o.user_id) || undefined,
      }));

      setOrders(enriched);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Lookup package by Option ID for manual order
  useEffect(() => {
    if (!optionId.trim()) { setPreviewPackage(null); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('esim_packages').select('*').eq('package_id', optionId.trim()).single();
      setPreviewPackage(data || null);
    }, 300);
    return () => clearTimeout(t);
  }, [optionId]);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const webhook = order.webhook_data && typeof order.webhook_data === 'object' ? (order.webhook_data as any) : null;
      const topupId = webhook?.topupId ? String(webhook.topupId) : '';
      const search = filters.search.toLowerCase();

      if (search && !(
        order.order_id.toLowerCase().includes(search) ||
        (order.profiles?.email?.toLowerCase() || '').includes(search) ||
        (order.esim_packages?.name?.toLowerCase() || '').includes(search) ||
        (order.iccid?.toLowerCase() || '').includes(search) ||
        topupId.toLowerCase().includes(search)
      )) return false;

      if (filters.status !== 'all' && order.status !== filters.status) return false;

      const ext = isExtensionOrder(order);
      if (filters.extensionType === 'extension' && !ext) return false;
      if (filters.extensionType === 'original' && ext) return false;

      if (filters.tier !== 'all') {
        const tier = order.service_tier || 'priority';
        if (tier !== filters.tier) return false;
      }

      if (filters.supplier !== 'all') {
        const provName = order.esim_providers?.provider_name || order.esim_providers?.provider_code || '';
        if (provName !== filters.supplier) return false;
      }

      if (filters.destination !== 'all') {
        if (order.esim_packages?.country_name !== filters.destination) return false;
      }

      if (filters.channelSource !== 'all') {
        if (getChannelSource(order) !== filters.channelSource) return false;
      }

      if (filters.dateFrom) {
        if (new Date(order.created_at) < new Date(filters.dateFrom)) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setDate(to.getDate() + 1);
        if (new Date(order.created_at) >= to) return false;
      }

      return true;
    });
  }, [orders, filters]);

  // Derived filter options
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      const name = o.esim_providers?.provider_name || o.esim_providers?.provider_code;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [orders]);

  const destinations = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.esim_packages?.country_name) set.add(o.esim_packages.country_name); });
    return Array.from(set).sort();
  }, [orders]);

  const needsAttentionCount = orders.filter(o => o.status === 'needs_attention').length;

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filters]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const resetManualOrderForm = () => {
    setOptionId('');
    setSelectedUserId('');
    setOrderEmail('');
    setOrderEnvironment('test');
    setPreviewPackage(null);
    setCreatedOrderResult(null);
  };

  const handleCreateManualOrder = async () => {
    if (!optionId.trim() || !previewPackage) {
      toast({ title: "Error", description: "Please enter a valid Option ID", variant: "destructive" });
      return;
    }

    try {
      setManualOrderLoading(true);
      setCreatedOrderResult(null);

      const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
      const orderId = `MANUAL-${randomStr}`;

      const { data: { user: adminUser } } = await supabase.auth.getUser();
      const effectiveUserId = (selectedUserId && selectedUserId !== 'none') ? selectedUserId : adminUser?.id;

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: orderId,
          user_id: effectiveUserId,
          package_id: previewPackage.id,
          total_amount: 0,
          currency: previewPackage.currency || 'USD',
          status: 'pending',
          environment: orderEnvironment,
          notification_email: orderEmail || undefined,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: processError } = await supabase.functions.invoke('process-free-orders', {
        body: { orderIds: [newOrder.id], environment: orderEnvironment },
      });
      if (processError) throw processError;

      const { data: updatedOrder } = await supabase.from('orders').select('*').eq('id', newOrder.id).single();

      setCreatedOrderResult({ order: updatedOrder });
      toast({ title: "Order Created" });

      if (orderEmail && updatedOrder?.qr_code) {
        await supabase.functions.invoke('send-order-confirmation', { body: { orderId: newOrder.id, overrideEmail: orderEmail } }).catch(() => {});
      }
      await fetchOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setManualOrderLoading(false);
    }
  };

  const exportOrders = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Package', 'Destination', 'Supplier', 'Channel', 'Amount', 'Currency'];
    if (exportIncludeCost) headers.push('Cost (USD)', 'Margin');
    if (exportIncludeIccid) headers.push('ICCID');
    headers.push('Status', 'Payment', 'Provisioning', 'Date');

    const rows = filteredOrders.map(order => {
      const row: string[] = [
        order.order_id,
        `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim(),
        order.profiles?.email || '',
        order.esim_packages?.name || '',
        order.esim_packages?.country_name || '',
        order.esim_providers?.provider_name || '',
        getChannelSource(order),
        String(order.total_amount),
        order.currency,
      ];
      if (exportIncludeCost) {
        row.push(
          order.esim_packages?.cost_price != null ? Number(order.esim_packages.cost_price).toFixed(2) : '',
          order.provider_cost != null ? (order.total_amount - order.provider_cost).toFixed(2) : ''
        );
      }
      if (exportIncludeIccid) row.push(order.iccid || '');
      row.push(order.status, order.payment_completed_at ? 'paid' : 'pending', order.qr_code ? 'provisioned' : 'pending', new Date(order.created_at).toLocaleDateString());
      return row;
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-48 bg-[#F3F0EB] rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-[#F3F0EB] rounded-lg animate-pulse mt-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-[#F3F0EB] rounded-lg animate-pulse" />
            <div className="h-9 w-32 bg-[#F3F0EB] rounded-lg animate-pulse" />
          </div>
        </div>
        {/* KPI skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[76px] bg-white rounded-xl border border-[#F3F0EB] animate-pulse" />
          ))}
        </div>
        {/* Filter skeleton */}
        <div className="h-9 bg-[#F3F0EB] rounded-lg animate-pulse max-w-md" />
        {/* Table skeleton */}
        <div className="rounded-xl border border-[#F3F0EB] bg-white overflow-hidden">
          <div className="h-10 bg-[#FAFAF8] border-b border-[#F3F0EB]" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-[#F3F0EB] last:border-0 flex items-center px-4 gap-6">
              <div className="h-3 w-24 rounded bg-[#F3F0EB] animate-pulse" />
              <div className="h-3 w-32 rounded bg-[#F3F0EB] animate-pulse hidden md:block" />
              <div className="h-3 w-20 rounded bg-[#F3F0EB] animate-pulse hidden lg:block" />
              <div className="h-3 w-14 rounded bg-[#F3F0EB] animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-[#F3F0EB] animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Commerce Operations</h1>
            <p className="text-sm text-[#6B7280]">Manage orders, provisioning, and fulfillment</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg border-[#F3F0EB] text-[#4B5563] hover:bg-[#FAF7F2]" onClick={fetchOrders}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Create Order
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-[#F3F0EB] shadow-lg">
                <DropdownMenuLabel className="text-[11px] text-[#9CA3AF] uppercase tracking-wider">Select Provider</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#F3F0EB]" />
                <DropdownMenuItem onClick={() => { resetManualOrderForm(); setManualOrderDialogOpen(true); }} className="hover:bg-[#FAF7F2]">
                  <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 mr-2">USIMSA</Badge>
                  Create USIMSA Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTugeOrderDialogOpen(true)} className="hover:bg-[#FAF7F2]">
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 mr-2">TUGE</Badge>
                  Create TUGE Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg border-[#F3F0EB] text-[#4B5563] hover:bg-[#FAF7F2]" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <OrderKPIStrip orders={filteredOrders} />

        {/* Filters */}
        <OrderFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={orders.length}
          filteredCount={filteredOrders.length}
          needsAttentionCount={needsAttentionCount}
          suppliers={suppliers}
          destinations={destinations}
        />

        {/* Orders Table — now self-contained with border */}
        <OrdersTable
          orders={filteredOrders}
          onViewOrder={handleViewOrder}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />

        {/* Order Detail Drawer */}
        <OrderDetailDrawer
          order={selectedOrder}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onRefresh={fetchOrders}
        />

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Orders</DialogTitle>
              <DialogDescription>Select optional columns to include.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="exportCost" checked={exportIncludeCost} onCheckedChange={(c) => setExportIncludeCost(c === true)} />
                <Label htmlFor="exportCost" className="text-sm">Include Cost & Margin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="exportIccid" checked={exportIncludeIccid} onCheckedChange={(c) => setExportIncludeIccid(c === true)} />
                <Label htmlFor="exportIccid" className="text-sm">Include ICCID</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
              <Button onClick={exportOrders}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual USIMSA Order Dialog */}
        <Dialog open={manualOrderDialogOpen} onOpenChange={setManualOrderDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create USIMSA Order</DialogTitle>
              <DialogDescription>Manually provision an eSIM via USIMSA.</DialogDescription>
            </DialogHeader>
            {!createdOrderResult ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Option ID (API)</Label>
                  <Input placeholder="e.g., TH_1Days_1GB_Data" value={optionId} onChange={(e) => setOptionId(e.target.value)} className="font-mono" />
                </div>
                {previewPackage && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground text-xs">Package</span><p className="font-medium">{previewPackage.name}</p></div>
                      <div><span className="text-muted-foreground text-xs">Country</span><p className="font-medium">{previewPackage.country_name}</p></div>
                      <div><span className="text-muted-foreground text-xs">Data</span><p className="font-medium">{previewPackage.data_amount}</p></div>
                      <div><span className="text-muted-foreground text-xs">Price</span><p className="font-medium">{previewPackage.price} {previewPackage.currency}</p></div>
                    </CardContent>
                  </Card>
                )}
                {optionId && !previewPackage && (
                  <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Not Found</AlertTitle><AlertDescription>No package with ID "{optionId}"</AlertDescription></Alert>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">User (Optional)</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger><SelectValue placeholder="No user (internal)" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">No user (internal)</SelectItem>
                      {users.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email (Optional)</Label>
                  <Input type="email" placeholder="customer@example.com" value={orderEmail} onChange={(e) => setOrderEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Environment</Label>
                  <Select value={orderEnvironment} onValueChange={(v: any) => setOrderEnvironment(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setManualOrderDialogOpen(false)} disabled={manualOrderLoading}>Cancel</Button>
                  <Button onClick={handleCreateManualOrder} disabled={!previewPackage || manualOrderLoading}>
                    {manualOrderLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <><Activity className="mr-2 h-4 w-4" />Create & Process</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Order Created</AlertTitle>
                  <AlertDescription className="text-green-700">eSIM provisioned successfully</AlertDescription>
                </Alert>
                <p className="font-mono text-sm">Order ID: {createdOrderResult.order?.order_id}</p>
                {createdOrderResult.order?.iccid && <p className="font-mono text-xs">ICCID: {createdOrderResult.order.iccid}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetManualOrderForm}>Create Another</Button>
                  <Button onClick={() => setManualOrderDialogOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* TUGE Order Dialog */}
        <TugeOrderDialog open={tugeOrderDialogOpen} onOpenChange={setTugeOrderDialogOpen} onSuccess={fetchOrders} />
      </div>
    </TooltipProvider>
  );
}
