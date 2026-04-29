import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TugeProduct {
  productCode: string;
  productName: string;
  productType: string;
  countries: string[];
  netPrice: number;
  usagePeriod: number;
  validityPeriod: number;
  dataTotal: number;
  dataUnit: string;
  dataLimited: boolean;
  highSpeed?: string;
  limitSpeed?: string;
  cardType?: string;
  hasTopup: boolean;
  topupCount: number;
}

interface TugeProductTableProps {
  products: TugeProduct[];
  selectedProducts: Set<string>;
  onSelectionChange: (productCode: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  existingPackageIds: Set<string>;
}

type SortField = 'country' | 'type' | 'price' | null;
type SortDirection = 'asc' | 'desc';

export function TugeProductTable({
  products,
  selectedProducts,
  onSelectionChange,
  onSelectAll,
  existingPackageIds,
}: TugeProductTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const sortedAndFilteredProducts = useMemo(() => {
    // First filter
    const filtered = products.filter(product => {
      const matchesSearch = 
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.countries.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || product.productType === typeFilter;
      
      return matchesSearch && matchesType;
    });

    // Then sort
    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'country':
          const countryA = a.countries[0] || '';
          const countryB = b.countries[0] || '';
          comparison = countryA.localeCompare(countryB);
          break;
        case 'type':
          comparison = a.productType.localeCompare(b.productType);
          break;
        case 'price':
          comparison = a.netPrice - b.netPrice;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [products, searchTerm, typeFilter, sortField, sortDirection]);

  const allFilteredSelected = sortedAndFilteredProducts.length > 0 && 
    sortedAndFilteredProducts.every(p => selectedProducts.has(p.productCode));

  const formatData = (dataTotal: number, dataUnit: string, dataLimited: boolean) => {
    if (!dataLimited) return 'Unlimited';
    return `${dataTotal}${dataUnit}`;
  };

  const formatCountries = (countries: string[]) => {
    if (countries.length <= 3) {
      return countries.join(', ');
    }
    return `${countries.slice(0, 3).join(', ')} +${countries.length - 3}`;
  };

  return (
    <div className="space-y-4">
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
            <SelectValue placeholder="Product Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="DAILY_PACK">Day Pass</SelectItem>
            <SelectItem value="DATA_PACK">Data Pack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Showing {sortedAndFilteredProducts.length} of {products.length} products</span>
        <span>•</span>
        <span>{selectedProducts.size} selected</span>
        <span>•</span>
        <span>{existingPackageIds.size} already synced</span>
      </div>

      {/* Table */}
      <div className="border rounded-lg max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={(checked) => {
                    sortedAndFilteredProducts.forEach(p => onSelectionChange(p.productCode, !!checked));
                  }}
                />
              </TableHead>
              <TableHead>Product Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
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
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
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
                  className="-mr-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('price')}
                >
                  Cost (USD)
                  {getSortIcon('price')}
                </Button>
              </TableHead>
              <TableHead>Card</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredProducts.map((product) => {
              const isExisting = existingPackageIds.has(product.productCode);
              return (
                <TableRow 
                  key={product.productCode}
                  className={isExisting ? 'opacity-60' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.has(product.productCode)}
                      onCheckedChange={(checked) => onSelectionChange(product.productCode, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{product.productCode}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={product.productName}>
                    {product.productName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.productType === 'DAILY_PACK' ? 'default' : 'secondary'}>
                      {product.productType === 'DAILY_PACK' ? 'Day Pass' : 'Data Pack'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={product.countries.join(', ')}>
                    {formatCountries(product.countries)}
                  </TableCell>
                  <TableCell>{formatData(product.dataTotal, product.dataUnit, product.dataLimited)}</TableCell>
                  <TableCell>{product.usagePeriod} days</TableCell>
                  <TableCell className="text-right font-medium">${product.netPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    {product.cardType && <Badge variant="outline">{product.cardType}</Badge>}
                  </TableCell>
                  <TableCell>
                    {isExisting ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400">Synced</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-400">New</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
