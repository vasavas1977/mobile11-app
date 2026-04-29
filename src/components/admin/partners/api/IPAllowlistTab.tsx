import { Shield, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_API_PARTNERS } from './apiPartnerData';

export function IPAllowlistTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#6B7280]">Manage IP allowlists for API partner access. Only requests from allowed IPs are accepted in production.</p>

      {MOCK_API_PARTNERS.map(p => (
        <div key={p.id} className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{p.company_name}</h3>
              {p.allowed_ips.length === 0 && (
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">No IPs — open access</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
              <Plus className="h-3 w-3 mr-1" />Add IP
            </Button>
          </div>

          {p.allowed_ips.length > 0 ? (
            <div className="space-y-1.5">
              {p.allowed_ips.map((ip, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-[#FAF7F2] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    <code className="text-xs font-mono text-[#4B5563]">{ip}</code>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[#D1D5DB] hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[#9CA3AF] text-sm">
              No IP restrictions configured. All IPs are allowed (sandbox mode typical).
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
