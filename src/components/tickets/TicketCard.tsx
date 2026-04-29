import { Card } from "@/components/ui/card";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface TicketCardProps {
  ticket: {
    id: string;
    ticket_number: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
  };
}

export const TicketCard = ({ ticket }: TicketCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-muted-foreground">
              {ticket.ticket_number}
            </span>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
        <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
      </div>
    </Card>
  );
};