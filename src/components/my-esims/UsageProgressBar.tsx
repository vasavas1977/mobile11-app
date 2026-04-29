import { cn } from '@/lib/utils';

interface UsageProgressBarProps {
  icon: React.ReactNode;
  value: string;
  label?: string;
  subtitle?: string;
  percentage: number;
  isExpired?: boolean;
  isLoading?: boolean;
  className?: string;
  showUsed?: boolean; // When true, shows percentage as "used" (green when low, red when high)
  showPercentage?: boolean; // Show percentage label next to progress bar
}

export function UsageProgressBar({ 
  icon, 
  value, 
  label, 
  subtitle,
  percentage, 
  isExpired = false,
  isLoading = false,
  className,
  showUsed = false,
  showPercentage = false
}: UsageProgressBarProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Determine bar color based on status and mode
  const getBarColor = () => {
    if (isExpired) return 'bg-red-500';
    
    if (showUsed) {
      // For "used" display: low usage = green, high usage = red
      if (clampedPercentage >= 80) return 'bg-red-500';
      if (clampedPercentage >= 50) return 'bg-orange-500';
      return 'bg-green-500';
    } else {
      // For "remaining" display: low remaining = orange/red, high remaining = green
      if (clampedPercentage <= 20) return 'bg-orange-500';
      return 'bg-green-500';
    }
  };
  
  return (
    <div className={cn("flex-1", className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-gray-400", isExpired && "text-red-400")}>{icon}</span>
        {isLoading ? (
          <span className="font-semibold text-gray-400 text-sm animate-pulse">...</span>
        ) : (
          <span className={cn(
            "font-semibold text-sm",
            isExpired ? "text-red-600" : "text-gray-800"
          )}>
            {value}
          </span>
        )}
        {label && <span className="text-gray-500 text-xs">{label}</span>}
      </div>
      {subtitle && (
        <p className={cn(
          "text-xs mb-1.5",
          isExpired ? "text-red-500" : "text-gray-500"
        )}>
          {subtitle}
        </p>
      )}
      <div className="flex items-center gap-2">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1 max-w-[120px]">
          <div 
            className={cn("h-full rounded-full transition-all duration-300", getBarColor())}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
        {showPercentage && (
          <span className="text-xs text-gray-400 min-w-[28px]">
            {Math.round(clampedPercentage)}%
          </span>
        )}
      </div>
    </div>
  );
}
