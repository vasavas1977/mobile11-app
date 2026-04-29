import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CreditCard } from 'lucide-react';

interface PaymentMethodData {
  name: string;
  value: number;
  revenue: number;
  color: string;
}

interface PaymentMethodChartProps {
  data: PaymentMethodData[];
  currencySymbol: string;
}

const LABEL_MAP: Record<string, { label: string; color: string }> = {
  'stripe:card': { label: 'Credit Card', color: '#3B82F6' },
  'stripe:promo_code': { label: 'Promo / Free', color: '#8B5CF6' },
  'stripe:mobile11_money': { label: 'Mobile11 Money', color: '#10B981' },
  'stripe:org_credit': { label: 'Org Credit', color: '#F59E0B' },
  '2c2p:redirect': { label: '2C2P QR/Redirect', color: '#F97316' },
  '2c2p:promptpay_direct': { label: 'PromptPay', color: '#6366F1' },
  'manual:admin_manual': { label: 'Manual', color: '#6B7280' },
};

export function getPaymentMethodLabel(gateway: string, method: string) {
  const key = `${gateway}:${method}`;
  return LABEL_MAP[key] || { label: method || gateway || 'Other', color: '#9CA3AF' };
}

const CustomTooltip = ({ active, payload, currencySymbol }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#F3F0EB] p-3 text-xs">
      <p className="font-semibold text-[#1A1A1A]">{d.name}</p>
      <p className="text-muted-foreground">{d.value} orders ({((d.value / (payload[0]?.payload?.total || 1)) * 100).toFixed(1)}%)</p>
      <p className="text-muted-foreground">Revenue: {currencySymbol}{d.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  );
};

export function PaymentMethodChart({ data, currencySymbol }: PaymentMethodChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const dataWithTotal = data.map(d => ({ ...d, total }));

  return (
    <div className="bg-white rounded-2xl border border-[#F3F0EB] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-blue-50">
          <CreditCard className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="font-semibold text-sm text-[#1A1A1A]">Payment Methods</h3>
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No payment data</p>
      ) : (
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dataWithTotal}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {dataWithTotal.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 w-full">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground truncate">{d.name}</span>
                <span className="ml-auto font-medium text-[#1A1A1A]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
