import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Circle } from "lucide-react";

interface TicketPriorityBadgeProps {
  priority: string;
}

export const TicketPriorityBadge = ({ priority }: TicketPriorityBadgeProps) => {
  const config: Record<string, { icon: React.ElementType, className: string, label: string }> = {
    urgent: { icon: AlertTriangle, className: "border-destructive text-destructive", label: "Urgent" },
    high: { icon: AlertCircle, className: "border-orange-500 text-orange-500", label: "High" },
    medium: { icon: Circle, className: "border-primary text-primary", label: "Medium" },
    low: { icon: Circle, className: "border-muted-foreground text-muted-foreground", label: "Low" },
  };

  const { icon: Icon, className, label } = config[priority] || config.medium;

  return (
    <Badge variant="outline" className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
};