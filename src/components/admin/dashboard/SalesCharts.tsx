import { Card, CardContent } from '@/components/ui/card';
import { 
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart
} from 'recharts';

interface SalesChartsProps {
  revenueData: Array<{ date: string; revenue: number; orders: number }>;
  provisioningData: Array<{ date: string; success: number; failed: number }>;
  topDestinations: Array<{ name: string; value: number }>;
  channelMix: Array<{ name: string; value: number; color: string }>;
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #F3F0EB',
  borderRadius: '12px',
  fontSize: '11px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

export function SalesCharts({ revenueData, provisioningData, topDestinations, channelMix }: SalesChartsProps) {
  return (
    <div className="space-y-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
        Sales & Operations
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Revenue & Orders Trend */}
        <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Revenue & Orders Trend</p>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#F9731610" stroke="none" />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} dot={false} name="Revenue ($)" />
                <Bar yAxisId="right" dataKey="orders" fill="#F3F0EB" radius={[4, 4, 0, 0]} name="Orders" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Provisioning Success vs Failure */}
        <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Provisioning Success vs Failure</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={provisioningData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="success" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} name="Success" />
                <Bar dataKey="failed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Destinations */}
        <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Top Destinations</p>
            {topDestinations.length > 0 ? (
              <div className="space-y-2">
                {topDestinations.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#9CA3AF] w-4">{i + 1}</span>
                    <span className="text-xs text-[#1A1A1A] w-24 font-medium">{d.name}</span>
                    <div className="flex-1 h-2 bg-[#F3F0EB] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(d.value / (topDestinations[0]?.value || 1)) * 100}%`,
                          backgroundColor: '#F97316',
                          opacity: 1 - (i * 0.15),
                        }} 
                      />
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] font-medium w-8 text-right">{d.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9CA3AF] text-center py-8">No destination data available</p>
            )}
          </CardContent>
        </Card>

        {/* Channel Sales Mix */}
        <Card className="border-[#F3F0EB] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Sales Channel Mix</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie
                    data={channelMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {channelMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {channelMix.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs text-[#1A1A1A] flex-1">{c.name}</span>
                    <span className="text-xs font-semibold text-[#1A1A1A]">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
