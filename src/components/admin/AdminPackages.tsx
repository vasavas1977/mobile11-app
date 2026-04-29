import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Star, Upload, Download, AlertTriangle, Eye, EyeOff, RefreshCw, Copy, Package, Filter, X, Pause, Archive, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TugeProductSync } from './packages/TugeProductSync';
import { CatalogKPIStrip } from './catalog/CatalogKPIStrip';
import { CatalogSuppliersTab } from './catalog/CatalogSuppliersTab';
import { CatalogPriceRulesTab } from './catalog/CatalogPriceRulesTab';
import { CatalogVisibilityTab } from './catalog/CatalogVisibilityTab';
import { CatalogCompetitorTab } from './catalog/CatalogCompetitorTab';
import { CatalogPackageDrawer } from './catalog/CatalogPackageDrawer';
import { AdminEmptyState } from './ui/AdminEmptyState';
import { AdminPageHeader } from './ui/AdminPageHeader';

interface ESimPackage {
  id: string;
  name: string;
  short_name?: string;
  country_name: string;
  country_code: string;
  data_amount: string;
  validity_days: number;
  price: number;
  normal_price: number;
  min_sell_price: number;
  cost_price: number;
  markup_percentage: number;
  markup_fixed: number;
  currency: string;
  description?: string;
  package_id: string;
  is_active: boolean;
  is_featured: boolean;
  featured_order: number | null;
  purchase_count: number;
  created_at: string;
  updated_at: string;
  qos_speed?: string;
  is_cancelable?: boolean;
  sim_type?: string;
  validity_period?: string;
  carrier?: string;
  network_type?: string;
  service_type?: string;
  apn?: string;
  availability?: string;
  support_voice?: boolean;
  support_sms?: boolean;
  support_data?: boolean;
  activation_note?: string;
  category?: string;
  access_type?: string;
  pre_installation?: boolean;
  top_up?: boolean;
  kyc?: boolean;
  hot_spot?: boolean;
  initialize_policy?: string;
  speed_after_limit?: string;
  package_type?: string;
  provider_id?: string;
  provider_code?: string;
  provider_name?: string;
}

