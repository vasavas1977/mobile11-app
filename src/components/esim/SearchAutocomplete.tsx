import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import * as regionalUtils from '@/lib/regionalPackageUtils';
import { translateSearchTerm } from '@/lib/countryTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchCountries, getRegionalPackagesForCountry, getDisplayName } from '@/lib/countryDestinations';

interface SearchResult {
  type: 'country' | 'regional' | 'global';
  display: string;
  countryName: string;
  packageCount: number;
  flag?: string;
  viaRegional?: string; // For countries only available via regional packages
}

interface SearchAutocompleteProps {
  packages: any[];
  onSelectCountry: (countryName: string) => void;
  onSelectRegional: (packageName: string) => void;
  onSelectGlobal: (packageName: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchAutocomplete({
  packages,
  onSelectCountry,
  onSelectRegional,
  onSelectGlobal,
  placeholder = "Search packages or destinations...",
  className
}: SearchAutocompleteProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  // Helper: Normalize regional package names for comparison
  const normalizeRegionalName = useCallback((name: string): string => {
    return name
      .trim()
      .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
      .replace(/(\d+)([A-Z])/g, '$1 $2')  // Add space between number and letter (13Countries → 13 Countries)
      .toLowerCase();
  }, []);

  // Debounce search input by 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [value]);

  // Build package maps for fast lookup with pre-computed data
  const { countryMap, regionalMap, globalPackages, pkgNameToData } = useMemo(() => {
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
    
    const globalPackages: {
      pkgName: string;
      count: number;
      countryCount: number;
    }[] = [];
    
    // Cache for package counts and regional data
    const packageCounts = new Map<string, { count: number; displayName: string }>();
    const regionalDataCache = new Map<any, any>();
    const pkgNameToData = new Map<string, { count: number; countryCount: number; displayName: string; category: string }>();

    // First pass: count packages and cache regional data
    packages.forEach(pkg => {
      const pkgName = pkg.country_name;
      const normalized = normalizeRegionalName(pkgName);
      
      const existing = packageCounts.get(normalized);
      if (!existing) {
        packageCounts.set(normalized, {
          count: 1,
          displayName: getDisplayName(pkgName)
        });
      } else {
        existing.count++;
        // Prefer properly spaced version for display (e.g., "13 Countries" over "13Countries")
        if (/\d\s[A-Z]/.test(pkgName) && !/\d\s[A-Z]/.test(existing.displayName)) {
          existing.displayName = pkgName;
        }
      }
      
      if (!regionalDataCache.has(pkg)) {
        regionalDataCache.set(pkg, regionalUtils.getRegionalData(pkg));
      }
    });

    // Second pass: build maps with pre-computed data
    packages.forEach(pkg => {
      const pkgName = pkg.country_name;
      const normalized = normalizeRegionalName(pkgName);
      const regionalData = regionalDataCache.get(pkg);
      const isGlobal = pkg.category === 'global';

      // Store package metadata with normalized key
      if (!pkgNameToData.has(normalized)) {
        const countData = packageCounts.get(normalized)!;
        pkgNameToData.set(normalized, {
          count: countData.count,
          countryCount: regionalData ? regionalData.countries.length : 1,
          displayName: countData.displayName,
          category: pkg.category || 'regional'
        });
      }

      // Track direct country matches
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

      // Track regional/global packages by their included countries
      if (regionalData && regionalData.countries.length > 0) {
        regionalData.countries.forEach((country: any) => {
          const key = country.name.toLowerCase();
          const pkgData = pkgNameToData.get(normalized)!;
          
          if (!regionalMap.has(key)) {
            regionalMap.set(key, []);
          }
          
          // Avoid duplicates based on normalized name
          const existing = regionalMap.get(key)!;
          if (!existing.some(p => normalizeRegionalName(p.pkgName) === normalized)) {
            existing.push({
              pkgName: pkgData.displayName,  // Use best-formatted display name
              count: pkgData.count,
              countryCount: pkgData.countryCount,
              category: pkgData.category
            });
          }
        });
      }

      // Track global packages separately
      if (isGlobal && regionalData) {
        const pkgData = pkgNameToData.get(normalized)!;
        if (!globalPackages.some(p => normalizeRegionalName(p.pkgName) === normalized)) {
          globalPackages.push({
            pkgName: pkgData.displayName,  // Use best-formatted display name
            count: pkgData.count,
            countryCount: pkgData.countryCount
          });
        }
      }
    });

    return { countryMap, regionalMap, globalPackages, pkgNameToData };
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

    // Translate Thai search terms to English (returns array including original term)
    const searchTerms = translateSearchTerm(term);

    const countries: SearchResult[] = [];
    const addedCountries = new Set<string>();
    const regionalSet = new Map<string, { count: number; countryCount: number }>();
    const globalSet = new Map<string, { count: number; countryCount: number }>();

    // Normalize key for dedup (handles "hongkong" vs "hong kong")
    const normalizeKey = (k: string) => k.replace(/\s+/g, '').toLowerCase();

    // Find direct country matches from database packages
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
        addedCountries.add(normalizeKey(country));
      }
    });

    // Find countries from countryDestinations that aren't in direct packages
    // This includes all 151 countries covered by regional packages
    searchTerms.forEach(searchTerm => {
      const allMatchedCountries = searchCountries(searchTerm);
      allMatchedCountries.forEach(country => {
        const countryKey = country.name.toLowerCase();
        if (!addedCountries.has(countryKey) && !addedCountries.has(normalizeKey(countryKey))) {
          // Check if this country has regional coverage
          const regionalInfo = getRegionalPackagesForCountry(country.name);
          if (regionalInfo.length > 0) {
            countries.push({
              type: 'country',
              display: country.name,
              countryName: country.name,
              packageCount: 0, // No direct packages
              flag: country.code,
              viaRegional: regionalInfo[0].displayName
            });
            addedCountries.add(countryKey);
          }
        }
      });
    });

    // Find regional and global packages containing the search term (instant lookup)
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

    // Search package names directly for regional/global packages
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

    // Build regional results (no expensive operations)
    const regional: SearchResult[] = Array.from(regionalSet.entries()).map(([pkgName, data]) => ({
      type: 'regional' as const,
      display: pkgName,
      countryName: pkgName,
      packageCount: data.count,
      flag: `${data.countryCount} countries`
    }));

    // Build global results (no expensive operations)
    const global: SearchResult[] = Array.from(globalSet.entries()).map(([pkgName, data]) => ({
      type: 'global' as const,
      display: pkgName,
      countryName: pkgName,
      packageCount: data.count,
      flag: `${data.countryCount} countries`
    }));

    // Sort results - direct packages first, then regional-only countries
    countries.sort((a, b) => {
      // Prioritize countries with direct packages
      if (a.viaRegional && !b.viaRegional) return 1;
      if (!a.viaRegional && b.viaRegional) return -1;
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
      countries: countries.slice(0, 15), 
      regional: regional.slice(0, 5), 
      global: global.slice(0, 3) 
    };
  }, [debouncedValue, countryMap, regionalMap, globalPackages, pkgNameToData]);

