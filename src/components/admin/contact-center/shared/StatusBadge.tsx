import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
type StatusType = "active" | "pending" | "completed" | "failed" | "draft" | "approved" | "rejected" | "running" | "paused";

const severityConfig: Record<SeverityLevel, { className: string; dot: string }> = {
  critical: { className: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  high: { className: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  medium: { className: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  low: { className: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  info: { className: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
};

const statusConfig: Record<StatusType, { className: string; dot: string }> = {
  active: { className: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  completed: { className: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  approved: { className: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  running: { className: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500 animate-pulse" },
  pending: { className: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  paused: { className: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
  draft: { className: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
  failed: { className: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  rejected: { className: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
};

interface SeverityBadgeProps {
  severity: SeverityLevel;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function SeverityBadge({ severity, label, size = "sm", className }: SeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.info;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium border capitalize",
        config.className,
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        className
      )}
    >
      <span className={cn("rounded-full flex-shrink-0", config.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      {label || severity}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, label, size = "sm", className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium border capitalize",
        config.className,
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        className
      )}
    >
      <span className={cn("rounded-full flex-shrink-0", config.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      {label || status}
    </Badge>
  );
}

interface FailureTypeBadgeProps {
  type: string;
  size?: "sm" | "md";
  className?: string;
}

const failureTypeLabels: Record<string, string> = {
  wrong_answer: "Wrong Answer",
  hallucination: "Hallucination",
  language_mismatch: "Language Mismatch",
  tone_inappropriate: "Bad Tone",
  missing_knowledge: "Missing KB",
  missing_kb: "Missing KB",
  policy_violation: "Policy Violation",
  loop_detected: "Loop",
  failed_handoff: "Failed Handoff",
  timeout: "Timeout",
  incomplete_answer: "Incomplete",
  unclear_answer: "Unclear",
  wrong_language: "Wrong Language",
  weak_empathy: "Weak Empathy",
  policy_risk: "Policy Risk",
  dead_air_trigger: "Dead Air",
  unresolved_issue: "Unresolved",
  repeated_contact_risk: "Repeat Risk",
  missing_backend_action: "Missing Action",
  wrong_intent_classification: "Wrong Intent",
};

export function FailureTypeBadge({ type, size = "sm", className }: FailureTypeBadgeProps) {
  const label = failureTypeLabels[type] || type.replace(/_/g, " ");
  const severity: SeverityLevel =
    ["hallucination", "policy_violation", "policy_risk"].includes(type) ? "critical" :
    ["wrong_answer", "missing_backend_action", "failed_handoff"].includes(type) ? "high" :
    ["missing_knowledge", "missing_kb", "incomplete_answer", "unresolved_issue"].includes(type) ? "medium" :
    "low";

  return <SeverityBadge severity={severity} label={label} size={size} className={className} />;
}
