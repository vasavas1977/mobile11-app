import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface InternalNoteFormProps {
  ticketId: string;
  conversationId?: string | null;
  userId: string;
  onNoteAdded?: () => void;
}

export const InternalNoteForm = ({ ticketId, conversationId, userId, onNoteAdded }: InternalNoteFormProps) => {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      if (conversationId) {
        // Write to conversation_messages (new system)
        const { error } = await supabase
          .from("conversation_messages")
          .insert({
            conversation_id: conversationId,
            content: note,
            sender_type: "agent",
            sender_id: userId,
            is_internal_note: true,
          });

        if (error) throw error;
      } else {
        // Fallback to legacy ticket_messages
        const { error } = await supabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticketId,
            user_id: userId,
            message: note,
            sender_type: "admin",
            is_internal_note: true,
          });

        if (error) throw error;
      }

      setNote("");
      toast({
        title: "Internal note added",
        description: "Your note has been saved",
      });

      onNoteAdded?.();
    } catch (error) {
      console.error("Error adding internal note:", error);
      toast({
        title: "Error",
        description: "Failed to add internal note",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg">
      <div className="flex items-center gap-2 text-amber-600">
        <Lock className="h-4 w-4" />
        <span className="text-sm font-medium">Internal Note (Admin Only)</span>
      </div>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a private note for admin team..."
        className="min-h-[80px]"
      />
      <Button onClick={handleSubmit} disabled={isSubmitting || !note.trim()} size="sm">
        Add Internal Note
      </Button>
    </div>
  );
};
