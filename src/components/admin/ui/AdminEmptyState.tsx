import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AdminEmptyState({ icon, title, description, actionLabel, onAction }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#F3F0EB] flex items-center justify-center mb-4">
        {icon || <Inbox className="h-5 w-5 text-[#9CA3AF]" />}
      </div>
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[#9CA3AF] text-center max-w-xs mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-8 text-xs"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
