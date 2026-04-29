import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PackageTypeBadge } from '@/components/esim/PackageTypeBadge';
import { CartItem } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedDescription } from '@/lib/packageDescriptionUtils';

interface CartItemCardProps {
  item: CartItem;
  onRemove: (packageId: string) => void;
  onUpdateQuantity: (packageId: string, quantity: number) => void;
}

export function CartItemCard({ item, onRemove, onUpdateQuantity }: CartItemCardProps) {
  const { t, formatPrice, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const getItemDescription = (): string => {
    if (item.package_type && item.data_amount) {
      return getLocalizedDescription({
        packageType: item.package_type,
        dataAmount: item.data_amount,
        speedAfterLimit: item.speed_after_limit,
        qosSpeed: item.qos_speed,
      }, t);
    }
    return item.description || '';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        {/* Top section */}
        <div className="flex-1">
          {/* Row 1: Badge + Delete button on mobile */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {item.package_type && (
                <PackageTypeBadge 
                  packageType={item.package_type as any}
                  size="sm"
                  showIcon={true}
                />
              )}
              {item.service_tier === 'economy' ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Economy
                </span>
              ) : (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  Priority
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -mr-2 text-gray-500 hover:text-gray-700"
              onClick={() => onRemove(item.packageId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-base md:text-lg mb-2 text-gray-900">
            {item.country && !item.name.toLowerCase().includes(item.country.toLowerCase()) 
              ? `${item.country} ${item.name}` 
              : item.name}
          </h3>
          
          {/* Key info badges */}
          <div className="flex flex-wrap gap-2 text-xs md:text-sm">
            {item.country && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {item.country}
              </span>
            )}
            {item.validity && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {item.validity}
              </span>
            )}
            {item.data_amount && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {item.data_amount}
              </span>
            )}
          </div>
          
          {/* Day Pass total GB highlight */}
          {item.package_type === 'day_pass' && (() => {
            const dataStr = item.daily_reset_amount || item.data_amount || '';
            const dataMatch = dataStr.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)$/i);
            const daysMatch = item.validity?.match(/(\d+)/);
            if (!dataMatch || !daysMatch) return null;
            const amount = parseFloat(dataMatch[1]);
            const unit = dataMatch[2].toUpperCase();
            const days = parseInt(daysMatch[1]);
            const totalGB = unit === 'MB' ? (amount * days) / 1024 : amount * days;
            const totalStr = totalGB % 1 === 0 ? `${totalGB}GB` : `${totalGB.toFixed(1)}GB`;
            const dailyStr = `${dataMatch[1]}${unit === 'MB' ? 'MB' : 'GB'}`;
            return (
              <div className="mt-2 flex items-center gap-1.5 text-xs md:text-sm text-orange-500 font-medium">
                <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500 flex-shrink-0" />
                {(t('cartItem.bestValue') as string)
                  .replace('{total}', totalStr)
                  .replace('{daily}', dailyStr)
                  .replace('{days}', String(days))
                }
              </div>
            );
          })()}
          
          {/* Expandable details */}
          {(item.description || item.package_type) && (
            <div className="mt-2">
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 text-xs md:text-sm text-orange-500 hover:underline">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        {t('cart.hideDetails')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        {t('cart.viewDetails')}
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-3">
                    <p className="text-xs md:text-sm text-gray-600">
                      {getItemDescription()}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-2 text-xs md:text-sm">
                      {item.carrier && (
                        <>
                          <span className="text-gray-500">{t('configurator.carrier')}</span>
                          <span className="font-medium text-gray-900 md:col-span-2">{item.carrier}</span>
                        </>
                      )}
                      {item.network_type && (
                        <>
                          <span className="text-gray-500">{t('configurator.network')}</span>
                          <span className="font-medium text-gray-900 md:col-span-2">{item.network_type}</span>
                        </>
                      )}
                      {item.sim_type && (
                        <>
                          <span className="text-gray-500">{t('configurator.simType')}</span>
                          <span className="font-medium text-gray-900 md:col-span-2">{item.sim_type}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                        {t('configurator.data')}
                      </span>
                      {item.hot_spot && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                          {t('configurator.hotspot')}
                        </span>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>

        {/* Bottom section: Qty + Price */}
        <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-0 border-gray-200">
          {/* Quantity controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 h-8 w-8 p-0 rounded-full"
              onClick={() => onUpdateQuantity(item.packageId, item.quantity - 1)}
            >
              -
            </Button>
            <span className="w-8 text-center text-gray-900 font-medium">{item.quantity}</span>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 h-8 w-8 p-0 rounded-full"
              onClick={() => onUpdateQuantity(item.packageId, item.quantity + 1)}
            >
              +
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="font-semibold text-lg text-gray-900">
              {formatPrice(item.price * item.quantity)}
            </p>
            <p className="text-xs text-gray-500">
              {formatPrice(item.price)} {t('cart.each') || 'each'}
            </p>
          </div>

          {/* Delete button - desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-gray-500 hover:text-gray-700"
            onClick={() => onRemove(item.packageId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
