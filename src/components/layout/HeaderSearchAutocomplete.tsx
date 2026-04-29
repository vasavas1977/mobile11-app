import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, MapPin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import * as regionalUtils from '@/lib/regionalPackageUtils';
import { translateSearchTerm } from '@/lib/countryTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { HeaderLocationsDropdown } from './HeaderLocationsDropdown';
import { searchCountries, getRegionalPackagesForCountry, countryToSlug, regionalToSlug, getDisplayName } from '@/lib/countryDestinations';

interface SearchResult {
  type: 'country' | 'regional' | 'global';
  display: string;
  countryName: string;
  packageCount: number;
  flag?: string;
  viaRegional?: string; // For countries only available via regional packages
}

interface HeaderSearchAutocompleteProps {
  className?: string;
}

export function HeaderSearchAutocomplete({ className }: HeaderSearchAutocompleteProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [locationsOpen, setLocationsOpen] = useState(false);
  const locationsRef = useRef<HTMLDivElement>(null);

  // Fetch aggregated package search index (bypasses 1000-row limit)
  const { data: packages = [], isLoading: isLoadingPackages } = useQuery({
    queryKey: ['header-search-packages-index'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_package_search_index');
      return (data || []).map((row: any) => ({
        id: row.country_name,
        country_name: row.country_name,
        country_code: row.country_code || '',
        category: row.category || '',
        included_countries: row.included_countries,
        _aggregated_count: Number(row.package_count),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Close locations dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationsRef.current && !locationsRef.current.contains(event.target as Node)) {
        setLocationsOpen(false);
      }
    };

    if (locationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [locationsOpen]);

  // Helper: Normalize regional package names for comparison
  const normalizeRegionalName = useCallback((name: string): string => {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/(\d+)([A-Z])/g, '$1 $2')
      .toLowerCase();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 150);
    return () => clearTimeout(timer);
  }, [value]);

  // Build package maps for fast lookup
  const { countryMap, regionalMap, pkgNameToData } = useMemo(() => {
    const countryMap = new Map<string, { 
      count: number; 
      code: string;
      displayName: string;
    }>();
    
    const regionalMap = new Map<string, {
      pkgName: string;
      count: number;
      countryCount: number;
      category: string;
    }[]>();
    
    const packageCounts = new Map<string, { count: number; displayName: string }>();
    const regionalDataCache = new Map<any, any>();
    const pkgNameToData = new Map<string, { count: number; countryCount: number; displayName: string; category: string }>();

    packages.forEach(pkg => {
      const pkgName = pkg.country_name;
      const normalized = normalizeRegionalName(pkgName);
      
      // Use pre-aggregated count from RPC if available
      const aggregatedCount = (pkg as any)._aggregated_count || 1;
      
      const existing = packageCounts.get(normalized);
      if (!existing) {
        packageCounts.set(normalized, { count: aggregatedCount, displayName: getDisplayName(pkgName) });
      } else {
        // With aggregated data, each row is unique per country_name, so this shouldn't happen
        // but keep for safety
        existing.count += aggregatedCount;
        if (/\d\s[A-Z]/.test(pkgName) && !/\d\s[A-Z]/.test(existing.displayName)) {
          existing.displayName = pkgName;
        }
      }
      
      if (!regionalDataCache.has(pkg)) {
        regionalDataCache.set(pkg, regionalUtils.getRegionalData(pkg));
      }
    });

    packages.forEach(pkg => {
      const pkgName = pkg.country_name;
      const normalized = normalizeRegionalName(pkgName);
      const regionalData = regionalDataCache.get(pkg);
      const isGlobal = pkg.category === 'global';

      if (!pkgNameToData.has(normalized)) {
        const countData = packageCounts.get(normalized)!;
        pkgNameToData.set(normalized, {
          count: countData.count,
          countryCount: regionalData ? regionalData.countries.length : 1,
          displayName: countData.displayName,
          category: pkg.category || 'regional'
        });
      }

      if (!regionalData || regionalData.countries.length <= 1) {
        if (!isGlobal) {
          const country = pkgName.toLowerCase();
          if (!countryMap.has(country)) {
            const countData = packageCounts.get(normalized)!;
            countryMap.set(country, { 
              count: countData.count,
              code: pkg.country_code || '',
              displayName: countData.displayName
            });
          }
        }
      }

      if (regionalData && regionalData.countries.length > 0) {
        regionalData.countries.forEach((country: any) => {
          const key = country.name.toLowerCase();
          const pkgData = pkgNameToData.get(normalized)!;
          
          if (!regionalMap.has(key)) {
            regionalMap.set(key, []);
          }
          
          const existing = regionalMap.get(key)!;
          if (!existing.some(p => normalizeRegionalName(p.pkgName) === normalized)) {
            existing.push({
              pkgName: pkgData.displayName,
              count: pkgData.count,
              countryCount: pkgData.countryCount,
              category: pkgData.category
            });
          }
        });
      }
    });

    return { countryMap, regionalMap, pkgNameToData };
  }, [packages, normalizeRegionalName]);

  // Search and group results
  const results = useMemo((): {
    countries: SearchResult[];
    regional: SearchResult[];
    global: SearchResult[];
  } => {
    const term = debouncedValue.toLowerCase().trim();
    
    if (term.length < 1) {
      return { countries: [], regional: [], global: [] };
    }

    const searchTerms = translateSearchTerm(term);
    const countries: SearchResult[] = [];
    const addedCountries = new Set<string>(); // Track added countries to avoid duplicates
    const regionalSet = new Map<string, { count: number; countryCount: number }>();
    const globalSet = new Map<string, { count: number; countryCount: number }>();

    // First, add countries with direct packages
    countryMap.forEach((data, country) => {
      if (searchTerms.some(searchTerm => country.includes(searchTerm))) {
        countries.push({
          type: 'country',
          display: data.displayName,
          countryName: data.displayName,
          packageCount: data.count,
          flag: data.code
        });
        addedCountries.add(country);
        // Also add base name without parenthetical for dedup (e.g., "turkey(türkiye)" -> "turkey")
        const baseName = country.replace(/\(.*\)/, '').trim();
        if (baseName !== country) {
          addedCountries.add(baseName);
        }
      }
    });

    // Then, search all supported countries from regional presets (for countries like New Zealand)
    // Only show "via Regional" fallback results when we KNOW the DB has no direct packages
    if (!isLoadingPackages) {
    const allMatchedCountries = searchCountries(term);
    allMatchedCountries.forEach(country => {
      const key = country.name.toLowerCase();
      // Only add if not already in countries (no direct package)
      if (!addedCountries.has(key)) {
        const regionalPackages = getRegionalPackagesForCountry(country.name);
        if (regionalPackages.length > 0) {
          // Remove larger regional packages that are supersets of smaller ones
          // e.g., "China, Hong Kong & Macau" (3 countries) is redundant when "Hong Kong & Macau" (2) exists
          const getWords = (name: string) => name.toLowerCase().replace(/[,&\/]/g, ' ').split(/\s+/).filter(Boolean);
          const filtered = regionalPackages.filter(pkg => {
            const pkgWords = new Set(getWords(pkg.displayName));
            // Remove this package if a smaller package exists whose words are all contained in this one
            return !regionalPackages.some(smaller => 
              smaller.countryCount < pkg.countryCount &&
              getWords(smaller.displayName).every(w => pkgWords.has(w))
            );
          });
          
          const viaPackages = (filtered.length > 0 ? filtered : regionalPackages)
            .slice(0, 2)
            .map(r => r.displayName.replace(' Countries', ''))
            .join(', ');
          
          countries.push({
            type: 'country',
            display: country.name,
            countryName: country.name,
            packageCount: 0, // No direct packages
            flag: country.code,
            viaRegional: viaPackages
          });
          addedCountries.add(key);
        }
      }
    });
    } // end isLoadingPackages guard

    regionalMap.forEach((packagesList, country) => {
      if (searchTerms.some(searchTerm => country.includes(searchTerm))) {
        packagesList.forEach(pkgData => {
          const isGlobal = pkgData.category === 'global';
          
          if (isGlobal) {
            globalSet.set(pkgData.pkgName, {
              count: pkgData.count,
              countryCount: pkgData.countryCount
            });
          } else {
            regionalSet.set(pkgData.pkgName, {
              count: pkgData.count,
              countryCount: pkgData.countryCount
            });
          }
        });
      }
    });

    pkgNameToData.forEach((data, normalizedName) => {
      if (searchTerms.some(searchTerm => normalizedName.includes(searchTerm)) && data.countryCount > 1) {
        const isGlobal = data.category === 'global';
        
        if (isGlobal) {
          if (!globalSet.has(data.displayName)) {
            globalSet.set(data.displayName, {
              count: data.count,
              countryCount: data.countryCount
            });
          }
        } else {
          if (!regionalSet.has(data.displayName)) {
            regionalSet.set(data.displayName, {
              count: data.count,
              countryCount: data.countryCount
            });
          }
        }
      }
    });

    const regional: SearchResult[] = Array.from(regionalSet.entries()).map(([pkgName, data]) => ({
      type: 'regional' as const,
      display: pkgName,
      countryName: pkgName,
      packageCount: data.count,
      flag: `${data.countryCount} countries`
    }));

    const global: SearchResult[] = Array.from(globalSet.entries()).map(([pkgName, data]) => ({
      type: 'global' as const,
      display: pkgName,
      countryName: pkgName,
      packageCount: data.count,
      flag: `${data.countryCount} countries`
    }));

    // Sort countries: direct packages first, then regional-only
    countries.sort((a, b) => {
      // Direct packages come first
      if (a.packageCount > 0 && b.packageCount === 0) return -1;
      if (a.packageCount === 0 && b.packageCount > 0) return 1;
      // Exact/starts-with matches come before substring matches
      const aStarts = a.display.toLowerCase().startsWith(term);
      const bStarts = b.display.toLowerCase().startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.display.localeCompare(b.display);
    });
    regional.sort((a, b) => b.packageCount - a.packageCount);
    global.sort((a, b) => b.packageCount - a.packageCount);

    return { 
      countries: countries.slice(0, 10), 
      regional: regional.slice(0, 5), 
      global: global.slice(0, 3) 
    };
  }, [debouncedValue, countryMap, regionalMap, pkgNameToData, isLoadingPackages]);

  // Helper to detect if a package name is regional/multi-country
  const isRegionalPackageName = (name: string): boolean => {
    const normalized = name.toLowerCase();
    return (
      normalized.includes('countries') ||
      normalized.includes('global') ||
      normalized.includes('/') || // e.g., "USA/Canada", "Hongkong/Macau"
      normalized.includes('europe')
    );
  };

  const handleSelect = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'country':
        // Check if this is actually a multi-country package (e.g., "USA/Canada")
        if (isRegionalPackageName(result.countryName)) {
          const regSlug = regionalToSlug(result.countryName);
          navigate(`/esim/${regSlug}`);
        } else {
          const slug = countryToSlug(result.countryName);
          navigate(`/esim/${encodeURIComponent(slug)}`);
        }
        break;
      case 'regional': {
        const regSlug = regionalToSlug(result.countryName);
        navigate(`/esim/${regSlug}`);
        break;
      }
      case 'global': {
        const regSlug = regionalToSlug(result.countryName);
        navigate(`/esim/${regSlug}`);
        break;
      }
    }
    setOpen(false);
    setValue('');
  }, [navigate]);

  const totalResults = results.countries.length + results.regional.length + results.global.length;
  const hasResults = totalResults > 0;

  return (
    <div ref={locationsRef} className={cn("relative", className)}>
      <Popover open={open && value.length >= 1} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center flex-1 px-3 lg:px-5 py-2.5 lg:py-3">
              <Search className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 mr-2 lg:mr-3 flex-shrink-0" />
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (e.target.value.length > 0) {
                    setOpen(true);
                    setLocationsOpen(false);
                  }
                }}
                onFocus={() => {
                  if (value.length > 0) setOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && hasResults) {
                    if (results.countries.length > 0) {
                      handleSelect(results.countries[0]);
                    } else if (results.regional.length > 0) {
                      handleSelect(results.regional[0]);
                    } else if (results.global.length > 0) {
                      handleSelect(results.global[0]);
                    }
                  }
                }}
                placeholder={t('header.searchPlaceholder') || 'Where do you need an eSIM?'}
                className="w-full bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm lg:text-base"
              />
              {value && (
                <button
                  onClick={() => {
                    setValue('');
                    setOpen(false);
                  }}
                  className="mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setLocationsOpen(!locationsOpen);
                setOpen(false);
              }}
              className="flex items-center gap-1 lg:gap-2 px-3 lg:px-5 py-2.5 lg:py-3 border-l border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">{t('header.locations') || 'Locations'}</span>
              {locationsOpen ? (
                <ChevronUp className="h-4 w-4 hidden sm:block" />
              ) : (
                <ChevronDown className="h-4 w-4 hidden sm:block" />
              )}
            </button>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 mt-2 z-[100] bg-white border-gray-200 shadow-xl rounded-2xl" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {value !== debouncedValue ? (
            <div className="p-6 text-center bg-white">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                {t('search.searching')}
              </div>
            </div>
          ) : (
            <Command shouldFilter={false} className="bg-white text-gray-900">
              <CommandList className="max-h-[400px]">
                {!hasResults && (
                  <CommandEmpty>
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Search className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{t('search.noDestinationsFound').replace('{value}', value)}</p>
                      <p className="text-xs text-gray-500 mt-1">{t('search.trySearchingTip')}</p>
                    </div>
                  </CommandEmpty>
                )}

                {results.countries.length > 0 && (
                  <CommandGroup heading={t('search.countriesGroup')} className="[&_[cmdk-group-heading]]:text-gray-500">
                    {results.countries.map((result) => (
                      <CommandItem
                        key={`country-${result.countryName}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-100 data-[selected='true']:bg-violet-100"
                      >
                        <div className="flex items-center gap-3">
                          <FlagIcon countryCode={result.flag} countryName={result.display} size="md" />
                          <div>
                            <div className="font-medium text-gray-900">{result.display}</div>
                            <div className="text-xs text-gray-500">
                              {result.viaRegional ? (
                                // Regional-only country
                                t('search.viaRegional').replace('{packages}', result.viaRegional)
                              ) : (
                                // Direct packages available
                                result.packageCount === 1 
                                  ? t('search.packageAvailable').replace('{count}', String(result.packageCount))
                                  : t('search.packagesAvailable').replace('{count}', String(result.packageCount))
                              )}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.regional.length > 0 && (
                  <CommandGroup heading={t('search.regionalPackagesGroup')} className="[&_[cmdk-group-heading]]:text-gray-500">
                    {results.regional.map((result) => (
                      <CommandItem
                        key={`regional-${result.countryName}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-100 data-[selected='true']:bg-violet-100"
                      >
                        <div className="flex items-center gap-3">
                          <FlagIcon regionalId={result.display} size="md" />
                          <div>
                            <div className="font-medium text-gray-900">{result.display}</div>
                            <div className="text-xs text-gray-500">
                              {result.packageCount === 1 
                                ? t('search.packageAvailable').replace('{count}', String(result.packageCount))
                                : t('search.packagesAvailable').replace('{count}', String(result.packageCount))
                              } • {result.flag}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.global.length > 0 && (
                  <CommandGroup heading={t('search.globalPackagesGroup')} className="[&_[cmdk-group-heading]]:text-gray-500">
                    {results.global.map((result) => (
                      <CommandItem
                        key={`global-${result.countryName}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-100 data-[selected='true']:bg-violet-100"
                      >
                        <div className="flex items-center gap-3">
                          <FlagIcon regionalId={result.display} size="md" />
                          <div>
                            <div className="font-medium text-gray-900">{result.display}</div>
                            <div className="text-xs text-gray-500">
                              {result.packageCount === 1 
                                ? t('search.packageAvailable').replace('{count}', String(result.packageCount))
                                : t('search.packagesAvailable').replace('{count}', String(result.packageCount))
                              } • {result.flag}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>

      {/* Locations Dropdown */}
      {locationsOpen && (
        <HeaderLocationsDropdown onClose={() => setLocationsOpen(false)} />
      )}
    </div>
  );
}
