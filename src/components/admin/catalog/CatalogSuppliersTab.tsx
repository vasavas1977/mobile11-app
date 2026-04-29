import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, Package, Globe, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SupplierStats {
  id: string;
  provider_name: string;
  provider_code: string;
  is_active: boolean;
  packageCount: number;
  activePackages: number;
  destinations: number;
  avgCost: number;
  avgRetail: number;
  avgMarginPct: number;
  noCostCount: number;
}

export function CatalogSuppliersTab() {
  const [suppliers, setSuppliers] = useState<SupplierStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplierStats();
  }, []);

  const fetchSupplierStats = async () => {
    try {
      const { data: providers } = await supabase
        .from('esim_providers')
        .select('id, provider_name, provider_code, is_active')
        .order('provider_name');

      const { data: packages } = await supabase
        .from('esim_packages')
        .select('provider_id, country_name, cost_price, price, is_active');

      if (!providers || !packages) return;

      const stats: SupplierStats[] = providers.map(prov => {
        const provPkgs = packages.filter(p => p.provider_id === prov.id);
        const activePkgs = provPkgs.filter(p => p.is_active);
        const withCost = provPkgs.filter(p => p.cost_price && p.cost_price > 0);
        const destinations = new Set(provPkgs.map(p => p.country_name)).size;
        const avgCost = withCost.length > 0 ? withCost.reduce((s, p) => s + (p.cost_price || 0), 0) / withCost.length : 0;
        const avgRetail = provPkgs.length > 0 ? provPkgs.reduce((s, p) => s + p.price, 0) / provPkgs.length : 0;
        const avgMarginPct = avgCost > 0 ? ((avgRetail - avgCost) / avgCost) * 100 : 0;
        const noCostCount = provPkgs.filter(p => !p.cost_price || p.cost_price === 0).length;

        return {
          ...prov,
          packageCount: provPkgs.length,
          activePackages: activePkgs.length,
          destinations,
          avgCost,
          avgRetail,
          avgMarginPct,
          noCostCount,
        };
      });

      setSuppliers(stats.sort((a, b) => b.packageCount - a.packageCount));
    } catch (err) {
      console.error('Error fetching supplier stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Supplier Overview</h2>
        <p className="text-sm text-muted-foreground">Upstream provider performance, coverage, and cost analysis</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Packages</TableHead>
                <TableHead className="text-center hidden md:table-cell">Live</TableHead>
                <TableHead className="text-center hidden md:table-cell">Destinations</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Avg Cost</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Avg Retail</TableHead>
                <TableHead className="text-right">Avg Margin</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Missing Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{s.provider_name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{s.provider_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{s.packageCount.toLocaleString()}</TableCell>
                  <TableCell className="text-center hidden md:table-cell">{s.activePackages.toLocaleString()}</TableCell>
                  <TableCell className="text-center hidden md:table-cell">{s.destinations}</TableCell>
                  <TableCell className="text-right font-mono text-sm hidden lg:table-cell">${s.avgCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-sm hidden lg:table-cell">${s.avgRetail.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono text-sm font-medium ${s.avgMarginPct >= 200 ? 'text-green-600' : s.avgMarginPct >= 100 ? 'text-amber-600' : 'text-destructive'}`}>
                      {s.avgMarginPct > 0 ? `${s.avgMarginPct.toFixed(0)}%` : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    {s.noCostCount > 0 ? (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="h-3 w-3 mr-1" />{s.noCostCount}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
