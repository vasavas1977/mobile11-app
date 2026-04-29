import { CheckCircle2, XCircle, Activity, Clock, Server, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProviderData {
  id: string;
  provider_code: string;
  provider_name: string;
  is_active: boolean;
}

interface KPIData {
  totalRoutes: number;
  suppliersConnected: number;
  successRate: number;
  failedOrders: number;
  totalOrders30d: number;
  lastTugeSync: string | null;
  providerPackageCounts: Record<string, number>;
}

interface ProvisioningKPIStripProps {
  kpiData: KPIData;
  providers: ProviderData[];
}

export function ProvisioningKPIStrip({ kpiData, providers }: ProvisioningKPIStripProps) {
  const { totalRoutes, suppliersConnected, successRate, failedOrders, totalOrders30d, lastTugeSync, providerPackageCounts } = kpiData;
  const activeProviders = providers.filter(p => p.is_active).length;
  const totalProviders = providers.length;

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-2.5">
      {/* Operational status bar */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${activeProviders === totalProviders && totalProviders > 0 ? 'bg-emerald-500' : activeProviders > 0 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">System Status</span>
          </div>
          <Badge className={`text-[9px] font-semibold px-2 py-0 h-[18px] ${
            activeProviders === totalProviders && totalProviders > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            activeProviders > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            {activeProviders === totalProviders && totalProviders > 0 ? 'ALL SYSTEMS OPERATIONAL' : activeProviders > 0 ? 'PARTIAL' : 'NO SUPPLIERS'}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[#6B7280]">
          {providers.map(p => (
            <span key={p.id} className="flex items-center gap-1">
              <Wifi className={`h-2.5 w-2.5 ${p.is_active ? 'text-emerald-600' : 'text-red-500'}`} />
              <span className="font-medium text-foreground">{p.provider_name}</span>
              <span className="text-[#9CA3AF] tabular-nums">({providerPackageCounts[p.provider_name] || 0})</span>
            </span>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: 'Success Rate', value: totalOrders30d > 0 ? `${successRate.toFixed(1)}%` : '—', icon: CheckCircle2, color: successRate >= 90 ? 'emerald' : successRate >= 70 ? 'amber' : totalOrders30d > 0 ? 'red' : 'default', critical: successRate < 90 && totalOrders30d > 0 },
          { label: 'Failed Orders', value: failedOrders.toLocaleString(), icon: XCircle, color: failedOrders > 0 ? 'red' : 'emerald', critical: failedOrders > 10 },
          { label: 'Total Orders', value: totalOrders30d.toLocaleString(), icon: Activity, color: 'default', critical: false },
          { label: 'Supplier Health', value: `${activeProviders}/${totalProviders}`, icon: Server, color: activeProviders < totalProviders ? 'amber' : 'emerald', critical: false },
          { label: 'Last TUGE Sync', value: formatTimeAgo(lastTugeSync), icon: Clock, color: 'default', critical: false },
          { label: 'Total Routes', value: totalRoutes.toLocaleString(), icon: Activity, color: 'default', critical: false },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border p-2.5 transition-shadow hover:shadow-sm ${
            kpi.critical ? 'bg-red-50/50 border-red-200' : 'bg-white border-[#F3F0EB]'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                kpi.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                kpi.color === 'red' ? 'bg-red-100 text-red-600' :
                kpi.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                'bg-[#FAF7F2] text-[#6B7280]'
              }`}>
                <kpi.icon className="h-2.5 w-2.5" />
              </div>
              <span className="text-[9px] font-medium text-[#9CA3AF] uppercase tracking-wide truncate">{kpi.label}</span>
            </div>
            <p className={`text-sm font-bold tabular-nums font-mono ${
              kpi.color === 'emerald' ? 'text-emerald-700' :
              kpi.color === 'red' ? 'text-red-700' :
              kpi.color === 'amber' ? 'text-amber-700' :
              'text-foreground'
            }`}>{kpi.value}</p>
            {kpi.critical && <p className="text-[8px] text-red-600 font-medium mt-0.5">⚠ Needs attention</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
