import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Package, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { getCountryCode, getCountryName } from '@/lib/countryCodeMapping';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface TugeCacheProduct {
  id: string;
  product_code: string;
  product_name: string;
  product_type: string;
  countries: string[] | null;
  net_price: number;
  usage_period: number;
  validity_period: number;
  data_total: number;
  data_unit: string;
  data_limited: boolean;
  high_speed: string | null;
  limit_speed: string | null;
  card_type: string | null;
  has_topup: boolean;
  topup_count: number;
  last_synced_at: string;
  raw_data: {
    operatorDesc?: string;
    apnDesc?: string;
  } | null;
}

type SortField = 'country' | 'type' | 'price' | null;
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 50;

export function TugeCatalogView() {
  const [products, setProducts] = useState<TugeCacheProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [coverageFilter, setCoverageFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [existingPackageIds, setExistingPackageIds] = useState<Set<string>>(new Set());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  // Debounce search term for server-side filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get type filter value for queries
  const typeFilterValue = typeFilter === 'daypass' ? 'DAILY_PACK' : typeFilter === 'datapack' ? 'DATA_PACK' : null;

  // Helper to transform raw data to typed format
  const transformProduct = (item: any): TugeCacheProduct => ({
    ...item,
    countries: Array.isArray(item.countries) ? item.countries as string[] : null,
    raw_data: item.raw_data as { operatorDesc?: string; apnDesc?: string } | null
  });

  // Fetch last synced timestamp
  const fetchLastSyncedAt = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('tuge_product_cache')
        .select('last_synced_at')
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data?.last_synced_at) {
        setLastSyncedAt(data.last_synced_at);
      }
    } catch (error) {
      console.error('Error fetching last synced at:', error);
    }
  }, []);

  // Fetch products from tuge_product_cache with server-side filtering
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const searchLower = debouncedSearchTerm?.toLowerCase().trim() || '';
      const resolvedCountryCode = searchLower ? getCountryCode(searchLower) : 'XX';
      const isCountrySearch = resolvedCountryCode !== 'XX';
      const resolvedJson = isCountrySearch ? JSON.stringify([resolvedCountryCode]) : '';
      const offset = (currentPage - 1) * PAGE_SIZE;

      console.log('[TugeCatalog] Fetching with filters:', {
        search: debouncedSearchTerm,
        typeFilter,
        coverageFilter,
        resolvedCountryCode: isCountrySearch ? resolvedCountryCode : null,
        resolvedJson,
        currentPage,
        offset
      });

      // CASE A: Country search (e.g., "Thailand" -> "TH")
      // Use server-side JSONB equality/containment for Direct/Regional filtering
      if (isCountrySearch) {
        if (coverageFilter === 'direct') {
          // Direct: countries == ["TH"] exactly
          let countQuery = supabase
            .from('tuge_product_cache')
            .select('*', { count: 'exact', head: true })
            .eq('countries', resolvedJson);
          if (typeFilterValue) countQuery = countQuery.eq('product_type', typeFilterValue);
          
          let dataQuery = supabase
            .from('tuge_product_cache')
            .select('*')
            .eq('countries', resolvedJson);
          if (typeFilterValue) dataQuery = dataQuery.eq('product_type', typeFilterValue);

          const [{ count }, { data, error }] = await Promise.all([
            countQuery,
            dataQuery.order('product_name', { ascending: true }).range(offset, offset + PAGE_SIZE - 1)
          ]);

          console.log('[TugeCatalog] Direct country search result:', { count, dataLength: data?.length, error: error?.message });
          if (error) throw error;

          setTotalCount(count || 0);
          setProducts((data || []).map(transformProduct));
        } else if (coverageFilter === 'regional') {
          // Regional: countries contains TH but != ["TH"]
          let countQuery = supabase
            .from('tuge_product_cache')
            .select('*', { count: 'exact', head: true })
            .filter('countries', 'cs', resolvedJson)
            .neq('countries', resolvedJson);
          if (typeFilterValue) countQuery = countQuery.eq('product_type', typeFilterValue);

          let dataQuery = supabase
            .from('tuge_product_cache')
            .select('*')
            .filter('countries', 'cs', resolvedJson)
            .neq('countries', resolvedJson);
          if (typeFilterValue) dataQuery = dataQuery.eq('product_type', typeFilterValue);

          const [{ count }, { data, error }] = await Promise.all([
            countQuery,
            dataQuery.order('product_name', { ascending: true }).range(offset, offset + PAGE_SIZE - 1)
          ]);

          console.log('[TugeCatalog] Regional country search result:', { count, dataLength: data?.length, error: error?.message });
          if (error) throw error;

          setTotalCount(count || 0);
          setProducts((data || []).map(transformProduct));
        } else {
          // All Coverage: Show direct packages FIRST, then regional
          // Step 1: Get counts for both segments
          let directCountQuery = supabase
            .from('tuge_product_cache')
            .select('*', { count: 'exact', head: true })
            .eq('countries', resolvedJson);
          if (typeFilterValue) directCountQuery = directCountQuery.eq('product_type', typeFilterValue);

          let regionalCountQuery = supabase
            .from('tuge_product_cache')
            .select('*', { count: 'exact', head: true })
            .filter('countries', 'cs', resolvedJson)
            .neq('countries', resolvedJson);
          if (typeFilterValue) regionalCountQuery = regionalCountQuery.eq('product_type', typeFilterValue);

          const [{ count: directCount }, { count: regionalCount }] = await Promise.all([
            directCountQuery,
            regionalCountQuery
          ]);

          const totalDirectCount = directCount || 0;
          const totalRegionalCount = regionalCount || 0;
          const combinedTotal = totalDirectCount + totalRegionalCount;

          console.log('[TugeCatalog] All coverage country search counts:', { totalDirectCount, totalRegionalCount, combinedTotal });

          setTotalCount(combinedTotal);

          // Step 2: Fetch data with direct-first logic
          let directItems: TugeCacheProduct[] = [];
          let regionalItems: TugeCacheProduct[] = [];

          if (offset < totalDirectCount) {
            // We need some direct items
            let directQuery = supabase
              .from('tuge_product_cache')
              .select('*')
              .eq('countries', resolvedJson);
            if (typeFilterValue) directQuery = directQuery.eq('product_type', typeFilterValue);

            const { data: directData, error: directError } = await directQuery
              .order('product_name', { ascending: true })
              .range(offset, Math.min(offset + PAGE_SIZE - 1, totalDirectCount - 1));

            if (directError) throw directError;
            directItems = (directData || []).map(transformProduct);

            // If direct items don't fill the page, fetch regional items
            const remaining = PAGE_SIZE - directItems.length;
            if (remaining > 0 && totalRegionalCount > 0) {
              let regionalQuery = supabase
                .from('tuge_product_cache')
                .select('*')
                .filter('countries', 'cs', resolvedJson)
                .neq('countries', resolvedJson);
              if (typeFilterValue) regionalQuery = regionalQuery.eq('product_type', typeFilterValue);

              const { data: regionalData, error: regionalError } = await regionalQuery
                .order('product_name', { ascending: true })
                .range(0, remaining - 1);

              if (regionalError) throw regionalError;
              regionalItems = (regionalData || []).map(transformProduct);
            }
          } else {
            // Offset is past all direct items, fetch only regional
            const regionalOffset = offset - totalDirectCount;
            let regionalQuery = supabase
              .from('tuge_product_cache')
              .select('*')
              .filter('countries', 'cs', resolvedJson)
              .neq('countries', resolvedJson);
            if (typeFilterValue) regionalQuery = regionalQuery.eq('product_type', typeFilterValue);

            const { data: regionalData, error: regionalError } = await regionalQuery
              .order('product_name', { ascending: true })
              .range(regionalOffset, regionalOffset + PAGE_SIZE - 1);

            if (regionalError) throw regionalError;
            regionalItems = (regionalData || []).map(transformProduct);
          }

          console.log('[TugeCatalog] All coverage combined result:', { directItems: directItems.length, regionalItems: regionalItems.length });
          setProducts([...directItems, ...regionalItems]);
        }
      } 
      // CASE B: Non-country search (text search or empty search)
      else {
        // Build base queries
        let countQuery = supabase
          .from('tuge_product_cache')
          .select('*', { count: 'exact', head: true });

        let dataQuery = supabase
          .from('tuge_product_cache')
          .select('*');

        // Apply text search filter
        if (searchLower) {
          const searchFilter = `product_name.ilike.%${searchLower}%,product_code.ilike.%${searchLower}%,raw_data->>operatorDesc.ilike.%${searchLower}%`;
          countQuery = countQuery.or(searchFilter);
          dataQuery = dataQuery.or(searchFilter);
        }

        // Apply type filter
        if (typeFilterValue) {
          countQuery = countQuery.eq('product_type', typeFilterValue);
          dataQuery = dataQuery.eq('product_type', typeFilterValue);
        }

        if (coverageFilter === 'all') {
          // No coverage filter - use standard pagination
          const [{ count }, { data, error }] = await Promise.all([
            countQuery,
            dataQuery.order('product_name', { ascending: true }).range(offset, offset + PAGE_SIZE - 1)
          ]);

          console.log('[TugeCatalog] Standard fetch result:', { count, dataLength: data?.length, error: error?.message });
          if (error) throw error;

          setTotalCount(count || 0);
          setProducts((data || []).map(transformProduct));
        } else {
          // Coverage filter with text/empty search - need to iterate through chunks
          // to get accurate count and correct page data
          const CHUNK_SIZE = 1000;
          let allFilteredProducts: TugeCacheProduct[] = [];
          let from = 0;
          let hasMore = true;

          console.log('[TugeCatalog] Chunked fetch for coverage filter started');

          while (hasMore) {
            const { data, error } = await dataQuery
              .order('product_name', { ascending: true })
              .range(from, from + CHUNK_SIZE - 1);

            if (error) throw error;

            const chunk = (data || []).map(transformProduct);
            
            // Filter this chunk by coverage
            const filtered = chunk.filter(product => {
              const countryCount = product.countries?.length || 0;
              if (coverageFilter === 'direct') return countryCount === 1;
              if (coverageFilter === 'regional') return countryCount > 1;
              return true;
            });

            allFilteredProducts = [...allFilteredProducts, ...filtered];
            hasMore = chunk.length === CHUNK_SIZE;
            from += CHUNK_SIZE;
          }

          console.log('[TugeCatalog] Chunked fetch complete:', { totalFiltered: allFilteredProducts.length });

          setTotalCount(allFilteredProducts.length);
          const paginatedData = allFilteredProducts.slice(offset, offset + PAGE_SIZE);
          setProducts(paginatedData);
        }
      }
    } catch (error) {
      console.error('Error fetching TUGE products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch TUGE catalog",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, typeFilter, typeFilterValue, coverageFilter, toast]);

  // Fetch existing package IDs to show "synced" badge
  const fetchExistingPackageIds = async () => {
    try {
      const { data, error } = await supabase
        .from('esim_packages')
        .select('package_id');

      if (error) throw error;
      setExistingPackageIds(new Set(data?.map(p => p.package_id) || []));
    } catch (error) {
      console.error('Error fetching existing packages:', error);
    }
  };

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch existing packages and last synced time once on mount
  useEffect(() => {
    fetchExistingPackageIds();
    fetchLastSyncedAt();
  }, [fetchLastSyncedAt]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, typeFilter, coverageFilter]);

  // Refresh from API
  const handleRefreshFromAPI = async () => {
    setSyncing(true);
    try {
      const response = await supabase.functions.invoke('sync-tuge-products', {
        body: { forceRefresh: true }
      });

      if (response.error) throw response.error;

      toast({
        title: "Sync Complete",
        description: `Synced ${response.data?.totalProducts || 0} products from TUGE API`
      });

      // Refresh the view
      setCurrentPage(1);
      fetchProducts();
    } catch (error: any) {
      console.error('Error syncing TUGE products:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync from TUGE API",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4 ml-1" />;
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Sort products (coverage filtering is now done in fetchProducts for proper pagination)
  const filteredProducts = (() => {
    if (!sortField) return products;
    
    return [...products].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'country':
          const countryA = a.countries?.[0] || '';
          const countryB = b.countries?.[0] || '';
          comparison = countryA.localeCompare(countryB);
          break;
        case 'type':
          comparison = a.product_type.localeCompare(b.product_type);
          break;
        case 'price':
          comparison = a.net_price - b.net_price;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  })();

  // Selection handlers
  const handleSelectionChange = (productCode: string, selected: boolean) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(productCode);
      } else {
        next.delete(productCode);
      }
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProducts(new Set(filteredProducts.map(p => p.product_code)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  // Import selected products to esim_packages
  const handleImportSelected = async () => {
    if (selectedProducts.size === 0) return;

    setImporting(true);
    try {
      // Fetch TUGE provider ID first
      const { data: provider, error: providerError } = await supabase
        .from('esim_providers')
        .select('id')
        .eq('provider_code', 'tuge')
        .single();

      if (providerError || !provider) {
        toast({
          title: "Error",
          description: "TUGE provider not found in database. Please add it first.",
          variant: "destructive"
        });
        setImporting(false);
        return;
      }

      // Get full product data for selected products
      const selectedProductData = products.filter(p => selectedProducts.has(p.product_code));
      
      // Country code to name mapping
      const countryNameMap: Record<string, string> = {
        JP: 'Japan', KR: 'South Korea', TH: 'Thailand', SG: 'Singapore',
        MY: 'Malaysia', VN: 'Vietnam', ID: 'Indonesia', PH: 'Philippines',
        TW: 'Taiwan', HK: 'Hong Kong', CN: 'China', US: 'United States',
        GB: 'United Kingdom', DE: 'Germany', FR: 'France', IT: 'Italy',
        ES: 'Spain', AU: 'Australia', NZ: 'New Zealand', CA: 'Canada',
        IN: 'India', RU: 'Russia', BR: 'Brazil', MX: 'Mexico',
      };

      // Card type + country to carrier mapping
      const getCarrier = (cardType: string, countryCode: string): string | null => {
        if (cardType === 'ep1') {
          if (countryCode === 'NZ') return 'Vodafone/Spark';
          if (countryCode === 'AU') return 'Optus/Vodafone';
        }
        if (cardType === 'ac1' && countryCode === 'AU') return 'Optus';
        if (cardType === 'C4' && countryCode === 'JP') return 'DOCOMO';
        return null;
      };

      // Parse data amount from high_speed when data_total is null
      const parseDataAmount = (product: any): string => {
        if (product.data_total != null && product.data_unit) {
          return `${product.data_total}${product.data_unit}`;
        }
        if (product.high_speed) {
          if (product.high_speed === 'Unlimited') return 'Unlimited';
          // Normalize "500M" to "500MB"
          let speed = product.high_speed;
          if (/^\d+M$/i.test(speed)) speed = speed + 'B';
          if (product.product_type === 'DAILY_PACK') return `${speed}/day`;
          return speed;
        }
        return 'Unlimited';
      };

      // Transform to esim_packages format
      const packagesToInsert = selectedProductData.map(product => {
        // Determine package_type based on high_speed content for accuracy
        let packageType = 'max_speed';
        if (product.product_type === 'DAILY_PACK') {
          packageType = (product.high_speed === 'Unlimited') ? 'limitless' : 'day_pass';
        } else {
          // DATA_PACK or other
          packageType = !product.data_limited ? 'limitless' : 'max_speed';
        }

        // Set speed fields per package type
        let qosSpeed: string | null = null;
        let speedAfterLimit: string | null = null;
        if (packageType === 'day_pass') {
          qosSpeed = product.high_speed || null;
          speedAfterLimit = product.limit_speed || null;
        } else if (packageType === 'limitless') {
          qosSpeed = 'Unlimited';
          speedAfterLimit = null;
        } else {
          qosSpeed = 'Max Speed';
          speedAfterLimit = null;
        }

        const countryCode = product.countries?.[0] || 'XX';
        
        return {
          package_id: product.product_code,
          name: product.product_name,
          country_code: countryCode,
          country_name: countryNameMap[countryCode] || countryCode,
          data_amount: parseDataAmount(product),
          validity_days: product.usage_period,
          validity_period: `${product.usage_period} days`,
          price: product.net_price * 4.0,
          cost_price: product.net_price,
          normal_price: 0,
          currency: 'USD',
          is_active: false,
          package_type: packageType,
          provider_id: provider.id,
          included_countries: product.countries,
          carrier: getCarrier(product.card_type, countryCode),
          qos_speed: qosSpeed,
          speed_after_limit: speedAfterLimit,
          sim_type: product.card_type,
          top_up: product.has_topup,
        };
      });

      // Upsert to avoid duplicates
      const { error } = await supabase
        .from('esim_packages')
        .upsert(packagesToInsert, { onConflict: 'package_id' });

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `Imported ${packagesToInsert.length} packages to production (inactive)`
      });

      // Refresh existing package IDs
      fetchExistingPackageIds();
      setSelectedProducts(new Set());
    } catch (error: any) {
      console.error('Error importing products:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import selected products",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const allFilteredSelected = filteredProducts.length > 0 && 
    filteredProducts.every(p => selectedProducts.has(p.product_code));

  const formatData = (dataTotal: number, dataUnit: string, dataLimited: boolean) => {
    if (!dataLimited) return 'Unlimited';
    return `${dataTotal}${dataUnit}`;
  };

  const formatCountries = (countries: string[]) => {
    if (!countries || countries.length === 0) return '-';
    // Convert codes to full country names
    const names = countries.map(code => getCountryName(code));
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const formatLastSynced = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Header with stats and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{totalCount.toLocaleString()} products in catalog</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Last synced: {formatLastSynced(lastSyncedAt)}
          </div>
        </div>
        <Button 
          onClick={handleRefreshFromAPI} 
          disabled={syncing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Refresh from API'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Plan Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="daypass">Day Pass</SelectItem>
            <SelectItem value="datapack">Data Pack</SelectItem>
          </SelectContent>
        </Select>
        <Select value={coverageFilter} onValueChange={setCoverageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Coverage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Coverage</SelectItem>
            <SelectItem value="direct">Direct Country</SelectItem>
            <SelectItem value="regional">Regional Plan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
          <span>Showing {filteredProducts.length} of {totalCount} (page {currentPage} of {totalPages || 1})</span>
          <span>•</span>
          <span>{selectedProducts.size} selected</span>
          <span>•</span>
          <span>{existingPackageIds.size} already in production</span>
        </div>
        {selectedProducts.size > 0 && (
          <Button 
            onClick={handleImportSelected}
            disabled={importing}
          >
            <Download className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : `Import Selected (${selectedProducts.size})`}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                  </TableHead>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort('type')}
                    >
                      Type
                      {getSortIcon('type')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort('country')}
                    >
                      Countries
                      {getSortIcon('country')}
                    </Button>
                  </TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-mr-3 h-8"
                      onClick={() => handleSort('price')}
                    >
                      Cost (USD)
                      {getSortIcon('price')}
                    </Button>
                  </TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>APN</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12">
                      <div className="space-y-2 text-muted-foreground">
                        <p>{debouncedSearchTerm || typeFilter !== 'all' || coverageFilter !== 'all' 
                          ? 'No products match your filters' 
                          : 'No products found in catalog'}</p>
                        {totalCount === 0 && (
                          <p className="text-sm">
                            If catalog shows 0 products, click <strong>"Refresh from API"</strong> to sync data from TUGE.
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const isExisting = existingPackageIds.has(product.product_code);
                    return (
                      <TableRow 
                        key={product.id}
                        className={isExisting ? 'opacity-60' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.product_code)}
                            onCheckedChange={(checked) => handleSelectionChange(product.product_code, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{product.product_code}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={product.product_name}>
                          {product.product_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.product_type === 'DAILY_PACK' ? 'default' : 'secondary'}>
                            {product.product_type === 'DAILY_PACK' ? 'Day Pass' : 'Data Pack'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={product.countries?.join(', ')}>
                          {formatCountries(product.countries)}
                        </TableCell>
                        <TableCell>{formatData(product.data_total, product.data_unit, product.data_limited)}</TableCell>
                        <TableCell>{product.usage_period} days</TableCell>
                        <TableCell className="text-right font-medium">${product.net_price?.toFixed(2)}</TableCell>
                        <TableCell className="max-w-[120px] truncate text-xs" title={product.raw_data?.operatorDesc || '-'}>
                          {product.raw_data?.operatorDesc || '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {product.raw_data?.apnDesc || '-'}
                        </TableCell>
                        <TableCell>
                          {product.card_type && <Badge variant="outline">{product.card_type}</Badge>}
                        </TableCell>
                        <TableCell>
                          {isExisting ? (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
                              Synced
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                              New
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={page}>
                  <PaginationLink 
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => setCurrentPage(totalPages)}
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
