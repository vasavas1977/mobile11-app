import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { FileAttachments } from "./FileAttachments";

interface MessageBubbleProps {
  message: {
    id: string;
    message: string;
    sender_type: string;
    created_at: string;
    is_internal_note?: boolean;
    attachments?: any;
  };
  isCurrentUser: boolean;
}

export const MessageBubble = ({ message, isCurrentUser }: MessageBubbleProps) => {
  const isAdmin = message.sender_type === "admin";
  const isSystem = message.sender_type === "system";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isCurrentUser && !isAdmin ? "flex-row-reverse" : "flex-row",
        message.is_internal_note && "opacity-60"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className={cn(
          isAdmin && "bg-primary text-primary-foreground",
          isSystem && "bg-muted"
        )}>
          {isAdmin ? "A" : isSystem ? "S" : "U"}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex-1 max-w-[70%]", isCurrentUser && !isAdmin && "text-right")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {isAdmin ? "Support Team" : isSystem ? "System" : "You"}
          </span>
          {message.is_internal_note && (
            <span className="text-xs text-muted-foreground">(Internal Note)</span>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg p-3 text-sm",
            isCurrentUser && !isAdmin
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {message.message}
        </div>
        {message.attachments && (
          <FileAttachments attachments={message.attachments} />
        )}
        <span className="text-xs text-muted-foreground mt-1 block">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};