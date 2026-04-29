import { useState, useEffect, useMemo } from 'react';
import { Download, ArrowUpDown, TrendingDown, Package, Percent, DollarSign, Search, Filter, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractPrimaryCountryCode } from '@/lib/countryCodeMapper';

interface CurrentPackage {
  id: string;
  name: string;
  country_name: string;
  country_code: string;
  data_amount: string;
  validity_days: number;
  price: number;
  cost_price: number;
  provider_name?: string;
  package_id: string;
  is_active: boolean;
}

interface TugeProduct {
  product_code: string;
  product_name: string;
  countries: string[];
  data_total: number;
  usage_period: number;
  net_price: number;
  product_type: string;
}

interface ComparisonResult {
  currentPackage: CurrentPackage;
  tugeProduct: TugeProduct;
  savings: number;
  savingsPercent: number;
  potentialMargin: number;
}

type SortField = 'savings' | 'savingsPercent' | 'country' | 'data';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 20;

const CHUNK_SIZE = 1000;

export function VendorCostComparison() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ stage: '', fetched: 0, total: 0 });
  const [sessionReady, setSessionReady] = useState(false);
  const [currentPackages, setCurrentPackages] = useState<CurrentPackage[]>([]);
  const [tugeProducts, setTugeProducts] = useState<TugeProduct[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [minSavingsFilter, setMinSavingsFilter] = useState<string>('0');
  const [showAllComparisons, setShowAllComparisons] = useState(false);
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('savings');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toast } = useToast();

  // Chunked fetch helper to bypass 1000-row Supabase limit
  const fetchAllRows = async (
    tableName: 'esim_packages' | 'tuge_product_cache',
    selectQuery: string,
    filters?: (query: any) => any,
    onProgress?: (fetched: number) => void
  ): Promise<any[]> => {
    const allRows: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from(tableName)
        .select(selectQuery)
        .range(from, from + CHUNK_SIZE - 1);
      
      if (filters) {
        query = filters(query);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      allRows.push(...(data || []));
      hasMore = (data?.length || 0) === CHUNK_SIZE;
      from += CHUNK_SIZE;
      
      if (onProgress) {
        onProgress(allRows.length);
      }
    }
    
    return allRows;
  };

  // Wait for session before fetching data
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      }
    };
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSessionReady(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when session is ready
  useEffect(() => {
    if (sessionReady) {
      fetchData();
    }
  }, [sessionReady]);

  // Parse data amount to GB
  const parseDataToGB = (dataAmount: string): number => {
    if (!dataAmount) return 0;
    const normalized = dataAmount.toLowerCase().trim();
    
    // Handle unlimited
    if (normalized.includes('unlimited')) return -1;
    
    // Extract number and unit
    const match = normalized.match(/([\d.]+)\s*(gb|mb|tb)?/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'gb').toLowerCase();
    
    switch (unit) {
      case 'tb': return value * 1024;
      case 'gb': return value;
      case 'mb': return value / 1024;
      default: return value;
    }
  };

  // Normalize country code from name using enhanced mapper
  const normalizeCountryCode = (countryName: string, countryCode: string): string => {
    // If we already have a valid 2-letter code, use it
    if (countryCode && countryCode.length === 2) {
      return countryCode.toUpperCase();
    }
    
    // Try to extract from country name (handles multi-country names)
    const resolved = extractPrimaryCountryCode(countryName);
    return resolved ? resolved.toUpperCase() : '';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ALL production packages using chunked fetching
      setLoadingProgress({ stage: 'Loading production packages...', fetched: 0, total: 0 });
      const packagesData = await fetchAllRows(
        'esim_packages',
        'id, name, country_name, country_code, data_amount, validity_days, price, cost_price, package_id, is_active, esim_providers(provider_name)',
        (q) => q.gt('cost_price', 0).eq('is_active', true).order('country_name'),
        (fetched) => setLoadingProgress({ stage: 'Loading production packages...', fetched, total: 0 })
      );
      console.log(`Fetched ${packagesData.length} production packages`);

      // Fetch ALL TUGE products using chunked fetching
      setLoadingProgress({ stage: 'Loading TUGE products...', fetched: 0, total: 0 });
      const tugeData = await fetchAllRows(
        'tuge_product_cache',
        'product_code, product_name, countries, data_total, usage_period, net_price, product_type',
        (q) => q.order('product_name'),
        (fetched) => setLoadingProgress({ stage: 'Loading TUGE products...', fetched, total: 0 })
      );
      console.log(`Fetched ${tugeData.length} TUGE products`);

      // Transform packages data
      const packages: CurrentPackage[] = (packagesData || []).map((p: any) => ({
        ...p,
        provider_name: p.esim_providers?.provider_name || 'Unknown'
      }));

      // Filter TUGE products to single-country only
      const singleCountryTuge: TugeProduct[] = (tugeData || [])
        .filter((t: any) => {
          const countries = t.countries as string[];
          return countries && countries.length === 1;
        })
        .map((t: any) => ({
          ...t,
          countries: t.countries as string[]
        }));
      
      console.log(`Filtered to ${singleCountryTuge.length} single-country TUGE products`);

      setCurrentPackages(packages);
      setTugeProducts(singleCountryTuge);

      // Build comparison map
      setLoadingProgress({ stage: 'Building comparisons...', fetched: 0, total: 0 });
      buildComparisons(packages, singleCountryTuge);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch package data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const buildComparisons = (packages: CurrentPackage[], tugeProducts: TugeProduct[]) => {
    // Create a lookup map for TUGE products: key = "COUNTRY_CODE|DATA_GB|DAYS"
    const tugeLookup = new Map<string, TugeProduct[]>();
    
    for (const tuge of tugeProducts) {
      const countryCode = tuge.countries[0]?.toUpperCase() || '';
      const dataGB = tuge.data_total;
      const days = tuge.usage_period;
      
      if (!countryCode) continue;
      
      const key = `${countryCode}|${dataGB}|${days}`;
      if (!tugeLookup.has(key)) {
        tugeLookup.set(key, []);
      }
      tugeLookup.get(key)!.push(tuge);
    }

    const results: ComparisonResult[] = [];

    for (const pkg of packages) {
      const countryCode = normalizeCountryCode(pkg.country_name, pkg.country_code);
      const dataGB = parseDataToGB(pkg.data_amount);
      const days = pkg.validity_days;

      // Skip unlimited packages or packages without resolved country
      if (dataGB < 0 || !countryCode) continue;

      const key = `${countryCode}|${dataGB}|${days}`;
      const matchingTuge = tugeLookup.get(key);

      if (matchingTuge && matchingTuge.length > 0) {
        // Find the cheapest TUGE option
        const cheapest = matchingTuge.reduce((min, t) => 
          t.net_price < min.net_price ? t : min
        );

        const savings = pkg.cost_price - cheapest.net_price;
        const savingsPercent = pkg.cost_price > 0 ? (savings / pkg.cost_price) * 100 : 0;
        const potentialMargin = pkg.price - cheapest.net_price;

        // Include ALL matches - filtering by savings happens in the UI
        results.push({
          currentPackage: pkg,
          tugeProduct: cheapest,
          savings,
          savingsPercent,
          potentialMargin
        });
      }
    }

    setComparisons(results);
  };

  // Get unique countries from comparisons
  const uniqueCountries = useMemo(() => {
    const countries = new Set(comparisons.map(c => c.currentPackage.country_name));
    return Array.from(countries).sort();
  }, [comparisons]);

  // Filter and sort comparisons
  const filteredComparisons = useMemo(() => {
    let filtered = [...comparisons];

    // Apply "show only savings" filter (default behavior)
    if (!showAllComparisons) {
      filtered = filtered.filter(c => c.savings > 0);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.currentPackage.country_name.toLowerCase().includes(term) ||
        c.currentPackage.name.toLowerCase().includes(term) ||
        c.tugeProduct.product_name.toLowerCase().includes(term)
      );
    }

    // Apply country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(c => c.currentPackage.country_name === countryFilter);
    }

    // Apply min savings filter (only when showing savings)
    if (!showAllComparisons) {
      const minSavings = parseFloat(minSavingsFilter) || 0;
      if (minSavings > 0) {
        filtered = filtered.filter(c => c.savings >= minSavings);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      switch (sortField) {
        case 'savings':
          compareValue = a.savings - b.savings;
          break;
        case 'savingsPercent':
          compareValue = a.savingsPercent - b.savingsPercent;
          break;
        case 'country':
          compareValue = a.currentPackage.country_name.localeCompare(b.currentPackage.country_name);
          break;
        case 'data':
          compareValue = parseDataToGB(a.currentPackage.data_amount) - parseDataToGB(b.currentPackage.data_amount);
          break;
      }
      return sortDirection === 'desc' ? -compareValue : compareValue;
    });

    return filtered;
  }, [comparisons, searchTerm, countryFilter, minSavingsFilter, sortField, sortDirection, showAllComparisons]);

  // Pagination
  const totalPages = Math.ceil(filteredComparisons.length / PAGE_SIZE);
  const paginatedComparisons = filteredComparisons.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, countryFilter, minSavingsFilter, showAllComparisons]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    // For savings stats, only count positive savings
    const savingsComparisons = comparisons.filter(c => c.savings > 0);
    const totalSavings = savingsComparisons.reduce((sum, c) => sum + c.savings, 0);
    const avgSavingsPercent = savingsComparisons.length > 0
      ? savingsComparisons.reduce((sum, c) => sum + c.savingsPercent, 0) / savingsComparisons.length
      : 0;
    const avgSavingsPerPackage = savingsComparisons.length > 0
      ? totalSavings / savingsComparisons.length
      : 0;

    return {
      totalMatches: comparisons.length,
      packagesWithSavings: savingsComparisons.length,
      totalSavings,
      avgSavingsPercent,
      avgSavingsPerPackage
    };
  }, [comparisons]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Country',
      'Data',
      'Days',
      'Current Provider',
      'Current Cost',
      'TUGE Product',
      'TUGE Cost',
      'Savings ($)',
      'Savings (%)',
      'Sell Price',
      'New Margin'
    ];

    const rows = filteredComparisons.map(c => [
      c.currentPackage.country_name,
      c.currentPackage.data_amount,
      c.currentPackage.validity_days,
      c.currentPackage.provider_name || 'Unknown',
      c.currentPackage.cost_price.toFixed(2),
      c.tugeProduct.product_name,
      c.tugeProduct.net_price.toFixed(2),
      c.savings.toFixed(2),
      c.savingsPercent.toFixed(1),
      c.currentPackage.price.toFixed(2),
      c.potentialMargin.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendor-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    toast({
      title: 'Export Complete',
      description: `Exported ${filteredComparisons.length} comparison records`
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">{loadingProgress.stage || 'Initializing...'}</p>
                {loadingProgress.fetched > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {loadingProgress.fetched.toLocaleString()} records loaded...
                  </p>
                )}
              </div>
              <Progress value={undefined} className="w-64 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Matches</p>
                <p className="text-2xl font-bold">{summary.totalMatches}</p>
                <p className="text-xs text-muted-foreground">{summary.packagesWithSavings} with savings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Potential Savings</p>
                <p className="text-2xl font-bold">${summary.totalSavings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Percent className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Savings %</p>
                <p className="text-2xl font-bold">{summary.avgSavingsPercent.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Per Package</p>
                <p className="text-2xl font-bold">${summary.avgSavingsPerPackage.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by country or package name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={minSavingsFilter} onValueChange={setMinSavingsFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Min Savings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Savings</SelectItem>
                <SelectItem value="1">≥ $1</SelectItem>
                <SelectItem value="5">≥ $5</SelectItem>
                <SelectItem value="10">≥ $10</SelectItem>
                <SelectItem value="20">≥ $20</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="show-all"
                checked={showAllComparisons}
                onCheckedChange={setShowAllComparisons}
              />
              <Label htmlFor="show-all" className="text-sm cursor-pointer">
                {showAllComparisons ? (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Show all
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <EyeOff className="h-3.5 w-3.5" />
                    Savings only
                  </span>
                )}
              </Label>
            </div>

            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Comparison</CardTitle>
          <CardDescription>
            Current packages with cheaper TUGE alternatives (matched by country, data, and validity)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('country')}
                  >
                    <div className="flex items-center gap-1">
                      Country
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('data')}
                  >
                    <div className="flex items-center gap-1">
                      Data
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Current Provider</TableHead>
                  <TableHead className="text-right">Current Cost</TableHead>
                  <TableHead>TUGE Product</TableHead>
                  <TableHead className="text-right">TUGE Cost</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('savings')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Savings
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('savingsPercent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      %
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedComparisons.map((comparison, idx) => (
                  <TableRow key={`${comparison.currentPackage.id}-${idx}`}>
                    <TableCell className="font-medium">
                      {comparison.currentPackage.country_name}
                    </TableCell>
                    <TableCell>{comparison.currentPackage.data_amount}</TableCell>
                    <TableCell>{comparison.currentPackage.validity_days}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {comparison.currentPackage.provider_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${comparison.currentPackage.cost_price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block" title={comparison.tugeProduct.product_name}>
                        {comparison.tugeProduct.product_name.length > 30
                          ? comparison.tugeProduct.product_name.substring(0, 30) + '...'
                          : comparison.tugeProduct.product_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      ${comparison.tugeProduct.net_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={comparison.savings >= 0 ? "default" : "secondary"}
                        className={
                          comparison.savings >= 20 
                            ? 'bg-green-600 hover:bg-green-600' 
                            : comparison.savings >= 10 
                              ? 'bg-green-500 hover:bg-green-500' 
                              : comparison.savings > 0
                                ? 'bg-green-400 hover:bg-green-400'
                                : 'bg-muted text-muted-foreground'
                        }
                      >
                        {comparison.savings >= 0 ? '' : '-'}${Math.abs(comparison.savings).toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono ${comparison.savingsPercent >= 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {comparison.savingsPercent >= 0 ? '' : '-'}{Math.abs(comparison.savingsPercent).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Empty state */}
          {filteredComparisons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {showAllComparisons 
                ? 'No packages found matching TUGE products with current filters.'
                : 'No packages found with cheaper TUGE alternatives matching current filters.'}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredComparisons.length)} of {filteredComparisons.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
