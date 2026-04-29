import { cn } from '@/lib/utils';
import { Gauge, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SubFilterOption {
  value: string;
  label: string;
  badge?: string;
}

interface SubFilterConfig {
  label: string;
  icon: typeof Gauge;
  field: 'qos_speed' | 'data_amount';
  options: SubFilterOption[];
  remark?: string;
}

export const PLAN_TYPE_SUB_FILTERS: Record<string, SubFilterConfig> = {
  limitless: {
    label: 'MIN. SPEED GUARANTEE',
    icon: Zap,
    field: 'qos_speed',
    remark: 'Unlimited data at maximum network speeds (up to 5G). QoS speeds are minimum guarantees.',
    options: [
      { value: 'all', label: 'All Speeds' },
      { value: '1Mbps', label: '1 Mbps', badge: 'Standard' },
      { value: '5Mbps', label: '5 Mbps', badge: 'Premium' }
    ]
  },
  max_speed: {
    label: 'High-Speed Data',
    icon: Gauge,
    field: 'data_amount',
    remark: 'After high-speed data is used, speed reduces to 384 Kbps',
    options: [
      { value: 'all', label: 'All Amounts' },
      { value: '1GB', label: '1 GB' },
      { value: '2GB', label: '2 GB' },
      { value: '3GB', label: '3 GB' },
      { value: '5GB', label: '5 GB' },
      { value: '10GB', label: '10 GB' },
      { value: '15GB', label: '15 GB' },
      { value: '20GB', label: '20 GB' },
      { value: '30GB', label: '30 GB' }
    ]
  },
  day_pass: {
    label: 'Daily Allowance',
    icon: Gauge,
    field: 'data_amount',
    remark: 'Daily data resets every 24 hours. After daily data is used, backup speed continues (384 Kbps or 1 Mbps based on plan)',
    options: [
      { value: 'all', label: 'All Amounts' },
      { value: '200MB', label: '200 MB' },
      { value: '500MB', label: '500 MB' },
      { value: '1GB', label: '1 GB' },
      { value: '2GB', label: '2 GB' },
      { value: '3GB', label: '3 GB' },
      { value: '4GB', label: '4 GB' },
      { value: '5GB', label: '5 GB' }
    ]
  }
};

interface PlanTypeSubFilterProps {
  planType: string;
  selectedValue: string | null;
  onValueChange: (value: string | null) => void;
}

export function PlanTypeSubFilter({ planType, selectedValue, onValueChange }: PlanTypeSubFilterProps) {
  const config = PLAN_TYPE_SUB_FILTERS[planType];
  const isMobile = useIsMobile();
  
  if (!config) return null;
  
  const Icon = config.icon;

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-2 md:px-4 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg p-2 sm:p-3 md:p-4 border border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-medium flex items-center gap-2 whitespace-nowrap text-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {config.label}:
          </label>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {config.options.map((option) => (
              <button
                key={option.value}
                onClick={() => onValueChange(option.value === 'all' ? null : option.value)}
                className={cn(
                  "px-2 sm:px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  "hover:shadow-md sm:hover:scale-105",
                  selectedValue === option.value || (!selectedValue && option.value === 'all')
                    ? "bg-primary text-primary-foreground shadow-md sm:scale-105"
                    : "bg-background border border-border hover:border-primary"
                )}
              >
                {option.label}
                {option.badge && !isMobile && (
                  <span className="ml-1.5 text-xs opacity-75">
                    ({option.badge})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {config.remark && (
          <p className="text-xs text-muted-foreground mt-2 italic flex items-center gap-1">
            <span className="text-primary">ℹ️</span>
            {config.remark}
          </p>
        )}
      </div>
    </div>
  );
}
