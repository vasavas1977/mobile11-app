import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { CountryInfoCard } from '@/components/esim/CountryInfoCard';
import { OperatorSimCard } from '@/components/my-esims/OperatorSimCard';
import { BroaderCoverageSection } from '@/components/esim/BroaderCoverageSection';
import { NoDirectCoverageState } from '@/components/esim/NoDirectCoverageState';
import { PackageConfigurator } from '@/components/esim/PackageConfigurator';
import { RegionalCountriesList } from '@/components/esim/RegionalCountriesList';
import { CompatibilityCheckDialog } from '@/components/esim/CompatibilityCheckDialog';
import { Loader2, ChevronRight, Home, Crown, Wifi, Check } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { 
  findCountryBySlug, 
  getCountryCarriers, 
  getCountryBestNetwork,
  getDbCountryName,
  getRegionalBySlug,
  regionalToSlug,
} from '@/lib/countryDestinations';
import { getRegionPresetForName } from '@/lib/regionPresets';
import { getExcludedProviders } from '@/lib/carrierSelectionConfig';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export default function CountryEsimPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language, formatPrice } = useLanguage();
  const { addToCart } = useCart();
  
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const urlTier = searchParams.get('tier');
  const [activeTier, setActiveTier] = useState<'priority' | 'economy'>(
    urlTier === 'economy' ? 'economy' : 'priority'
  );

  // Check if this slug is a regional plan
  const regionalInfo = useMemo(() => {
    if (!countrySlug) return null;
    return getRegionalBySlug(countrySlug);
  }, [countrySlug]);

  // Get regional preset data for the countries list display
  const regionalPresetData = useMemo(() => {
    if (!regionalInfo) return null;
    return getRegionPresetForName(regionalInfo.displayName);
  }, [regionalInfo]);

  // Extract filter params from URL (passed from LINE redirect)
  const initialCarrier = searchParams.get('carrier') || undefined;
  const initialType = searchParams.get('type') as 'limitless' | 'max_speed' | 'day_pass' | undefined;
  const initialDays = searchParams.get('days') ? parseInt(searchParams.get('days')!, 10) : undefined;
  const initialOption = searchParams.get('option') || undefined;

  // Find country from slug (only for non-regional)
  const country = useMemo(() => {
    if (!countrySlug || regionalInfo) return null;
    return findCountryBySlug(countrySlug);
  }, [countrySlug, regionalInfo]);

  // Get the DB-compatible country name
  const dbCountryName = countrySlug && !regionalInfo ? getDbCountryName(countrySlug) : null;
  const resolvedCountryName = regionalInfo?.displayName || dbCountryName || country?.name || null;

  // Fetch packages - for regional pages, use dbPattern; for country pages, use country name
  const { data: directPackages = [], isLoading: loadingDirect } = useQuery({
    queryKey: ['country-packages', regionalInfo ? regionalInfo.dbPattern : resolvedCountryName],
    queryFn: async () => {
      if (regionalInfo) {
        const { data } = await supabase
          .from('esim_packages')
          .select('*, esim_providers(provider_code, provider_name)')
          .eq('is_active', true)
          .ilike('country_name', regionalInfo.dbPattern)
          .order('price', { ascending: true });
        return (data || []).map((p: any) => ({
          ...p,
          provider_code: p.esim_providers?.provider_code,
          provider_name: p.esim_providers?.provider_name,
        }));
      }
      if (!resolvedCountryName) return [];
      const { data } = await supabase
        .from('esim_packages')
        .select('*, esim_providers(provider_code, provider_name)')
        .eq('is_active', true)
        .ilike('country_name', resolvedCountryName)
        .order('price', { ascending: true });
      let results = (data || []).map((p: any) => ({
        ...p,
        provider_code: p.esim_providers?.provider_code,
        provider_name: p.esim_providers?.provider_name,
      }));

      const isHkOrMacau = ['hong kong', 'macau'].includes(resolvedCountryName.toLowerCase());
      if (isHkOrMacau) {
        const bundlePatterns = ['Hong Kong/Macau', 'China/Hong Kong/Macau'];
        for (const pattern of bundlePatterns) {
          const { data: extra } = await supabase
            .from('esim_packages')
            .select('*, esim_providers(provider_code, provider_name)')
            .eq('is_active', true)
            .ilike('country_name', pattern)
            .order('price', { ascending: true });
          if (extra) {
            const mapped = extra.map((p: any) => ({
              ...p,
              provider_code: p.esim_providers?.provider_code,
              provider_name: p.esim_providers?.provider_name,
            }));
            const existingIds = new Set(results.map((r: any) => r.id));
            results = [...results, ...mapped.filter((p: any) => !existingIds.has(p.id))];
          }
        }
        results.sort((a: any, b: any) => a.price - b.price);
      }

      // Filter out excluded providers for this country
      const excluded = getExcludedProviders(resolvedCountryName);
      if (excluded.size > 0) {
        results = results.filter((p: any) => !excluded.has((p.provider_code || '').toLowerCase()));
      }

      return results;
    },
    enabled: !!resolvedCountryName || !!regionalInfo,
  });

  // Fetch regional packages for this country
  const { data: regionalPackages = [], isLoading: loadingRegional } = useQuery({
    queryKey: ['regional-packages-for-country', country?.name, selectedRegional],
    queryFn: async () => {
      if (!selectedRegional) return [];
      
      // Map display names to DB patterns
      const patternMap: Record<string, string> = {
        'Europe 42 Countries + 2Stopover': '%Europe 42%',
        'Europe 42 Countries': '%Europe 42%',
        'Europe Premium 42 + Stopover': '%Europe 42%',
        'Europe Extended 41': '%Europe 41%',
        'Europe Essentials 33': '%Europe 33%',
        'Europe 41 Countries': '%Europe 41%',
        'Europe 33 Countries': '%Europe 33%',
        'Asia 13 Countries': '%Asia 13%',
        'South East Asia 3 Countries': '%South East Asia 3%',
        'South East Asia 8 Countries': '%South East Asia 8%',
        'Global 109 Countries': '%Global 109%',
        'Global 151 Countries': '%Global 151%',
        'Hong Kong & Macau': 'Hong Kong/Macau',
        'China, Hong Kong & Macau': 'China/Hong Kong/Macau',
      };

      const pattern = patternMap[selectedRegional];
      if (!pattern) return [];

      const { data } = await supabase
        .from('esim_packages')
        .select('*, esim_providers(provider_code, provider_name)')
        .eq('is_active', true)
        .ilike('country_name', pattern)
        .order('price', { ascending: true });
      
      return (data || []).map((p: any) => ({
        ...p,
        provider_code: p.esim_providers?.provider_code,
        provider_name: p.esim_providers?.provider_name,
      }));
    },
    enabled: !!selectedRegional,
  });

  // Get unique carriers from packages
  const uniqueCarriers = useMemo(() => {
    const carrierSet = new Set<string>();
    directPackages.forEach(pkg => {
      if (pkg.carrier) carrierSet.add(pkg.carrier);
    });
    return Array.from(carrierSet);
  }, [directPackages]);

  // Get carrier and network info (fallback to lib/regionPresets if no packages)
  const carriers = useMemo(() => {
    if (!country) return [];
    return getCountryCarriers(country.name);
  }, [country]);

  const bestNetwork = useMemo(() => {
    if (!country) return '4G';
    return getCountryBestNetwork(country.name) || '4G';
  }, [country]);

  // Primary carrier display - use from packages if available, else from presets
  const primaryCarrier = uniqueCarriers.length > 0 
    ? uniqueCarriers.join(', ') 
    : (carriers[0]?.name || 'Mobile11');

  // Check if we have direct packages
  const hasDirect = directPackages.length > 0;

  // Handle regional selection
  const handleSelectRegional = (regionalName: string) => {
    const slug = regionalToSlug(regionalName);
    navigate(`/esim/${slug}`);
  };

  // Clear regional selection to go back to direct
  const handleBackToDirect = () => {
    setSelectedRegional(null);
  };

  // Handle add to cart - receives packageId from PackageConfigurator
  const handleAddToCart = (packageId: string, quantity: number, serviceTier: 'priority' | 'economy' = 'priority') => {
    // Find the package from our loaded packages
    const allPackages = serviceTier === 'economy' ? economyPackages : (selectedRegional ? regionalPackages : directPackages);
    const pkg = allPackages.find(p => p.id === packageId);
    
    if (!pkg) {
      console.error('Package not found:', packageId);
      toast.error('Package not found');
      return;
    }
    
    // Add each item individually based on quantity
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
        service_tier: serviceTier,
        initialize_policy: pkg.initialize_policy || undefined,
      });
    }
    // Toast is already triggered by CartContext.addToCart - no duplicate needed
  };

  const handleAddToCartPriority = (packageId: string, quantity: number) => {
    handleAddToCart(packageId, quantity, 'priority');
  };

  const handleAddToCartEconomy = (packageId: string, quantity: number) => {
    handleAddToCart(packageId, quantity, 'economy');
  };

  const isLoading = loadingDirect || (!regionalInfo && selectedRegional && loadingRegional);

  // Determine which packages to show in configurator
  // For regional pages, directPackages already contains regional packages
  const configuratorPackages = regionalInfo ? directPackages : (selectedRegional ? regionalPackages : directPackages);
  const configuratorCountryName = regionalInfo?.displayName || selectedRegional || resolvedCountryName || '';

  // Economy packages: same packages with 30% lower price
  const economyPackages = useMemo(() => {
    return configuratorPackages.map(pkg => ({
      ...pkg,
      price: Math.round(pkg.price * 0.7 * 100) / 100,
    }));
  }, [configuratorPackages]);

  // Start prices for tier headers
  const priorityStartPrice = useMemo(() => {
    if (configuratorPackages.length === 0) return 0;
    return Math.min(...configuratorPackages.map(p => p.price));
  }, [configuratorPackages]);

  const economyStartPrice = useMemo(() => {
    if (economyPackages.length === 0) return 0;
    return Math.min(...economyPackages.map(p => p.price));
  }, [economyPackages]);

  // Derive resolved country code for UI (from preset or first package)
  const resolvedCountryCode = country?.code || directPackages?.[0]?.country_code || 'XX';

  // 404 for unknown countries - only if we have no preset AND no DB mapping AND not regional
  if (!resolvedCountryName && !regionalInfo && countrySlug) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="pt-24 pb-12 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('countryPage.notFound') || 'Country not found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('countryPage.notFoundMessage') || "We couldn't find eSIM packages for this destination."}
          </p>
          <Link 
            to="/packages" 
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            {t('countryPage.browseAll') || 'Browse all destinations'}
          </Link>
        </div>
        <FooterAiralo />
      </div>
    );
  }

  // DB-only destination with no packages found after loading → 404 (skip for regional)
  if (!regionalInfo && !country && dbCountryName && !loadingDirect && directPackages.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <div className="pt-24 pb-12 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('countryPage.notFound') || 'Country not found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('countryPage.notFoundMessage') || "We couldn't find eSIM packages for this destination."}
          </p>
          <Link 
            to="/packages" 
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            {t('countryPage.browseAll') || 'Browse all destinations'}
          </Link>
        </div>
        <FooterAiralo />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{resolvedCountryName} eSIMs | Mobile11</title>
        <meta 
          name="description" 
          content={`Buy eSIM for ${resolvedCountryName}. Instant activation, affordable data plans. Stay connected with Mobile11.`} 
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link to="/" className="hover:text-orange-500 transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/packages" className="hover:text-orange-500 transition-colors">
                {t('countryPage.esimStore') || 'eSIM Store'}
              </Link>
              <ChevronRight className="w-4 h-4" />
              {selectedRegional ? (
                <>
                  <button 
                    onClick={handleBackToDirect}
                    className="hover:text-orange-500 transition-colors"
                  >
                    {resolvedCountryName}
                  </button>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-900 font-medium">{selectedRegional}</span>
                </>
              ) : (
                <span className="text-gray-900 font-medium">{resolvedCountryName}</span>
              )}
            </nav>

            {/* Page title */}
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">
              {selectedRegional 
                ? `${selectedRegional} eSIMs`
                : `${resolvedCountryName} eSIMs`
              }
            </h1>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Country Info Card - only show for direct (non-regional) */}
                {!regionalInfo && !selectedRegional && resolvedCountryName && (
                  <CountryInfoCard
                    countryName={resolvedCountryName}
                    countryCode={resolvedCountryCode}
                    carrier={primaryCarrier}
                    networkType={bestNetwork}
                    hasDirect={hasDirect}
                    initializePolicy={directPackages?.find(p => p.initialize_policy)?.initialize_policy || undefined}
                  />
                )}

                {/* Regional Info Card - show eSIM card visual for regional pages */}
                {regionalInfo && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                            <Wifi className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">{regionalInfo.displayName}</h2>
                            <p className="text-sm text-gray-500">Mobile11</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-sm font-medium">Mobile11</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">4G</span>
                        </div>
                        <CompatibilityCheckDialog />
                        <div className="space-y-2 pt-2">
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{t('countryPage.feature1') || "If you're running low, you can always top up"}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{t('countryPage.feature2') || 'The package starts when you connect to the network of destination'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center md:justify-end">
                        <OperatorSimCard
                          carrier="Mobile11"
                          countryName={regionalInfo.displayName}
                          packageType="day_pass"
                          networkType="4G"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Regional countries list for regional pages */}
                {regionalInfo && regionalPresetData && (
                  <RegionalCountriesList data={regionalPresetData} defaultExpanded={false} maxInitialDisplay={10} />
                )}

                {/* Main content area */}
                <div id="configurator">
                  {hasDirect || selectedRegional || regionalInfo ? (
                    <>
                      {/* Horizontal pill tab bar */}
                      <div className="flex bg-[#EDE9E1] p-1 rounded-full mb-3">
                        <button
                          onClick={() => setActiveTier('priority')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                            activeTier === 'priority'
                              ? 'bg-white shadow-sm text-gray-900 font-bold'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Crown className="w-4 h-4 text-orange-500" />
                          <span>Priority</span>
                          <span className="text-xs opacity-75">
                            {t('countryPage.from')} {formatPrice(priorityStartPrice)}
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveTier('economy')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                            activeTier === 'economy'
                              ? 'bg-white shadow-sm text-gray-900 font-bold'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Wifi className="w-4 h-4 text-green-600" />
                          <span>Economy</span>
                          <span className="text-xs opacity-75">
                            {t('countryPage.from')} {formatPrice(economyStartPrice)}
                          </span>
                        </button>
                      </div>

                      {activeTier === 'priority' ? (
                        <>
                          <div className="flex flex-col gap-1 text-sm text-gray-600 mb-1 md:mb-3 px-2">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              {t('serviceTier.premiumInternet')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              {t('serviceTier.prioritySupport')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              {t('serviceTier.backupEsim')}
                            </span>
                          </div>

                          {selectedRegional && (
                            <button
                              onClick={handleBackToDirect}
                              className="mb-3 text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 px-2"
                            >
                              ← {t('countryPage.backTo') || 'Back to'} {resolvedCountryName}
                            </button>
                          )}

                          <PackageConfigurator
                            countryName={configuratorCountryName}
                            countryCode={resolvedCountryCode}
                            packages={configuratorPackages}
                            onAddToCart={handleAddToCartPriority}
                            onBack={() => navigate('/packages')}
                            isRegional={!!selectedRegional || !!regionalInfo}
                            initialCarrier={initialCarrier}
                            initialPackageType={initialType}
                            initialDays={initialDays}
                            initialOption={initialOption}
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col gap-1 text-sm text-gray-600 mb-1 md:mb-3 px-2">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              {t('serviceTier.monFriSupport')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              {t('serviceTier.standardSpeed')}
                            </span>
                          </div>

                          {selectedRegional && (
                            <button
                              onClick={handleBackToDirect}
                              className="mb-3 text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 px-2"
                            >
                              ← {t('countryPage.backTo') || 'Back to'} {resolvedCountryName}
                            </button>
                          )}

                          <PackageConfigurator
                            countryName={configuratorCountryName}
                            countryCode={resolvedCountryCode}
                            packages={economyPackages}
                            onAddToCart={handleAddToCartEconomy}
                            onBack={() => navigate('/packages')}
                            isRegional={!!selectedRegional || !!regionalInfo}
                            initialCarrier={initialCarrier}
                            initialPackageType={initialType}
                            initialDays={initialDays}
                            initialOption={initialOption}
                          />
                        </>
                      )}
                    </>
                  ) : (
                    /* No direct coverage state */
                    <NoDirectCoverageState
                      countryName={resolvedCountryName || ''}
                      countryCode={resolvedCountryCode}
                      onSelectRegional={handleSelectRegional}
                    />
                  )}
                </div>

                {/* Broader coverage section - only show for direct packages */}
                {hasDirect && !selectedRegional && !regionalInfo && country && (
                  <BroaderCoverageSection
                    countryName={country.name}
                    onSelectRegional={handleSelectRegional}
                  />
                )}
              </div>
            )}
          </div>
        </main>

        <FooterAiralo />
      </div>
    </>
  );
}
