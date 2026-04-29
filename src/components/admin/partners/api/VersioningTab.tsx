import { GitBranch, Check, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { API_VERSIONS } from './apiPartnerData';

const versionStatusStyles: Record<string, string> = {
  current: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  supported: 'bg-blue-50 text-blue-700 border-blue-200',
  deprecated: 'bg-amber-50 text-amber-700 border-amber-200',
  sunset: 'bg-red-50 text-red-700 border-red-200',
};

const versionIcons: Record<string, typeof Check> = {
  current: Check,
  supported: Check,
  deprecated: AlertTriangle,
  sunset: Clock,
};

export function VersioningTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#6B7280]">API version history and changelog. Partners should migrate to the current version for the best experience.</p>

      <div className="space-y-4">
        {API_VERSIONS.map((v, i) => {
          const Icon = versionIcons[v.status];
          return (
            <div key={v.version} className="bg-white rounded-xl border border-[#F3F0EB] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${v.status === 'current' ? 'bg-emerald-50' : v.status === 'supported' ? 'bg-blue-50' : v.status === 'deprecated' ? 'bg-amber-50' : 'bg-gray-100'}`}>
                    <GitBranch className={`h-4 w-4 ${v.status === 'current' ? 'text-emerald-600' : v.status === 'supported' ? 'text-blue-600' : v.status === 'deprecated' ? 'text-amber-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-mono text-[#1A1A1A]">{v.version}</span>
                      <Badge variant="outline" className={`text-[10px] ${versionStatusStyles[v.status]}`}>
                        <Icon className="h-2.5 w-2.5 mr-1" />{v.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-[#9CA3AF]">Released {v.date}</span>
                  </div>
                </div>
              </div>

              <div className="ml-11">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase block mb-1.5">Changes</span>
                <ul className="space-y-1">
                  {v.changes.map((change, ci) => (
                    <li key={ci} className="text-[13px] text-[#4B5563] flex items-start gap-2">
                      <span className="text-[#D1D5DB] mt-1">•</span>
                      <span className={change.startsWith('Breaking') ? 'text-red-600 font-medium' : ''}>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {i < API_VERSIONS.length - 1 && (
                <div className="ml-[19px] mt-3 h-4 border-l-2 border-dashed border-[#F3F0EB]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
