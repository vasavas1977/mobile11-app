import { useState, useMemo, useCallback } from 'react';
import { Flame, MapPin, Globe, LayoutGrid } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getPopularDestinationsForUser } from '@/lib/popularDestinations';
import { GLOBAL_151 } from '@/lib/regionPresets';

import * as regionalUtils from '@/lib/regionalPackageUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface EsimPackage {
  id: string;
  package_id: string;
  name: string;
  country_name: string;
  country_code: string;
  price: number;
  data_amount: string;
  validity_days: number;
  currency: string;
  [key: string]: any;
}

interface DestinationCard {
  name: string;
  nameDisplay: string;
  countryCode?: string;
  minPrice: number;
  type: 'local' | 'regional' | 'global';
  filterValue: string;
}

interface StoreCategoryTabsProps {
  packages: EsimPackage[];
  loading: boolean;
  onCountryClick: (countryName: string) => void;
  onRegionalClick: (regionName: string) => void;
}

type TabId = 'popular' | 'local' | 'regional' | 'global' | 'all';

const TAB_IDS: TabId[] = ['popular', 'local', 'regional', 'global', 'all'];
const TAB_ICONS: Record<TabId, React.ElementType> = {
  popular: Flame,
  local: MapPin,
  regional: Globe,
  global: Globe,
  all: LayoutGrid,
};

