import { Badge } from "@/components/ui/badge";

interface TicketStatusBadgeProps {
  status: string;
}

export const TicketStatusBadge = ({ status }: TicketStatusBadgeProps) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
    open: { variant: "default", label: "Open" },
    in_progress: { variant: "secondary", label: "In Progress" },
    awaiting_customer: { variant: "outline", label: "Awaiting Response" },
    resolved: { variant: "secondary", label: "Resolved" },
    closed: { variant: "outline", label: "Closed" },
  };

  const config = variants[status] || { variant: "outline" as const, label: status };

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.label}
    </Badge>
  );
};