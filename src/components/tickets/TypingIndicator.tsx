import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  typingUsers: string[];
  className?: string;
  compact?: boolean;
}

export const TypingIndicator = ({ typingUsers, className, compact = false }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const displayText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : `${typingUsers.length} people are typing`;

  return (
    <div className={cn(
      "flex items-center gap-2 text-muted-foreground",
      compact ? "text-xs py-1" : "text-sm py-2",
      className
    )}>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{displayText}...</span>
    </div>
  );
};
