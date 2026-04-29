import { useState } from "react";
import { useTelecomSIMs } from "@/hooks/useTelecomSIMs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Upload, RefreshCw } from "lucide-react";
import { SIMDetailDrawer } from "./SIMDetailDrawer";
import { BulkImportSIMs } from "./BulkImportSIMs";
import type { SimStatus, SimType } from "@/types/telecom";

const STATUS_COLORS: Record<string, string> = {
  inventory: "bg-gray-100 text-gray-700",
  reserved: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  deactivated: "bg-red-100 text-red-700",
  lost: "bg-red-200 text-red-800",
};

export function TelecomInventory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SimStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SimType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { data: sims, isLoading, refetch } = useTelecomSIMs({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter as SimStatus : undefined,
    sim_type: typeFilter !== "all" ? typeFilter as SimType : undefined,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            placeholder="Search by ICCID, MSISDN, or IMSI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-white border-[#F3F0EB]"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SimStatus | "all")}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-white border-[#F3F0EB]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as SimType | "all")}>
          <SelectTrigger className="w-[120px] h-9 text-xs bg-white border-[#F3F0EB]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="physical">Physical</SelectItem>
            <SelectItem value="esim">eSIM</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 border-[#F3F0EB]">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="h-9 gap-1.5 border-[#F3F0EB]">
          <Upload className="h-3.5 w-3.5" /> Import
        </Button>
        <Button size="sm" className="h-9 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-3.5 w-3.5" /> Add SIM
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {["inventory", "active", "suspended", "reserved", "deactivated", "lost"].map((s) => {
          const count = sims?.filter((sim: any) => sim.status === s).length ?? 0;
          return (
            <div key={s} className="bg-white rounded-lg border border-[#F3F0EB] p-3 text-center">
              <div className="text-lg font-bold text-[#1A1A1A]">{count}</div>
              <div className="text-[10px] uppercase text-[#9CA3AF] font-medium tracking-wide">{s}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAF7F2]">
              <TableHead className="text-[11px] font-semibold">ICCID</TableHead>
              <TableHead className="text-[11px] font-semibold">MSISDN</TableHead>
              <TableHead className="text-[11px] font-semibold">Type</TableHead>
              <TableHead className="text-[11px] font-semibold">Status</TableHead>
              <TableHead className="text-[11px] font-semibold">Provider</TableHead>
              <TableHead className="text-[11px] font-semibold">Batch</TableHead>
              <TableHead className="text-[11px] font-semibold">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-[#9CA3AF]">Loading...</TableCell></TableRow>
            ) : !sims?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-[#9CA3AF]">No SIM cards found. Import or add SIMs to get started.</TableCell></TableRow>
            ) : sims.map((sim: any) => (
              <TableRow
                key={sim.id}
                className="cursor-pointer hover:bg-[#FAF7F2]/50"
                onClick={() => setSelectedId(sim.id)}
              >
                <TableCell className="font-mono text-xs">{sim.iccid || "—"}</TableCell>
                <TableCell className="text-xs">{sim.msisdn || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] capitalize">{sim.sim_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] capitalize border-0 ${STATUS_COLORS[sim.status] || ""}`}>{sim.status}</Badge>
                </TableCell>
                <TableCell className="text-xs">{sim.esim_providers?.name || "—"}</TableCell>
                <TableCell className="text-xs text-[#6B7280]">{sim.batch_id || "—"}</TableCell>
                <TableCell className="text-xs text-[#6B7280]">{new Date(sim.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SIMDetailDrawer simId={selectedId} onClose={() => setSelectedId(null)} />
      <BulkImportSIMs open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