  const handleSelect = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'country':
        onSelectCountry(result.countryName);
        break;
      case 'regional':
        onSelectRegional(result.countryName);
        break;
      case 'global':
        onSelectGlobal(result.countryName);
        break;
    }
    setOpen(false);
    setValue('');
  }, [onSelectCountry, onSelectRegional, onSelectGlobal]);

  const totalResults = results.countries.length + results.regional.length + results.global.length;
  const hasResults = totalResults > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-12 pr-4 h-12 text-base rounded-full border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-lg"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (e.target.value.length > 0) {
                setOpen(true);
              }
            }}
            onFocus={() => setOpen(true)}
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
          />
          {value && (
            <button
              onClick={() => {
                setValue('');
                setOpen(false);
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      
      {value.length >= 1 && (
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 mt-2 z-[100] bg-white border-gray-200 shadow-xl rounded-2xl" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {value !== debouncedValue ? (
            <div className="p-6 text-center bg-white rounded-2xl">
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
                      <Search className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">{t('search.noDestinationsFound').replace('{value}', value)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('search.trySearchingTip')}</p>
                    </div>
                  </CommandEmpty>
                )}

                {results.countries.length > 0 && (
                  <CommandGroup heading={t('search.countriesGroup')}>
                    {results.countries.map((result) => (
                      <CommandItem
                        key={`country-${result.countryName}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center justify-between py-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FlagIcon countryCode={result.flag} countryName={result.display} size="md" />
                          <div>
                            <div className="font-medium">{result.display}</div>
                            <div className="text-xs text-muted-foreground">
                              {result.viaRegional ? (
                                <span>via {result.viaRegional}</span>
                              ) : result.packageCount === 1 ? (
                                t('search.packageAvailable').replace('{count}', String(result.packageCount))
                              ) : (
                                t('search.packagesAvailable').replace('{count}', String(result.packageCount))
                              )}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.regional.length > 0 && (
                  <CommandGroup heading={t('search.regionalPackagesGroup')}>
                    {results.regional.map((result) => (
                      <CommandItem
                        key={`regional-${result.countryName}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center justify-between py-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FlagIcon regionalId={result.display} size="md" />
                          <div>
                            <div className="font-medium">{result.display}</div>
                            <div className="text-xs text-muted-foreground">
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
                  <CommandGroup heading={t('search.globalPackagesGroup')}>
                    {results.global.map((result) => (
                      <CommandItem
                        key={`global-${result.countryName}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center justify-between py-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FlagIcon regionalId={result.display} size="md" />
                          <div>
                            <div className="font-medium">{result.display}</div>
                            <div className="text-xs text-muted-foreground">
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
      )}
    </Popover>
  );
}
