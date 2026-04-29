import { Globe, Check, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_API_PARTNERS, WEBHOOK_EVENTS } from './apiPartnerData';

export function WebhooksTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#6B7280]">Manage webhook endpoints and event subscriptions for each API partner.</p>

      {MOCK_API_PARTNERS.map(p => (
        <div key={p.id} className="bg-white rounded-xl border border-[#F3F0EB] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{p.company_name}</h3>
            {!p.webhook_url && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="h-2.5 w-2.5 mr-1" />No webhook configured
              </Badge>
            )}
          </div>

          {p.webhook_url ? (
            <>
              <div className="mb-3">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase block mb-1">Endpoint URL</span>
                <code className="text-xs font-mono bg-[#FAF7F2] px-3 py-1.5 rounded-lg text-[#4B5563] block">{p.webhook_url}</code>
              </div>
              <div className="mb-3">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase block mb-1">Signing Secret</span>
                <code className="text-xs font-mono text-[#9CA3AF]">{p.webhook_secret_masked}</code>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase block mb-2">Subscribed Events</span>
                <div className="flex flex-wrap gap-1.5">
                  {WEBHOOK_EVENTS.map(evt => {
                    const subscribed = p.webhook_events.includes(evt);
                    return (
                      <Badge key={evt} variant="outline" className={`text-[10px] font-mono ${subscribed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        {subscribed ? <Check className="h-2.5 w-2.5 mr-1" /> : <X className="h-2.5 w-2.5 mr-1" />}
                        {evt}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#F3F0EB]">
                <Button variant="outline" size="sm" className="h-7 text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">Test Webhook</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs border-[#F3F0EB] text-[#6B7280] hover:bg-[#FAF7F2]">View Delivery Log</Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-[#9CA3AF] text-sm">
              No webhook endpoint configured for this partner.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
