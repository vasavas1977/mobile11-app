import { useState, useEffect, useRef } from 'react';
import {
  Copy, ExternalLink, Calendar, Settings, ChevronDown, Smartphone, Loader2,
  Clock, Hash, RotateCcw, AlertCircle, CheckCircle, XCircle, Link2,
  Activity, Mail, RefreshCw, User, Package, CreditCard, Globe, Zap
} from 'lucide-react';
import { createAppleEsimUrl } from '@/lib/installationHelpers';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LPAQRCode } from '../../esim/LPAQRCode';
import { Order, getProviderType, getChannelSource, getMargin, getPaymentStatus, getProvisioningStatus, isExtensionOrder, InstallationInfo } from './types';
import { OrderJourneyTimeline } from './OrderJourneyTimeline';
import { ManualEsimEntry } from './ManualEsimEntry';

interface OrderDetailDrawerProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function OrderDetailDrawer({ order, open, onOpenChange, onRefresh }: OrderDetailDrawerProps) {
  const { toast } = useToast();
  const [emailSending, setEmailSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isEsimInstalled, setIsEsimInstalled] = useState(false);
  const [checkingInstall, setCheckingInstall] = useState(false);
  const [installationData, setInstallationData] = useState<InstallationInfo | null>(null);
  const installResultRef = useRef<HTMLDivElement>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [usageEdgeData, setUsageEdgeData] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [tugeUsageData, setTugeUsageData] = useState<any>(null);
  const [tugeProfileData, setTugeProfileData] = useState<any>(null);
  const [tugeLoading, setTugeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentData, setPaymentData] = useState<any>(null);
  

  useEffect(() => {
    if (!order?.iccid || order.status !== 'completed') {
      setIsEsimInstalled(false);
      return;
    }
    setCheckingInstall(true);
    supabase.functions.invoke('check-installation-status', { body: { orderId: order.id } })
      .then(({ data, error }) => {
        if (!error && data?.success && data?.installation) {
          setIsEsimInstalled(data.installation.devices?.length > 0);
        } else {
          setIsEsimInstalled(false);
        }
      })
      .catch(() => setIsEsimInstalled(false))
      .finally(() => setCheckingInstall(false));
  }, [order?.id, order?.iccid, order?.status]);

  useEffect(() => {
    setActiveTab('overview');
    setInstallationData(null);
    setUsageData(null);
    setUsageEdgeData(null);
    setTugeUsageData(null);
    setTugeProfileData(null);
    setPaymentData(null);
  }, [order?.id]);

