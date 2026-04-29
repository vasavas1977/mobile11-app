import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import {
  useBridgeLogs,
  summarizeCalls,
  computeHealthKPIs,
  computeGreetingLatencies,
  bucketLatencies,
  computeCloseReasons,
  getActivePayloadShape,
  computeAvgGreetingLatency,
  isLiveStatus,
  CallSummary,
} from "@/hooks/useBridgeMonitor";
import { HealthHeader } from "./bridge-monitor/HealthHeader";
import { IncidentFeed } from "./bridge-monitor/IncidentFeed";
import { CallTimelineSheet } from "./bridge-monitor/CallTimelineSheet";
import { LatencyHistogram } from "./bridge-monitor/LatencyHistogram";
import { CloseReasonPie } from "./bridge-monitor/CloseReasonPie";
import { ManualRollbackButton } from "./bridge-monitor/ManualRollbackButton";

export function BridgeMonitorPage() {
  const navigate = useNavigate();
  const [windowMinutes, setWindowMinutes] = useState(60);
  const { rows, loading, refetch } = useBridgeLogs(windowMinutes);
  const [selected, setSelected] = useState<CallSummary | null>(null);

  const calls = useMemo(() => summarizeCalls(rows), [rows]);
  const kpis = useMemo(() => computeHealthKPIs(calls), [calls]);
  const latencies = useMemo(() => computeGreetingLatencies(rows), [rows]);
  const buckets = useMemo(() => bucketLatencies(latencies), [latencies]);
  const reasons = useMemo(() => computeCloseReasons(rows), [rows]);
  const payloadShape = useMemo(() => getActivePayloadShape(rows), [rows]);
  const avgLatency = useMemo(() => computeAvgGreetingLatency(latencies), [latencies]);
  const liveStatus = useMemo(() => isLiveStatus(rows), [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/contact-center")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <AdminPageHeader
        title="Gemini 3.1 Migration Monitor"
        description="Real-time validation of the +gemini-3.1-setup-fix deployment"
      >
        <Select value={String(windowMinutes)} onValueChange={(v) => setWindowMinutes(Number(v))}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="60">Last 1 hour</SelectItem>
            <SelectItem value="360">Last 6 hours</SelectItem>
            <SelectItem value="1440">Last 24 hours</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <ManualRollbackButton />
      </AdminPageHeader>

      <HealthHeader
        liveStatus={liveStatus}
        successRate={kpis.successRate}
        setupFixEligible={kpis.setupFixEligible}
        avgLatencyMs={avgLatency}
        payloadShape={payloadShape}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <LatencyHistogram buckets={buckets} />
        <CloseReasonPie reasons={reasons} />
      </div>

      <IncidentFeed calls={calls} onSelect={setSelected} />
      <CallTimelineSheet call={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
