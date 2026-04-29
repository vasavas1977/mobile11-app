import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CallSummary } from "@/hooks/useBridgeMonitor";
import { formatDistanceToNow } from "date-fns";

interface Props {
  calls: CallSummary[];
  onSelect: (call: CallSummary) => void;
}

export function IncidentFeed({ calls, onSelect }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F3F0EB]">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Recent Calls</h3>
        <p className="text-xs text-[#9CA3AF]">Last 20 — click row for full timeline</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[11px]">Call</TableHead>
            <TableHead className="text-[11px]">Build</TableHead>
            <TableHead className="text-[11px]">Started</TableHead>
            <TableHead className="text-[11px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.slice(0, 20).map((c) => (
            <TableRow key={c.callSid} onClick={() => onSelect(c)} className="cursor-pointer">
              <TableCell className="font-mono text-xs">…{c.callSid.slice(-8)}</TableCell>
              <TableCell className="font-mono text-[10px] text-[#6B7280]">
                {c.buildVersion ? (c.buildVersion.includes("3.1-setup-fix") ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">3.1-fix</Badge> : c.buildVersion.slice(-20)) : "—"}
              </TableCell>
              <TableCell className="text-xs text-[#6B7280]">
                {formatDistanceToNow(new Date(c.startedAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                {c.status === "success" && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">success</Badge>}
                {c.status === "failed" && <Badge className="bg-red-100 text-red-700 border-red-200">failed{c.failReason ? ` · ${c.failReason.slice(0, 30)}` : ""}</Badge>}
                {c.status === "stalled" && <Badge className="bg-orange-100 text-orange-700 border-orange-200">stalled{c.failReason ? ` · ${c.failReason.slice(0, 30)}` : ""}</Badge>}
                {c.status === "in_progress" && <Badge className="bg-amber-100 text-amber-700 border-amber-200">in progress</Badge>}
              </TableCell>
            </TableRow>
          ))}
          {!calls.length && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-sm text-[#9CA3AF] py-8">No calls in window</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
