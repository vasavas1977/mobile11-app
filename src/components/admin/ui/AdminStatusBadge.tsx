import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, XCircle, Loader2, Ban } from 'lucide-react';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'processing';

const statusConfig: Record<StatusType, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
  warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: AlertCircle },
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: XCircle },
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Clock },
  neutral: { bg: 'bg-[#FAF7F2] border-[#F3F0EB]', text: 'text-[#6B7280]', icon: Ban },
  processing: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Loader2 },
};

// Common status-to-type mappings for the admin
const statusTypeMap: Record<string, StatusType> = {
  completed: 'success', active: 'success', paid: 'success', approved: 'success', provisioned: 'success', resolved: 'success',
  pending: 'warning', unpaid: 'warning', needs_attention: 'warning',
  failed: 'error', cancelled: 'error', rejected: 'error', expired: 'error',
  processing: 'processing', in_progress: 'processing',
  free: 'neutral', draft: 'neutral',
};

interface AdminStatusBadgeProps {
  status: string;
  type?: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function AdminStatusBadge({ status, type, label, showIcon = true, size = 'sm', className }: AdminStatusBadgeProps) {
  const resolvedType = type || statusTypeMap[status] || 'neutral';
  const config = statusConfig[resolvedType];
  const Icon = config.icon;
  const displayLabel = label || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={cn(
      'inline-flex items-center gap-1 border rounded-full font-medium whitespace-nowrap',
      config.bg, config.text,
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
      className
    )}>
      {showIcon && (
        <Icon className={cn('flex-shrink-0', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3', resolvedType === 'processing' && 'animate-spin')} />
      )}
      {displayLabel}
    </span>
  );
}
