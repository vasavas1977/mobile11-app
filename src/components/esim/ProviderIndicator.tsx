import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProviderIndicatorProps {
  providerCode?: string;
  className?: string;
}

export function ProviderIndicator({ providerCode, className }: ProviderIndicatorProps) {
  const { isAdmin } = useAdminCheck();

  if (!isAdmin || !providerCode) return null;

  const isTuge = providerCode.toLowerCase() === 'tuge';
  const isUsimsa = providerCode.toLowerCase() === 'usimsa';

  return (
    <Badge
      className={cn(
        'text-[10px] px-1.5 py-0 font-bold border-0',
        isTuge && 'bg-purple-100 text-purple-700',
        isUsimsa && 'bg-blue-100 text-blue-700',
        !isTuge && !isUsimsa && 'bg-gray-100 text-gray-700',
        className
      )}
    >
      {providerCode.toUpperCase()}
    </Badge>
  );
}

/** Returns admin-only border class for left-border styling */
export function getProviderBorderClass(providerCode?: string, isAdmin?: boolean): string {
  if (!isAdmin || !providerCode) return '';
  const code = providerCode.toLowerCase();
  if (code === 'tuge') return 'border-l-4 border-purple-400';
  if (code === 'usimsa') return 'border-l-4 border-blue-400';
  return '';
}
