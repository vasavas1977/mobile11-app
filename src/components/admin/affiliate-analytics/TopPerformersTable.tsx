import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface TopPerformer {
  id: string;
  affiliateCode: string;
  companyName: string | null;
  tier: string;
  monthlySales: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
}

interface TopPerformersTableProps {
  performers: TopPerformer[];
  loading: boolean;
}

const tierBadgeColors: Record<string, string> = {
  starter: 'bg-gray-500',
  bronze: 'bg-amber-700',
  silver: 'bg-slate-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500',
};

export function TopPerformersTable({ performers, loading }: TopPerformersTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {performers.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No affiliate performance data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Affiliate</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Monthly Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performers.map((performer, index) => (
                <TableRow key={performer.id}>
                  <TableCell className="font-medium">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{performer.affiliateCode}</div>
                      {performer.companyName && (
                        <div className="text-xs text-muted-foreground">{performer.companyName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${tierBadgeColors[performer.tier] || 'bg-gray-500'} text-white`}>
                      {performer.tier.charAt(0).toUpperCase() + performer.tier.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{performer.monthlySales}</TableCell>
                  <TableCell className="text-right">${performer.totalRevenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${performer.totalCommission.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{performer.conversionRate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
