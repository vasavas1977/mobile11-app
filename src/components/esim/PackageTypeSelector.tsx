import { Card, CardContent } from '@/components/ui/card';
import { Sun, Gauge, Zap, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type PackageType = 'day_pass' | 'max_speed' | 'limitless';

interface PackageTypeSelectorProps {
  availableTypes: PackageType[];
  selectedType: PackageType | null;
  onSelect: (type: PackageType) => void;
}

interface TypeConfig {
  labelKey: string;
  subtitleKey: string;
  descriptionKey: string;
  icon: typeof Zap;
  // Rich tooltip content
  whyTitleKey: string;
  whyIcon: string;
  whyPoints: string[];
  whyGradient: string;
  whyBorder: string;
  whyTextColor: string;
  whyCheckColor: string;
}

const TYPE_CONFIGS: Record<PackageType, TypeConfig> = {
  limitless: {
    labelKey: 'planTypes.limitless.name',
    subtitleKey: 'planTypes.limitless.badge',
    descriptionKey: 'planTypes.limitless.tagline',
    icon: Zap,
    whyTitleKey: 'configurator.whyLimitless.title',
    whyIcon: '⭐',
    whyPoints: [
      'configurator.whyLimitless.point1',
      'configurator.whyLimitless.point2',
      'configurator.whyLimitless.point3'
    ],
    whyGradient: 'from-orange-500/10 to-amber-500/10',
    whyBorder: 'border-orange-500/30',
    whyTextColor: 'text-orange-700',
    whyCheckColor: 'text-orange-600'
  },
  day_pass: {
    labelKey: 'planTypes.dayPass.name',
    subtitleKey: 'planTypes.dayPass.badge',
    descriptionKey: 'planTypes.dayPass.tagline',
    icon: Sun,
    whyTitleKey: 'configurator.whyDayPass.title',
    whyIcon: '☀️',
    whyPoints: [
      'configurator.whyDayPass.point1',
      'configurator.whyDayPass.point2',
      'configurator.whyDayPass.point3'
    ],
    whyGradient: 'from-blue-500/10 to-cyan-500/10',
    whyBorder: 'border-blue-500/30',
    whyTextColor: 'text-blue-700',
    whyCheckColor: 'text-blue-600'
  },
  max_speed: {
    labelKey: 'planTypes.maxSpeed.name',
    subtitleKey: 'planTypes.maxSpeed.badge',
    descriptionKey: 'planTypes.maxSpeed.tagline',
    icon: Gauge,
    whyTitleKey: 'configurator.whyMaxSpeed.title',
    whyIcon: '🚀',
    whyPoints: [
      'configurator.whyMaxSpeed.point1',
      'configurator.whyMaxSpeed.point2',
      'configurator.whyMaxSpeed.point3'
    ],
    whyGradient: 'from-blue-500/10 to-cyan-500/10',
    whyBorder: 'border-blue-500/30',
    whyTextColor: 'text-blue-700',
    whyCheckColor: 'text-blue-600'
  }
};

// Info popover for tooltip content
function InfoPopover({ config }: { config: TypeConfig }) {
  const { t } = useLanguage();
  
  return (
    <Popover>
      <PopoverTrigger asChild>
      <button 
        type="button" 
        className="inline-flex focus:outline-none focus:ring-0 p-1 rounded-full bg-gray-100/50 hover:bg-gray-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <Info className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="center"
        className={`w-72 p-4 bg-white border ${config.whyBorder} shadow-lg text-gray-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center gap-2 font-semibold ${config.whyTextColor} mb-3`}>
          <span className="text-base">{config.whyIcon}</span>
          <span className="text-sm">{t(config.whyTitleKey)}</span>
        </div>
        <ul className="space-y-2">
          {config.whyPoints.map((pointKey, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-900">
              <span className={`${config.whyCheckColor} mt-0.5 flex-shrink-0`}>✓</span>
              <span>{t(pointKey)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

// Compact card component for all package types
function CompactCard({ 
  type,
  isSelected, 
  onSelect,
  config 
}: { 
  type: PackageType;
  isSelected: boolean; 
  onSelect: () => void;
  config: TypeConfig;
}) {
  const { t } = useLanguage();
  const Icon = config.icon;
  const isLimitless = type === 'limitless';
  
  return (
    <Card 
      onClick={onSelect}
      className={cn(
        "cursor-pointer transition-all duration-200",
        isSelected 
          ? isLimitless 
            ? "bg-white border-2 border-orange-400 ring-1 ring-orange-300 shadow-md"
            : "bg-blue-50 border-2 border-blue-400 ring-1 ring-blue-300 shadow-md"
          : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
      )}
    >
      <CardContent className="p-2 sm:p-3">
        <div className="flex flex-col items-center text-center space-y-1">
          {/* Compact circular icon */}
          <div className={cn(
            "rounded-full p-2",
            isLimitless ? "bg-orange-500" : "bg-blue-500"
          )}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          
          {/* Title with info */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-xs sm:text-sm text-gray-900">
              {t(config.labelKey)}
            </span>
            <InfoPopover config={config} />
          </div>
          
          {/* Subtitle badge */}
          <span className={cn(
            "text-[10px] sm:text-xs font-medium",
            isLimitless ? "text-orange-500" : 
            isSelected ? "text-blue-600" : "text-gray-500"
          )}>
            {t(config.subtitleKey)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PackageTypeSelector({ 
  availableTypes, 
  selectedType, 
  onSelect 
}: PackageTypeSelectorProps) {
  const { t } = useLanguage();
  
  // Ensure order: limitless first, then day_pass, then max_speed
  const orderedTypes = ['day_pass', 'limitless', 'max_speed'].filter(
    type => availableTypes.includes(type as PackageType)
  ) as PackageType[];
  
  return (
    <div className="space-y-3">
      {/* 3-column grid for all cards */}
      <div className={cn(
        "grid gap-2 sm:gap-3",
        orderedTypes.length === 3 ? "grid-cols-3" : 
        orderedTypes.length === 2 ? "grid-cols-2" : "grid-cols-1"
      )}>
        {orderedTypes.map(type => (
          <CompactCard
            key={type}
            type={type}
            isSelected={selectedType === type}
            onSelect={() => onSelect(type)}
            config={TYPE_CONFIGS[type]}
          />
        ))}
      </div>
      
      {/* Description shown below only when a type is selected */}
      {selectedType && (
        <div className="text-center text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">
          {t(TYPE_CONFIGS[selectedType].descriptionKey)}
        </div>
      )}
    </div>
  );
}
