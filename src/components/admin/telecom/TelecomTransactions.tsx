import { useTelecomAllTransactions } from "@/hooks/useTelecomUsage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const TYPE_COLORS: Record<string, string> = {
  activation: "bg-emerald-100 text-emerald-700",
  suspension: "bg-amber-100 text-amber-700",
  reactivation: "bg-blue-100 text-blue-700",
  termination: "bg-red-100 text-red-700",
  topup: "bg-purple-100 text-purple-700",
  plan_change: "bg-indigo-100 text-indigo-700",
  renewal: "bg-teal-100 text-teal-700",
};

export function TelecomTransactions() {
  const { data, isLoading } = useTelecomAllTransactions();

  return (
    <div className="bg-white rounded-xl border border-[#F3F0EB] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#FAF7F2]">
            <TableHead className="text-[11px] font-semibold">Type</TableHead>
            <TableHead className="text-[11px] font-semibold">SIM</TableHead>
            <TableHead className="text-[11px] font-semibold">Amount</TableHead>
            <TableHead className="text-[11px] font-semibold">Status</TableHead>
            <TableHead className="text-[11px] font-semibold">MNO Ref</TableHead>
            <TableHead className="text-[11px] font-semibold">Notes</TableHead>
            <TableHead className="text-[11px] font-semibold">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-[#9CA3AF]">Loading...</TableCell></TableRow>
          ) : !data?.length ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-[#9CA3AF]">No transactions yet.</TableCell></TableRow>
          ) : data.map((tx: any) => (
            <TableRow key={tx.id}>
              <TableCell><Badge className={`text-[10px] capitalize border-0 ${TYPE_COLORS[tx.transaction_type] || ""}`}>{tx.transaction_type.replace("_", " ")}</Badge></TableCell>
              <TableCell className="font-mono text-xs">{tx.telecom_sim_cards?.iccid || tx.telecom_sim_cards?.msisdn || "—"}</TableCell>
              <TableCell className="text-xs">{tx.amount > 0 ? `${tx.currency} ${tx.amount}` : "—"}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px] capitalize">{tx.status}</Badge></TableCell>
              <TableCell className="text-xs text-[#6B7280]">{tx.mno_transaction_id || "—"}</TableCell>
              <TableCell className="text-xs text-[#6B7280] max-w-[200px] truncate">{tx.notes || "—"}</TableCell>
              <TableCell className="text-xs">{format(new Date(tx.created_at), "dd MMM HH:mm")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
