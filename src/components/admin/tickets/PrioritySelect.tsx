import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, AlertTriangle, Circle } from "lucide-react";

interface PrioritySelectProps {
  ticketId: string;
  currentPriority: string;
  onPriorityChange?: () => void;
}

export const PrioritySelect = ({ ticketId, currentPriority, onPriorityChange }: PrioritySelectProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const priorityOptions = [
    { value: "low", label: "Low", icon: Circle, color: "text-muted-foreground" },
    { value: "medium", label: "Medium", icon: Circle, color: "text-primary" },
    { value: "high", label: "High", icon: AlertCircle, color: "text-orange-500" },
    { value: "urgent", label: "Urgent", icon: AlertTriangle, color: "text-destructive" },
  ];

  const handlePriorityChange = async (newPriority: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ 
          priority: newPriority,
          updated_at: new Date().toISOString()
        })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Priority updated",
        description: `Ticket priority changed to ${priorityOptions.find(p => p.value === newPriority)?.label}`,
      });

      onPriorityChange?.();
    } catch (error) {
      console.error("Error updating priority:", error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={currentPriority} onValueChange={handlePriorityChange} disabled={isUpdating}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {priorityOptions.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${option.color}`} />
                {option.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};