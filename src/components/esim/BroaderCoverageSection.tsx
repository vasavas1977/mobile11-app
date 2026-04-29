import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, ChevronDown, ChevronRight, Globe2, Map, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRegionalPackagesForCountry } from '@/lib/countryDestinations';
import { AiraloStyleSelectorV4 } from './AiraloStyleSelectorV4';
import { RegionalCountriesDialog } from './RegionalCountriesDialog';
import { Badge } from '@/components/ui/badge';
import { getRegionPresetForName } from '@/lib/regionPresets';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BroaderCoverageSectionProps {
  countryName: string;
  onSelectRegional: (regionalName: string) => void;
  excludeRegionals?: string[];
}

// Map preset names to DB package name patterns
const NAME_PATTERNS: Record<string, string> = {
  asia_3: '%South East Asia 3%',
  asia_8: '%South East Asia 8%',
  asia_13: '%Asia 13%',
  europe_33: '%Europe 33%',
  europe_41: '%Europe 41%',
  europe_42: '%Europe 42%',
  global_109: '%Global 109%',
  global_151: '%Global 151%',
  hongkong_macau: 'Hong Kong/Macau',
  china_hongkong_macau: 'China/Hong Kong/Macau',
  africa_18: '%Africa 18%',
};

export function BroaderCoverageSection({
  countryName,
  onSelectRegional,
  excludeRegionals = [],
}: BroaderCoverageSectionProps) {
  const { t, formatPrice, language } = useLanguage();
  const { addToCart } = useCart();
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  // Get regional packages that include this country from presets
  const isHkOrMacau = ['hong kong', 'macau'].includes(countryName.toLowerCase());
  const regionalPackagesInfo = getRegionalPackagesForCountry(countryName)
    .filter(pkg => isHkOrMacau ? !['hongkong_macau', 'china_hongkong_macau'].includes(pkg.name) : true)
    .filter(pkg => !excludeRegionals.includes(pkg.name));

  // Fetch starting prices for regional packages
  const { data: regionalPrices = {} } = useQuery({
    queryKey: ['regional-prices', countryName],
    queryFn: async () => {
      const prices: Record<string, number> = {};

      for (const pkg of regionalPackagesInfo) {
        const pattern = NAME_PATTERNS[pkg.name];
        if (pattern) {
          const { data } = await supabase
            .from('esim_packages')
            .select('price')
            .ilike('country_name', pattern)
            .eq('is_active', true)
            .order('price', { ascending: true })
            .limit(1)
            .single();

          if (data) {
            prices[pkg.name] = data.price;
          }
        }
      }

      return prices;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch full packages for the expanded regional package
  const { data: expandedPackages = [], isLoading: loadingExpanded } = useQuery({
    queryKey: ['regional-packages-full', expandedPackage],
    queryFn: async () => {
      if (!expandedPackage) return [];
      const pattern = NAME_PATTERNS[expandedPackage];
      if (!pattern) return [];

      const { data } = await supabase
        .from('esim_packages')
        .select('*')
        .ilike('country_name', pattern)
        .eq('is_active', true)
        .order('price', { ascending: true });

      return data || [];
    },
    enabled: !!expandedPackage,
    staleTime: 5 * 60 * 1000,
  });

  // Filter to only show packages with prices and sort by price
  const packagesWithPrices = regionalPackagesInfo
    .filter((pkg) => regionalPrices[pkg.name])
    .sort((a, b) => (regionalPrices[a.name] || 0) - (regionalPrices[b.name] || 0));

  if (packagesWithPrices.length === 0) return null;

  const handleAddToCart = (packageId: string, quantity: number) => {
    const pkg = expandedPackages.find(p => p.id === packageId);
    if (!pkg) {
      toast.error('Package not found');
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addToCart({
        packageId: pkg.id,
        name: pkg.name,
        price: pkg.price,
        data_amount: pkg.data_amount,
        validity: `${pkg.validity_days} days`,
        country: pkg.country_name,
        package_type: pkg.package_type,
        network_type: pkg.network_type,
        carrier: pkg.carrier,
        service_tier: 'priority',
        initialize_policy: pkg.initialize_policy || undefined,
        provider_metadata: (pkg.provider_metadata && typeof pkg.provider_metadata === 'object' && !Array.isArray(pkg.provider_metadata) ? pkg.provider_metadata : undefined) as Record<string, any> | undefined,
      });
    }
  };

  const handleToggleExpand = (pkgName: string) => {
    setExpandedPackage(prev => prev === pkgName ? null : pkgName);
    setSelectedPackageId(null);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('countryPage.broaderCoverageTitle') || t('countryPage.needBroaderCoverage')}
        </h3>
        <p className="text-sm text-gray-500">
          {t('countryPage.broaderCoverageSubtitle') || t('countryPage.broaderCoverageDesc')}
        </p>
      </header>

      <div className="space-y-3">
        {packagesWithPrices.map((pkg) => {
          const isGlobal = pkg.name.includes('global');
          const title = pkg.displayName.replace(' Countries', '');
          const isExpanded = expandedPackage === pkg.name;
          const presetData = getRegionPresetForName(pkg.displayName);

          return (
            <div key={pkg.name} className="rounded-2xl border border-gray-200 overflow-hidden transition-all">
              <button
                onClick={() => handleToggleExpand(pkg.name)}
                className={cn(
                  "group w-full bg-gray-50 p-5 text-left transition-all hover:bg-white",
                  isExpanded && "bg-white border-b border-gray-100"
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {isGlobal ? (
                        <Globe2 className="h-6 w-6 text-gray-500" />
                      ) : (
                        <Map className="h-6 w-6 text-gray-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-base font-bold text-gray-900 truncate">{title}</div>
                      <div className="text-xs text-gray-500">
                        {pkg.countryCount} {t('countryPage.countries') || 'countries'}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        {(t('countryPage.includesCountry') || 'Includes {country}').replace('{country}', countryName)}
                      </div>
                      {!isExpanded && (
                        <div className="mt-2 text-2xl font-black text-gray-900">
                          {formatPrice(regionalPrices[pkg.name] || 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronDown className="h-6 w-6 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-6 w-6 text-gray-400 transition-colors group-hover:text-gray-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Expanded inline selector */}
              {isExpanded && (
                <div className="p-4 bg-white space-y-3">
                  {/* Countries popover */}
                   {presetData && (
                     <div className="flex items-center gap-2 pb-2">
                       <RegionalCountriesDialog 
                         data={presetData}
                         trigger={
                           <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs gap-1">
                             <Globe2 className="h-3 w-3" />
                             {presetData.countries.length} {t('configurator.countries')}
                           </Badge>
                         }
                       />
                     </div>
                  )}

                  {loadingExpanded ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    </div>
                  ) : expandedPackages.length > 0 ? (
                    <AiraloStyleSelectorV4
                      packages={expandedPackages}
                      countryCode={expandedPackages[0]?.country_code || ''}
                      countryName={expandedPackages[0]?.country_name || pkg.displayName}
                      isRegional={true}
                      selectedPackageId={selectedPackageId}
                      onSelectPackage={setSelectedPackageId}
                      onViewFullConfigurator={() => onSelectRegional(pkg.displayName)}
                      onAddToCart={handleAddToCart}
                    />
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {t('packageSelector.noPackages')}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
