import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Inbox, Timer, User } from "lucide-react";

interface TicketStatsProps {
  totalOpen: number;
  unassigned: number;
  urgent: number;
  myTickets: number;
}

export const TicketStats = ({ totalOpen, unassigned, urgent, myTickets }: TicketStatsProps) => {
  const stats = [
    { label: "Open Tickets", value: totalOpen, icon: Inbox, color: "text-primary" },
    { label: "Unassigned", value: unassigned, icon: User, color: "text-orange-500" },
    { label: "Urgent", value: urgent, icon: AlertTriangle, color: "text-destructive" },
    { label: "My Tickets", value: myTickets, icon: Timer, color: "text-blue-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};