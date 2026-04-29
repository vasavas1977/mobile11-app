import { useState } from "react";
import { useTelecomSubscriptions } from "@/hooks/useTelecomSubscriptions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { SubscriptionStatus } from "@/types/telecom";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  expired: "bg-gray-100 text-gray-600",
  terminated: "bg-red-100 text-red-700",
};

export function TelecomSubscriptions() {
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
  const { data, isLoading, refetch } = useTelecomSubscriptions({
    status: statusFilter !== "all" ? statusFilter as SubscriptionStatus : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SubscriptionStatus | "all")}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-white border-[#F3F0EB]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 border-[#F3F0EB]">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAF7F2]">
              <TableHead className="text-[11px] font-semibold">SIM</TableHead>
              <TableHead className="text-[11px] font-semibold">Plan</TableHead>
              <TableHead className="text-[11px] font-semibold">Status</TableHead>
              <TableHead className="text-[11px] font-semibold">Start</TableHead>
              <TableHead className="text-[11px] font-semibold">End</TableHead>
              <TableHead className="text-[11px] font-semibold">Renewal</TableHead>
              <TableHead className="text-[11px] font-semibold">Auto-Renew</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-[#9CA3AF]">Loading...</TableCell></TableRow>
            ) : !data?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-[#9CA3AF]">No subscriptions found.</TableCell></TableRow>
            ) : data.map((sub: any) => (
              <TableRow key={sub.id}>
                <TableCell className="font-mono text-xs">{sub.telecom_sim_cards?.iccid || sub.telecom_sim_cards?.msisdn || "—"}</TableCell>
                <TableCell className="text-xs">{sub.telecom_plans?.plan_name || "—"}</TableCell>
                <TableCell><Badge className={`text-[10px] capitalize border-0 ${STATUS_COLORS[sub.status]}`}>{sub.status}</Badge></TableCell>
                <TableCell className="text-xs">{format(new Date(sub.start_date), "dd MMM yyyy")}</TableCell>
                <TableCell className="text-xs">{sub.end_date ? format(new Date(sub.end_date), "dd MMM yyyy") : "—"}</TableCell>
                <TableCell className="text-xs">{sub.next_renewal_date ? format(new Date(sub.next_renewal_date), "dd MMM yyyy") : "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{sub.auto_renew ? "Yes" : "No"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
