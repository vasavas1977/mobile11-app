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
import { AiraloStyleSelectorV4 } from '@/components/esim/AiraloStyleSelectorV4';
import { RegionalCountriesList } from '@/components/esim/RegionalCountriesList';
import { RegionalCountriesDialog } from '@/components/esim/RegionalCountriesDialog';
import { CompatibilityCheckDialog } from '@/components/esim/CompatibilityCheckDialog';
import { Loader2, ChevronRight, Home, Wifi, Check, ArrowLeft, Globe, Smartphone, BookOpen, HelpCircle } from 'lucide-react';
import { SEO, getCountrySEOByLanguage, getBreadcrumbStructuredData, getProductStructuredData, getFAQStructuredData } from '@/components/SEO';
import { RelatedPages } from '@/components/seo/RelatedPages';
import { 
  findCountryBySlug, 
  getCountryCarriers, 
  getDbCountryName,
  getRegionalBySlug,
  regionalToSlug,
  getRegionalPackagesForCountry,
} from '@/lib/countryDestinations';
import { parseBestNetwork, getBestNetworkFromPackages } from '@/lib/networkTypeUtils';
import { getCarrierDisplayName, getRawCarriersForDisplay, getCheapestCarrierOverall, requiresCarrierSelection, getPreferredCarrier, isCountryNameGrouped, getCountryNameDisplayLabel, getLocalCarrierForGrouped, getExcludedProviders } from '@/lib/carrierSelectionConfig';
import { getRegionPresetForName } from '@/lib/regionPresets';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

/**
 * V4 Country eSIM Page
 * Identical to V3, but uses AiraloStyleSelectorV4 which shows ALL day durations
 * without the "See longer plans" toggle. Production /esim/ routes remain on V3.
 */
