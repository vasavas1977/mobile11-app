import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, Check, ChevronRight, Globe2, Map } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRegionalPackagesForCountry } from '@/lib/countryDestinations';

interface NoDirectCoverageStateProps {
  countryName: string;
  countryCode: string;
  onSelectRegional: (regionalName: string) => void;
}

export function NoDirectCoverageState({
  countryName,
  countryCode,
  onSelectRegional,
}: NoDirectCoverageStateProps) {
  const { t, formatPrice } = useLanguage();

  // Get regional packages that include this country
  const regionalPackagesInfo = getRegionalPackagesForCountry(countryName);

  // Fetch starting prices for regional packages
  const { data: regionalPrices = {}, isLoading } = useQuery({
    queryKey: ['regional-prices-no-direct', countryName],
    queryFn: async () => {
      const prices: Record<string, number> = {};

      const namePatterns: Record<string, string> = {
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

      for (const pkg of regionalPackagesInfo) {
        const pattern = namePatterns[pkg.name];
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

  // Filter and sort packages by price
  const packagesWithPrices = regionalPackagesInfo
    .filter((pkg) => regionalPrices[pkg.name])
    .sort((a, b) => (regionalPrices[a.name] || 0) - (regionalPrices[b.name] || 0));

  return (
    <div className="space-y-6">
      {/* No direct coverage notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-amber-900">
              {t('countryPage.noDirectTitle') || 'Direct eSIM packages not available'}
            </h3>
            <p className="text-sm text-amber-700">
              {(t('countryPage.noDirectMessage') ||
                'Direct eSIM packages are not currently available for {country}. However, you can still get connected with our regional and global plans that include coverage in {country}.')
                .replace(/{country}/g, countryName)}
            </p>
          </div>
        </div>
      </div>

      {/* Regional options */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h3 className="mb-1 text-lg font-bold text-gray-900">
            {t('countryPage.availableOptions') || 'Available coverage options'}
          </h3>
          <p className="text-sm text-gray-500">
            {(t('countryPage.availableOptionsSubtitle') || 'Select a plan that includes {country}')
              .replace('{country}', countryName)}
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : packagesWithPrices.length > 0 ? (
          <div className="space-y-3">
            {packagesWithPrices.map((pkg) => {
              const isGlobal = pkg.name.includes('global');
              const title = pkg.displayName.replace(' Countries', '');

              return (
                <button
                  key={pkg.name}
                  onClick={() => onSelectRegional(pkg.displayName)}
                  className="group w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left shadow-sm transition-all hover:bg-white hover:shadow-md"
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
                        <div className="mt-2 text-2xl font-black text-gray-900">
                          {formatPrice(regionalPrices[pkg.name] || 0)}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-6 w-6 text-gray-400 transition-colors group-hover:text-gray-600" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            {t('countryPage.noCoverage') || 'No coverage options available for this country'}
          </div>
        )}
      </section>
    </div>
  );
}