export function AdminPackages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'packages');
  const [packages, setPackages] = useState<ESimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ESimPackage | null>(null);
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [tugeSyncOpen, setTugeSyncOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ESimPackage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '', country_name: '', country_code: '', data_amount: '',
    validity_days: 30, price: 0, cost_price: 0, markup_percentage: 0,
    markup_fixed: 0, currency: 'USD', description: '', package_id: '',
    is_active: true, is_featured: false, featured_order: null as number | null,
    provider_id: null as string | null
  });

  const [providers, setProviders] = useState<{id: string; provider_name: string}[]>([]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const fetchProviders = async () => {
    const { data } = await supabase.from('esim_providers').select('id, provider_name').eq('is_active', true).order('provider_name');
    if (data) setProviders(data);
  };

  useEffect(() => { fetchPackages(); fetchProviders(); }, []);

  const fetchPackages = async () => {
    try {
      const PAGE_SIZE = 1000;
      let from = 0;
      let all: ESimPackage[] = [];
      while (true) {
        const { data, error } = await supabase
          .from('esim_packages')
          .select('*, esim_providers(id, provider_code, provider_name)')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        const batch = (data || []).map((item: any) => ({
          ...item,
          provider_id: item.esim_providers?.id,
          provider_code: item.esim_providers?.provider_code,
          provider_name: item.esim_providers?.provider_name,
        }));
        all = all.concat(batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      setPackages(all);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({ title: "Error", description: "Failed to fetch packages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(formData.package_id)) {
      toast({ title: "Invalid Package ID", description: "Must be provider optionId, not UUID", variant: "destructive" });
      return;
    }
    const calculatedPrice = formData.cost_price + (formData.cost_price * formData.markup_percentage / 100) + formData.markup_fixed;
    const packageData = { ...formData, price: calculatedPrice };
    try {
      if (editingPackage) {
        const { error } = await supabase.from('esim_packages').update(packageData).eq('id', editingPackage.id);
        if (error) throw error;
        toast({ title: "Package updated" });
      } else {
        const { error } = await supabase.from('esim_packages').insert([packageData]);
        if (error) throw error;
        toast({ title: "Package created" });
      }
      fetchPackages();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save package", variant: "destructive" });
    }
  };

  const handleEdit = (pkg: ESimPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name, country_name: pkg.country_name, country_code: pkg.country_code,
      data_amount: pkg.data_amount, validity_days: pkg.validity_days, price: pkg.price,
      cost_price: pkg.cost_price || 0, markup_percentage: pkg.markup_percentage || 0,
      markup_fixed: pkg.markup_fixed || 0, currency: pkg.currency,
      description: pkg.description || '', package_id: pkg.package_id,
      is_active: pkg.is_active, is_featured: pkg.is_featured || false,
      featured_order: pkg.featured_order, provider_id: pkg.provider_id || null
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    try {
      const { error } = await supabase.from('esim_packages').delete().eq('id', id);
      if (error) throw error;
      fetchPackages();
      toast({ title: "Package deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleClone = async (pkg: ESimPackage) => {
    try {
      const cloneData = {
        name: `${pkg.name} (Copy)`,
        country_name: pkg.country_name, country_code: pkg.country_code,
        data_amount: pkg.data_amount, validity_days: pkg.validity_days,
        price: pkg.price, cost_price: pkg.cost_price || 0,
        markup_percentage: pkg.markup_percentage || 0, markup_fixed: pkg.markup_fixed || 0,
        currency: pkg.currency, description: pkg.description || '',
        package_id: `${pkg.package_id}_COPY_${Date.now()}`,
        is_active: false, is_featured: false,
        provider_id: pkg.provider_id || null,
      };
      const { error } = await supabase.from('esim_packages').insert([cloneData]);
      if (error) throw error;
      fetchPackages();
      toast({ title: "Package cloned", description: "Created as inactive draft" });
    } catch {
      toast({ title: "Error", description: "Failed to clone", variant: "destructive" });
    }
  };

  const handleToggleActive = async (pkg: ESimPackage) => {
    try {
      const { error } = await supabase.from('esim_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
      if (error) throw error;
      fetchPackages();
      toast({ title: pkg.is_active ? "Package hidden" : "Package is now live" });
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: '', country_name: '', country_code: '', data_amount: '',
      validity_days: 30, price: 0, cost_price: 0, markup_percentage: 0,
      markup_fixed: 0, currency: 'USD', description: '', package_id: '',
      is_active: true, is_featured: false, featured_order: null, provider_id: null
    });
  };

  const handleExcelExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const exportData = filteredPackages.map(pkg => ({
        'Option ID': pkg.package_id, 'Name': pkg.name, 'Country': pkg.country_name,
        'Days': pkg.validity_days, 'Data': pkg.data_amount, 'Type': pkg.package_type || '',
        'Provider': pkg.provider_name || '', 'Cost (USD)': pkg.cost_price || 0,
        'Retail': pkg.price, 'Margin%': pkg.cost_price > 0 ? (((pkg.price - pkg.cost_price) / pkg.cost_price) * 100).toFixed(0) : '',
        'Active': pkg.is_active ? 'Yes' : 'No', 'Featured': pkg.is_featured ? 'Yes' : 'No',
        'Carrier': pkg.carrier || '', 'Network': pkg.network_type || '',
        'QoS': pkg.qos_speed || '', 'Sales': pkg.purchase_count || 0,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Catalog');
      XLSX.writeFile(wb, `catalog-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: "Exported", description: `${exportData.length} packages` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  // Filters
  const uniqueCountries = useMemo(() => Array.from(new Set(packages.map(p => p.country_name))).sort(), [packages]);
  const uniqueProviders = useMemo(() => Array.from(new Set(packages.map(p => p.provider_name).filter(Boolean))).sort(), [packages]);
  const uniqueTypes = useMemo(() => Array.from(new Set(packages.map(p => p.package_type).filter(Boolean))).sort(), [packages]);

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const search = searchTerm.toLowerCase();
      if (search && !(
        pkg.name.toLowerCase().includes(search) ||
        pkg.country_name.toLowerCase().includes(search) ||
        pkg.package_id.toLowerCase().includes(search) ||
        (pkg.carrier || '').toLowerCase().includes(search)
      )) return false;
      if (statusFilter === 'active' && !pkg.is_active) return false;
      if (statusFilter === 'inactive' && pkg.is_active) return false;
      if (countryFilter !== 'all' && pkg.country_name !== countryFilter) return false;
      if (providerFilter !== 'all' && pkg.provider_name !== providerFilter) return false;
      if (typeFilter !== 'all' && pkg.package_type !== typeFilter) return false;
      return true;
    });
  }, [packages, searchTerm, statusFilter, countryFilter, providerFilter, typeFilter]);

  const totalPages = Math.ceil(filteredPackages.length / pageSize);
  const paginatedPackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, countryFilter, providerFilter, typeFilter]);

  const activeFilterCount = [statusFilter !== 'all', countryFilter !== 'all', providerFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <AdminPageHeader title="Catalog & Sourcing" description="Package management, pricing, suppliers, and competitive intelligence">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={fetchPackages}>
            <RefreshCw className="h-3 w-3" />Refresh
          </Button>
        </AdminPageHeader>

        {/* KPI Strip */}
        <CatalogKPIStrip packages={packages} />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-10">
            <TabsTrigger value="packages" className="text-xs gap-1.5">
              <Package className="h-3.5 w-3.5" />Packages
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="text-xs">Suppliers</TabsTrigger>
            <TabsTrigger value="price-rules" className="text-xs">Price Rules</TabsTrigger>
            <TabsTrigger value="visibility" className="text-xs">Visibility</TabsTrigger>
            <TabsTrigger value="competitor" className="text-xs">Competitor</TabsTrigger>
          </TabsList>

          {/* ===== PACKAGES TAB ===== */}
          <TabsContent value="packages" className="space-y-4 mt-4">
            {/* Actions bar */}
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={async (event) => {
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

                  for (const { pattern, category, displayName } of targetSheetPatterns) {
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
                  fetchPackages();
                } catch (error: any) {
                  toast({ title: "Import Failed", description: error?.message, variant: "destructive" });
                } finally {
                  setImporting(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }} className="hidden" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-9 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />Add Package
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { resetForm(); setIsDialogOpen(true); }}>Create Manually</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={importing}>
                    <Upload className="h-3.5 w-3.5 mr-2" />Import Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTugeSyncOpen(true)}>
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />Sync TUGE
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExcelExport}>
                <Download className="h-3.5 w-3.5" />Export
              </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] p-3 flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                <Input placeholder="Search name, destination, option ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]" />
              </div>

              <div className="h-5 w-px bg-[#F3F0EB] hidden sm:block" />

              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[110px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Live</SelectItem>
                  <SelectItem value="inactive">Hidden</SelectItem>
                </SelectContent>
              </Select>

              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {uniqueProviders.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Destination" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Destinations</SelectItem>
                  {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs border-[#E5E7EB] bg-[#FAFAF8]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(t => <SelectItem key={t} value={t!}>{t}</SelectItem>)}
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#6B7280] hover:text-[#1A1A1A]" onClick={() => { setStatusFilter('all'); setCountryFilter('all'); setProviderFilter('all'); setTypeFilter('all'); setSearchTerm(''); }}>
                  <X className="h-3 w-3 mr-1" />Clear
                </Button>
              )}

              <span className="text-[11px] text-[#9CA3AF] ml-auto tabular-nums">
                {filteredPackages.length === packages.length ? `${packages.length.toLocaleString()} packages` : `${filteredPackages.length.toLocaleString()} of ${packages.length.toLocaleString()}`}
              </span>
            </div>

            {/* Packages Table */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-[#F3F0EB]">
                      <TableHead className="w-[60px] h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status</TableHead>
                      <TableHead className="min-w-[180px] h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Package</TableHead>
                      <TableHead className="hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Supplier</TableHead>
                      <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Type</TableHead>
                      <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Data</TableHead>
                      <TableHead className="hidden sm:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Days</TableHead>
                      <TableHead className="text-right h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Cost</TableHead>
                      <TableHead className="text-right h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Retail</TableHead>
                      <TableHead className="text-right hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Margin</TableHead>
                      <TableHead className="hidden lg:table-cell text-center h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Sales</TableHead>
                      <TableHead className="w-[50px] h-9"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPackages.map((pkg, idx) => {
                      const margin = pkg.cost_price > 0 ? ((pkg.price - pkg.cost_price) / pkg.cost_price) * 100 : 0;
                      return (
                        <TableRow key={pkg.id} className={`cursor-pointer border-b border-[#F3F0EB]/60 hover:bg-[#FAF7F2]/50 ${idx % 2 === 1 ? 'bg-[#FAFAF8]' : ''}`} onClick={() => { setSelectedPackage(pkg); setDrawerOpen(true); }}>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              {pkg.is_active ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-semibold px-1.5 py-0 h-5 hover:bg-emerald-50">Live</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] text-[9px] font-semibold px-1.5 py-0 h-5">Off</Badge>
                              )}
                              {pkg.is_featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#1A1A1A] truncate max-w-[200px]">{pkg.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-medium text-[#6B7280] bg-[#F3F0EB] rounded px-1.5 py-0.5">{pkg.country_name}</span>
                                <span className="text-[10px] font-mono text-[#9CA3AF] truncate max-w-[120px]">{pkg.package_id}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-2">
                            <Badge variant="outline" className={`text-[10px] font-medium ${pkg.provider_code === 'TUGE' ? 'bg-purple-500/10 text-purple-700 border-purple-200' : 'bg-blue-500/10 text-blue-700 border-blue-200'}`}>
                              {pkg.provider_name || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell py-2">
                            <span className="text-xs text-[#6B7280]">{pkg.package_type || '—'}</span>
                          </TableCell>
                          <TableCell className="text-[13px] font-medium text-[#1A1A1A] py-2">{pkg.data_amount}</TableCell>
                          <TableCell className="hidden sm:table-cell text-[13px] text-[#6B7280] py-2">{pkg.validity_days}d</TableCell>
                          <TableCell className="text-right font-mono text-[13px] text-[#6B7280] py-2">${(pkg.cost_price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-[13px] font-semibold text-[#1A1A1A] py-2">${pkg.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right hidden md:table-cell py-2">
                            {pkg.cost_price > 0 ? (
                              <span className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded ${margin >= 200 ? 'bg-emerald-50 text-emerald-700' : margin >= 100 ? 'bg-amber-50 text-amber-700' : margin > 0 ? 'bg-orange-50 text-orange-700' : 'text-[#9CA3AF]'}`}>
                                {margin.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-[#D1D5DB]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center py-2">
                            <span className="text-xs font-mono font-medium text-[#6B7280]">{pkg.purchase_count || 0}</span>
                          </TableCell>
                          <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#F3F0EB]">
                                  <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => { setSelectedPackage(pkg); setDrawerOpen(true); }}>
                                  <Eye className="h-3.5 w-3.5 mr-2" />View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(pkg)}>
                                  <Edit className="h-3.5 w-3.5 mr-2" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleClone(pkg)}>
                                  <Copy className="h-3.5 w-3.5 mr-2" />Clone
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleActive(pkg)}>
                                  {pkg.is_active ? <><EyeOff className="h-3.5 w-3.5 mr-2" />Hide</> : <><Eye className="h-3.5 w-3.5 mr-2" />Go Live</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(pkg.id)} className="text-destructive">
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredPackages.length === 0 && packages.length > 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] flex items-center justify-center mb-3">
                    <Search className="h-4 w-4 text-[#9CA3AF]" />
                  </div>
                  <p className="text-sm font-medium text-[#6B7280]">No packages match your filters</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Try adjusting your search or filter criteria</p>
                </div>
              )}
              {packages.length === 0 && (
                <AdminEmptyState
                  icon={<Package className="h-5 w-5 text-muted-foreground" />}
                  title="No packages yet"
                  description="Create your first eSIM package or import from a supplier spreadsheet to get started."
                  actionLabel="Create First Package"
                  onAction={() => { resetForm(); setIsDialogOpen(true); }}
                />
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F0EB]">
                  <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                    <span className="tabular-nums">Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredPackages.length)} of {filteredPackages.length.toLocaleString()}</span>
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="h-7 rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-2 py-0.5 text-[11px] text-[#6B7280]">
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-3 border-[#E5E7EB] rounded-lg" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                    <span className="flex items-center px-2.5 text-[11px] font-medium text-[#6B7280] tabular-nums">{currentPage} / {totalPages}</span>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-3 border-[#E5E7EB] rounded-lg" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== SUPPLIERS TAB ===== */}
          <TabsContent value="suppliers" className="mt-4">
            <CatalogSuppliersTab />
          </TabsContent>

          {/* ===== PRICE RULES TAB ===== */}
          <TabsContent value="price-rules" className="mt-4">
            <CatalogPriceRulesTab packages={packages} />
          </TabsContent>

          {/* ===== VISIBILITY TAB ===== */}
          <TabsContent value="visibility" className="mt-4">
            <CatalogVisibilityTab packages={packages} onRefresh={fetchPackages} />
          </TabsContent>

          {/* ===== COMPETITOR TAB ===== */}
          <TabsContent value="competitor" className="mt-4">
            <CatalogCompetitorTab />
          </TabsContent>
        </Tabs>

        {/* Package Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white text-[#1A1A1A]">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Create New Package'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Package Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="package_id">Option ID (API)</Label>
                  <Input id="package_id" value={formData.package_id} onChange={(e) => setFormData({...formData, package_id: e.target.value})} required className="font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Country</Label>
                  <Input value={formData.country_name} onChange={(e) => setFormData({...formData, country_name: e.target.value})} required />
                </div>
                <div>
                  <Label>Country Code</Label>
                  <Input value={formData.country_code} onChange={(e) => setFormData({...formData, country_code: e.target.value})} placeholder="US, TH" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Data Amount</Label>
                  <Input value={formData.data_amount} onChange={(e) => setFormData({...formData, data_amount: e.target.value})} placeholder="1GB, Unlimited" required />
                </div>
                <div>
                  <Label>Validity (Days)</Label>
                  <Input type="number" value={formData.validity_days} onChange={(e) => setFormData({...formData, validity_days: parseInt(e.target.value)})} required />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4 border border-[#F3F0EB] rounded-lg p-4 bg-[#FAFAF8]">
                <h3 className="font-semibold text-sm text-[#1A1A1A]">Pricing & Markup</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Cost Price ($)</Label>
                    <Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <Label>Markup %</Label>
                    <Input type="number" step="0.01" value={formData.markup_percentage} onChange={(e) => setFormData({...formData, markup_percentage: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <Label>Fixed Markup ($)</Label>
                    <Input type="number" step="0.01" value={formData.markup_fixed} onChange={(e) => setFormData({...formData, markup_fixed: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="bg-white rounded p-3 border border-[#F3F0EB]">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[#6B7280]">Final Price:</span>
                    <span className="text-lg font-bold text-[#1A1A1A]">${(formData.cost_price + (formData.cost_price * formData.markup_percentage / 100) + formData.markup_fixed).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border border-[#F3F0EB] rounded-lg bg-[#FAFAF8]">
                  <div>
                    <Label className="font-semibold text-sm">Visible</Label>
                    <p className="text-[10px] text-[#9CA3AF]">Show on storefront</p>
                  </div>
                  <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({...formData, is_active: c})} />
                </div>
                <div className="flex items-center justify-between p-3 border border-[#F3F0EB] rounded-lg bg-[#FAFAF8]">
                  <div>
                    <Label className="font-semibold text-sm">Featured</Label>
                    <p className="text-[10px] text-[#9CA3AF]">Popular section</p>
                  </div>
                  <Switch checked={formData.is_featured} onCheckedChange={(c) => setFormData({...formData, is_featured: c})} />
                </div>
              </div>
              <div>
                <Label>Provider</Label>
                <Select value={formData.provider_id || ''} onValueChange={(v) => setFormData({...formData, provider_id: v || null})}>
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.provider_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingPackage ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* TUGE Sync Dialog */}
        <TugeProductSync open={tugeSyncOpen} onOpenChange={setTugeSyncOpen} onImportComplete={fetchPackages} />

        {/* Package Detail Drawer */}
        <CatalogPackageDrawer
          pkg={selectedPackage}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onEdit={handleEdit}
          onClone={handleClone}
          onToggleActive={handleToggleActive}
        />
      </div>
    </TooltipProvider>
  );
}
