import { usePartnerDataMode } from '@/contexts/PartnerDataModeContext';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Wraps an action button to disable it in Sample Data mode.
 * Shows a subtle "Preview only" tooltip when hovered.
 */
export function SampleModeActionGuard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isReadOnly } = usePartnerDataMode();

  if (!isReadOnly) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex', className)}>
            <span className="pointer-events-none opacity-50 select-none inline-flex">
              {children}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-[11px] bg-amber-50 border-amber-200 text-amber-700 max-w-[200px]"
        >
          <span className="flex items-center gap-1.5">
            <FlaskConical className="h-3 w-3 flex-shrink-0" />
            Preview only — no live changes
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Small inline badge shown next to action areas in sample mode.
 */
export function SampleModeBadge({ className }: { className?: string }) {
  const { isSampleMode } = usePartnerDataMode();

  if (!isSampleMode) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[9px] font-medium text-amber-500 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5 uppercase tracking-wide select-none',
        className,
      )}
    >
      <FlaskConical className="h-2.5 w-2.5" />
      Preview only
    </span>
  );
}
