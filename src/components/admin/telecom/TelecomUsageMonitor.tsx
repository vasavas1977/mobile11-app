import { useState } from "react";
import { useTelecomSIMs } from "@/hooks/useTelecomSIMs";
import { useTelecomUsage } from "@/hooks/useTelecomUsage";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export function TelecomUsageMonitor() {
  const [search, setSearch] = useState("");
  const [selectedSim, setSelectedSim] = useState<string | null>(null);
  const { data: sims } = useTelecomSIMs({ status: "active", search: search || undefined });
  const { data: usage, isLoading: usageLoading } = useTelecomUsage(selectedSim || undefined);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <Input
          placeholder="Search active SIMs by ICCID or MSISDN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-white border-[#F3F0EB]"
        />
      </div>

      {!selectedSim ? (
        <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAF7F2]">
                <TableHead className="text-[11px] font-semibold">ICCID</TableHead>
                <TableHead className="text-[11px] font-semibold">MSISDN</TableHead>
                <TableHead className="text-[11px] font-semibold">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!sims?.length ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-sm text-[#9CA3AF]">No active SIMs. Select an active SIM to view usage.</TableCell></TableRow>
              ) : sims.map((sim: any) => (
                <TableRow key={sim.id} className="cursor-pointer hover:bg-[#FAF7F2]/50" onClick={() => setSelectedSim(sim.id)}>
                  <TableCell className="font-mono text-xs">{sim.iccid || "—"}</TableCell>
                  <TableCell className="text-xs">{sim.msisdn || "—"}</TableCell>
                  <TableCell className="text-xs capitalize">{sim.sim_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => setSelectedSim(null)} className="text-xs text-orange-500 hover:underline">← Back to SIM list</button>
          <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FAF7F2]">
                  <TableHead className="text-[11px] font-semibold">Date</TableHead>
                  <TableHead className="text-[11px] font-semibold">Data Used (MB)</TableHead>
                  <TableHead className="text-[11px] font-semibold">Remaining (MB)</TableHead>
                  <TableHead className="text-[11px] font-semibold">Voice (min)</TableHead>
                  <TableHead className="text-[11px] font-semibold">SMS</TableHead>
                  <TableHead className="text-[11px] font-semibold">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-[#9CA3AF]">Loading...</TableCell></TableRow>
                ) : !usage?.length ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-[#9CA3AF]">No usage records for this SIM.</TableCell></TableRow>
                ) : usage.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{format(new Date(r.record_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-xs font-mono">{r.data_used_mb}</TableCell>
                    <TableCell className="text-xs font-mono">{r.data_remaining_mb ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.voice_used_minutes}</TableCell>
                    <TableCell className="text-xs">{r.sms_used}</TableCell>
                    <TableCell className="text-xs capitalize">{r.sync_source.replace("_", " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
