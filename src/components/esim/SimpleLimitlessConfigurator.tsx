import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { cn } from '@/lib/utils';
import { ArrowLeft, Minus, Plus, ShoppingCart, ChevronRight, Link2, Globe } from 'lucide-react';
import { trackCTAClick } from '@/lib/journeyTrackingUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateConfiguratorUrl, copyToClipboard } from '@/lib/configuratorUrlUtils';
import { useToast } from '@/hooks/use-toast';
import { getRegionalData, getCountryCount } from '@/lib/regionalPackageUtils';
import { RegionalCountriesPopover } from './RegionalCountriesPopover';
import { RegionalCountriesDialog } from './RegionalCountriesDialog';

interface EsimPackage {
  id: string;
  package_id: string;
  name: string;
  description?: string;
  country_code: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  qos_speed?: string;
  carrier?: string;
  network_type?: string;
  sim_type?: string;
  package_type?: string | null;
  speed_after_limit?: string | null;
  daily_data_reset?: boolean | null;
  daily_reset_amount?: string | null;
  support_data?: boolean;
  support_sms?: boolean;
  support_voice?: boolean;
  hot_spot?: boolean;
}

interface SimpleLimitlessConfiguratorProps {
  countryCode: string;
  countryName: string;
  packages: EsimPackage[];
  onAddToCart: (packageId: string, quantity: number) => void;
  onShowFullConfigurator: () => void;
  onBack: () => void;
  isRegional?: boolean;
  initialDays?: number;
  initialQuantity?: number;
  onStateChange?: (state: { days: number; quantity: number }) => void;
}

export function SimpleLimitlessConfigurator({
  countryCode,
  countryName,
  packages,
  onAddToCart,
  onShowFullConfigurator,
  onBack,
  isRegional = false,
  initialDays,
  initialQuantity,
  onStateChange,
}: SimpleLimitlessConfiguratorProps) {
  const { formatPrice, t } = useLanguage();
  const { toast } = useToast();

  // Filter to only limitless packages
  const limitlessPackages = useMemo(() => {
    return packages.filter(pkg => pkg.package_type === 'limitless');
  }, [packages]);

  // Get unique days sorted
  const availableDays = useMemo(() => {
    const days = new Set<number>();
    limitlessPackages.forEach(pkg => {
      if (pkg.validity_days) days.add(pkg.validity_days);
    });
    return Array.from(days).sort((a, b) => a - b);
  }, [limitlessPackages]);

  // State - use initial values from URL if provided
  const [selectedDays, setSelectedDays] = useState<number>(() => {
    if (initialDays && availableDays.includes(initialDays)) {
      return initialDays;
    }
    return availableDays.includes(7) ? 7 : availableDays[0] || 7;
  });
  const [quantity, setQuantity] = useState(initialQuantity || 1);

  // Notify parent of state changes for URL sync
  useEffect(() => {
    if (onStateChange && selectedDays) {
      onStateChange({ days: selectedDays, quantity });
    }
  }, [selectedDays, quantity, onStateChange]);

  // Copy link handler
  const handleCopyLink = useCallback(async () => {
    const url = generateConfiguratorUrl({
      country: countryName,
      isRegional: isRegional,
      type: 'limitless',
      days: selectedDays,
      qty: quantity,
      view: 'simple'
    });
    
    const success = await copyToClipboard(url);
    if (success) {
      toast({
        title: t('configurator.linkCopied'),
        description: t('configurator.linkCopiedDesc'),
      });
    }
  }, [countryName, isRegional, selectedDays, quantity, toast, t]);

  // Find matching package
  const selectedPackage = useMemo(() => {
    return limitlessPackages.find(pkg => pkg.validity_days === selectedDays) || null;
  }, [limitlessPackages, selectedDays]);

  // Calculate total
  const totalPrice = selectedPackage ? selectedPackage.price * quantity : 0;

  // If no limitless packages, show full configurator immediately
  if (limitlessPackages.length === 0) {
    onShowFullConfigurator();
    return null;
  }

  return (
    <div className="max-w-md mx-auto animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('simpleConfigurator.backToDestinations')}
      </button>

      <Card className="overflow-hidden bg-white border-gray-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Header - Compact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlagIcon countryCode={countryCode} countryName={countryName} size="lg" className="rounded shadow-sm" />
              <div>
                <h2 className="text-xl font-bold leading-tight text-gray-900">{countryName}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    {t('simpleConfigurator.title')} · {t('simpleConfigurator.benefit')}
                  </p>
                  {/* Regional Countries Indicator */}
                  {isRegional && selectedPackage && (() => {
                    const regionalData = getRegionalData(selectedPackage);
                    if (regionalData) {
                      const countryCount = getCountryCount(selectedPackage);
                      return (
                        <div className="flex items-center justify-between">
                          <RegionalCountriesPopover 
                            data={regionalData}
                            trigger={
                              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                                <Globe className="h-3 w-3 mr-1" />
                                {countryCount} {countryCount === 1 ? t('configurator.country') : t('configurator.countries')}
                              </Badge>
                            }
                          />
                          
                          <RegionalCountriesDialog 
                            data={regionalData}
                            trigger={
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs hover:underline"
                                type="button"
                              >
                                {t('configurator.viewAllCountries')}
                              </Button>
                            }
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
              title={t('configurator.copyLink')}
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>

          {/* Days Selector - Compact */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              {t('simpleConfigurator.howManyDays')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableDays.map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    selectedDays === days
                      ? "bg-gray-900 text-white ring-2 ring-orange-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Price Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{t('configurator.quantity')}:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-7 w-7 rounded-md bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-50"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center font-semibold text-sm text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-7 w-7 rounded-md bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</p>
          </div>

          {/* Action Button - Add to Cart only */}
          <Button
            className="w-full h-10 font-semibold"
            onClick={() => { trackCTAClick('Add to Cart - Limitless'); selectedPackage && onAddToCart(selectedPackage.id, quantity); }}
            disabled={!selectedPackage}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t('configurator.addToCart')}
          </Button>

          {/* View Other Options - Subtle link */}
          <button
            onClick={onShowFullConfigurator}
            className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors pt-2"
          >
            <span>{t('simpleConfigurator.lookingForCheaper')}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
