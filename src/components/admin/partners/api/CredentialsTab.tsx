import { Key, Eye, EyeOff, Copy, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { MOCK_API_PARTNERS, PARTNER_STATUS_STYLES } from './apiPartnerData';
import { useToast } from '@/hooks/use-toast';

export function CredentialsTab() {
  const { toast } = useToast();
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'API key copied to clipboard' });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6B7280]">Manage API keys and secrets for each partner. Production keys are masked for security.</p>

      {MOCK_API_PARTNERS.map(p => (
        <div key={p.id} className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{p.company_name}</h3>
              <Badge variant="outline" className={`text-[10px] ${PARTNER_STATUS_STYLES[p.status]}`}>{p.status}</Badge>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50">
              <ShieldAlert className="h-3 w-3 mr-1" />Revoke All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Production Key */}
            <div className="border border-[#F3F0EB] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Production Key</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-[#FAF7F2] px-2 py-1.5 rounded text-[#4B5563]">
                  {revealedKeys[`${p.id}_prod`] ? `${p.production_key_prefix}_full_key_here` : `${p.production_key_prefix}••••••••••••`}
                </code>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#9CA3AF] hover:bg-[#FAF7F2]" onClick={() => toggleReveal(`${p.id}_prod`)}>
                  {revealedKeys[`${p.id}_prod`] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#9CA3AF] hover:bg-[#FAF7F2]" onClick={() => copyKey(p.production_key_prefix)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-[#9CA3AF]">Secret:</span>
                <code className="text-xs font-mono text-[#9CA3AF]">{p.api_secret_masked}</code>
              </div>
            </div>

            {/* Sandbox Key */}
            <div className="border border-[#F3F0EB] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase">Sandbox Key</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-[#FAF7F2] px-2 py-1.5 rounded text-[#4B5563]">
                  {revealedKeys[`${p.id}_test`] ? `${p.sandbox_key_prefix}_full_test_key` : `${p.sandbox_key_prefix}••••••••••••`}
                </code>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#9CA3AF] hover:bg-[#FAF7F2]" onClick={() => toggleReveal(`${p.id}_test`)}>
                  {revealedKeys[`${p.id}_test`] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#9CA3AF] hover:bg-[#FAF7F2]" onClick={() => copyKey(p.sandbox_key_prefix)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t border-[#F3F0EB]">
            <Button variant="outline" size="sm" className="h-7 text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
              <RefreshCw className="h-3 w-3 mr-1" />Rotate Production Key
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">
              <RefreshCw className="h-3 w-3 mr-1" />Rotate Sandbox Key
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
