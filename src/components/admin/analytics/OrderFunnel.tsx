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

interface OrderFunnelProps {
  data: {
    completed: { count: number; revenue: number };
    processing: { count: number; revenue: number };
    failed: { count: number; revenue: number };
    cancelled: { count: number; revenue: number };
  };
}

export function OrderFunnel({ data }: OrderFunnelProps) {
  const chartData = [
    { 
      status: 'Completed', 
      count: data.completed.count, 
      revenue: data.completed.revenue,
      color: 'hsl(142 76% 36%)'
    },
    { 
      status: 'Processing', 
      count: data.processing.count, 
      revenue: data.processing.revenue,
      color: 'hsl(var(--primary))'
    },
    { 
      status: 'Failed', 
      count: data.failed.count, 
      revenue: data.failed.revenue,
      color: 'hsl(var(--destructive))'
    },
    { 
      status: 'Cancelled', 
      count: data.cancelled.count, 
      revenue: data.cancelled.revenue,
      color: 'hsl(var(--muted-foreground))'
    },
  ];

  const totalOrders = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chartData.map((item) => {
            const percentage = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;
            return (
              <div key={item.status} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.status}</span>
                  <span className="text-muted-foreground">
                    {item.count} orders • ${item.revenue.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
