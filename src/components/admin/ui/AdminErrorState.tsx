import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function AdminErrorState({ title = 'Something went wrong', message, onRetry }: AdminErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="h-5 w-5 text-red-500" />
      </div>
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">{title}</h3>
      {message && (
        <p className="text-xs text-[#9CA3AF] text-center max-w-xs mb-4">{message}</p>
      )}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="rounded-lg h-8 text-xs gap-1.5 border-[#F3F0EB]"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}
