import { useState, useMemo, useRef, useEffect } from 'react';
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
import { AiraloStyleSelectorV3 } from '@/components/esim/AiraloStyleSelectorV3';
import { RegionalCountriesList } from '@/components/esim/RegionalCountriesList';
import { RegionalCountriesDialog } from '@/components/esim/RegionalCountriesDialog';
import { CompatibilityCheckDialog } from '@/components/esim/CompatibilityCheckDialog';
import { Loader2, ChevronRight, Home, Wifi, Check, ArrowLeft, Globe } from 'lucide-react';
import { SEO, getFAQStructuredData } from '@/components/SEO';
import { 
  findCountryBySlug, 
  getCountryCarriers, 
  getDbCountryName,
  getRegionalBySlug,
  regionalToSlug,
} from '@/lib/countryDestinations';
import { parseBestNetwork, getBestNetworkFromPackages } from '@/lib/networkTypeUtils';
import { getCarrierDisplayName, getRawCarriersForDisplay, getCheapestCarrierOverall, requiresCarrierSelection, getPreferredCarrier, isCountryNameGrouped, getCountryNameDisplayLabel, getLocalCarrierForGrouped, getExcludedProviders } from '@/lib/carrierSelectionConfig';
import { getRegionPresetForName } from '@/lib/regionPresets';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export default function CountryEsimPageV3() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language, formatPrice } = useLanguage();
  const { addToCart } = useCart();
  
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'full'>('simple');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [fullViewCarrier, setFullViewCarrier] = useState<string | undefined>(undefined);
  const configuratorRef = useRef<HTMLDivElement>(null);

  // Scroll to top when page loads (e.g. navigating from a country page to regional)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [countrySlug]);

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
    (regionalPackages || []).forEach(pkg => {
      if (pkg.carrier) carrierSet.add(pkg.carrier);
    });
    return Array.from(carrierSet);
  }, [directPackages, regionalPackages]);

  const carriers = useMemo(() => {
    if (!country) return [];
    return getCountryCarriers(country.name);
  }, [country]);

  const bestNetwork = useMemo(() => {
    return getBestNetworkFromPackages(directPackages);
  }, [directPackages]);

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

  const handleAddToCart = (packageId: string, quantity: number) => {
    const allPackages = selectedRegional ? regionalPackages : directPackages;
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
        service_tier: 'priority',
        initialize_policy: pkg.initialize_policy || undefined,
        provider_metadata: pkg.provider_metadata || undefined,
      });
    }
  };

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackageId(packageId);
  };

  const isLoading = loadingDirect || (!regionalInfo && selectedRegional && loadingRegional);

  const configuratorPackages = regionalInfo ? directPackages : (selectedRegional ? regionalPackages : directPackages);
  const configuratorCountryName = regionalInfo?.displayName || selectedRegional || resolvedCountryName || '';


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

  const activePackages = configuratorPackages;

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
          network: getBestNetworkFromPackages(pkgs),
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
        network: getBestNetworkFromPackages(pkgs),
        allCarriers: allRawCarriers,
        supportTopUp: pkgs.some(p => p.top_up),
        supportVoice: pkgs.some(p => p.support_voice),
        supportSms: pkgs.some(p => p.support_sms),
        requiresKyc: pkgs.some(p => p.kyc),
        initializePolicy: pkgs.find(p => p.initialize_policy)?.initialize_policy || undefined,
      }];
    }
    // Separate local-sim packages BEFORE building display map to prevent merging
    const localSimPkgs = activePackages.filter(p => p.is_local_sim);
    const nonLocalPkgs = activePackages.filter(p => !p.is_local_sim);
    const hasLocalSim = localSimPkgs.length > 0;
    const basePkgs = hasLocalSim && nonLocalPkgs.length > 0 ? nonLocalPkgs : activePackages;

    const rawCarriers = [...new Set(basePkgs.map(p => p.carrier).filter(Boolean))] as string[];
    const displayMap = new Map<string, string[]>();
    rawCarriers.forEach(raw => {
      const display = getCarrierDisplayName(configuratorCountryName, raw);
      if (!displayMap.has(display)) displayMap.set(display, []);
      displayMap.get(display)!.push(raw);
    });

    const buildGroup = (pkgs: typeof activePackages, display: string, raws: string[]) => {
      const priorityPkgs = pkgs.filter(p => 
        p.package_type === 'max_speed' || p.package_type === 'limitless'
      );
      const sortPkgs = priorityPkgs.length > 0 ? priorityPkgs : pkgs;
      const minPrice = sortPkgs.length > 0 ? Math.min(...sortPkgs.map(p => p.price)) : Infinity;
      return {
        displayName: display,
        packages: pkgs,
        network: getBestNetworkFromPackages(pkgs),
        allCarriers: raws,
        minPrice,
        supportTopUp: pkgs.some(p => p.top_up),
        supportVoice: pkgs.some(p => p.support_voice),
        supportSms: pkgs.some(p => p.support_sms),
        requiresKyc: pkgs.some(p => p.kyc),
        initializePolicy: pkgs.find(p => p.initialize_policy)?.initialize_policy || undefined,
      };
    };

    // Build groups from non-local packages
    let mainGroups: ReturnType<typeof buildGroup>[];
    if (displayMap.size <= 1) {
      const allRawCarriers = [...new Set(basePkgs.map(p => p.carrier).filter(Boolean))] as string[];
      const displayName = displayMap.size === 1 ? [...displayMap.keys()][0] : rawCarriers[0] || primaryCarrier;
      mainGroups = [buildGroup(basePkgs, displayName, allRawCarriers)];
    } else {
      mainGroups = [...displayMap.entries()].map(([display, raws]) => {
        const pkgs = basePkgs.filter(p => raws.includes(p.carrier || ''));
        return buildGroup(pkgs, display, raws);
      });
    }

    // Build separate groups for each local-sim carrier (no display name merging)
    const localGroups: ReturnType<typeof buildGroup>[] = [];
    if (hasLocalSim && nonLocalPkgs.length > 0) {
      const localCarriers = [...new Set(localSimPkgs.map(p => p.carrier).filter(Boolean))] as string[];
      localCarriers.forEach(carrier => {
        const pkgs = localSimPkgs.filter(p => p.carrier === carrier);
        localGroups.push(buildGroup(pkgs, carrier, [carrier]));
      });
    }

    const allGroups = [...mainGroups, ...localGroups];

    const preferred = getPreferredCarrier(configuratorCountryName, allGroups.map(g => g.displayName));
    allGroups.sort((a, b) => {
      // Keep local-sim groups at the top
      const aLocal = a.packages.some(p => p.is_local_sim);
      const bLocal = b.packages.some(p => p.is_local_sim);
      if (aLocal !== bLocal) return aLocal ? -1 : 1;
      if (preferred) {
        if (a.displayName === preferred) return -1;
        if (b.displayName === preferred) return 1;
      }
      return (a.minPrice || 0) - (b.minPrice || 0);
    });
    return allGroups;
  }, [activePackages, configuratorCountryName, selectedRegional, regionalInfo, primaryCarrier, bestNetwork, uniqueCarriers]);

  return (
    <>
      <SEO
        title={`${resolvedCountryName} eSIMs | Mobile11`}
        description={`Buy eSIM for ${resolvedCountryName}. Instant activation, affordable data plans. Stay connected with Mobile11.`}
        noindex={true}
        structuredData={resolvedCountryName ? getFAQStructuredData([
          { question: String(t('countryFaq.q1')).replace(/\{country\}/g, resolvedCountryName), answer: String(t('countryFaq.a1')).replace(/\{country\}/g, resolvedCountryName) },
          { question: String(t('countryFaq.q2')).replace(/\{country\}/g, resolvedCountryName), answer: String(t('countryFaq.a2')).replace(/\{country\}/g, resolvedCountryName) },
          { question: String(t('countryFaq.q3')).replace(/\{country\}/g, resolvedCountryName), answer: String(t('countryFaq.a3')).replace(/\{country\}/g, resolvedCountryName) },
          { question: String(t('countryFaq.q4')).replace(/\{country\}/g, resolvedCountryName), answer: String(t('countryFaq.a4')).replace(/\{country\}/g, resolvedCountryName) },
          { question: String(t('countryFaq.q5')).replace(/\{country\}/g, resolvedCountryName), answer: String(t('countryFaq.a5')).replace(/\{country\}/g, resolvedCountryName) },
        ]) : undefined}
      />

      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        
        <main className="pt-24 pb-16">
          <div className={`container mx-auto px-4 ${viewMode === 'full' ? 'max-w-5xl' : 'max-w-2xl'}`}>
            {/* Back button for regional pages */}
            {regionalInfo && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('countryPage3.back')}
              </button>
            )}

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
                {/* Country Info Card */}
                {!regionalInfo && !selectedRegional && resolvedCountryName && carrierGroups.length <= 1 && (
                  <CountryInfoCard
                    countryName={resolvedCountryName}
                    countryCode={resolvedCountryCode}
                    carrier={isCountryNameGrouped(configuratorCountryName) ? (getLocalCarrierForGrouped(configuratorCountryName) || carrierGroups[0]?.displayName || carrierGroups[0]?.allCarriers?.join('/') || primaryCarrier) : (carrierGroups[0]?.displayName || carrierGroups[0]?.allCarriers?.join('/') || primaryCarrier)}
                    networkType={carrierGroups[0]?.network || bestNetwork}
                    allCarriers={carrierGroups[0]?.allCarriers}
                    hasDirect={hasDirect}
                    supportTopUp={carrierGroups[0]?.supportTopUp}
                    supportVoice={carrierGroups[0]?.supportVoice}
                    supportSms={carrierGroups[0]?.supportSms}
                    requiresKyc={carrierGroups[0]?.requiresKyc}
                    isLocalSim={carrierGroups[0]?.packages.length > 0 && carrierGroups[0]?.packages.every(p => p.is_local_sim === true)}
                    initializePolicy={carrierGroups[0]?.initializePolicy}
                    bundleCoverage={isCountryNameGrouped(configuratorCountryName) ? carrierGroups[0]?.displayName : undefined}
                  />
                )}

                {/* Regional Info Card */}
                {regionalInfo && (() => {
                  // Helper to extract clean carrier names from regional carrier strings
                  const cleanCarriers = (() => {
                    // Prefer carriers from regional preset data (actual network operators)
                    if (regionalPresetData) {
                      const names = new Set<string>();
                      regionalPresetData.countries.forEach(country => {
                        country.carriers?.forEach(c => {
                          c.name.split('/').forEach(n => {
                            const trimmed = n.trim();
                            if (trimmed) names.add(trimmed);
                          });
                        });
                      });
                      if (names.size > 0) return Array.from(names).join(' / ');
                    }
                    // Fallback to DB carrier strings
                    const names = new Set<string>();
                    uniqueCarriers.forEach(raw => {
                      const parts = raw.replace(/[A-Z][a-zA-Z\s]+:\s*/g, '').split(/[,\/]/);
                      parts.forEach(p => {
                        const trimmed = p.trim();
                        if (trimmed) names.add(trimmed);
                      });
                    });
                    return names.size > 0 ? Array.from(names).join(' / ') : 'Mobile11';
                  })();
                  return (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                            <Wifi className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">{regionalInfo.displayName}</h2>
                            <p className="text-sm text-gray-500">{regionalPresetData ? 'Multi-carrier coverage' : cleanCarriers}</p>
                          </div>
                        </div>
                        {regionalPresetData && (
                          <RegionalCountriesDialog
                            data={regionalPresetData}
                            trigger={
                              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-orange-500 transition-colors">
                                <Globe className="w-4 h-4" />
                                <span className="font-medium underline underline-offset-2">
                                  {regionalPresetData.countries.length} Countries and Networks
                                </span>
                              </button>
                            }
                          />
                        )}
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
                          carrier={cleanCarriers}
                          countryName={regionalInfo.displayName}
                          packageType="day_pass"
                          networkType="4G"
                        />
                      </div>
                    </div>
                  </div>
                  );
                })()}



                {/* Main content area */}
                <div id="configurator">
                  {hasDirect || selectedRegional || regionalInfo ? (
                    <>

                      {selectedRegional && (
                        <button
                          onClick={handleBackToDirect}
                          className="mb-3 text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 px-2"
                        >
                          ← {t('countryPage.backTo') || 'Back to'} {resolvedCountryName}
                        </button>
                      )}

                      {/* View mode toggle */}
                      <div ref={configuratorRef}>
                      {viewMode === 'simple' ? (
                        <div className="space-y-10">
                          {carrierGroups.map((group, groupIndex) => (
                            <div key={group.displayName} className="space-y-4">
                              {carrierGroups.length > 1 && !selectedRegional && resolvedCountryName && (
                                <CountryInfoCard
                                  countryName={resolvedCountryName}
                                  countryCode={resolvedCountryCode}
                                  carrier={isCountryNameGrouped(configuratorCountryName) ? (getLocalCarrierForGrouped(configuratorCountryName) || group.displayName || group.allCarriers?.join('/')) : (group.displayName || group.allCarriers?.join('/'))}
                                  networkType={group.network}
                                  allCarriers={group.allCarriers}
                                  hasDirect={hasDirect}
                                  supportTopUp={group.supportTopUp}
                                  supportVoice={group.supportVoice}
                                  supportSms={group.supportSms}
                                  requiresKyc={group.requiresKyc}
                                  carrierIndex={groupIndex}
                                  isLocalSim={(group.packages.length > 0 && group.packages.every(p => p.is_local_sim === true)) || (configuratorCountryName === 'Japan' && group.displayName === 'DOCOMO')}
                                  initializePolicy={group.initializePolicy}
                                  bundleCoverage={isCountryNameGrouped(configuratorCountryName) ? group.displayName : undefined}
                                />
                              )}
                              <AiraloStyleSelectorV3
                                packages={group.packages}
                                countryCode={resolvedCountryCode}
                                countryName={configuratorCountryName}
                                isRegional={!!selectedRegional || !!regionalInfo}
                                onSelectPackage={handleSelectPackage}
                                selectedPackageId={selectedPackageId}
                onViewFullConfigurator={() => {
                  setFullViewCarrier(group.displayName);
                  setViewMode('full');
                  setTimeout(() => {
const y = configuratorRef.current?.getBoundingClientRect().top! + window.scrollY - 190;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }, 100);
                }}
                                onAddToCart={(packageId, qty) => handleAddToCart(packageId, qty)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <button
onClick={() => {
                              setFullViewCarrier(undefined);
                              setViewMode('simple');
                              setTimeout(() => {
                                const y = configuratorRef.current?.getBoundingClientRect().top! + window.scrollY - 190;
                                window.scrollTo({ top: y, behavior: 'smooth' });
                              }, 100);
                            }}
className="mb-1 text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 px-2"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {t('countryPage3.backToSimpleView')}
                          </button>
                          <PackageConfiguratorV2
                            countryName={configuratorCountryName}
                            countryCode={resolvedCountryCode}
                            packages={activePackages}
                            onAddToCart={handleAddToCart}
                            onBack={() => navigate('/packages')}
                            isRegional={!!selectedRegional || !!regionalInfo}
                            initialCarrier={fullViewCarrier || initialCarrier}
                            initialPackageType={initialType}
                            initialDays={initialDays}
                            initialOption={initialOption}
                            skipUsageStyle
                          />
                        </>
                      )}
                      </div>
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
