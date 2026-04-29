import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useOrganizationCredit } from '@/hooks/useOrganizationCredit';
import { useBusinessCart } from '@/contexts/BusinessCartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Globe, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BusinessPortalNav } from '@/components/business/BusinessPortalNav';
import { SearchAutocomplete } from '@/components/esim/SearchAutocomplete';
import { SimpleLimitlessConfigurator } from '@/components/esim/SimpleLimitlessConfigurator';
import { PackageConfigurator } from '@/components/esim/PackageConfigurator';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { getCountryCodeFromName } from '@/lib/countryCodeMapper';
import { getAllSupportedCountries, getRegionalPackagesForCountry } from '@/lib/countryDestinations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EsimPackage {
  id: string;
  package_id: string;
  name: string;
  short_name?: string;
  description: string;
  country_code: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  package_type?: string | null;
  category?: string;
  qos_speed?: string;
  carrier?: string;
  network_type?: string;
  sim_type?: string;
  speed_after_limit?: string | null;
  daily_data_reset?: boolean | null;
  daily_reset_amount?: string | null;
  support_data?: boolean;
  support_sms?: boolean;
  support_voice?: boolean;
  hot_spot?: boolean;
}

export default function BusinessPurchasePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading, isOrgAdmin, isOrgManager } = useOrganizationContext();
  const { data: creditData } = useOrganizationCredit(currentOrg?.id || null);
  const { addToCart } = useBusinessCart();
  const { formatPrice, t } = useLanguage();
  const { toast } = useToast();
  
  const [packageType, setPackageType] = useState<'local' | 'regional' | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [configuratorMode, setConfiguratorMode] = useState(false);
  const [showFullConfigurator, setShowFullConfigurator] = useState(false);

  const creditBalance = creditData?.credit_balance || 0;

  // Fetch all active packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['business-esim-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('esim_packages')
        .select('*, esim_providers(provider_code, provider_name)')
        .eq('is_active', true)
        .order('country_name', { ascending: true });
      
      if (error) {
        toast({
          title: "Error loading packages",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return (data || []).map((p: any) => ({
        ...p,
        provider_code: p.esim_providers?.provider_code,
        provider_name: p.esim_providers?.provider_name,
      })) as EsimPackage[];
    },
  });

  // Get countries with actual local packages (exclude multi-country packages by name pattern only)
  const localCountries = useMemo(() => {
    // Only exclude packages with multi-country indicators in the name
    const regionalPatterns = ['Countries', 'Global', '/'];
    
    const countrySet = new Map<string, { name: string; code: string }>();
    
    packages.forEach(pkg => {
      // Skip if country_name contains multi-country indicators
      const isRegionalName = regionalPatterns.some(pattern => 
        pkg.country_name.includes(pattern)
      );
      if (isRegionalName) return;
      
      // Add unique countries (regardless of category)
      if (!countrySet.has(pkg.country_name)) {
        countrySet.set(pkg.country_name, {
          name: pkg.country_name,
          code: pkg.country_code || ''
        });
      }
    });
    
    return Array.from(countrySet.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [packages]);

  // Get unique regional packages (must have multi-country indicators in name)
  const regionalPackages = useMemo(() => {
    // Patterns that indicate actual multi-country/regional packages
    const regionalNamePatterns = ['Countries', 'Global', '/'];
    
    const regions = new Map<string, EsimPackage[]>();
    packages.forEach(pkg => {
      // Must have a multi-country indicator in the name
      const hasRegionalName = regionalNamePatterns.some(pattern => 
        pkg.country_name.includes(pattern)
      );
      
      // Only include if it's actually a multi-country package
      if (hasRegionalName) {
        const existing = regions.get(pkg.country_name) || [];
        existing.push(pkg);
        regions.set(pkg.country_name, existing);
      }
    });
    
    return Array.from(regions.entries()).map(([name, pkgs]) => ({
      name,
      packages: pkgs,
      countryCode: pkgs[0]?.country_code || 'GLOBAL'
    }));
  }, [packages]);

  // Filter packages for selected destination (handles display name vs database name mismatch)
  const destinationPackages = useMemo(() => {
    if (!selectedDestination) return [];
    
    // Direct match first
    const directMatch = packages.filter(pkg => pkg.country_name === selectedDestination);
    if (directMatch.length > 0) return directMatch;
    
    // Normalize names for comparison (handle "China/Hongkong/Macau" vs "China, Hong Kong & Macau")
    const normalizeForComparison = (name: string) => 
      name.toLowerCase()
        .replace(/[,&\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace('hong kong', 'hongkong')
        .trim();
    
    const normalizedSelected = normalizeForComparison(selectedDestination);
    
    return packages.filter(pkg => {
      const normalizedPkg = normalizeForComparison(pkg.country_name);
      return normalizedPkg === normalizedSelected || 
             normalizedPkg.includes(normalizedSelected) ||
             normalizedSelected.includes(normalizedPkg);
    });
  }, [packages, selectedDestination]);

  // Get country code for selected destination
  const selectedCountryCode = useMemo(() => {
    if (!selectedDestination) return '';
    const pkg = packages.find(p => p.country_name === selectedDestination);
    return pkg?.country_code || getCountryCodeFromName(selectedDestination) || '';
  }, [selectedDestination, packages]);

  // Handle destination selection from search - with regional fallback
  const handleSelectCountry = useCallback((countryName: string) => {
    // Check if this country has direct packages in the database
    const directPackages = packages.filter(p => p.country_name === countryName);
    
    if (directPackages.length === 0) {
      // No direct packages - check for regional coverage
      const regionalInfo = getRegionalPackagesForCountry(countryName);
      if (regionalInfo.length > 0) {
        // Redirect to the regional package that covers this country
        setPackageType('regional');
        setSelectedDestination(regionalInfo[0].displayName);
      } else {
        // No coverage at all - show the country anyway (will show empty state)
        setSelectedDestination(countryName);
        setPackageType('local');
      }
    } else {
      // Has direct packages - proceed normally
      setSelectedDestination(countryName);
      setPackageType('local');
    }
    
    setConfiguratorMode(true);
    setShowFullConfigurator(false);
  }, [packages]);

  const handleSelectRegional = useCallback((name: string) => {
    setSelectedDestination(name);
    setPackageType('regional');
    setConfiguratorMode(true);
    setShowFullConfigurator(false);
  }, []);

  const handleSelectGlobal = useCallback((name: string) => {
    setSelectedDestination(name);
    setPackageType('regional');
    setConfiguratorMode(true);
    setShowFullConfigurator(false);
  }, []);

  // Handle dropdown selection with regional fallback
  const handleDropdownSelect = useCallback((countryName: string) => {
    const directPackages = packages.filter(p => 
      p.country_name === countryName && 
      (!p.category || p.category === 'local')
    );
    
    if (directPackages.length === 0) {
      const regionalInfo = getRegionalPackagesForCountry(countryName);
      if (regionalInfo.length > 0) {
        setPackageType('regional');
        setSelectedDestination(regionalInfo[0].displayName);
      } else {
        setSelectedDestination(countryName);
      }
    } else {
      setSelectedDestination(countryName);
    }
    setConfiguratorMode(true);
    setShowFullConfigurator(false);
  }, [packages]);

  // Handle back from configurator
  const handleBackFromConfigurator = useCallback(() => {
    setConfiguratorMode(false);
    setSelectedDestination(null);
    setShowFullConfigurator(false);
  }, []);

  // Add to cart from configurator - using BusinessCartContext
  const handleAddToCart = useCallback((packageId: string, quantity: number) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;

    addToCart({
      packageId: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      country: pkg.country_name,
      countryCode: pkg.country_code,
      data_amount: pkg.data_amount,
      validity: `${pkg.validity_days} days`,
      package_type: pkg.package_type || undefined,
      qos_speed: pkg.qos_speed,
      carrier: pkg.carrier,
      network_type: pkg.network_type,
      sim_type: pkg.sim_type || 'eSIM',
      speed_after_limit: pkg.speed_after_limit,
      daily_reset_amount: pkg.daily_reset_amount,
      hot_spot: pkg.hot_spot || false,
      support_sms: pkg.support_sms || false,
      support_voice: pkg.support_voice || false,
      support_data: pkg.support_data ?? true,
    }, quantity);
    
    // Navigate to cart after adding
    navigate('/business/cart');
  }, [packages, addToCart, navigate]);

  // Loading states
  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Card className="max-w-md bg-white rounded-2xl">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Please sign in to access the business portal.</p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600 rounded-full" onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Card className="max-w-md bg-white rounded-2xl">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No organization selected. Please select or create an organization.</p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600 rounded-full" onClick={() => navigate('/business')}>Go to Business Portal</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOrgAdmin && !isOrgManager) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Card className="max-w-md bg-white rounded-2xl">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Only admins and managers can purchase eSIMs.</p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600 rounded-full" onClick={() => navigate('/business/esims')}>Back to eSIMs</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <BusinessPortalNav />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with Credit Balance */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase eSIMs</h1>
            <p className="text-gray-600 mt-1">Select packages for your organization</p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100">
            <CreditCard className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Organization Credit</p>
              <p className="text-lg font-bold text-gray-900">{formatPrice(creditBalance)}</p>
            </div>
          </div>
        </div>

        {/* Configurator Mode */}
        {configuratorMode && selectedDestination ? (
          <div className="max-w-xl mx-auto">
            {showFullConfigurator ? (
              <PackageConfigurator
                countryCode={selectedCountryCode}
                countryName={selectedDestination}
                packages={destinationPackages}
                onAddToCart={handleAddToCart}
                onBack={handleBackFromConfigurator}
                isRegional={packageType === 'regional'}
              />
            ) : (
              <SimpleLimitlessConfigurator
                countryCode={selectedCountryCode}
                countryName={selectedDestination}
                packages={destinationPackages}
                onAddToCart={handleAddToCart}
                onShowFullConfigurator={() => setShowFullConfigurator(true)}
                onBack={handleBackFromConfigurator}
                isRegional={packageType === 'regional'}
              />
            )}
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-8">
              <SearchAutocomplete
                packages={packages}
                onSelectCountry={handleSelectCountry}
                onSelectRegional={handleSelectRegional}
                onSelectGlobal={handleSelectGlobal}
                placeholder={t('hero.searchPlaceholder')}
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Local / Regional Tabs */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setPackageType('local')}
                className={`px-8 py-4 rounded-full text-base font-semibold transition-all duration-300 ${
                  packageType === 'local'
                    ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30 scale-105'
                    : 'bg-white text-gray-700 hover:bg-white/90 border border-gray-200'
                }`}
              >
                <MapPin className="h-5 w-5 inline mr-2" />
                Local eSIM
              </button>
              <button
                onClick={() => setPackageType('regional')}
                className={`px-8 py-4 rounded-full text-base font-semibold transition-all duration-300 ${
                  packageType === 'regional'
                    ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30 scale-105'
                    : 'bg-white text-gray-700 hover:bg-white/90 border border-gray-200'
                }`}
              >
                <Globe className="h-5 w-5 inline mr-2" />
                Regional eSIM
              </button>
            </div>

            {/* Destination Selector - Only show when a package type is selected */}
            {packageType !== null && (
              <div className="max-w-md mx-auto mb-8">
                {packageType === 'local' ? (
                  <Select onValueChange={handleDropdownSelect}>
                    <SelectTrigger className="h-14 bg-white rounded-2xl shadow-lg border-gray-200 text-left text-gray-700 [&>span]:text-gray-500">
                      <SelectValue placeholder="All local packages" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-xl z-50 max-h-80">
                      {localCountries.map(country => (
                        <SelectItem key={country.name} value={country.name} className="py-3 cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FlagIcon countryCode={country.code} size="sm" />
                            <span className="text-gray-900">{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select onValueChange={handleDropdownSelect}>
                    <SelectTrigger className="h-14 bg-white rounded-2xl shadow-lg border-gray-200 text-left text-gray-700 [&>span]:text-gray-500">
                      <SelectValue placeholder="All regional packages" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-xl z-50 max-h-80">
                      {regionalPackages.map(({ name, countryCode }) => (
                        <SelectItem key={name} value={name} className="py-3 cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FlagIcon countryCode={countryCode} countryName={name} size="sm" />
                            <span className="text-gray-900">{name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Loading State */}
            {packagesLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            )}

            {/* Empty State */}
            {!packagesLoading && packages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('packageSelector.noPackages')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