  useEffect(() => {
    if (!order?.id || !open) return;
    supabase
      .from('payments')
      .select('payment_gateway, payment_method, payment_reference, payment_intent_id, status, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setPaymentData(data?.[0] || null);
      });
  }, [order?.id, open]);

  

  if (!order) return null;

  const providerType = getProviderType(order);
  const channelSource = getChannelSource(order);
  const margin = getMargin(order);
  const payStatus = getPaymentStatus(order);
  const provStatus = getProvisioningStatus(order);
  const ext = isExtensionOrder(order);

  const handleSendEmail = async () => {
    try {
      setEmailSending(true);
      await supabase.functions.invoke('send-order-confirmation', { body: { orderId: order.id } });
      toast({ title: 'Email queued', description: 'Confirmation email will be sent shortly.' });
    } catch {
      toast({ title: 'Email failed', variant: 'destructive' });
    } finally {
      setEmailSending(false);
    }
  };

  const handleReprocess = async () => {
    try {
      setReprocessing(true);
      await supabase.functions.invoke('process-free-orders', {
        body: { orderIds: [order.id], environment: order.environment || 'production' }
      });
      toast({ title: 'Reprocessing started' });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Reprocess failed', description: err?.message, variant: 'destructive' });
    } finally {
      setReprocessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Cancel order ${order.order_id}?`)) return;
    try {
      setIsCanceling(true);
      const { data, error } = await supabase.functions.invoke('cancel-order', { body: { orderId: order.id } });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);
      toast({ title: 'Order cancelled' });
      onRefresh();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Cancel failed', description: err?.message, variant: 'destructive' });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleCheckUsage = async () => {
    try {
      setUsageLoading(true);
      const fn = providerType === 'tuge' ? 'check-tuge-usage' : 'check-esim-usage';
      const { data, error } = await supabase.functions.invoke(fn, { body: { orderId: order.id } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || data?.message || 'Failed');
      if (providerType === 'tuge') {
        setTugeUsageData(data.usage);
      } else {
        setUsageEdgeData(data);
        setUsageData(data.usage);
      }
      toast({ title: 'Usage retrieved' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUsageLoading(false);
    }
  };

  const handleCheckProfile = async () => {
    if (providerType !== 'tuge') return;
    try {
      setTugeLoading(true);
      const { data, error } = await supabase.functions.invoke('check-tuge-profile', { body: { orderId: order.id } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error);
      setTugeProfileData(data.profile);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setTugeLoading(false);
    }
  };


  const handleCheckInstallation = async () => {
    if (!order.iccid) return;
    try {
      setCheckingInstall(true);
      const { data, error } = await supabase.functions.invoke('check-installation-status', { body: { orderId: order.id } });
      if (error) throw error;
      if (data?.success) {
        setInstallationData(data.installation);
        const inst = data.installation;
        if (inst.device?.installTime) {
          toast({ title: '✅ eSIM Installed', description: `${inst.device.installDevice || 'Device'} — ${formatDate(inst.device.installTime)}` });
        } else {
          toast({ title: '⏳ Not Installed Yet', description: 'The eSIM has not been installed on any device.' });
        }
        setTimeout(() => installResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      } else {
        toast({ title: 'Cannot check', description: data?.installation?.message || 'Failed', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    } finally {
      setCheckingInstall(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-usimsa-order', { body: { orderId: order.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Order synced', description: `Status: ${data?.status || 'updated'}` });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err?.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
  };

  const handleQuickInstall = () => {
    if (!order.download_link) return;
    const url = createAppleEsimUrl(order.download_link);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyQuickInstallLink = () => {
    if (!order.download_link) return;
    const url = createAppleEsimUrl(order.download_link);
    copyToClipboard(url, 'Apple eSIM install link');
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('en-GB', {
        timeZone: 'Asia/Bangkok', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch {
      return d;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[520px] lg:w-[600px] p-0 overflow-hidden bg-white border-l border-[#F3F0EB]" side="right">
        <div className="h-full flex flex-col bg-white text-[#1A1A1A]">
          <SheetHeader className="border-b border-[#F3F0EB] px-6 py-4 flex-shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold flex items-center gap-2 text-[#1A1A1A]">
                  Order Details
                  {ext && <Badge variant="outline" className="text-blue-600 border-blue-200 text-[10px]"><Link2 className="h-3 w-3 mr-1" />Extension</Badge>}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs mt-1 text-[#9CA3AF]">
                  {order.order_id}
                </SheetDescription>
              </div>
              <Badge variant="outline" className={
                order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                order.status === 'failed' || order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                order.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }>
                {order.status}
              </Badge>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="sticky top-0 bg-white z-10 border-b border-[#F3F0EB] px-6">
                <TabsList className="h-9 w-full justify-start bg-transparent p-0 gap-4">
                  <TabsTrigger value="overview" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">Overview</TabsTrigger>
                  <TabsTrigger value="esim" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">eSIM / QR</TabsTrigger>
                  <TabsTrigger value="journey" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">Journey</TabsTrigger>
                  <TabsTrigger value="diagnostics" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">Diagnostics</TabsTrigger>
                  <TabsTrigger value="raw" className="h-9 px-0 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none text-xs text-[#6B7280] data-[state=active]:text-orange-600 bg-transparent">Raw Data</TabsTrigger>
                </TabsList>
              </div>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem icon={<User className="h-3.5 w-3.5" />} label="Customer" value={`${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || '—'} sub={order.profiles?.email} />
                  <InfoItem icon={<Globe className="h-3.5 w-3.5" />} label="Destination" value={order.esim_packages?.country_name || '—'} sub={order.esim_packages?.data_amount} />
                  <InfoItem icon={<Package className="h-3.5 w-3.5" />} label="Package" value={order.esim_packages?.name || '—'} />
                  <InfoItem icon={<CreditCard className="h-3.5 w-3.5" />} label="Amount" value={order.currency === 'THB' ? `฿${Math.round(order.total_amount).toLocaleString()}` : `$${order.total_amount.toFixed(2)}`} sub={margin != null ? `Margin: $${margin.toFixed(2)}` : undefined} />
                </div>

                <Separator className="bg-[#F3F0EB]" />
                <div>
                  <span className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2 block">Payment Details</span>
                  {paymentData ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <MetaItem label="Gateway" value={paymentData.payment_gateway?.toUpperCase() || '—'} />
                      <MetaItem label="Method" value={paymentData.payment_method || '—'} />
                      {paymentData.payment_reference && <MetaItem label="Transaction ID" value={paymentData.payment_reference} />}
                      {paymentData.payment_intent_id && <MetaItem label="Stripe PI" value={paymentData.payment_intent_id} />}
                      {paymentData.created_at && <MetaItem label="Payment Date" value={formatDate(paymentData.created_at)} />}
                      {paymentData.status && <MetaItem label="Payment Status" value={paymentData.status} />}
                    </div>
                  ) : (
                    <p className="text-xs text-[#9CA3AF]">No payment record found for this order.</p>
                  )}
                </div>

                <Separator className="bg-[#F3F0EB]" />

                <div className="grid grid-cols-3 gap-3">
                  <StatusItem label="Payment" status={payStatus} variant={payStatus === 'paid' ? 'default' : 'secondary'} />
                  <StatusItem label="Provisioning" status={provStatus} variant={provStatus === 'provisioned' ? 'default' : provStatus === 'failed' ? 'destructive' : 'secondary'} />
                  <StatusItem label="Channel" status={channelSource} variant="outline" />
                </div>

                <Separator className="bg-[#F3F0EB]" />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetaItem label="Supplier" value={order.esim_providers?.provider_name || '—'} />
                  <MetaItem label="Tier" value={order.service_tier || 'Priority'} />
                  <MetaItem label="Created" value={formatDate(order.created_at)} />
                  <MetaItem label="Updated" value={formatDate(order.updated_at)} />
                  {order.payment_completed_at && <MetaItem label="Paid At" value={formatDate(order.payment_completed_at)} />}
                  {order.discount_amount != null && order.discount_amount > 0 && (
                    <MetaItem label="Discount" value={`-$${order.discount_amount.toFixed(2)}`} />
                  )}
                </div>

                <Separator className="bg-[#F3F0EB]" />

                <div>
                  <span className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2 block">Quick Actions</span>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs border-[#F3F0EB] text-[#1A1A1A] hover:bg-[#FAF7F2]" onClick={handleSendEmail} disabled={emailSending}>
                      <Mail className="h-3 w-3 mr-1.5" />{emailSending ? 'Sending...' : 'Resend Email'}
                    </Button>
                    {providerType === 'usimsa' && (
                      <Button variant="outline" size="sm" className="h-8 text-xs border-[#F3F0EB] text-[#1A1A1A] hover:bg-[#FAF7F2]" onClick={handleSync} disabled={syncing}>
                        <RefreshCw className={`h-3 w-3 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />Sync
                      </Button>
                    )}
                    {['pending', 'processing', 'needs_attention', 'failed'].includes(order.status) && (
                      <Button variant="outline" size="sm" className="h-8 text-xs border-[#F3F0EB] text-[#1A1A1A] hover:bg-[#FAF7F2]" onClick={handleReprocess} disabled={reprocessing}>
                        <RotateCcw className={`h-3 w-3 mr-1.5 ${reprocessing ? 'animate-spin' : ''}`} />
                        {reprocessing ? 'Retrying...' : 'Retry Provisioning'}
                      </Button>
                    )}
                    {['pending', 'processing', 'needs_attention', 'failed', 'completed'].includes(order.status) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleCancel} disabled={isCanceling || isEsimInstalled || checkingInstall}>
                            <XCircle className="h-3 w-3 mr-1.5" />{isCanceling ? 'Canceling...' : 'Cancel'}
                          </Button>
                        </TooltipTrigger>
                        {isEsimInstalled && <TooltipContent>Cannot cancel: eSIM is installed</TooltipContent>}
                      </Tooltip>
                    )}
                    <Button variant="outline" size="sm" className="h-8 text-xs border-[#F3F0EB] text-[#1A1A1A] hover:bg-[#FAF7F2]" onClick={() => window.open(`/admin/users/${order.user_id}`, '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1.5" />Customer
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ESIM / QR TAB */}
              <TabsContent value="esim" className="px-6 py-4 space-y-4 mt-0">
                {order.status === 'processing' && !order.qr_code && (
                  <ManualEsimEntry orderId={order.id} orderDisplayId={order.order_id} onSuccess={() => { onRefresh(); onOpenChange(false); }} />
                )}
                {order.iccid && <CopyField label="ICCID" value={order.iccid} onCopy={copyToClipboard} />}
                {order.msisdn && <CopyField label="MSISDN" value={order.msisdn} onCopy={copyToClipboard} />}
                {order.provider_order_id && <CopyField label="Provider Order ID" value={order.provider_order_id} onCopy={copyToClipboard} />}
                {order.short_code && <CopyField label="Short Code" value={order.short_code} onCopy={copyToClipboard} />}

                {order.expiry_date && (
                  <div>
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">Expiry</span>
                    <p className="text-sm">{formatDate(order.expiry_date)}</p>
                    {new Date(order.expiry_date) < new Date() && <Badge variant="destructive" className="mt-1 text-[10px]">Expired</Badge>}
                  </div>
                )}

                {order.download_link && (
                  <div>
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">Download Link</span>
                    <div className="flex gap-2 mt-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(order.download_link!, '_blank')}>
                        <ExternalLink className="h-3 w-3 mr-1" /> Open
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyToClipboard(order.download_link!, 'Download link')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {order.download_link && (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <Zap className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-orange-900">Quick Install (iPhone)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                        onClick={handleQuickInstall}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Install on iPhone
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-orange-200 hover:bg-orange-50"
                        onClick={handleCopyQuickInstallLink}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-orange-700/70 mt-1.5">For iOS 17.4+ — tap or share this link with the customer</p>
                  </div>
                )}

                {(order.smdp_address || order.activation_code) && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs">
                        <span className="flex items-center gap-1.5"><Settings className="h-3 w-3" /> Manual Installation</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                      {order.smdp_address && <CopyField label="SM-DP+" value={order.smdp_address} onCopy={copyToClipboard} />}
                      {order.activation_code && <CopyField label="Activation Code" value={order.activation_code} onCopy={copyToClipboard} />}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {order.qr_code && (
                  <div>
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2 block">QR Code</span>
                    {order.qr_code.startsWith('LPA:') ? (
                      <div className="max-w-xs">
                        <LPAQRCode lpaString={order.qr_code} downloadFilename={`${providerType.toUpperCase()}-${order.provider_order_id || order.order_id}`} />
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border inline-block">
                        <img
                          src={order.qr_code.startsWith('http') || order.qr_code.startsWith('data:') ? order.qr_code : `data:image/png;base64,${order.qr_code}`}
                          alt="eSIM QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCheckInstallation} disabled={checkingInstall || !order.iccid}>
                    <Smartphone className={`h-3 w-3 mr-1.5 ${checkingInstall ? 'animate-pulse' : ''}`} />
                    {checkingInstall ? 'Checking...' : 'Check Installation'}
                  </Button>

                  {installationData && (<div ref={installResultRef}>
                    <Card className="mt-3 bg-white border-[#F3F0EB]">
                      <CardContent className="pt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          {installationData.device?.installTime ? (
                            <Badge className="bg-green-500/20 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" /> Installed</Badge>
                          ) : (
                            <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Not Installed</Badge>
                          )}
                        </div>
                        {installationData.device?.installDevice && (
                          <p className="text-xs"><span className="text-[#9CA3AF]">Device:</span> {installationData.device.installDevice}</p>
                        )}
                        {installationData.device?.installTime && (
                          <p className="text-xs"><span className="text-[#9CA3AF]">Installed:</span> {formatDate(installationData.device.installTime)}</p>
                        )}
                        <p className="text-xs"><span className="text-[#9CA3AF]">Install Count:</span> {installationData.installCount}</p>
                      </CardContent>
                    </Card>
                  </div>)}
                </div>
              </TabsContent>

              {/* JOURNEY TAB */}
              <TabsContent value="journey" className="px-6 py-4 mt-0">
                <OrderJourneyTimeline userId={order.user_id} orderCreatedAt={order.created_at} />
              </TabsContent>

              {/* DIAGNOSTICS TAB */}
              <TabsContent value="diagnostics" className="px-6 py-4 space-y-4 mt-0">
                <div className="flex flex-wrap gap-2">
                  {providerType === 'tuge' && order.provider_order_id && (
                    <>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCheckUsage} disabled={usageLoading}>
                        <Activity className={`h-3 w-3 mr-1.5 ${usageLoading ? 'animate-pulse' : ''}`} />Check TUGE Traffic
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCheckProfile} disabled={tugeLoading}>
                        <Smartphone className={`h-3 w-3 mr-1.5 ${tugeLoading ? 'animate-pulse' : ''}`} />Check eSIM Profile
                      </Button>
                    </>
                  )}
                  {providerType === 'usimsa' && (
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCheckUsage} disabled={usageLoading}>
                      <Activity className={`h-3 w-3 mr-1.5 ${usageLoading ? 'animate-pulse' : ''}`} />Check Usage
                    </Button>
                  )}
                </div>

                {tugeUsageData && (
                  <Card className="bg-white border-[#F3F0EB]">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">TUGE Traffic</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex gap-4">
                        <div><span className="text-[10px] text-[#9CA3AF] uppercase">State</span><p className="font-medium">{tugeUsageData.orderState}</p></div>
                        <div><span className="text-[10px] text-[#9CA3AF] uppercase">Days Left</span><p className="font-medium">{tugeUsageData.daysRemaining ?? '—'}</p></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Data Usage</span>
                          <span className="font-mono">{tugeUsageData.dataUsedMB?.toFixed(1)} / {tugeUsageData.dataTotalMB?.toFixed(1)} MB</span>
                        </div>
                        <div className="w-full bg-[#FAF7F2] rounded-full h-2 overflow-hidden">
                          <div className="bg-orange-500 h-full transition-all" style={{ width: tugeUsageData.dataTotalMB > 0 ? `${Math.min(100, (tugeUsageData.dataUsedMB / tugeUsageData.dataTotalMB) * 100)}%` : '0%' }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {tugeProfileData && (
                  <Card className="bg-white border-[#F3F0EB]">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">eSIM Profile</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><span className="text-[#9CA3AF] text-xs">ICCID:</span> <span className="font-mono text-xs">{tugeProfileData.iccid}</span></p>
                      <p><span className="text-[#9CA3AF] text-xs">State:</span> {tugeProfileData.state}</p>
                      {tugeProfileData.imsi && <p><span className="text-[#9CA3AF] text-xs">IMSI:</span> <span className="font-mono text-xs">{tugeProfileData.imsi}</span></p>}
                    </CardContent>
                  </Card>
                )}

                {usageData && (
                  <Card className="bg-white border-[#F3F0EB]">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Usage Data</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {usageData.used !== undefined && <p><span className="text-[#9CA3AF] text-xs">Used:</span> {usageData.used} MB</p>}
                      {usageData.total !== undefined && <p><span className="text-[#9CA3AF] text-xs">Total:</span> {usageData.total} MB</p>}
                      {usageData.status && <p><span className="text-[#9CA3AF] text-xs">Status:</span> {usageData.status}</p>}
                    </CardContent>
                  </Card>
                )}

                {!tugeUsageData && !tugeProfileData && !usageData && (
                  <p className="text-sm text-[#9CA3AF] py-8 text-center">Run diagnostics using the buttons above.</p>
                )}
              </TabsContent>

              {/* RAW DATA TAB */}
              <TabsContent value="raw" className="px-6 py-4 space-y-4 mt-0">
                <div>
                  <span className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2 block">Webhook Data</span>
                  <pre className="p-3 bg-[#FAF7F2] rounded-lg text-[11px] overflow-auto max-h-64 font-mono">
                    {JSON.stringify(order.webhook_data, null, 2) || 'null'}
                  </pre>
                </div>
                {usageEdgeData && (
                  <div>
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2 block">Usage Response</span>
                    <pre className="p-3 bg-[#FAF7F2] rounded-lg text-[11px] overflow-auto max-h-64 font-mono">
                      {JSON.stringify(usageEdgeData, null, 2)}
                    </pre>
                  </div>
                )}
                {tugeProfileData && (
                  <div>
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2 block">Profile Response</span>
                    <pre className="p-3 bg-[#FAF7F2] rounded-lg text-[11px] overflow-auto max-h-64 font-mono">
                      {JSON.stringify(tugeProfileData, null, 2)}
                    </pre>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoItem({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-[#9CA3AF]">{icon}</div>
      <div className="min-w-0">
        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
        <p className="text-sm font-medium truncate text-[#1A1A1A]">{value}</p>
        {sub && <p className="text-[11px] text-[#6B7280] truncate">{sub}</p>}
      </div>
    </div>
  );
}

function StatusItem({ label, status, variant }: { label: string; status: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }) {
  const colorClass =
    variant === 'default' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    variant === 'destructive' ? 'bg-red-50 text-red-700 border-red-200' :
    variant === 'outline' ? 'bg-[#FAF7F2] text-[#6B7280] border-[#F3F0EB]' :
    'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <div>
      <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
      <div className="mt-1"><Badge variant="outline" className={`text-[10px] ${colorClass}`}>{status}</Badge></div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
      <p className="text-xs text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function CopyField({ label, value, onCopy }: { label: string; value: string; onCopy: (text: string, label: string) => void }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{label}</span>
      <div className="flex items-center gap-2 mt-0.5">
        <p className="font-mono text-xs flex-1 break-all text-[#1A1A1A]">{value}</p>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0 text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]" onClick={() => onCopy(value, label)}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
