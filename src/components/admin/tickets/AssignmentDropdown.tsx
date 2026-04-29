import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface AssignmentDropdownProps {
  ticketId: string;
  currentAssignedTo: string | null;
  currentUserId: string;
  admins: Array<{ id: string; name: string }>;
  onAssignmentChange?: () => void;
}

export const AssignmentDropdown = ({
  ticketId,
  currentAssignedTo,
  currentUserId,
  admins,
  onAssignmentChange,
}: AssignmentDropdownProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleAssignment = async (assignedTo: string | null) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ 
          assigned_to: assignedTo,
          updated_at: new Date().toISOString()
        })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Assignment updated",
        description: assignedTo ? "Ticket has been assigned" : "Assignment removed",
      });

      onAssignmentChange?.();
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignToMe = () => {
    handleAssignment(currentUserId);
  };

  return (
    <div className="flex gap-2">
      <Select
        value={currentAssignedTo || "unassigned"}
        onValueChange={(value) => handleAssignment(value === "unassigned" ? null : value)}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Assign to..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {admins.map((admin) => (
            <SelectItem key={admin.id} value={admin.id}>
              {admin.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {currentAssignedTo !== currentUserId && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAssignToMe}
          disabled={isUpdating}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Assign to me
        </Button>
      )}
    </div>
  );
};