import { Badge } from '@/components/ui/badge';
import { Infinity, Signal, Wind, LucideIcon, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type PackageType = 'day_pass' | 'max_speed' | 'limitless';

interface PackageTypeBadgeProps {
  packageType: PackageType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
  interactive?: boolean;
}

interface PackageTypeConfig {
  label: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  selectedBgColor?: string;
  selectedColor?: string;
  selectedRingColor: string;
  descriptionKey: string;
  whyTitleKey: string;
  whyIcon: string;
  whyPoints: string[];
  whyGradient: string;
  whyBorder: string;
  whyTextColor: string;
  whyCheckColor: string;
}

const PACKAGE_TYPE_CONFIGS: Record<PackageType, PackageTypeConfig> = {
  limitless: {
    label: 'Unlimited',
    subtitle: 'Heavy user',
    icon: Infinity,
    color: 'text-white',
    bgColor: 'bg-gradient-to-r from-orange-500 to-amber-500',
    selectedRingColor: 'ring-orange-400',
    descriptionKey: 'planTypes.limitless.tagline',
    whyTitleKey: 'configurator.whyLimitless.title',
    whyIcon: '⭐',
    whyPoints: [
      'configurator.whyLimitless.point1',
      'configurator.whyLimitless.point2',
      'configurator.whyLimitless.point3'
    ],
    whyGradient: 'from-orange-500/10 to-amber-500/10',
    whyBorder: 'border-orange-500/30',
    whyTextColor: 'text-orange-600 dark:text-orange-400',
    whyCheckColor: 'text-orange-500'
  },
  day_pass: {
    label: 'Value',
    subtitle: 'Balanced user',
    icon: Signal,
    color: 'text-white',
    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
    selectedBgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
    selectedColor: 'text-white',
    selectedRingColor: 'ring-blue-500',
    descriptionKey: 'planTypes.dayPass.tagline',
    whyTitleKey: 'configurator.whyDayPass.title',
    whyIcon: '☀️',
    whyPoints: [
      'configurator.whyDayPass.point1',
      'configurator.whyDayPass.point2',
      'configurator.whyDayPass.point3'
    ],
    whyGradient: 'from-blue-500/10 to-cyan-500/10',
    whyBorder: 'border-blue-500/30',
    whyTextColor: 'text-blue-600 dark:text-blue-400',
    whyCheckColor: 'text-blue-500'
  },
  max_speed: {
    label: 'Pay-per-use',
    subtitle: 'Light user',
    icon: Wind,
    color: 'text-white',
    bgColor: 'bg-gradient-to-r from-emerald-400 to-green-500',
    selectedBgColor: 'bg-gradient-to-r from-emerald-400 to-green-500',
    selectedColor: 'text-white',
    selectedRingColor: 'ring-green-400',
    descriptionKey: 'planTypes.maxSpeed.tagline',
    whyTitleKey: 'configurator.whyMaxSpeed.title',
    whyIcon: '🌿',
    whyPoints: [
      'configurator.whyMaxSpeed.point1',
      'configurator.whyMaxSpeed.point2',
      'configurator.whyMaxSpeed.point3'
    ],
    whyGradient: 'from-emerald-500/10 to-green-500/10',
    whyBorder: 'border-emerald-500/30',
    whyTextColor: 'text-emerald-600 dark:text-emerald-400',
    whyCheckColor: 'text-emerald-500'
  }
};

export function PackageTypeBadgeV2({ 
  packageType, 
  size = 'md', 
  showIcon = true,
  showTooltip = true,
  className = '',
  onClick,
  isSelected = false,
  interactive = false
}: PackageTypeBadgeProps) {
  const { t } = useLanguage();
  const config = PACKAGE_TYPE_CONFIGS[packageType];
  
  if (!config) {
    console.warn(`Unknown package type: ${packageType}`);
    return null;
  }
  
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-sm px-2.5 py-1 md:text-base md:px-3.5 md:py-2',
    lg: 'text-base px-4 py-1.5 md:text-lg md:px-5 md:py-2'
  };

  const interactiveClasses = interactive 
    ? 'cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg' 
    : '';
  
  const selectedClasses = isSelected 
    ? `opacity-100 scale-105 shadow-lg ring-2 ${config.selectedRingColor}` 
    : interactive 
      ? 'opacity-80 hover:opacity-100' 
      : '';

  const bgColorClass = isSelected && config.selectedBgColor ? config.selectedBgColor : config.bgColor;
  const textColorClass = isSelected && config.selectedColor ? config.selectedColor : config.color;

  const getSubtitleColor = () => {
    if (packageType === 'limitless') return 'text-white/80';
    if (packageType === 'day_pass' || packageType === 'max_speed') return 'text-white/80';
    if (isSelected) return 'text-blue-600';
    return 'text-gray-500';
  };

  const badge = (
    <Badge 
      onClick={onClick}
      className={`${bgColorClass} ${textColorClass} rounded-xl font-medium whitespace-nowrap flex flex-col items-center text-center ${sizeClasses[size]} ${interactiveClasses} ${selectedClasses} ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {showIcon && <Icon className={`${size === 'sm' ? 'h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4' : 'h-4 w-4'}`} />}
        <span>{config.label}</span>
        {showTooltip && <Info className="h-2.5 w-2.5 opacity-70" />}
      </div>
      <span className={`text-xs font-normal mt-0.5 ${getSubtitleColor()}`}>
        {config.subtitle}
      </span>
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button" 
          className="inline-flex focus:outline-none focus:ring-0"
        >
          {badge}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="center"
        className={`w-72 p-4 bg-gradient-to-br ${config.whyGradient} border ${config.whyBorder} backdrop-blur-sm`}
      >
        <div className={`flex items-center gap-2 font-semibold ${config.whyTextColor} mb-3`}>
          <span className="text-base">{config.whyIcon}</span>
          <span className="text-sm">{t(config.whyTitleKey)}</span>
        </div>
        <ul className="space-y-2">
          {config.whyPoints.map((pointKey, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
              <span className={`${config.whyCheckColor} mt-0.5 flex-shrink-0`}>✓</span>
              <span>{t(pointKey)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function getPackageTypeConfigV2(packageType: PackageType) {
  return PACKAGE_TYPE_CONFIGS[packageType];
}
