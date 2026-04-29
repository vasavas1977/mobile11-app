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
import { PackageConfiguratorV2 } from '@/components/esim/PackageConfiguratorV2';
import { AiraloStyleSelector } from '@/components/esim/AiraloStyleSelector';
import { RegionalCountriesList } from '@/components/esim/RegionalCountriesList';
import { CompatibilityCheckDialog } from '@/components/esim/CompatibilityCheckDialog';
import { Loader2, ChevronRight, Home, Crown, Wifi, Check, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { 
  findCountryBySlug, 
  getCountryCarriers, 
  getCountryBestNetwork,
  getDbCountryName,
  getRegionalBySlug,
  regionalToSlug,
} from '@/lib/countryDestinations';
import { getCarrierDisplayName, getRawCarriersForDisplay, getCheapestCarrierOverall, requiresCarrierSelection, getPreferredCarrier, isCountryNameGrouped, getCountryNameDisplayLabel, getLocalCarrierForGrouped, getExcludedProviders } from '@/lib/carrierSelectionConfig';
import { getRegionPresetForName } from '@/lib/regionPresets';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export default function CountryEsimPageV2() {
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
  const [viewMode, setViewMode] = useState<'simple' | 'full'>('simple');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  // Check if this slug is a regional plan
  const regionalInfo = useMemo(() => {
    if (!countrySlug) return null;
    return getRegionalBySlug(countrySlug);
  }, [countrySlug]);

  const regionalPresetData = useMemo(() => {
    if (!regionalInfo) return null;
    return getRegionPresetForName(regionalInfo.displayName);
  }, [regionalInfo]);

  const initialCarrier = searchParams.get('carrier') || undefined;
  const initialType = searchParams.get('type') as 'limitless' | 'max_speed' | 'day_pass' | undefined;
  const initialDays = searchParams.get('days') ? parseInt(searchParams.get('days')!, 10) : undefined;
  const initialOption = searchParams.get('option') || undefined;

  const country = useMemo(() => {
    if (!countrySlug || regionalInfo) return null;
    return findCountryBySlug(countrySlug);
  }, [countrySlug, regionalInfo]);

  const dbCountryName = countrySlug && !regionalInfo ? getDbCountryName(countrySlug) : null;
  const resolvedCountryName = regionalInfo?.displayName || dbCountryName || country?.name || null;

  // Fetch packages
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

  const uniqueCarriers = useMemo(() => {
    const carrierSet = new Set<string>();
    directPackages.forEach(pkg => {
      if (pkg.carrier) carrierSet.add(pkg.carrier);
    });
    return Array.from(carrierSet);
  }, [directPackages]);

  const carriers = useMemo(() => {
    if (!country) return [];
    return getCountryCarriers(country.name);
  }, [country]);

  const bestNetwork = useMemo(() => {
    if (!country) return '4G';
    return getCountryBestNetwork(country.name) || '4G';
  }, [country]);

  const primaryCarrier = uniqueCarriers.length > 0 
    ? uniqueCarriers.join(', ') 
    : (carriers[0]?.name || 'Mobile11');

  const hasDirect = directPackages.length > 0;

  const handleSelectRegional = (regionalName: string) => {
    const slug = regionalToSlug(regionalName);
    navigate(`/esim/${slug}`);
  };

  const handleBackToDirect = () => {
    setSelectedRegional(null);
  };

  const handleAddToCart = (packageId: string, quantity: number, serviceTier: 'priority' | 'economy' = 'priority') => {
    const allPackages = serviceTier === 'economy' ? economyPackages : (selectedRegional ? regionalPackages : directPackages);
    const pkg = allPackages.find(p => p.id === packageId);
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
        service_tier: serviceTier,
        initialize_policy: pkg.initialize_policy || undefined,
      });
    }
  };

  const handleAddToCartPriority = (packageId: string, quantity: number) => {
    handleAddToCart(packageId, quantity, 'priority');
  };

  const handleAddToCartEconomy = (packageId: string, quantity: number) => {
    handleAddToCart(packageId, quantity, 'economy');
  };

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackageId(packageId);
  };

  const isLoading = loadingDirect || (!regionalInfo && selectedRegional && loadingRegional);

  const configuratorPackages = regionalInfo ? directPackages : (selectedRegional ? regionalPackages : directPackages);
  const configuratorCountryName = regionalInfo?.displayName || selectedRegional || resolvedCountryName || '';

  const economyPackages = useMemo(() => {
    return configuratorPackages.map(pkg => ({
      ...pkg,
      price: Math.round(pkg.price * 0.7 * 100) / 100,
    }));
  }, [configuratorPackages]);

  const priorityStartPrice = useMemo(() => {
    if (configuratorPackages.length === 0) return 0;
    return Math.min(...configuratorPackages.map(p => p.price));
  }, [configuratorPackages]);

  const economyStartPrice = useMemo(() => {
    if (economyPackages.length === 0) return 0;
    return Math.min(...economyPackages.map(p => p.price));
  }, [economyPackages]);

  const resolvedCountryCode = country?.code || directPackages?.[0]?.country_code || 'XX';

  // 404 for unknown countries
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

  const activePackages = activeTier === 'economy' ? economyPackages : configuratorPackages;

  // Group packages by carrier for multi-carrier stacked layout
  const carrierGroups = useMemo(() => {
    const isMultiCarrier = requiresCarrierSelection(configuratorCountryName);

    // Special path: group by country_name for HK/Macau bundle destinations
    if (isCountryNameGrouped(configuratorCountryName) && !selectedRegional && !regionalInfo) {
      const countryNameMap = new Map<string, typeof activePackages>();
      activePackages.forEach(pkg => {
        const cn = pkg.country_name || configuratorCountryName;
        if (!countryNameMap.has(cn)) countryNameMap.set(cn, []);
        countryNameMap.get(cn)!.push(pkg);
      });
      const groups = [...countryNameMap.entries()].map(([cn, pkgs]) => {
        const allRawCarriers = [...new Set(pkgs.map(p => p.carrier).filter(Boolean))] as string[];
        const priorityPkgs = pkgs.filter(p => p.package_type === 'max_speed' || p.package_type === 'limitless');
        const sortPkgs = priorityPkgs.length > 0 ? priorityPkgs : pkgs;
        const minPrice = sortPkgs.length > 0 ? Math.min(...sortPkgs.map(p => p.price)) : Infinity;
        return {
          displayName: getCountryNameDisplayLabel(cn),
          packages: pkgs,
          network: pkgs[0]?.network_type || bestNetwork,
          allCarriers: allRawCarriers,
          minPrice,
          supportTopUp: pkgs.some(p => p.top_up),
          supportVoice: pkgs.some(p => p.support_voice),
          supportSms: pkgs.some(p => p.support_sms),
          requiresKyc: pkgs.some(p => p.kyc),
          initializePolicy: pkgs.find(p => p.initialize_policy)?.initialize_policy || undefined,
        };
      });
      groups.sort((a, b) => {
        const aIsExact = a.displayName === configuratorCountryName;
        const bIsExact = b.displayName === configuratorCountryName;
        if (aIsExact !== bIsExact) return aIsExact ? -1 : 1;
        return (a.minPrice || 0) - (b.minPrice || 0);
      });
      return groups;
    }

    if (!isMultiCarrier || selectedRegional || regionalInfo) {
      const pkgs = activePackages;
      const allRawCarriers = [...new Set(pkgs.map(p => p.carrier).filter(Boolean))] as string[];
      return [{
        displayName: uniqueCarriers[0] || primaryCarrier,
        packages: pkgs,
        network: bestNetwork,
        allCarriers: allRawCarriers,
        supportTopUp: pkgs.some(p => p.top_up),
        supportVoice: pkgs.some(p => p.support_voice),
        supportSms: pkgs.some(p => p.support_sms),
        requiresKyc: pkgs.some(p => p.kyc),
        initializePolicy: pkgs.find(p => p.initialize_policy)?.initialize_policy || undefined,
      }];
    }
    const rawCarriers = [...new Set(activePackages.map(p => p.carrier).filter(Boolean))] as string[];
    const displayMap = new Map<string, string[]>();
    rawCarriers.forEach(raw => {
      const display = getCarrierDisplayName(configuratorCountryName, raw);
      if (!displayMap.has(display)) displayMap.set(display, []);
      displayMap.get(display)!.push(raw);
    });
    if (displayMap.size <= 1) {
      const pkgs = activePackages;
      return [{
        displayName: rawCarriers[0] || primaryCarrier,
        packages: pkgs,
        network: bestNetwork,
        allCarriers: rawCarriers,
        supportTopUp: pkgs.some(p => p.top_up),
        supportVoice: pkgs.some(p => p.support_voice),
        supportSms: pkgs.some(p => p.support_sms),
        requiresKyc: pkgs.some(p => p.kyc),
        initializePolicy: pkgs.find(p => p.initialize_policy)?.initialize_policy || undefined,
      }];
    }
    const groups = [...displayMap.entries()].map(([display, raws]) => {
      const pkgs = activePackages.filter(p => raws.includes(p.carrier || ''));
      const minPrice = pkgs.length > 0 ? Math.min(...pkgs.map(p => p.price)) : Infinity;
      const net = pkgs[0]?.network_type || bestNetwork;
      return {
        displayName: display,
        packages: pkgs,
        network: net,
        allCarriers: raws,
        minPrice,
        supportTopUp: pkgs.some(p => p.top_up),
        supportVoice: pkgs.some(p => p.support_voice),
        supportSms: pkgs.some(p => p.support_sms),
        requiresKyc: pkgs.some(p => p.kyc),
        initializePolicy: pkgs.find(p => p.initialize_policy)?.initialize_policy || undefined,
      };
    });
    const preferred = getPreferredCarrier(configuratorCountryName, groups.map(g => g.displayName));
    groups.sort((a, b) => {
      if (preferred) {
        if (a.displayName === preferred) return -1;
        if (b.displayName === preferred) return 1;
      }
      return a.minPrice - b.minPrice;
    });
    return groups;
  }, [activePackages, configuratorCountryName, selectedRegional, regionalInfo, primaryCarrier, bestNetwork, uniqueCarriers]);

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
          <div className={`container mx-auto px-4 ${viewMode === 'full' ? 'max-w-5xl' : 'max-w-2xl'}`}>
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
                {/* Country Info Card — only for single-carrier countries */}
                {!regionalInfo && !selectedRegional && resolvedCountryName && carrierGroups.length <= 1 && (
                  <CountryInfoCard
                    countryName={resolvedCountryName}
                    countryCode={resolvedCountryCode}
                    carrier={isCountryNameGrouped(configuratorCountryName) ? (getLocalCarrierForGrouped(configuratorCountryName) || carrierGroups[0]?.allCarriers?.join('/') || carrierGroups[0]?.displayName || primaryCarrier) : (carrierGroups[0]?.allCarriers?.join('/') || carrierGroups[0]?.displayName || primaryCarrier)}
                    networkType={bestNetwork}
                    hasDirect={hasDirect}
                    supportTopUp={carrierGroups[0]?.supportTopUp}
                    supportVoice={carrierGroups[0]?.supportVoice}
                    supportSms={carrierGroups[0]?.supportSms}
                    requiresKyc={carrierGroups[0]?.requiresKyc}
                    initializePolicy={carrierGroups[0]?.initializePolicy}
                    bundleCoverage={isCountryNameGrouped(configuratorCountryName) ? carrierGroups[0]?.displayName : undefined}
                  />
                )}

                {/* Regional Info Card */}
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

                {/* Regional countries list */}
                {regionalInfo && regionalPresetData && (
                  <RegionalCountriesList data={regionalPresetData} defaultExpanded={false} maxInitialDisplay={10} />
                )}

                {/* Main content area */}
                <div id="configurator">
                  {hasDirect || selectedRegional || regionalInfo ? (
                    <>
                      {/* Priority / Economy pill tabs */}
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
                            {t('countryPage2.from')} {formatPrice(priorityStartPrice)}
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
                            {t('countryPage2.from')} {formatPrice(economyStartPrice)}
                          </span>
                        </button>
                      </div>

                      {/* Tier benefits */}
                      {activeTier === 'priority' ? (
                        <div className="flex flex-col gap-1 text-sm text-gray-600 mb-1 md:mb-3 px-2">
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {t('countryPage2.priorityInternet')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {t('countryPage2.support247')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {t('countryPage2.backupEsim')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 text-sm text-gray-600 mb-1 md:mb-3 px-2">
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {t('countryPage2.monFriSupport')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {t('countryPage2.standardSpeed')}
                          </span>
                        </div>
                      )}

                      {selectedRegional && (
                        <button
                          onClick={handleBackToDirect}
                          className="mb-3 text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 px-2"
                        >
                          ← {t('countryPage.backTo') || 'Back to'} {resolvedCountryName}
                        </button>
                      )}

                      {/* View mode toggle */}
                      {viewMode === 'simple' ? (
                        <div className="space-y-10">
                          {carrierGroups.map((group, groupIndex) => (
                            <div key={group.displayName} className="space-y-4">
                              {carrierGroups.length > 1 && !selectedRegional && resolvedCountryName && (
                                <CountryInfoCard
                                  countryName={resolvedCountryName}
                                  countryCode={resolvedCountryCode}
                                  carrier={isCountryNameGrouped(configuratorCountryName) ? (getLocalCarrierForGrouped(configuratorCountryName) || group.allCarriers?.join('/') || group.displayName) : (group.allCarriers?.join('/') || group.displayName)}
                                  networkType={group.network}
                                  hasDirect={hasDirect}
                                  supportTopUp={group.supportTopUp}
                                  supportVoice={group.supportVoice}
                                  supportSms={group.supportSms}
                                  requiresKyc={group.requiresKyc}
                                  carrierIndex={groupIndex}
                                  initializePolicy={group.initializePolicy}
                                />
                              )}
                              <AiraloStyleSelector
                                packages={group.packages}
                                countryCode={resolvedCountryCode}
                                countryName={configuratorCountryName}
                                isRegional={!!selectedRegional || !!regionalInfo}
                                onSelectPackage={handleSelectPackage}
                                selectedPackageId={selectedPackageId}
                                onViewFullConfigurator={() => setViewMode('full')}
                                onAddToCart={(packageId, qty) => handleAddToCart(packageId, qty, activeTier)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setViewMode('simple')}
                            className="mb-3 text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 px-2"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {t('countryPage2.backToSimpleView')}
                          </button>
                          <PackageConfiguratorV2
                            countryName={configuratorCountryName}
                            countryCode={resolvedCountryCode}
                            packages={activePackages}
                            onAddToCart={activeTier === 'economy' ? handleAddToCartEconomy : handleAddToCartPriority}
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
                    <NoDirectCoverageState
                      countryName={resolvedCountryName || ''}
                      countryCode={resolvedCountryCode}
                      onSelectRegional={handleSelectRegional}
                    />
                  )}
                </div>

                {/* Broader coverage section */}
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
