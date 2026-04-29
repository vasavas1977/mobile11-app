import { DollarSign, ShoppingCart, AlertTriangle, CheckCircle, Clock, XCircle, TrendingUp, Percent } from 'lucide-react';
import { AdminKPICard } from '../ui/AdminKPICard';
import { Order, getMargin, getPaymentStatus, getProvisioningStatus } from './types';

interface OrderKPIStripProps {
  orders: Order[];
}

export function OrderKPIStrip({ orders }: OrderKPIStripProps) {
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const failedOrders = orders.filter(o => o.status === 'failed' || o.status === 'needs_attention').length;
  
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);
  
  const totalMargin = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => {
      const m = getMargin(o);
      return sum + (m ?? 0);
    }, 0);

  const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const provisioningFailed = orders.filter(o => getProvisioningStatus(o) === 'failed').length;

  const kpis: { label: string; value: string; icon: any; accent: 'default' | 'success' | 'warning' | 'error' }[] = [
    { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingCart, accent: 'default' },
    { label: 'Revenue', value: `$${totalRevenue.toFixed(0)}`, icon: DollarSign, accent: 'success' },
    { label: 'Margin', value: `$${totalMargin.toFixed(0)}`, icon: TrendingUp, accent: 'success' },
    { label: 'Avg Margin', value: `${avgMarginPct.toFixed(1)}%`, icon: Percent, accent: 'default' },
    { label: 'Completed', value: completedOrders.toLocaleString(), icon: CheckCircle, accent: 'success' },
    { label: 'Pending', value: pendingOrders.toLocaleString(), icon: Clock, accent: 'warning' },
    { label: 'Failed', value: failedOrders.toLocaleString(), icon: XCircle, accent: 'error' },
    { label: 'Prov. Failed', value: provisioningFailed.toLocaleString(), icon: AlertTriangle, accent: 'error' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {kpis.map((kpi) => (
        <AdminKPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
