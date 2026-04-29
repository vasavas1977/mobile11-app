import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Download, Server, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TugeProductSync } from './packages/TugeProductSync';
import { ProvisioningSuppliersTab } from './provisioning/ProvisioningSuppliersTab';
import { ProvisioningKPIStrip } from './provisioning/ProvisioningKPIStrip';
import { SyncHealthTab } from './provisioning/SyncHealthTab';
import { FulfillmentLogsTab } from './provisioning/FulfillmentLogsTab';
import { FallbackRulesTab } from './provisioning/FallbackRulesTab';
import { RoutingTab } from './provisioning/RoutingTab';
import { AdminPageHeader } from './ui/AdminPageHeader';

interface ProviderData {
  id: string;
  provider_code: string;
  provider_name: string;
  is_active: boolean;
  api_base_url: string | null;
  priority: number;
  notes: string | null;
  updated_at: string;
}

interface KPIData {
  totalRoutes: number;
  suppliersConnected: number;
  successRate: number;
  failedOrders: number;
  totalOrders30d: number;
  lastTugeSync: string | null;
  providerPackageCounts: Record<string, number>;
}

export function AdminProvisioning() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'routing');
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [lastTugeSync, setLastTugeSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tugeSyncOpen, setTugeSyncOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  // KPI data from real sources
  const [packageCount, setPackageCount] = useState(0);
  const [providerPackageCounts, setProviderPackageCounts] = useState<Record<string, number>>({});
  const [orderStats, setOrderStats] = useState({ completed: 0, failed: 0, total: 0 });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchProviders(), fetchKPIData(), fetchLastSync()]);
    setLoading(false);
  };

  const fetchProviders = async () => {
    try {
      const { data } = await supabase.from('esim_providers').select('*').order('priority');
      setProviders((data || []) as ProviderData[]);
    } catch {}
  };

  const fetchKPIData = async () => {
    try {
      // Package counts by provider
      const { data: pkgs } = await supabase.from('esim_packages').select('provider_id, esim_providers(provider_name)');
      const counts: Record<string, number> = {};
      (pkgs || []).forEach((p: any) => {
        const name = p.esim_providers?.provider_name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
      setProviderPackageCounts(counts);
      setPackageCount((pkgs || []).length);

      // Order stats
      const { data: orders } = await supabase.from('orders').select('status').not('provider_id', 'is', null);
      if (orders) {
        const completed = orders.filter((o: any) => o.status === 'completed' || o.status === 'active').length;
        const failed = orders.filter((o: any) => o.status === 'failed' || o.status === 'cancelled').length;
        setOrderStats({ completed, failed, total: orders.length });
      }
    } catch {}
  };

  const fetchLastSync = async () => {
    try {
      const { data } = await supabase.from('tuge_product_cache').select('last_synced_at').order('last_synced_at', { ascending: false }).limit(1);
      if (data?.[0]) setLastTugeSync(data[0].last_synced_at);
    } catch {}
  };

  const kpiData = useMemo<KPIData>(() => {
    const suppliersConnected = providers.filter(p => p.is_active).length;
    const successRate = orderStats.total > 0 ? (orderStats.completed / orderStats.total) * 100 : 0;
    return {
      totalRoutes: packageCount,
      suppliersConnected,
      successRate,
      failedOrders: orderStats.failed,
      totalOrders30d: orderStats.total,
      lastTugeSync,
      providerPackageCounts,
    };
  }, [providers, orderStats, packageCount, lastTugeSync, providerPackageCounts]);

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const { parseRegionalPackagesFromExcel, matchPackageToRegionalData } = await import('@/lib/excelRegionalParser');
      const regionalData = await parseRegionalPackagesFromExcel(file, XLSX);
      const workbook = XLSX.read(data);
      const targetSheetPatterns = [{ pattern: 'unlimited', category: 'regional', displayName: 'Unlimited' }];
      const availableSheets = workbook.SheetNames;
      const normalizeSheetName = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      let totalSuccess = 0, totalError = 0;
      const getValueByHeaders = (row: any, candidates: string[]) => {
        const keys = Object.keys(row);
        const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        const entries = keys.map((k) => [norm(k), k] as const);
        for (const c of candidates) {
          const nk = norm(c);
          const exact = entries.find(([n]) => n === nk);
          if (exact) return row[exact[1]];
          const suffix = entries.find(([n]) => n.endsWith(nk));
          if (suffix) return row[suffix[1]];
          const includes = entries.find(([n]) => n.includes(nk));
          if (includes) return row[includes[1]];
        }
        return undefined;
      };
      const parseOX = (v: any) => { const s = String(v ?? '').trim().toUpperCase(); return new Set(['O','YES','Y','TRUE','1','V','✓','✔','√','T']).has(s); };
      const parseAvailable = (v: any) => { const s = String(v ?? '').trim().toLowerCase(); if (!s) return false; return ['available','yes','y','o','true','1'].includes(s) || s.includes('available'); };

      for (const { pattern, category } of targetSheetPatterns) {
        const matchingSheet = availableSheets.find(s => normalizeSheetName(s).includes(pattern));
        if (!matchingSheet) continue;
        const worksheet = workbook.Sheets[matchingSheet];
        let jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
        let keys = Object.keys(jsonData[0] || {});
        if (!keys.some(k => /option id|api call/i.test(k))) {
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        }
        for (const row of jsonData) {
          try {
            const optionId = String(getValueByHeaders(row, ['Option ID (For API)','Option ID','OptionID','API Call']) ?? '').trim();
            const plan = String(getValueByHeaders(row, ['Plan','Country']) ?? '').trim();
            const daysStr = String(getValueByHeaders(row, ['Day','Days']) ?? '').trim();
            const dataAmount = String(getValueByHeaders(row, ['Data']) ?? '').trim();
            if (!optionId || !plan || !dataAmount) { totalError++; continue; }
            const normalPrice = parseFloat(String(getValueByHeaders(row, ['Normal Price','NormalPrice']) ?? '0').replace(/[^\d.]/g, '')) || 0;
            const minSellPrice = parseFloat(String(getValueByHeaders(row, ['Min.Sell Price','Min Sell Price']) ?? '0').replace(/[^\d.]/g, '')) || 0;
            const costPrice = parseFloat(String(getValueByHeaders(row, ['B2B Price','B2B','(USD)']) ?? '0').replace(/[^\d.]/g, '')) || 0;
            const qosSpeed = String(getValueByHeaders(row, ['QOS','QoS','qos']) || '').trim();
            const isUnlimited = /unlimited/i.test(dataAmount);
            const isNonStop = isUnlimited && /^[15]\s*mbps$/i.test(qosSpeed);
            const regionalMatch = matchPackageToRegionalData(plan, regionalData);
            const packageData = {
              package_id: optionId, name: `${plan} ${daysStr} / ${dataAmount}`.trim(),
              country_name: plan, country_code: '', data_amount: dataAmount,
              validity_days: parseInt(daysStr.replace(/\D/g, '')) || 0,
              normal_price: normalPrice, min_sell_price: minSellPrice, cost_price: costPrice,
              included_countries: regionalMatch ? JSON.parse(JSON.stringify(regionalMatch)) : null,
              markup_percentage: costPrice > 0 ? ((normalPrice - costPrice) / costPrice * 100) : 0,
              markup_fixed: 0, price: normalPrice, currency: 'USD',
              description: String(getValueByHeaders(row, ['Option Name','Description']) ?? '').trim(),
              sim_type: String(getValueByHeaders(row, ['SIM Type']) ?? '').trim(),
              carrier: String(getValueByHeaders(row, ['Carrier']) ?? '').trim(),
              network_type: String(getValueByHeaders(row, ['Network Type','Network']) ?? '').trim(),
              qos_speed: qosSpeed,
              pre_installation: parseAvailable(getValueByHeaders(row, ['PreInstallation','Pre installation'])),
              top_up: parseOX(getValueByHeaders(row, ['Top-up','Topup'])),
              kyc: parseOX(getValueByHeaders(row, ['KYC'])),
              hot_spot: parseOX(getValueByHeaders(row, ['Hot-Spot','Hotspot'])),
              is_active: true, category,
              package_type: isNonStop ? 'limitless' : null,
              short_name: isNonStop ? (/5\s*mbps/i.test(qosSpeed) ? '5 Mbps unlimited' : '1 Mbps unlimited') : null,
            };
            const { error } = await supabase.from('esim_packages').upsert([packageData], { onConflict: 'package_id', ignoreDuplicates: false });
            if (error) totalError++; else totalSuccess++;
          } catch { totalError++; }
        }
      }
      toast({ title: "Import Complete", description: `${totalSuccess} success, ${totalError} errors` });
      fetchAll();
    } catch (error: any) {
      toast({ title: "Import Failed", description: error?.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-7 bg-[#F3F0EB] rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-[#F3F0EB] rounded-xl animate-pulse" />)}
        </div>
        <div className="h-48 bg-[#F3F0EB] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="hidden" />

        <AdminPageHeader title="Provisioning" description="Supplier routing, sync operations, fulfillment health, and activation management">
          <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold h-[22px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />
            {providers.filter(p => p.is_active).length} suppliers
          </Badge>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[10px] border-[#E5E7EB]" onClick={fetchAll}>
            <RefreshCw className="h-3 w-3" />Refresh
          </Button>
        </AdminPageHeader>

        <ProvisioningKPIStrip kpiData={kpiData} providers={providers} />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-9 bg-[#F3F0EB] border border-[#E8E4DE]">
            <TabsTrigger value="routing" className="text-[11px] gap-1 text-[#6B7280] data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Activity className="h-3 w-3" />Routing</TabsTrigger>
            <TabsTrigger value="suppliers" className="text-[11px] gap-1 text-[#6B7280] data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Server className="h-3 w-3" />Suppliers</TabsTrigger>
            <TabsTrigger value="sync-health" className="text-[11px] text-[#6B7280] data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Sync Health</TabsTrigger>
            <TabsTrigger value="fulfillment-logs" className="text-[11px] text-[#6B7280] data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Fulfillment</TabsTrigger>
            <TabsTrigger value="fallback-rules" className="text-[11px] text-[#6B7280] data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Fallback</TabsTrigger>
          </TabsList>

          <TabsContent value="routing" className="mt-3">
            <RoutingTab
              onImportExcel={() => fileInputRef.current?.click()}
              onSyncTuge={() => setTugeSyncOpen(true)}
              importing={importing}
            />
          </TabsContent>

          <TabsContent value="suppliers" className="mt-3">
            <ProvisioningSuppliersTab />
          </TabsContent>

          <TabsContent value="sync-health" className="mt-3">
            <SyncHealthTab />
          </TabsContent>

          <TabsContent value="fulfillment-logs" className="mt-3">
            <FulfillmentLogsTab />
          </TabsContent>

          <TabsContent value="fallback-rules" className="mt-3">
            <FallbackRulesTab />
          </TabsContent>
        </Tabs>

        <TugeProductSync open={tugeSyncOpen} onOpenChange={setTugeSyncOpen} onImportComplete={fetchAll} />
      </div>
    </TooltipProvider>
  );
}
