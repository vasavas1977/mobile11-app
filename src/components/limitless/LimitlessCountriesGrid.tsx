import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { GLOBAL_109 } from '@/lib/regionPresets';
import { Skeleton } from '@/components/ui/skeleton';
import { FlagIcon } from '@/components/ui/FlagIcon';
// Country code to slug mapping
const getCountrySlug = (countryName: string): string => {
  return countryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

interface CountryWithPrice {
  name: string;
  code: string;
  startingPrice: number | null;
}

export const LimitlessCountriesGrid: React.FC = () => {
  const { t, currency, formatPrice } = useLanguage();
  const navigate = useNavigate();

  // Fetch starting prices for limitless packages
  const { data: packages, isLoading } = useQuery({
    queryKey: ['limitless-country-prices', currency],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('esim_packages')
        .select('country_name, price, currency')
        .eq('package_type', 'limitless')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Map GLOBAL_109 countries with their starting prices
  const countriesWithPrices = useMemo(() => {
    if (!packages) return [];

    // Group by country to get minimum price
    const countryPriceMap: Record<string, number> = {};
    let global109MinPrice: number | null = null;

    packages.forEach((pkg) => {
      const countryName = pkg.country_name?.toLowerCase();
      if (countryName) {
        // Check if this is a Global 109 package
        if (countryName.includes('global 109') || countryName.includes('global-109')) {
          if (global109MinPrice === null || pkg.price < global109MinPrice) {
            global109MinPrice = pkg.price;
          }
        } else {
          // Regular country-specific package
          if (!countryPriceMap[countryName] || pkg.price < countryPriceMap[countryName]) {
            countryPriceMap[countryName] = pkg.price;
          }
        }
      }
    });

    // Use Global 109 price as fallback for countries without specific packages
    const fallbackPrice = global109MinPrice ?? 12.14;

    // Map GLOBAL_109 countries with their specific price or Global 109 fallback
    return GLOBAL_109.countries.map((country) => ({
      name: country.name,
      code: country.code,
      startingPrice: countryPriceMap[country.name.toLowerCase()] ?? fallbackPrice,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [packages]);

  const handleCountryClick = (country: CountryWithPrice) => {
    const slug = getCountrySlug(country.name);
    navigate(`/esim/${slug}?type=limitless`);
  };

  return (
    <section className="py-16 md:py-24 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            {t('limitless.countries.title') || 'Unlimited data locations'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('limitless.countries.subtitle') || 'Get unlimited data for any of the following locations - packages start from the shown price.'}
          </p>
        </motion.div>

        {/* Countries Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl bg-white" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {countriesWithPrices.map((country, index) => (
              <motion.button
                key={country.code}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.5) }}
                onClick={() => handleCountryClick(country)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group border border-gray-100 hover:border-orange-200"
              >
                <div className="flex items-center gap-3">
                  {/* Flag */}
                  <FlagIcon countryCode={country.code} size="lg" className="flex-shrink-0" />
                  {/* Country Info */}
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                      {country.name}
                    </p>
                    <p className="text-xs text-orange-500 font-medium">
                      {t('limitless.countries.from') || 'From'} {formatPrice(country.startingPrice)}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Countries Count */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-gray-500 mt-8"
        >
          {t('limitless.countries.count') || `Showing ${GLOBAL_109.countries.length} countries with unlimited data coverage`}
        </motion.p>
      </div>
    </section>
  );
};

export default LimitlessCountriesGrid;
