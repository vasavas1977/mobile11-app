import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Download, AlertCircle, Clock, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TugeProductTable, TugeProduct } from './TugeProductTable';
import { formatDistanceToNow } from 'date-fns';

interface TugeProductSyncProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function TugeProductSync({ open, onOpenChange, onImportComplete }: TugeProductSyncProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [products, setProducts] = useState<TugeProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [existingPackageIds, setExistingPackageIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const { toast } = useToast();

  // Fetch existing package IDs to show which are already synced
  const fetchExistingPackages = async () => {
    const { data } = await supabase
      .from('esim_packages')
      .select('package_id')
      .not('package_id', 'is', null);
    
    const ids = new Set(data?.map(p => p.package_id) || []);
    setExistingPackageIds(ids);
    return ids;
  };

  // Fetch products (from cache by default, or force refresh from API)
  const fetchProducts = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('sync-tuge-products', {
        body: { forceRefresh },
      });

      if (response.error) throw response.error;
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch products');
      }

      setProducts(response.data.products || []);
      setLastSyncedAt(response.data.lastSyncedAt || null);
      setFromCache(response.data.fromCache || false);
      await fetchExistingPackages();
      
      toast({
        title: forceRefresh ? "Products Refreshed" : "Products Loaded",
        description: `${response.data.total} products ${response.data.fromCache ? 'from cache' : 'synced from API'}`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      console.error('Error fetching TUGE products:', err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-fetch when dialog opens
  useEffect(() => {
    if (open && products.length === 0) {
      fetchProducts(false); // Load from cache
    }
  }, [open]);

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
      setSelectedProducts(new Set(products.map(p => p.productCode)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  // Map TUGE product type to our package_type
  const mapProductType = (tugeType: string, dataLimited: boolean): string => {
    // If data is unlimited, it's a limitless package
    if (!dataLimited) {
      return 'limitless';
    }
    switch (tugeType) {
      case 'DAILY_PACK':
        return 'day_pass';
      case 'DATA_PACK':
        return 'max_speed';
      default:
        return 'max_speed'; // Default to max_speed (valid value)
    }
  };

  // Get country name from code
  const getCountryName = (codes: string[]): string => {
    if (codes.length === 0) return 'Global';
    if (codes.length === 1) {
      const countryNames: Record<string, string> = {
        JP: 'Japan', KR: 'South Korea', TH: 'Thailand', SG: 'Singapore',
        MY: 'Malaysia', VN: 'Vietnam', ID: 'Indonesia', PH: 'Philippines',
        TW: 'Taiwan', HK: 'Hong Kong', CN: 'China', US: 'United States',
        GB: 'United Kingdom', DE: 'Germany', FR: 'France', IT: 'Italy',
        ES: 'Spain', AU: 'Australia', NZ: 'New Zealand', CA: 'Canada',
      };
      return countryNames[codes[0]] || codes[0];
    }
    return `${codes.length} Countries`;
  };

  // Import selected products to database
  const handleImport = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      const { data: provider } = await supabase
        .from('esim_providers')
        .select('id')
        .eq('provider_code', 'tuge')
        .single();

      if (!provider) {
        throw new Error('TUGE provider not found in database');
      }

      const selectedList = products.filter(p => selectedProducts.has(p.productCode));
      const total = selectedList.length;
      let imported = 0;
      let updated = 0;
      let failed = 0;

      for (let i = 0; i < selectedList.length; i++) {
        const product = selectedList[i];
        
        try {
          const packageData = {
            package_id: product.productCode,
            name: product.productName,
            country_code: product.countries[0] || 'GLOBAL',
            country_name: getCountryName(product.countries),
            data_amount: product.dataLimited ? `${product.dataTotal}${product.dataUnit}` : 'Unlimited',
            validity_days: product.usagePeriod,
            price: product.netPrice * 1.5,
            cost_price: product.netPrice,
            currency: 'USD',
            package_type: mapProductType(product.productType, product.dataLimited),
            qos_speed: product.highSpeed || null,
            speed_after_limit: product.limitSpeed || null,
            validity_period: `${product.validityPeriod} days`,
            provider_id: provider.id,
            is_active: false,
            provider_metadata: {
              cardType: product.cardType,
              dataLimited: product.dataLimited,
              hasTopup: product.hasTopup,
              topupCount: product.topupCount,
              countries: product.countries,
            },
          };

          const { error } = await supabase
            .from('esim_packages')
            .upsert(packageData, { onConflict: 'package_id' });

          if (error) throw error;
          
          if (existingPackageIds.has(product.productCode)) {
            updated++;
          } else {
            imported++;
          }
        } catch (err) {
          console.error(`Failed to import ${product.productCode}:`, err);
          failed++;
        }

        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      toast({
        title: "Import Complete",
        description: `Imported: ${imported}, Updated: ${updated}, Failed: ${failed}`,
      });

      await fetchExistingPackages();
      setSelectedProducts(new Set());
      onImportComplete();

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import products';
      console.error('Import error:', err);
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Sync TUGE Products</DialogTitle>
          <DialogDescription>
            Browse cached TUGE products or refresh from API to get latest data
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Status and action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Cache status indicator */}
            {lastSyncedAt && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                {fromCache ? (
                  <Database className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <span>
                  {fromCache ? 'From cache • ' : 'Fresh sync • '}
                  Last updated {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
                </span>
              </div>
            )}
            
            <div className="flex-1" />
            
            <Button 
              variant="outline" 
              onClick={() => fetchProducts(true)}
              disabled={loading || refreshing || importing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh from API'}
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={loading || refreshing || importing || selectedProducts.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Import Selected ({selectedProducts.size})
            </Button>
          </div>

          {/* Import progress */}
          {importing && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Importing products... {importProgress}%
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading products...</span>
            </div>
          )}

          {/* Products table */}
          {!loading && products.length > 0 && (
            <TugeProductTable
              products={products}
              selectedProducts={selectedProducts}
              onSelectionChange={handleSelectionChange}
              onSelectAll={handleSelectAll}
              existingPackageIds={existingPackageIds}
            />
          )}

          {/* Empty state */}
          {!loading && products.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cached products found.</p>
              <p className="text-sm mt-1">Click "Refresh from API" to fetch products from TUGE.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
