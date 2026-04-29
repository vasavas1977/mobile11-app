import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';

interface CommissionBreakdown {
  pending: number;
  approved: number;
  paid: number;
}

interface CommissionAnalyticsProps {
  breakdown: CommissionBreakdown;
  loading: boolean;
}

export function CommissionAnalytics({ breakdown, loading }: CommissionAnalyticsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: 'Pending', value: breakdown.pending, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Approved', value: breakdown.approved, fill: 'hsl(187, 85%, 43%)' },
    { name: 'Paid', value: breakdown.paid, fill: 'hsl(142, 76%, 36%)' },
  ];

  const total = breakdown.pending + breakdown.approved + breakdown.paid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Commission Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-2xl font-bold text-amber-500">${breakdown.pending.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="text-2xl font-bold text-cyan-500">${breakdown.approved.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-2xl font-bold text-emerald-500">${breakdown.paid.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Paid</div>
          </div>
        </div>

        {total === 0 ? (
          <div className="h-[150px] flex items-center justify-center text-muted-foreground">
            No commission data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="name" />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <rect key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
