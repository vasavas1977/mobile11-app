import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, EyeOff, Globe, Star, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CatalogVisibilityTabProps {
  packages: any[];
  onRefresh: () => void;
}

export function CatalogVisibilityTab({ packages, onRefresh }: CatalogVisibilityTabProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  // Group by destination for visibility management
  const destinations = useMemo(() => {
    const map = new Map<string, { name: string; total: number; active: number; featured: number; packages: any[] }>();
    packages.forEach(pkg => {
      const key = pkg.country_name;
      if (!map.has(key)) {
        map.set(key, { name: key, total: 0, active: 0, featured: 0, packages: [] });
      }
      const entry = map.get(key)!;
      entry.total++;
      if (pkg.is_active) entry.active++;
      if (pkg.is_featured) entry.featured++;
      entry.packages.push(pkg);
    });

    return Array.from(map.values())
      .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.total - a.total);
  }, [packages, search]);

  const toggleDestination = async (destination: string, active: boolean) => {
    setUpdating(destination);
    try {
      const pkgIds = packages.filter(p => p.country_name === destination).map(p => p.id);
      for (let i = 0; i < pkgIds.length; i += 50) {
        const batch = pkgIds.slice(i, i + 50);
        const { error } = await supabase
          .from('esim_packages')
          .update({ is_active: active })
          .in('id', batch);
        if (error) throw error;
      }
      toast({ title: `${destination} ${active ? 'shown' : 'hidden'}`, description: `${pkgIds.length} packages updated` });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const totalActive = packages.filter(p => p.is_active).length;
  const totalHidden = packages.length - totalActive;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Channel Visibility</h2>
        <p className="text-sm text-muted-foreground">Control which packages are visible on each sales channel</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-lg font-bold text-green-600">{totalActive.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Live packages</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <EyeOff className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{totalHidden.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Hidden packages</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-blue-600">{destinations.length}</p>
              <p className="text-[11px] text-muted-foreground">Destinations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search destinations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Destination visibility grid */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Destination</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Live</TableHead>
                <TableHead className="text-center hidden md:table-cell">Featured</TableHead>
                <TableHead className="text-center">Direct</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Reseller</TableHead>
                <TableHead className="text-center hidden lg:table-cell">API</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {destinations.slice(0, 100).map((dest) => {
                const allActive = dest.active === dest.total;
                const allHidden = dest.active === 0;

                return (
                  <TableRow key={dest.name}>
                    <TableCell>
                      <span className="font-medium text-sm">{dest.name}</span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">{dest.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={dest.active > 0 ? 'default' : 'secondary'} className="text-[10px]">
                        {dest.active}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      {dest.featured > 0 ? (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px]">
                          <Star className="h-3 w-3 mr-1" />{dest.featured}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={dest.active > 0 ? 'default' : 'outline'} className="text-[10px]">
                        {dest.active > 0 ? 'Visible' : 'Hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      <Badge variant="outline" className="text-[10px]">Available</Badge>
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      <Badge variant="outline" className="text-[10px]">Available</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!allActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2"
                            onClick={() => toggleDestination(dest.name, true)}
                            disabled={updating === dest.name}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Show All
                          </Button>
                        )}
                        {!allHidden && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2"
                            onClick={() => toggleDestination(dest.name, false)}
                            disabled={updating === dest.name}
                          >
                            <EyeOff className="h-3 w-3 mr-1" /> Hide All
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
