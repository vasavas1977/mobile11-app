import { Server, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_API_PARTNERS, PARTNER_STATUS_STYLES } from './apiPartnerData';

export function SandboxTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#6B7280]">Manage sandbox and production environments for each API partner. Partners can test in sandbox before going live.</p>

      {MOCK_API_PARTNERS.map(p => (
        <div key={p.id} className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{p.company_name}</h3>
              <Badge variant="outline" className={`text-[10px] ${PARTNER_STATUS_STYLES[p.status]}`}>{p.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sandbox */}
            <div className={`border rounded-lg p-4 ${p.environment === 'sandbox' || p.environment === 'both' ? 'border-blue-200 bg-blue-50/30' : 'border-[#F3F0EB]'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-[#1A1A1A]">Sandbox</span>
                <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">
                  {p.environment === 'sandbox' ? 'Current' : 'Available'}
                </Badge>
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Key Prefix</span>
                  <code className="font-mono text-[#4B5563]">{p.sandbox_key_prefix}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Rate Limit</span>
                  <span className="text-[#4B5563]">100 RPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Test Orders</span>
                  <span className="text-[#4B5563]">No real charges</span>
                </div>
              </div>
            </div>

            {/* Production */}
            <div className={`border rounded-lg p-4 ${p.environment === 'production' || p.environment === 'both' ? 'border-emerald-200 bg-emerald-50/30' : 'border-[#F3F0EB]'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-[#1A1A1A]">Production</span>
                {(p.environment === 'production' || p.environment === 'both') && (
                  <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">Live</Badge>
                )}
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Key Prefix</span>
                  <code className="font-mono text-[#4B5563]">{p.production_key_prefix || '—'}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Rate Limit</span>
                  <span className="text-[#4B5563]">{p.rate_limit_rpm} RPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">IP Restriction</span>
                  <span className="text-[#4B5563]">{p.allowed_ips.length > 0 ? `${p.allowed_ips.length} IPs` : 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {p.environment === 'sandbox' && (
            <div className="mt-3 pt-3 border-t border-[#F3F0EB]">
              <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <ArrowRight className="h-3 w-3 mr-1" />Promote to Production
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