export function StoreCategoryTabs({ packages, loading, onCountryClick, onRegionalClick }: StoreCategoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('popular');
  const { language, formatPrice, t, localizeField } = useLanguage();
  const { userCountry } = useUserLocation();

  // Compute min prices per country_name
  const minPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    packages.forEach(pkg => {
      const key = pkg.country_name;
      const existing = map.get(key);
      if (existing === undefined || pkg.price < existing) {
        map.set(key, pkg.price);
      }
    });
    return map;
  }, [packages]);

  // Popular destinations
  const popularCards = useMemo<DestinationCard[]>(() => {
    const destinations = getPopularDestinationsForUser(userCountry, language);
    return destinations
      .filter(d => d.id !== 'view-all' && d.filterValue)
      .map(d => {
        const price = minPriceMap.get(d.filterValue!) ?? 0;
        const isRegional = d.filterType === 'regional';
        return {
          name: d.filterValue!,
          nameDisplay: localizeField(d, 'name'),
          minPrice: price,
          type: isRegional ? 'regional' as const : 'local' as const,
          filterValue: d.filterValue!,
        };
      })
      .filter(c => c.minPrice > 0);
  }, [userCountry, language, minPriceMap]);

  // Local country cards — derived directly from DB packages
  const localCards = useMemo<DestinationCard[]>(() => {
    const seen = new Map<string, { name: string; code: string; minPrice: number }>();
    const REGIONAL_KEYWORDS = ['countries', 'global'];
    packages
      .filter(pkg => {
        const lower = pkg.country_name.toLowerCase();
        return !REGIONAL_KEYWORDS.some(kw => lower.includes(kw));
      })
      .forEach(pkg => {
        const key = pkg.country_name;
        const existing = seen.get(key);
        if (!existing || pkg.price < existing.minPrice) {
          seen.set(key, { name: key, code: pkg.country_code, minPrice: pkg.price });
        }
      });
    return Array.from(seen.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({
        name: c.name,
        nameDisplay: c.name,
        countryCode: c.code,
        minPrice: c.minPrice,
        type: 'local' as const,
        filterValue: c.name,
      }));
  }, [packages]);

  // Regional cards (non-global)
  const regionalCards = useMemo<DestinationCard[]>(() => {
    const seen = new Map<string, { name: string; minPrice: number }>();
    packages
      .filter(pkg => {
        const lower = pkg.country_name.toLowerCase();
        return lower.includes('countries') && !lower.includes('global');
      })
      .forEach(pkg => {
        const key = pkg.country_name;
        const existing = seen.get(key);
        if (!existing || pkg.price < existing.minPrice) {
          seen.set(key, { name: key, minPrice: pkg.price });
        }
      });
    return Array.from(seen.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(r => ({
        name: r.name,
        nameDisplay: r.name,
        minPrice: r.minPrice,
        type: 'regional' as const,
        filterValue: r.name,
      }));
  }, [packages]);

  // Global cards
  const globalCards = useMemo<DestinationCard[]>(() => {
    const seen = new Map<string, { name: string; minPrice: number }>();
    packages
      .filter(pkg => pkg.country_name.toLowerCase().includes('global'))
      .forEach(pkg => {
        const key = pkg.country_name;
        const existing = seen.get(key);
        if (!existing || pkg.price < existing.minPrice) {
          seen.set(key, { name: key, minPrice: pkg.price });
        }
      });
    return Array.from(seen.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(r => ({
        name: r.name,
        nameDisplay: r.name,
        minPrice: r.minPrice,
        type: 'global' as const,
        filterValue: r.name,
      }));
  }, [packages]);

  // All cards merged — includes countries from Global 151 plan
  const allCards = useMemo<DestinationCard[]>(() => {
    const map = new Map<string, DestinationCard>();
    localCards.forEach(c => map.set(c.name.toLowerCase(), c));
    regionalCards.forEach(c => map.set(c.name.toLowerCase(), c));
    globalCards.forEach(c => map.set(c.name.toLowerCase(), c));

    const globalMinPrice = globalCards.reduce(
      (min, c) => Math.min(min, c.minPrice), Infinity
    );
    if (globalMinPrice < Infinity) {
      GLOBAL_151.countries.forEach(country => {
        const key = country.name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: country.name,
            nameDisplay: country.name,
            countryCode: country.code,
            minPrice: globalMinPrice,
            type: 'local' as const,
            filterValue: country.name,
          });
        }
      });
    }

    return Array.from(map.values())
      .sort((a, b) => a.nameDisplay.localeCompare(b.nameDisplay));
  }, [localCards, regionalCards, globalCards]);

  const activeCards = useMemo(() => {
    switch (activeTab) {
      case 'popular': return popularCards;
      case 'local': return localCards;
      case 'regional': return regionalCards;
      case 'global': return globalCards;
      case 'all': return allCards;
    }
  }, [activeTab, popularCards, localCards, regionalCards, globalCards, allCards]);

  const availableLetters = useMemo(() => {
    if (activeTab !== 'all') return new Set<string>();
    return new Set(allCards.map(c => c.nameDisplay[0]?.toUpperCase()).filter(Boolean));
  }, [activeTab, allCards]);

  const groupedCards = useMemo(() => {
    if (activeTab !== 'all') return null;
    const groups = new Map<string, DestinationCard[]>();
    activeCards.forEach(card => {
      const letter = card.nameDisplay[0]?.toUpperCase();
      if (!letter) return;
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)!.push(card);
    });
    return groups;
  }, [activeTab, activeCards]);

  const scrollToLetter = useCallback((letter: string) => {
    document.getElementById(`letter-${letter}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleCardClick = (card: DestinationCard) => {
    if (card.type === 'local') {
      onCountryClick(card.filterValue);
    } else {
      onRegionalClick(card.filterValue);
    }
  };

  const headingKey = `storeTabs.${activeTab}Heading` as const;
  const subtitleKey = `storeTabs.${activeTab}Subtitle` as const;
  const heading = t(headingKey);
  const subtitle = t(subtitleKey);

  return (
    <section className="bg-[#FAF7F2] pt-2 pb-8 md:pt-4 md:pb-12">
      <div className="container max-w-7xl">
        {/* Tab Bar */}
        <div className="border-b border-[#E8E0D4]">
          <div className="flex">
            {TAB_IDS.map(tabId => {
              const Icon = TAB_ICONS[tabId];
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm md:text-base font-medium transition-colors relative
                    ${isActive 
                      ? 'text-[#1C1917]' 
                      : 'text-[#78716C] hover:text-[#1C1917]/70'
                    }`}
                >
                  <Icon size={18} className="hidden md:inline" />
                  <span>{t(`storeTabs.${tabId}`)}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1C1917] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1C1917] mb-2">{heading}</h2>
          <p className="text-[#78716C] mb-6">{subtitle}</p>

          {activeTab === 'all' && !loading && (
            <div className="sticky top-0 z-10 bg-[#FAF7F2]/95 backdrop-blur-sm py-2 mb-4 flex flex-wrap gap-0.5 justify-center">
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
                const hasItems = availableLetters.has(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => hasItems && scrollToLetter(letter)}
                    disabled={!hasItems}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-md text-xs font-medium transition-colors
                      ${hasItems
                        ? 'text-[#1C1917] hover:bg-[#E8E0D4]'
                        : 'text-[#D6D3D1] cursor-default'
                      }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : activeTab === 'all' && groupedCards ? (
            <div className="space-y-1">
              {Array.from(groupedCards.entries()).map(([letter, cards]) => (
                <div key={letter}>
                  <div id={`letter-${letter}`} className="scroll-mt-16 text-xs font-semibold text-[#A8A29E] uppercase tracking-wider pt-3 pb-1 pl-1">
                    {letter}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cards.map(card => (
                      <button
                        key={`${card.type}-${card.filterValue}`}
                        onClick={() => handleCardClick(card)}
                        className="flex items-center justify-between bg-white border border-[#E8E0D4] rounded-xl px-4 py-3.5 hover:shadow-md hover:border-[#C4B9A8] transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <FlagIcon countryCode={card.countryCode} countryName={card.filterValue} size="md" />
                          <span className="font-semibold text-[#1C1917] text-sm md:text-base">
                            {card.nameDisplay}
                          </span>
                        </div>
                        <span className="font-semibold text-[#1C1917] text-sm whitespace-nowrap">
                          {formatPrice(card.minPrice)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeCards.map((card) => (
                <button
                  key={`${card.type}-${card.filterValue}`}
                  onClick={() => handleCardClick(card)}
                  className="flex items-center justify-between bg-white border border-[#E8E0D4] rounded-xl px-4 py-3.5 hover:shadow-md hover:border-[#C4B9A8] transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <FlagIcon countryCode={card.countryCode} countryName={card.filterValue} size="md" />
                    <span className="font-semibold text-[#1C1917] text-sm md:text-base">
                      {card.nameDisplay}
                    </span>
                  </div>
                  <span className="font-semibold text-[#1C1917] text-sm whitespace-nowrap">
                    {formatPrice(card.minPrice)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loading && activeCards.length === 0 && (
            <p className="text-center text-[#78716C] py-8">
              {t('storeTabs.noPackages')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
