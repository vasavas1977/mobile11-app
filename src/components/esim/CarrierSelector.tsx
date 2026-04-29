import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Signal } from 'lucide-react';

interface CarrierSelectorProps {
  carriers: string[];
  selectedCarrier: string | null;
  onSelect: (carrier: string) => void;
  networkTypes?: Record<string, string>;
}

export function CarrierSelector({
  carriers,
  selectedCarrier,
  onSelect,
  networkTypes = {},
}: CarrierSelectorProps) {
  const { t } = useLanguage();

  if (carriers.length <= 1) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">
        {t('configurator.chooseCarrier')}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {carriers.map((carrier) => {
          const isSelected = selectedCarrier === carrier;
          const networkType = networkTypes[carrier] || '4G / 5G';
          
          return (
            <button
              key={carrier}
              onClick={() => onSelect(carrier)}
              className={cn(
                'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200',
                'hover:border-orange-300 hover:bg-orange-50/50',
                isSelected
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 bg-white'
              )}
            >
              {/* Carrier name */}
              <span className={cn(
                'font-semibold text-sm md:text-base',
                isSelected ? 'text-orange-600' : 'text-gray-700'
              )}>
                {carrier}
              </span>
              
              
              {/* Network badge */}
              <span className={cn(
                'flex items-center gap-1 text-xs mt-1',
                isSelected ? 'text-orange-500' : 'text-gray-500'
              )}>
                <Signal className="h-3 w-3" />
                {networkType}
              </span>
              
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 text-center">
        {t('configurator.carrierDescription')}
      </p>
    </div>
  );
}
