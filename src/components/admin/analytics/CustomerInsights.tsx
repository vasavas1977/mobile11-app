import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface CustomerInsightsProps {
  data: Array<{
    date: string;
    newCustomers: number;
    returningCustomers: number;
  }>;
  stats: {
    totalCustomers: number;
    repeatCustomers: number;
    avgOrdersPerCustomer: number;
    retentionRate: number;
  };
}

export function CustomerInsights({ data, stats }: CustomerInsightsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Customer Acquisition</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="newCustomers" 
                fill="hsl(var(--primary))" 
                name="New Customers" 
              />
              <Bar 
                dataKey="returningCustomers" 
                fill="hsl(142 76% 36%)" 
                name="Returning" 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Customers</div>
              <div className="text-3xl font-bold">{stats.totalCustomers}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Repeat Customers</div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.repeatCustomers}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.retentionRate.toFixed(1)}% retention rate
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Avg Orders/Customer</div>
              <div className="text-3xl font-bold">{stats.avgOrdersPerCustomer.toFixed(1)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
