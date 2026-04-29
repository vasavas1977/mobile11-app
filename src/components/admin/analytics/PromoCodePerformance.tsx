import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PromoPerformance {
  code: string;
  uses: number;
  revenue: number;
  discountGiven: number;
  netRevenue: number;
  roi: number;
}

interface PromoCodePerformanceProps {
  data: PromoPerformance[];
}

export function PromoCodePerformance({ data }: PromoCodePerformanceProps) {
  const getROIColor = (roi: number) => {
    if (roi > 100) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (roi > 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promo Code Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Uses</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Net Revenue</TableHead>
              <TableHead className="text-right">ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No promo codes used in this period
                </TableCell>
              </TableRow>
            ) : (
              data.map((promo, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium font-mono">{promo.code}</TableCell>
                  <TableCell className="text-right">{promo.uses}</TableCell>
                  <TableCell className="text-right">${promo.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-destructive">
                    -${promo.discountGiven.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${promo.netRevenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className={getROIColor(promo.roi)}>
                      {promo.roi.toFixed(0)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
