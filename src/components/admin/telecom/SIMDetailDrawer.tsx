import { useTelecomSIMDetail } from "@/hooks/useTelecomSIMs";
import { useTelecomSubscriptions } from "@/hooks/useTelecomSubscriptions";
import { useTelecomUsage, useTelecomTransactions as useSIMTransactions } from "@/hooks/useTelecomUsage";
import { useTelecomJobs } from "@/hooks/useTelecomJobs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Props {
  simId: string | null;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  inventory: "bg-gray-100 text-gray-700",
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  deactivated: "bg-red-100 text-red-700",
};

export function SIMDetailDrawer({ simId, onClose }: Props) {
  const { data: sim } = useTelecomSIMDetail(simId);
  const { data: subs } = useTelecomSubscriptions({ sim_card_id: simId || undefined });
  const { data: usage } = useTelecomUsage(simId || undefined);
  const { data: txs } = useSIMTransactions(simId || undefined);
  const { data: jobs } = useTelecomJobs({ sim_card_id: simId || undefined });

  return (
    <Sheet open={!!simId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg bg-[#FAF7F2] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">SIM Detail</SheetTitle>
        </SheetHeader>

        {sim && (
          <div className="mt-4 space-y-4">
            {/* Overview */}
            <div className="bg-white rounded-lg border border-[#F3F0EB] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">Status</span>
                <Badge className={`text-[10px] capitalize border-0 ${STATUS_COLORS[sim.status] || ""}`}>{sim.status}</Badge>
              </div>
              {[
                ["Type", sim.sim_type],
                ["ICCID", sim.iccid],
                ["MSISDN", sim.msisdn],
                ["IMSI", sim.imsi],
                ["Provider", (sim as any).esim_providers?.name],
                ["MNO Ref", sim.mno_reference_id],
                ["Batch", sim.batch_id],
                ["Activated", sim.activation_date ? format(new Date(sim.activation_date), "dd MMM yyyy HH:mm") : null],
                ["Created", format(new Date(sim.created_at), "dd MMM yyyy HH:mm")],
              ].map(([label, value]) => value ? (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">{label}</span>
                  <span className="text-xs font-medium text-[#1A1A1A] font-mono">{value}</span>
                </div>
              ) : null)}
            </div>

            <Tabs defaultValue="subscriptions">
              <TabsList className="bg-white border border-[#F3F0EB] h-8">
                <TabsTrigger value="subscriptions" className="text-[10px]">Subscriptions ({subs?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="usage" className="text-[10px]">Usage ({usage?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="jobs" className="text-[10px]">Jobs ({jobs?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="transactions" className="text-[10px]">Transactions ({txs?.length ?? 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="subscriptions" className="space-y-2 mt-3">
                {!subs?.length ? <p className="text-xs text-[#9CA3AF]">No subscriptions</p> : subs.map((s: any) => (
                  <div key={s.id} className="bg-white rounded-lg border border-[#F3F0EB] p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{s.telecom_plans?.plan_name}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{s.status}</Badge>
                    </div>
                    <p className="text-[10px] text-[#6B7280]">
                      {format(new Date(s.start_date), "dd MMM yyyy")} — {s.end_date ? format(new Date(s.end_date), "dd MMM yyyy") : "ongoing"}
                    </p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="usage" className="space-y-2 mt-3">
                {!usage?.length ? <p className="text-xs text-[#9CA3AF]">No usage records</p> : usage.slice(0, 10).map((u: any) => (
                  <div key={u.id} className="bg-white rounded-lg border border-[#F3F0EB] p-3 flex items-center justify-between">
                    <span className="text-xs">{format(new Date(u.record_date), "dd MMM")}</span>
                    <span className="text-xs font-mono">{u.data_used_mb} MB used</span>
                    <span className="text-[10px] text-[#6B7280] capitalize">{u.sync_source.replace("_", " ")}</span>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="jobs" className="space-y-2 mt-3">
                {!jobs?.length ? <p className="text-xs text-[#9CA3AF]">No jobs</p> : jobs.map((j: any) => (
                  <div key={j.id} className="bg-white rounded-lg border border-[#F3F0EB] p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] capitalize">{j.job_type}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{j.status}</Badge>
                    </div>
                    {j.error_message && <p className="text-[10px] text-red-500">{j.error_message}</p>}
                    <p className="text-[10px] text-[#6B7280]">{format(new Date(j.created_at), "dd MMM HH:mm")}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-2 mt-3">
                {!txs?.length ? <p className="text-xs text-[#9CA3AF]">No transactions</p> : txs.map((tx: any) => (
                  <div key={tx.id} className="bg-white rounded-lg border border-[#F3F0EB] p-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] capitalize">{tx.transaction_type.replace("_", " ")}</Badge>
                    <span className="text-xs">{tx.amount > 0 ? `${tx.currency} ${tx.amount}` : "—"}</span>
                    <span className="text-[10px] text-[#6B7280]">{format(new Date(tx.created_at), "dd MMM HH:mm")}</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
