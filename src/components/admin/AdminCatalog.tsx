import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Star, Upload, Download, Eye, EyeOff, RefreshCw, Copy, Package, X, Archive, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CatalogKPIStrip } from './catalog/CatalogKPIStrip';
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
  carrier?: string;
  network_type?: string;
  package_type?: string;
  provider_id?: string;
  provider_code?: string;
  provider_name?: string;
}

export function AdminCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'packages');
  const [packages, setPackages] = useState<ESimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ESimPackage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedPackage, setSelectedPackage] = useState<ESimPackage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  useEffect(() => { fetchPackages(); fetchProviders(); }, []);

  const fetchProviders = async () => {
    const { data } = await supabase.from('esim_providers').select('id, provider_name').eq('is_active', true).order('provider_name');
    if (data) setProviders(data);
  };

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
    } catch {
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
        name: `${pkg.name} (Copy)`, country_name: pkg.country_name, country_code: pkg.country_code,
        data_amount: pkg.data_amount, validity_days: pkg.validity_days, price: pkg.price,
        cost_price: pkg.cost_price || 0, markup_percentage: pkg.markup_percentage || 0,
        markup_fixed: pkg.markup_fixed || 0, currency: pkg.currency, description: pkg.description || '',
        package_id: `${pkg.package_id}_COPY_${Date.now()}`, is_active: false, is_featured: false,
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

  const handleToggleFeatured = async (pkg: ESimPackage) => {
    try {
      const { error } = await supabase.from('esim_packages').update({ is_featured: !pkg.is_featured }).eq('id', pkg.id);
      if (error) throw error;
      fetchPackages();
      toast({ title: pkg.is_featured ? "Removed from featured" : "Package featured" });
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
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
        'Name': pkg.name, 'Destination': pkg.country_name, 'Data': pkg.data_amount,
        'Days': pkg.validity_days, 'Cost (USD)': pkg.cost_price || 0,
        'Retail': pkg.price, 'Margin%': pkg.cost_price > 0 ? (((pkg.price - pkg.cost_price) / pkg.cost_price) * 100).toFixed(0) : '',
        'Status': pkg.is_active ? 'Live' : 'Hidden', 'Featured': pkg.is_featured ? 'Yes' : 'No',
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

  const uniqueCountries = useMemo(() => Array.from(new Set(packages.map(p => p.country_name))).sort(), [packages]);
  const uniqueTypes = useMemo(() => Array.from(new Set(packages.map(p => p.package_type).filter(Boolean))).sort(), [packages]);

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const search = searchTerm.toLowerCase();
      if (search && !(pkg.name.toLowerCase().includes(search) || pkg.country_name.toLowerCase().includes(search) || pkg.package_id.toLowerCase().includes(search))) return false;
      if (statusFilter === 'active' && !pkg.is_active) return false;
      if (statusFilter === 'inactive' && pkg.is_active) return false;
      if (countryFilter !== 'all' && pkg.country_name !== countryFilter) return false;
      if (typeFilter !== 'all' && pkg.package_type !== typeFilter) return false;
      return true;
    });
  }, [packages, searchTerm, statusFilter, countryFilter, typeFilter]);

  const totalPages = Math.ceil(filteredPackages.length / pageSize);
  const paginatedPackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, countryFilter, typeFilter]);

  const activeFilterCount = [statusFilter !== 'all', countryFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[#F3F0EB] rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-[#F3F0EB] rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-[#F3F0EB] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <AdminPageHeader title="Catalog" description="Product catalog, pricing strategy, visibility, and merchandising">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={handleExcelExport}>
            <Download className="h-3 w-3" />Export Catalog
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-[#E5E7EB]" onClick={fetchPackages}>
            <RefreshCw className="h-3 w-3" />Refresh
          </Button>
        </AdminPageHeader>

        <CatalogKPIStrip packages={packages} />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-10 bg-white border border-[#F3F0EB]">
            <TabsTrigger value="packages" className="text-xs gap-1.5 data-[state=active]:bg-[#FAF7F2]"><Package className="h-3.5 w-3.5" />Products</TabsTrigger>
            <TabsTrigger value="price-rules" className="text-xs data-[state=active]:bg-[#FAF7F2]">Price Rules</TabsTrigger>
            <TabsTrigger value="visibility" className="text-xs data-[state=active]:bg-[#FAF7F2]">Channel Visibility</TabsTrigger>
            <TabsTrigger value="competitor" className="text-xs data-[state=active]:bg-[#FAF7F2]">Competitor Intel</TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-4 mt-4">
            {/* Commercial Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-9 gap-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5" />Create Product
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-[#E5E7EB]" onClick={() => toast({ title: "Coming soon" })}>
                <Star className="h-3.5 w-3.5 text-amber-500" />Manage Featured
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
                <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#6B7280] hover:text-[#1A1A1A]" onClick={() => { setStatusFilter('all'); setCountryFilter('all'); setTypeFilter('all'); setSearchTerm(''); }}>
                  <X className="h-3 w-3 mr-1" />Clear
                </Button>
              )}
              <span className="text-[11px] text-[#9CA3AF] ml-auto tabular-nums">
                {filteredPackages.length === packages.length ? `${packages.length.toLocaleString()} packages` : `${filteredPackages.length.toLocaleString()} of ${packages.length.toLocaleString()}`}
              </span>
            </div>

            {/* Catalog Table — commercial pricing focus */}
            <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-[#F3F0EB] bg-[#FAFAF8]">
                      <TableHead className="w-[70px] h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Status</TableHead>
                      <TableHead className="min-w-[200px] h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Product</TableHead>
                      <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Plan</TableHead>
                      <TableHead className="text-right h-9 text-[10px] font-bold uppercase tracking-wider text-orange-500">Retail</TableHead>
                      <TableHead className="text-right hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-blue-500">Reseller</TableHead>
                      <TableHead className="text-right hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-purple-500">Distributor</TableHead>
                      <TableHead className="text-right hidden md:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Margin</TableHead>
                      <TableHead className="hidden lg:table-cell h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Tags</TableHead>
                      <TableHead className="hidden lg:table-cell text-center h-9 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Sales</TableHead>
                      <TableHead className="w-[50px] h-9"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPackages.map((pkg, idx) => {
                      const margin = pkg.cost_price > 0 ? ((pkg.price - pkg.cost_price) / pkg.cost_price) * 100 : 0;
                      const resellerPrice = pkg.min_sell_price || pkg.price * 0.85;
                      const distributorPrice = pkg.cost_price > 0 ? pkg.cost_price * 1.15 : pkg.price * 0.7;
                      const isBestValue = pkg.cost_price > 0 && margin > 150 && (pkg.purchase_count || 0) > 5;
                      return (
                        <TableRow key={pkg.id} className={`cursor-pointer border-b border-[#F3F0EB]/60 hover:bg-[#FAF7F2]/50 ${idx % 2 === 1 ? 'bg-[#FAFAF8]/50' : ''}`} onClick={() => { setSelectedPackage(pkg); setDrawerOpen(true); }}>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-1">
                              {pkg.is_active ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-semibold px-1.5 py-0 h-5 hover:bg-emerald-50">Live</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] text-[9px] font-semibold px-1.5 py-0 h-5">Draft</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[13px] font-semibold text-[#1A1A1A] truncate max-w-[180px]">{pkg.name}</p>
                                {pkg.is_featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-medium text-[#6B7280] bg-[#F3F0EB] rounded px-1.5 py-0.5">{pkg.country_name}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="text-[12px]">
                              <span className="font-medium text-[#1A1A1A]">{pkg.data_amount}</span>
                              <span className="text-[#9CA3AF] ml-1">/ {pkg.validity_days}d</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2.5">
                            <span className="font-mono text-[13px] font-bold text-orange-600">${pkg.price.toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell py-2.5">
                            <span className="font-mono text-[12px] text-blue-600">${resellerPrice.toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell py-2.5">
                            <span className="font-mono text-[12px] text-purple-600">${distributorPrice.toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell py-2.5">
                            {pkg.cost_price > 0 ? (
                              <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${margin >= 200 ? 'bg-emerald-50 text-emerald-700' : margin >= 100 ? 'bg-amber-50 text-amber-700' : margin > 0 ? 'bg-orange-50 text-orange-700' : 'text-[#9CA3AF]'}`}>
                                {margin.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#D1D5DB]">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell py-2.5">
                            <div className="flex items-center gap-1">
                              {pkg.is_featured && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[8px] font-semibold px-1 py-0 h-4 hover:bg-amber-50">★ Featured</Badge>}
                              {isBestValue && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] font-semibold px-1 py-0 h-4 hover:bg-emerald-50">Best Value</Badge>}
                              {!pkg.is_featured && !isBestValue && <span className="text-[#D1D5DB]">—</span>}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center py-2.5">
                            <span className={`text-xs font-semibold tabular-nums ${(pkg.purchase_count || 0) > 10 ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}>{pkg.purchase_count || 0}</span>
                          </TableCell>
                          <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#F3F0EB]">
                                  <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEdit(pkg)}><Edit className="h-3.5 w-3.5 mr-2" />Edit Pricing</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleFeatured(pkg)}>
                                  <Star className="h-3.5 w-3.5 mr-2" />{pkg.is_featured ? 'Remove Featured' : 'Feature Product'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleClone(pkg)}><Copy className="h-3.5 w-3.5 mr-2" />Clone Product</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleActive(pkg)}>
                                  {pkg.is_active ? <><EyeOff className="h-3.5 w-3.5 mr-2" />Unpublish</> : <><Eye className="h-3.5 w-3.5 mr-2" />Publish</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(pkg.id)}>
                                  <Archive className="h-3.5 w-3.5 mr-2" />Archive Product
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
                  icon={<Package className="h-5 w-5 text-[#9CA3AF]" />}
                  title="No packages yet"
                  description="Create your first eSIM package to start building your catalog."
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

          <TabsContent value="price-rules" className="mt-4">
            <CatalogPriceRulesTab packages={packages} />
          </TabsContent>

          <TabsContent value="visibility" className="mt-4">
            <CatalogVisibilityTab packages={packages} onRefresh={fetchPackages} />
          </TabsContent>

          <TabsContent value="competitor" className="mt-4">
            <CatalogCompetitorTab />
          </TabsContent>
        </Tabs>

        {/* Package Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Create New Package'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="name">Package Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                <div><Label htmlFor="package_id">Option ID (API)</Label><Input id="package_id" value={formData.package_id} onChange={(e) => setFormData({...formData, package_id: e.target.value})} required className="font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Country</Label><Input value={formData.country_name} onChange={(e) => setFormData({...formData, country_name: e.target.value})} required /></div>
                <div><Label>Country Code</Label><Input value={formData.country_code} onChange={(e) => setFormData({...formData, country_code: e.target.value})} placeholder="US, TH" required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Data Amount</Label><Input value={formData.data_amount} onChange={(e) => setFormData({...formData, data_amount: e.target.value})} placeholder="1GB, Unlimited" required /></div>
                <div><Label>Validity (Days)</Label><Input type="number" value={formData.validity_days} onChange={(e) => setFormData({...formData, validity_days: parseInt(e.target.value)})} required /></div>
                <div><Label>Currency</Label><Input value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} /></div>
              </div>
              <div className="space-y-4 border border-[#F3F0EB] rounded-lg p-4 bg-[#FAFAF8]">
                <h3 className="font-semibold text-sm text-[#1A1A1A]">Pricing & Markup</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Cost Price ($)</Label><Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})} /></div>
                  <div><Label>Markup %</Label><Input type="number" step="0.01" value={formData.markup_percentage} onChange={(e) => setFormData({...formData, markup_percentage: parseFloat(e.target.value) || 0})} /></div>
                  <div><Label>Fixed Markup ($)</Label><Input type="number" step="0.01" value={formData.markup_fixed} onChange={(e) => setFormData({...formData, markup_fixed: parseFloat(e.target.value) || 0})} /></div>
                </div>
                <div className="bg-white rounded p-3 border border-[#F3F0EB]">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[#6B7280]">Final Price:</span>
                    <span className="text-lg font-bold text-[#1A1A1A]">${(formData.cost_price + (formData.cost_price * formData.markup_percentage / 100) + formData.markup_fixed).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border border-[#F3F0EB] rounded-lg bg-[#FAFAF8]">
                  <div><Label className="font-semibold text-sm">Visible</Label><p className="text-[10px] text-[#9CA3AF]">Show on storefront</p></div>
                  <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({...formData, is_active: c})} />
                </div>
                <div className="flex items-center justify-between p-3 border border-[#F3F0EB] rounded-lg bg-[#FAFAF8]">
                  <div><Label className="font-semibold text-sm">Featured</Label><p className="text-[10px] text-[#9CA3AF]">Popular section</p></div>
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
