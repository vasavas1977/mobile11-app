import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";

interface DataListProps {
  title: string;
  icon?: LucideIcon;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function DataList({ title, icon: Icon, emptyMessage, children, className, action }: DataListProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-white", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      <div className="divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

interface DataListItemProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  metric?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function DataListItem({ title, subtitle, icon: Icon, badge, metric, onClick, className, children }: DataListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors",
        onClick && "cursor-pointer hover:bg-muted/30",
        className
      )}
      onClick={onClick}
    >
      {Icon && (
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{title}</span>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
        {children}
      </div>
      {metric && (
        <div className="flex-shrink-0 text-right">
          {metric}
        </div>
      )}
      {onClick && (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );
}

interface DataListEmptyProps {
  message?: string;
  icon?: LucideIcon;
}

export function DataListEmpty({ message = "No items", icon: Icon }: DataListEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      {Icon && <Icon className="h-8 w-8 mb-2 opacity-40" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
