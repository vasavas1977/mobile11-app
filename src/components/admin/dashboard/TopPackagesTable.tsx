import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';

interface TopPackagesTableProps {
  packages: Array<{ name: string; sales: number; revenue: number }>;
}

export function TopPackagesTable({ packages }: TopPackagesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Performing Packages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No sales data yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell className="text-right">{pkg.sales}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${pkg.revenue.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
