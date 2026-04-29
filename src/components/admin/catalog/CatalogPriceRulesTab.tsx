import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, AlertTriangle, Percent, ArrowUpDown } from 'lucide-react';

interface CatalogPriceRulesTabProps {
  packages: any[];
}

export function CatalogPriceRulesTab({ packages }: CatalogPriceRulesTabProps) {
  const [groupBy, setGroupBy] = useState<'destination' | 'provider' | 'type'>('destination');
  const [sortBy, setSortBy] = useState<'margin' | 'count' | 'revenue'>('count');

  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    packages.forEach(pkg => {
      let key = '';
      if (groupBy === 'destination') key = pkg.country_name || 'Unknown';
      else if (groupBy === 'provider') key = pkg.provider_name || 'Unknown';
      else key = pkg.package_type || 'standard';
      
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(pkg);
    });

    const result = Array.from(map.entries()).map(([name, pkgs]) => {
      const withCost = pkgs.filter(p => p.cost_price > 0);
      const avgCost = withCost.length > 0 ? withCost.reduce((s, p) => s + p.cost_price, 0) / withCost.length : 0;
      const avgRetail = pkgs.reduce((s, p) => s + p.price, 0) / pkgs.length;
      const avgMarginPct = avgCost > 0 ? ((avgRetail - avgCost) / avgCost) * 100 : 0;
      const directPrice = avgRetail;
      const resellerPrice = avgRetail * 0.85;
      const distributorPrice = avgRetail * 0.70;
      const apiPrice = avgRetail * 0.75;

      return {
        name,
        count: pkgs.length,
        active: pkgs.filter(p => p.is_active).length,
        avgCost,
        avgRetail,
        avgMarginPct,
        directPrice,
        resellerPrice,
        distributorPrice,
        apiPrice,
        noCost: pkgs.filter(p => !p.cost_price || p.cost_price === 0).length,
      };
    });

    if (sortBy === 'margin') result.sort((a, b) => b.avgMarginPct - a.avgMarginPct);
    else if (sortBy === 'count') result.sort((a, b) => b.count - a.count);
    else result.sort((a, b) => b.avgRetail * b.count - a.avgRetail * a.count);

    return result;
  }, [packages, groupBy, sortBy]);

  // Pricing tier summary
  const totalPackages = packages.length;
  const avgMarkup = packages.filter(p => p.cost_price > 0).length > 0
    ? packages.filter(p => p.cost_price > 0).reduce((s, p) => s + ((p.price - p.cost_price) / p.cost_price) * 100, 0) / packages.filter(p => p.cost_price > 0).length
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Price Rules & Channel Pricing</h2>
        <p className="text-sm text-muted-foreground">Margin analysis and multi-tier pricing overview</p>
      </div>

      {/* Pricing tier cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">Direct Store</span>
            </div>
            <p className="text-lg font-bold">4.0x markup</p>
            <p className="text-[11px] text-muted-foreground">100% retail price</p>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-muted-foreground">Reseller</span>
            </div>
            <p className="text-lg font-bold">15% discount</p>
            <p className="text-[11px] text-muted-foreground">85% of retail</p>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">Distributor</span>
            </div>
            <p className="text-lg font-bold">30% discount</p>
            <p className="text-[11px] text-muted-foreground">70% of retail</p>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpDown className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-muted-foreground">API Partner</span>
            </div>
            <p className="text-lg font-bold">25% discount</p>
            <p className="text-[11px] text-muted-foreground">75% of retail</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="destination">By Destination</SelectItem>
            <SelectItem value="provider">By Supplier</SelectItem>
            <SelectItem value="type">By Package Type</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count">By Count</SelectItem>
            <SelectItem value="margin">By Margin</SelectItem>
            <SelectItem value="revenue">By Revenue</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {groups.length} groups • {totalPackages.toLocaleString()} packages • Avg markup: {avgMarkup.toFixed(0)}%
        </span>
      </div>

      {/* Price table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{groupBy === 'destination' ? 'Destination' : groupBy === 'provider' ? 'Supplier' : 'Type'}</TableHead>
                  <TableHead className="text-center">Pkgs</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Avg Cost</TableHead>
                  <TableHead className="text-right">Direct</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Reseller</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Distributor</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">API</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-center hidden md:table-cell">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.slice(0, 50).map((g) => (
                  <TableRow key={g.name}>
                    <TableCell>
                      <span className="font-medium text-sm">{g.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{g.active} live</span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">{g.count}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden md:table-cell">${g.avgCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">${g.directPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden lg:table-cell">${g.resellerPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden lg:table-cell">${g.distributorPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden lg:table-cell">${g.apiPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono text-sm font-medium ${g.avgMarginPct >= 200 ? 'text-green-600' : g.avgMarginPct >= 100 ? 'text-amber-600' : 'text-destructive'}`}>
                        {g.avgMarginPct > 0 ? `${g.avgMarginPct.toFixed(0)}%` : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      {g.noCost > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          <AlertTriangle className="h-3 w-3 mr-1" />{g.noCost}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