export default function CountryEsimPageV4() {
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [countrySlug]);

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

      // For Hong Kong / Macau, also fetch multi-country bundles as direct packages
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
            // Deduplicate by id
            const existingIds = new Set(results.map((r: any) => r.id));
            results = [...results, ...mapped.filter((p: any) => !existingIds.has(p.id))];
          }
        }
        results.sort((a: any, b: any) => a.price - b.price);
      }

      const excluded = getExcludedProviders(resolvedCountryName);
      if (excluded.size > 0) {
        results = results.filter((p: any) => !excluded.has((p.provider_code || '').toLowerCase()));
      }

      return results;
    },
    enabled: !!resolvedCountryName || !!regionalInfo,
  });

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

  // Inline regional packages: fetch best-value regional groups to show as carrier cards
  const REGIONAL_NAME_PATTERNS: Record<string, string> = {
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

  const inlineRegionalCandidates = useMemo(() => {
    if (!country || regionalInfo || selectedRegional) return [];
    const isHkOrMacau = ['hong kong', 'macau'].includes(country.name.toLowerCase());
    return getRegionalPackagesForCountry(country.name)
      .filter(pkg => isHkOrMacau ? !['hongkong_macau', 'china_hongkong_macau'].includes(pkg.name) : true)
      .slice(0, 2); // Limit to 2 best-value regionals
  }, [country, regionalInfo, selectedRegional]);

  const { data: inlineRegionalPackages = {} } = useQuery({
    queryKey: ['inline-regional-packages', country?.name, inlineRegionalCandidates.map(c => c.name).join(',')],
    queryFn: async () => {
      const result: Record<string, any[]> = {};
      for (const candidate of inlineRegionalCandidates) {
        const pattern = REGIONAL_NAME_PATTERNS[candidate.name];
        if (!pattern) continue;
        const { data } = await supabase
          .from('esim_packages')
          .select('*, esim_providers(provider_code, provider_name)')
          .eq('is_active', true)
          .ilike('country_name', pattern)
          .order('price', { ascending: true });
        if (data && data.length > 0) {
          result[candidate.name] = data.map((p: any) => ({
            ...p,
            provider_code: p.esim_providers?.provider_code,
            provider_name: p.esim_providers?.provider_name,
          }));
        }
      }
      return result;
    },
    enabled: inlineRegionalCandidates.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const inlineRegionalGroups = useMemo(() => {
    return inlineRegionalCandidates
      .filter(c => inlineRegionalPackages[c.name]?.length > 0)
      .map(c => {
        const pkgs = inlineRegionalPackages[c.name];
        return {
          presetKey: c.name,
          displayName: c.displayName,
          countryCount: c.countryCount,
          packages: pkgs,
          network: getBestNetworkFromPackages(pkgs),
          allCarriers: [...new Set(pkgs.map((p: any) => p.carrier).filter(Boolean))] as string[],
          minPrice: Math.min(...pkgs.map((p: any) => p.price)),
          supportTopUp: pkgs.some((p: any) => p.top_up),
          supportVoice: pkgs.some((p: any) => p.support_voice),
          supportSms: pkgs.some((p: any) => p.support_sms),
          requiresKyc: pkgs.some((p: any) => p.kyc),
          initializePolicy: pkgs.find((p: any) => p.initialize_policy)?.initialize_policy || undefined,
        };
      })
      .sort((a, b) => a.minPrice - b.minPrice);
  }, [inlineRegionalCandidates, inlineRegionalPackages]);

  const inlineRegionalNames = useMemo(() => inlineRegionalGroups.map(g => g.presetKey), [inlineRegionalGroups]);

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

  // 404 states - identical to V3
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

  // Carrier groups - identical to V3
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
      // Put the exact country first, then sort rest by price
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
      {(() => {
        const seoData = getCountrySEOByLanguage(resolvedCountryName || '', language as 'en' | 'th');
        const breadcrumbData = getBreadcrumbStructuredData([
          { name: 'Home', url: 'https://mobile11.com/' },
          { name: 'eSIM Store', url: 'https://mobile11.com/packages' },
          { name: resolvedCountryName || '', url: `https://mobile11.com/esim/${countrySlug}` },
        ]);
        const cheapest = directPackages.length > 0
          ? directPackages.reduce((min, p) => p.price < min.price ? p : min, directPackages[0])
          : null;
        const productData = cheapest
          ? getProductStructuredData({
              name: `${resolvedCountryName} eSIM - ${cheapest.data_amount} / ${cheapest.validity_days} days`,
              description: seoData.description,
              price: cheapest.price,
              currency: cheapest.currency || 'USD',
              country: resolvedCountryName || undefined,
            })
          : null;
        const faqData = getFAQStructuredData([
          { question: String(t('countryFaq.q1')).replace(/\{country\}/g, resolvedCountryName || ''), answer: String(t('countryFaq.a1')).replace(/\{country\}/g, resolvedCountryName || '') },
          { question: String(t('countryFaq.q2')).replace(/\{country\}/g, resolvedCountryName || ''), answer: String(t('countryFaq.a2')).replace(/\{country\}/g, resolvedCountryName || '') },
          { question: String(t('countryFaq.q3')).replace(/\{country\}/g, resolvedCountryName || ''), answer: String(t('countryFaq.a3')).replace(/\{country\}/g, resolvedCountryName || '') },
          { question: String(t('countryFaq.q4')).replace(/\{country\}/g, resolvedCountryName || ''), answer: String(t('countryFaq.a4')).replace(/\{country\}/g, resolvedCountryName || '') },
          { question: String(t('countryFaq.q5')).replace(/\{country\}/g, resolvedCountryName || ''), answer: String(t('countryFaq.a5')).replace(/\{country\}/g, resolvedCountryName || '') },
        ]);
        const structuredData = [breadcrumbData, faqData, ...(productData ? [productData] : [])];
        return (
          <SEO
            title={seoData.title}
            description={seoData.description}
            keywords={seoData.keywords}
            canonical={`https://mobile11.com/esim/${countrySlug}`}
            type={cheapest ? 'product' : 'website'}
            structuredData={structuredData}
          />
        );
      })()}

      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        
        <main className="pt-24 pb-16">
          <div className={`container mx-auto px-4 ${viewMode === 'full' ? 'max-w-5xl' : 'max-w-2xl'}`}>
            {regionalInfo && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('common.back')}
              </button>
            )}

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
                            <p className="text-sm text-gray-500">{regionalPresetData ? 'Multi-carrier coverage' : (() => {
                              const names = new Set<string>();
                              uniqueCarriers.forEach(raw => {
                                const parts = raw.replace(/[A-Z][a-zA-Z\s]+:\s*/g, '').split(/[,\/]/);
                                parts.forEach(p => {
                                  const trimmed = p.trim();
                                  if (trimmed) names.add(trimmed);
                                });
                              });
                              return names.size > 0 ? Array.from(names).join(' / ') : 'Multi-carrier coverage';
                            })()}</p>
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
                          carrier={(() => {
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
                            const names = new Set<string>();
                            uniqueCarriers.forEach(raw => {
                              const parts = raw.replace(/[A-Z][a-zA-Z\s]+:\s*/g, '').split(/[,\/]/);
                              parts.forEach(p => {
                                const trimmed = p.trim();
                                if (trimmed) names.add(trimmed);
                              });
                            });
                            return names.size > 0 ? Array.from(names).join(' / ') : 'Mobile11';
                          })()}
                          countryName={regionalInfo.displayName}
                          packageType="day_pass"
                          networkType="4G"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                              {/* V4: AiraloStyleSelectorV4 shows all day durations */}
                              <AiraloStyleSelectorV4
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

                          {/* Inline regional package groups */}
                          {!selectedRegional && !regionalInfo && inlineRegionalGroups.map((rg) => {
                            const presetData = getRegionPresetForName(rg.displayName);
                            return (
                              <div key={rg.presetKey} className="space-y-4">
                                <CountryInfoCard
                                  countryName={rg.displayName}
                                  countryCode={resolvedCountryCode}
                                  carrier="Multi-carrier"
                                  networkType={rg.network}
                                  allCarriers={rg.allCarriers}
                                  hasDirect={true}
                                  supportTopUp={rg.supportTopUp}
                                  bundleCoverage={`${rg.countryCount} ${t('countryPage.countries') || 'countries'} · ${(t('countryPage.includesCountry') || 'Includes {country}').replace('{country}', resolvedCountryName || '')}`}
                                />
                                {presetData && (
                                  <div className="flex items-center gap-2 px-1">
                                    <RegionalCountriesDialog
                                      data={presetData}
                                      trigger={
                                        <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-500 transition-colors">
                                          <Globe className="w-3.5 h-3.5" />
                                          <span className="font-medium underline underline-offset-2">
                                            {presetData.countries.length} {t('configurator.countries') || 'Countries'}
                                          </span>
                                        </button>
                                      }
                                    />
                                  </div>
                                )}
                                <AiraloStyleSelectorV4
                                  packages={rg.packages}
                                  countryCode={rg.packages[0]?.country_code || resolvedCountryCode}
                                  countryName={rg.displayName}
                                  isRegional={true}
                                  onSelectPackage={handleSelectPackage}
                                  selectedPackageId={selectedPackageId}
                                  onViewFullConfigurator={() => handleSelectRegional(rg.displayName)}
                                  onAddToCart={(packageId, qty) => {
                                    const pkg = rg.packages.find((p: any) => p.id === packageId);
                                    if (!pkg) { toast.error('Package not found'); return; }
                                    for (let i = 0; i < qty; i++) {
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
                                  }}
                                />
                              </div>
                            );
                          })}
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
                            {t('countryPage.backToSimpleView')}
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
                    excludeRegionals={inlineRegionalNames}
                  />
                )}
              </div>
            )}
          </div>
        </main>

        <RelatedPages
          items={[
            { to: '/what-is-esim', titleEn: 'New to eSIM?', titleTh: 'eSIM คืออะไร?', titleZh: 'eSIM新手？', titleJa: 'eSIM初めての方？', titleKo: 'eSIM이 처음이신가요?', titleFr: 'Nouveau sur eSIM ?', titleDe: 'Neu bei eSIM?', descriptionEn: 'Learn what an eSIM is and how it works', descriptionTh: 'เรียนรู้ว่า eSIM คืออะไรและทำงานอย่างไร', descriptionZh: '了解什么是eSIM及其工作原理', descriptionJa: 'eSIMとは何か、どのように動作するかを学ぶ', descriptionKo: 'eSIM이 무엇이고 어떻게 작동하는지 알아보세요', descriptionFr: 'Découvrez ce qu\'est une eSIM et comment elle fonctionne', descriptionDe: 'Erfahren Sie, was eine eSIM ist und wie sie funktioniert', icon: Smartphone },
            { to: '/installation-guide', titleEn: 'Installation Guide', titleTh: 'คู่มือการติดตั้ง', titleZh: '安装指南', titleJa: 'インストールガイド', titleKo: '설치 가이드', titleFr: 'Guide d\'installation', titleDe: 'Installationsanleitung', descriptionEn: 'How to install your eSIM step by step', descriptionTh: 'วิธีติดตั้ง eSIM ทีละขั้นตอน', descriptionZh: '分步安装eSIM教程', descriptionJa: 'eSIMのインストール手順', descriptionKo: 'eSIM 설치 단계별 안내', descriptionFr: 'Comment installer votre eSIM étape par étape', descriptionDe: 'So installieren Sie Ihre eSIM Schritt für Schritt', icon: BookOpen },
            { to: '/support', titleEn: 'Need Help?', titleTh: 'ต้องการความช่วยเหลือ?', titleZh: '需要帮助？', titleJa: 'ヘルプが必要ですか？', titleKo: '도움이 필요하신가요?', titleFr: 'Besoin d\'aide ?', titleDe: 'Brauchen Sie Hilfe?', descriptionEn: 'Visit our Help Center for support', descriptionTh: 'เยี่ยมชมศูนย์ช่วยเหลือของเรา', descriptionZh: '访问我们的帮助中心获取支持', descriptionJa: 'ヘルプセンターでサポートを受ける', descriptionKo: '도움이 필요하시면 고객센터를 방문하세요', descriptionFr: 'Visitez notre centre d\'aide', descriptionDe: 'Besuchen Sie unser Hilfezentrum', icon: HelpCircle },
          ]}
        />

        <FooterAiralo />
      </div>
    </>
  );
}
