import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PackagePerformance {
  name: string;
  orders: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  avgPrice: number;
}

interface PackagePerformanceTableProps {
  data: PackagePerformance[];
}

export function PackagePerformanceTable({ data }: PackagePerformanceTableProps) {
  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (margin >= 15) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Avg Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((pkg, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell className="text-right">{pkg.orders}</TableCell>
                  <TableCell className="text-right">${pkg.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                    ${pkg.profit.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className={getProfitMarginColor(pkg.profitMargin)}>
                      {pkg.profitMargin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${pkg.avgPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
