import { Shield, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_API_PARTNERS, ALL_SCOPES, ALL_ENDPOINTS } from './apiPartnerData';

export function ScopesTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#6B7280]">Manage API scopes and endpoint permissions for each partner.</p>

      {MOCK_API_PARTNERS.map(p => (
        <div key={p.id} className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">{p.company_name}</h3>

          <div className="mb-4">
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase mb-2 block">Granted Scopes</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SCOPES.map(s => {
                const granted = p.scopes.includes(s.scope);
                return (
                  <Badge key={s.scope} variant="outline" className={`text-[10px] ${granted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    {granted ? <Check className="h-2.5 w-2.5 mr-1" /> : <X className="h-2.5 w-2.5 mr-1" />}
                    {s.scope}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase mb-2 block">Allowed Endpoints</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ENDPOINTS.map(ep => {
                const allowed = p.allowed_endpoints.includes(ep);
                return (
                  <Badge key={ep} variant="outline" className={`text-[10px] font-mono ${allowed ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    {ep}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
