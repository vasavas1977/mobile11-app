import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  success: "border-emerald-200 bg-emerald-50/50",
  warning: "border-amber-200 bg-amber-50/50",
  danger: "border-red-200 bg-red-50/50",
  info: "border-blue-200 bg-blue-50/50",
};

const iconVariantStyles = {
  default: "text-muted-foreground bg-muted/50",
  success: "text-emerald-600 bg-emerald-100",
  warning: "text-amber-600 bg-amber-100",
  danger: "text-red-600 bg-red-100",
  info: "text-blue-600 bg-blue-100",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  suffix,
  variant = "default",
  size = "md",
  className,
}: MetricCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? "text-emerald-600" : trend && trend < 0 ? "text-red-600" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-xl border bg-white transition-shadow hover:shadow-sm",
        variantStyles[variant],
        size === "sm" ? "p-3" : size === "lg" ? "p-5" : "p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-muted-foreground font-medium truncate",
            size === "sm" ? "text-[11px]" : "text-xs"
          )}>
            {label}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={cn(
              "font-bold text-foreground leading-none",
              size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl"
            )}>
              {value}
            </span>
            {suffix && (
              <span className="text-xs text-muted-foreground font-medium">{suffix}</span>
            )}
          </div>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 mt-1.5", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-[11px] font-medium">
                {trend > 0 ? "+" : ""}{trend}%
                {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "flex-shrink-0 rounded-lg flex items-center justify-center",
            iconVariantStyles[variant],
            size === "sm" ? "h-8 w-8" : "h-10 w-10"
          )}>
            <Icon className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
          </div>
        )}
      </div>
    </div>
  );
}
