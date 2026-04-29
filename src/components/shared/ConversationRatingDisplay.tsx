import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationRatingDisplayProps {
  rating: number;
  feedbackText?: string | null;
  compact?: boolean;
  className?: string;
}

export function ConversationRatingDisplay({ rating, feedbackText, compact, className }: ConversationRatingDisplayProps) {
  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', className)}>
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
        <span className="text-[#374151]">{rating}</span>
      </span>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
      {feedbackText && (
        <p className="text-xs text-[#6B7280] italic">"{feedbackText}"</p>
      )}
    </div>
  );
}
