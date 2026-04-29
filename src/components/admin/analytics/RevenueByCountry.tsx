import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface RevenueByCountryProps {
  data: Array<{
    country: string;
    revenue: number;
    orders: number;
    profitMargin: number;
  }>;
}

export function RevenueByCountry({ data }: RevenueByCountryProps) {
  const getBarColor = (margin: number) => {
    if (margin >= 30) return 'hsl(142 76% 36%)';
    if (margin >= 15) return 'hsl(var(--primary))';
    return 'hsl(var(--destructive))';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Country</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" className="text-xs" />
            <YAxis type="category" dataKey="country" className="text-xs" width={80} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Revenue'];
                return [value, name];
              }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.profitMargin)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
