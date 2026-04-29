import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';

export function PolicyAuditTab() {
  // In a real implementation, this would query an audit log table for fallback policy changes
  // For now, show a structurally complete empty state

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[#FAF7F2] border border-[#F3F0EB] flex items-center justify-center flex-shrink-0 mt-0.5">
          <ScrollText className="h-3.5 w-3.5 text-[#6B7280]" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-foreground">Policy Change History</p>
          <p className="text-[9px] text-[#9CA3AF]">Track all modifications to fallback rules, conditions, and routing configurations.</p>
        </div>
      </div>

      {/* Table structure */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <div className="grid grid-cols-7 gap-0 border-b border-[#F3F0EB] bg-[#FAFAF8]">
          {['Timestamp', 'Admin', 'Action', 'Rule Name', 'Before → After', 'Type', 'Note'].map(h => (
            <div key={h} className="px-3 py-2">
              <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div className="p-8 text-center">
          <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center mx-auto mb-2">
            <ScrollText className="h-3.5 w-3.5 text-[#9CA3AF]" />
          </div>
          <p className="text-[11px] font-medium text-[#6B7280]">No policy changes recorded yet</p>
          <p className="text-[9px] text-[#9CA3AF] mt-0.5">Changes to fallback rules, conditions, and routing will be logged here automatically.</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">Live</Badge>
          <span className="text-[9px] text-[#9CA3AF]">Applied to production</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">Simulated</Badge>
          <span className="text-[9px] text-[#9CA3AF]">Test run only</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">Rolled Back</Badge>
          <span className="text-[9px] text-[#9CA3AF]">Reverted change</span>
        </div>
      </div>
    </div>
  );
}
