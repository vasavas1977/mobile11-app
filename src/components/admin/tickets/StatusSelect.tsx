import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StatusSelectProps {
  ticketId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

export const StatusSelect = ({ ticketId, currentStatus, onStatusChange }: StatusSelectProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "awaiting_customer", label: "Awaiting Response" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Set resolved_at timestamp when status changes to resolved or closed
      if ((newStatus === "resolved" || newStatus === "closed") && currentStatus !== "resolved" && currentStatus !== "closed") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Ticket status changed to ${statusOptions.find(s => s.value === newStatus)?.label}`,
      });

      onStatusChange?.();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isUpdating}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};