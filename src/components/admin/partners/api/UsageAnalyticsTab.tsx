import { BarChart3, TrendingUp, Globe, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_API_PARTNERS } from './apiPartnerData';

const topEndpoints = [
  { endpoint: 'packages.list', calls: 48200, pct: 35 },
  { endpoint: 'orders.create', calls: 32100, pct: 23 },
  { endpoint: 'orders.status', calls: 28400, pct: 21 },
  { endpoint: 'esim.qr', calls: 15600, pct: 11 },
  { endpoint: 'esim.status', calls: 8900, pct: 7 },
  { endpoint: 'packages.get', calls: 4100, pct: 3 },
];

const usageByCountry = [
  { country: 'United Kingdom', requests: 52400, orders: 1800 },
  { country: 'Germany', requests: 45200, orders: 1380 },
  { country: 'Canada', requests: 38100, orders: 1020 },
  { country: 'Singapore', requests: 2340, orders: 0 },
];

const dailyVolume = [
  { day: 'Mon', requests: 6200 },
  { day: 'Tue', requests: 7100 },
  { day: 'Wed', requests: 7800 },
  { day: 'Thu', requests: 6900 },
  { day: 'Fri', requests: 8200 },
  { day: 'Sat', requests: 4100 },
  { day: 'Sun', requests: 3500 },
];

const maxDaily = Math.max(...dailyVolume.map(d => d.requests));

export function UsageAnalyticsTab() {
  const totalRequests = MOCK_API_PARTNERS.reduce((s, p) => s + p.monthly_requests, 0);
  const totalOrders = MOCK_API_PARTNERS.reduce((s, p) => s + p.monthly_orders, 0);
  const avgErrorRate = MOCK_API_PARTNERS.filter(p => p.monthly_requests > 0).reduce((s, p) => s + p.error_rate, 0) / MOCK_API_PARTNERS.filter(p => p.monthly_requests > 0).length;
  const avgLatency = MOCK_API_PARTNERS.filter(p => p.avg_latency_ms > 0).reduce((s, p) => s + p.avg_latency_ms, 0) / MOCK_API_PARTNERS.filter(p => p.avg_latency_ms > 0).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests (MTD)', value: totalRequests.toLocaleString(), icon: BarChart3, color: 'text-blue-500' },
          { label: 'Total Orders (MTD)', value: totalOrders.toLocaleString(), icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Avg Error Rate', value: `${avgErrorRate.toFixed(1)}%`, icon: Zap, color: avgErrorRate > 2 ? 'text-red-500' : 'text-emerald-500' },
          { label: 'Avg Latency', value: `${Math.round(avgLatency)}ms`, icon: Globe, color: 'text-orange-500' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#F3F0EB] p-4">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold font-mono text-[#1A1A1A]">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Volume Chart */}
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Daily Request Volume</h3>
          <div className="flex items-end gap-2 h-32">
            {dailyVolume.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-[#9CA3AF]">{(d.requests / 1000).toFixed(1)}k</span>
                <div className="w-full bg-[#F3F0EB] rounded-t" style={{ height: `${(d.requests / maxDaily) * 80}px` }}>
                  <div className="w-full h-full bg-orange-400 rounded-t" />
                </div>
                <span className="text-[10px] text-[#9CA3AF]">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Endpoints */}
        <div className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Top Endpoints</h3>
          <div className="space-y-2.5">
            {topEndpoints.map(ep => (
              <div key={ep.endpoint}>
                <div className="flex items-center justify-between mb-1">
                  <code className="text-[12px] font-mono text-[#4B5563]">{ep.endpoint}</code>
                  <span className="text-[12px] font-mono text-[#6B7280]">{ep.calls.toLocaleString()} ({ep.pct}%)</span>
                </div>
                <div className="w-full bg-[#F3F0EB] rounded-full h-1.5">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${ep.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage by Country */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] p-5">
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Usage by Partner Country</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB]">
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Country</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Requests</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Orders</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {usageByCountry.map(c => (
                <tr key={c.country} className="border-b border-[#F3F0EB]">
                  <td className="px-4 py-2 text-[13px] text-[#1A1A1A]">{c.country}</td>
                  <td className="px-4 py-2 text-right font-mono text-[13px] text-[#6B7280]">{c.requests.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono text-[13px] text-[#6B7280]">{c.orders.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono text-[13px] text-[#1A1A1A]">{c.requests > 0 ? `${(c.orders / c.requests * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
