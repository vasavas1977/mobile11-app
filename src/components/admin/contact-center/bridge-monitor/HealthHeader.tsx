import { Activity, CheckCircle2, Timer, Layers } from "lucide-react";
import { AdminKPICard } from "@/components/admin/ui/AdminKPICard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  liveStatus: "healthy" | "degraded" | "idle";
  successRate: number | null;
  setupFixEligible: number;
  avgLatencyMs: number | null;
  payloadShape: { shape: string; buildVersion: string | null; at: string } | null;
}

export function HealthHeader({ liveStatus, successRate, setupFixEligible, avgLatencyMs, payloadShape }: Props) {
  const statusColor = {
    healthy: "bg-emerald-500",
    degraded: "bg-red-500",
    idle: "bg-gray-400",
  }[liveStatus];
  const statusLabel = { healthy: "Live · Healthy", degraded: "Live · Degraded", idle: "No recent traffic" }[liveStatus];

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full animate-pulse", statusColor)} />
        <span className="text-sm font-medium text-[#1A1A1A]">{statusLabel}</span>
        <Badge variant="outline" className="ml-2 text-[10px]">Phase B · Gemini 3.1</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <AdminKPICard
          label="Setup-Fix Success Rate"
          value={successRate === null ? "—" : `${successRate.toFixed(1)}%`}
          icon={CheckCircle2}
          accent={successRate === null ? "default" : successRate >= 90 ? "success" : successRate >= 70 ? "warning" : "error"}
          trend={setupFixEligible ? { value: setupFixEligible, label: "calls" } : undefined}
        />
        <AdminKPICard
          label="Avg Greeting → Audio"
          value={avgLatencyMs === null ? "—" : `${Math.round(avgLatencyMs)} ms`}
          icon={Timer}
          accent={avgLatencyMs === null ? "default" : avgLatencyMs <= 800 ? "success" : avgLatencyMs <= 1400 ? "warning" : "error"}
        />
        <AdminKPICard
          label="Active Payload Shape"
          value={payloadShape?.shape ?? "—"}
          icon={Layers}
          accent="default"
        />
      </div>
      {payloadShape?.buildVersion && (
        <p className="text-[10px] text-[#9CA3AF] font-mono">build: {payloadShape.buildVersion}</p>
      )}
    </div>
  );
}
