import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ScoreBreakdownProps {
  scores: { label: string; value: number | null; max?: number }[];
  size?: "sm" | "md";
  className?: string;
}

export function ScoreBreakdown({ scores, size = "md", className }: ScoreBreakdownProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {scores.map((score) => {
        const val = score.value ?? 0;
        const max = score.max ?? 100;
        const pct = Math.round((val / max) * 100);
        const color =
          pct >= 80 ? "text-emerald-600" :
          pct >= 60 ? "text-amber-600" :
          "text-red-600";

        return (
          <div key={score.label} className="flex items-center gap-2">
            <span className={cn(
              "text-muted-foreground font-medium min-w-0 truncate",
              size === "sm" ? "text-[11px] w-20" : "text-xs w-28"
            )}>
              {score.label}
            </span>
            <Progress
              value={pct}
              className={cn("flex-1", size === "sm" ? "h-1.5" : "h-2")}
            />
            <span className={cn(
              "font-semibold tabular-nums",
              color,
              size === "sm" ? "text-[11px] w-7 text-right" : "text-xs w-8 text-right"
            )}>
              {score.value !== null ? val : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface CompositeScoreProps {
  score: number | null;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CompositeScore({ score, label, size = "md", className }: CompositeScoreProps) {
  const val = score ?? 0;
  const color =
    val >= 80 ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
    val >= 60 ? "text-amber-600 border-amber-200 bg-amber-50" :
    val >= 1 ? "text-red-600 border-red-200 bg-red-50" :
    "text-muted-foreground border-border bg-muted/50";

  return (
    <div className={cn(
      "inline-flex flex-col items-center justify-center rounded-xl border",
      color,
      size === "sm" ? "h-12 w-12" : size === "lg" ? "h-20 w-20" : "h-16 w-16",
      className
    )}>
      <span className={cn(
        "font-bold leading-none",
        size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg"
      )}>
        {score !== null ? val : "—"}
      </span>
      {label && (
        <span className="text-[9px] font-medium opacity-70 mt-0.5">{label}</span>
      )}
    </div>
  );
}
