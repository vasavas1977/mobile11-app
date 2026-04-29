import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogEntry {
  id: string;
  timestamp: string;
  partner: string;
  method: string;
  endpoint: string;
  status: number;
  latency_ms: number;
  ip: string;
  request_id: string;
}

const mockLogs: LogEntry[] = [
  { id: '1', timestamp: '2025-03-26T09:14:32', partner: 'GlobalReach API Ltd.', method: 'POST', endpoint: '/v2/orders', status: 201, latency_ms: 145, ip: '52.14.88.12', request_id: 'req_8kF2xQ9m01' },
  { id: '2', timestamp: '2025-03-26T09:14:28', partner: 'GlobalReach API Ltd.', method: 'GET', endpoint: '/v2/packages', status: 200, latency_ms: 42, ip: '52.14.88.12', request_id: 'req_8kF2xQ9m02' },
  { id: '3', timestamp: '2025-03-26T09:13:55', partner: 'FlyConnect GmbH', method: 'POST', endpoint: '/v2/orders', status: 201, latency_ms: 168, ip: '85.214.12.45', request_id: 'req_7jN2mW5x03' },
  { id: '4', timestamp: '2025-03-26T09:13:12', partner: 'FlyConnect GmbH', method: 'GET', endpoint: '/v2/orders/status', status: 200, latency_ms: 38, ip: '85.214.12.45', request_id: 'req_7jN2mW5x04' },
  { id: '5', timestamp: '2025-03-26T09:12:45', partner: 'GlobalReach API Ltd.', method: 'GET', endpoint: '/v2/esim/qr', status: 200, latency_ms: 95, ip: '18.220.5.33', request_id: 'req_8kF2xQ9m05' },
  { id: '6', timestamp: '2025-03-26T09:12:01', partner: 'NomadTech SaaS', method: 'GET', endpoint: '/v2/packages', status: 200, latency_ms: 35, ip: '103.42.12.8', request_id: 'req_5cD3pL8k06' },
  { id: '7', timestamp: '2025-03-26T09:11:30', partner: 'GlobalReach API Ltd.', method: 'POST', endpoint: '/v2/orders', status: 422, latency_ms: 12, ip: '52.14.88.12', request_id: 'req_8kF2xQ9m07' },
  { id: '8', timestamp: '2025-03-26T09:10:55', partner: 'FlyConnect GmbH', method: 'GET', endpoint: '/v2/esim/status', status: 200, latency_ms: 52, ip: '195.201.8.22', request_id: 'req_7jN2mW5x08' },
  { id: '9', timestamp: '2025-03-26T09:10:22', partner: 'NomadTech SaaS', method: 'POST', endpoint: '/v2/orders', status: 400, latency_ms: 8, ip: '103.42.12.8', request_id: 'req_5cD3pL8k09' },
  { id: '10', timestamp: '2025-03-26T09:09:45', partner: 'GlobalReach API Ltd.', method: 'GET', endpoint: '/v2/packages', status: 200, latency_ms: 44, ip: '203.0.113.42', request_id: 'req_8kF2xQ9m10' },
];

const statusColor = (s: number) => {
  if (s >= 200 && s < 300) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s >= 400 && s < 500) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

const methodColor = (m: string) => {
  if (m === 'GET') return 'text-blue-600';
  if (m === 'POST') return 'text-emerald-600';
  if (m === 'PUT') return 'text-amber-600';
  return 'text-red-600';
};

export function APILogsTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = mockLogs;
    if (search) result = result.filter(l => l.partner.toLowerCase().includes(search.toLowerCase()) || l.endpoint.includes(search));
    if (statusFilter === '2xx') result = result.filter(l => l.status >= 200 && l.status < 300);
    if (statusFilter === '4xx') result = result.filter(l => l.status >= 400 && l.status < 500);
    if (statusFilter === '5xx') result = result.filter(l => l.status >= 500);
    return result;
  }, [search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#F3F0EB] text-[#1A1A1A]" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-white border-[#F3F0EB] text-[#4B5563]">
            <Filter className="h-3.5 w-3.5 mr-2 text-[#9CA3AF]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="2xx">2xx Success</SelectItem>
            <SelectItem value="4xx">4xx Client Error</SelectItem>
            <SelectItem value="5xx">5xx Server Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F0EB] bg-[#FAFAF8]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Method</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Endpoint</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Latency</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">IP</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Request ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-[#F3F0EB] hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-2 text-[11px] font-mono text-[#6B7280] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                  </td>
                  <td className="px-4 py-2 text-[12px] text-[#1A1A1A]">{log.partner}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-mono font-semibold ${methodColor(log.method)}`}>{log.method}</span>
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-[11px] font-mono text-[#4B5563]">{log.endpoint}</code>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline" className={`text-[10px] font-mono ${statusColor(log.status)}`}>{log.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right text-[11px] font-mono text-[#6B7280]">{log.latency_ms}ms</td>
                  <td className="px-4 py-2 text-[11px] font-mono text-[#9CA3AF]">{log.ip}</td>
                  <td className="px-4 py-2 text-[10px] font-mono text-[#9CA3AF]">{log.request_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
