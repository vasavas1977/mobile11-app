import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CallSummary } from "@/hooks/useBridgeMonitor";
import { format } from "date-fns";

interface Props {
  call: CallSummary | null;
  onOpenChange: (open: boolean) => void;
}

export function CallTimelineSheet({ call, onOpenChange }: Props) {
  return (
    <Sheet open={!!call} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">Call …{call?.callSid.slice(-12)}</SheetTitle>
        </SheetHeader>
        {call && (
          <div className="mt-4 space-y-2">
            {call.stages.map((s) => (
              <div key={s.id} className="border border-[#F3F0EB] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{s.stage}</span>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">
                    {format(new Date(s.created_at), "HH:mm:ss.SSS")}
                  </span>
                </div>
                {s.message && <p className="text-xs text-[#6B7280] mb-1">{s.message}</p>}
                {s.metadata && Object.keys(s.metadata).length > 0 && (
                  <pre className="text-[10px] bg-[#FAF7F2] rounded p-2 overflow-x-auto font-mono text-[#374151]">
                    {JSON.stringify(s.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
