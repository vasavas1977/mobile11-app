import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid3X3, List, MapPin, Wifi, DollarSign, Star, ChevronDown, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  EUROPE_42_COUNTRIES,
  EuropeCountryData,
  sortByName,
  sortByCost,
  sortByBeauty,
  sortBySpeed,
  searchCountries,
  getEurope42Stats
} from '@/lib/europe42CountryData';

// Sort option labels for localization
const sortByLabels: Record<string, { en: string; th: string }> = {
  'Most Expensive': { en: 'Most Expensive', th: 'แพงที่สุด' },
  'Most Beautiful': { en: 'Most Beautiful', th: 'สวยที่สุด' },
  'Slowest Network': { en: 'Slowest Network', th: 'เน็ตช้าที่สุด' },
  'Budget First': { en: 'Budget First', th: 'ประหยัดก่อน' },
  'A-Z': { en: 'A-Z', th: 'A-Z' }
};

// Use Supabase Storage URLs instead of local imports (reduces production bundle size)
const STORAGE_BASE = 'https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets';
const BLOG_STORAGE = `${STORAGE_BASE}/blog`;
const EUROPE42_STORAGE = `${BLOG_STORAGE}/europe42`;

// Country code to image mapping using CDN URLs
const countryImages: Record<string, string> = {
  // From europe42 folder
  AL: `${EUROPE42_STORAGE}/albania.jpg`,
  AD: `${EUROPE42_STORAGE}/andorra.jpg`,
  AT: `${EUROPE42_STORAGE}/austria.jpg`,
  BE: `${EUROPE42_STORAGE}/belgium.jpg`,
  BA: `${EUROPE42_STORAGE}/bosnia.jpg`,
  BG: `${EUROPE42_STORAGE}/bulgaria.jpg`,
  HR: `${EUROPE42_STORAGE}/croatia.jpg`,
  CY: `${EUROPE42_STORAGE}/cyprus.jpg`,
  CZ: `${EUROPE42_STORAGE}/czechia.jpg`,
  DK: `${EUROPE42_STORAGE}/denmark.jpg`,
  EE: `${EUROPE42_STORAGE}/estonia.jpg`,
  FI: `${EUROPE42_STORAGE}/finland.jpg`,
  GI: `${EUROPE42_STORAGE}/gibraltar.jpg`,
  GR: `${EUROPE42_STORAGE}/greece.jpg`,
  GG: `${EUROPE42_STORAGE}/guernsey.jpg`,
  HU: `${EUROPE42_STORAGE}/hungary.jpg`,
  IS: `${EUROPE42_STORAGE}/iceland.jpg`,
  IE: `${EUROPE42_STORAGE}/ireland.jpg`,
  IM: `${EUROPE42_STORAGE}/isleofman.jpg`,
  JE: `${EUROPE42_STORAGE}/jersey.jpg`,
  LV: `${EUROPE42_STORAGE}/latvia.jpg`,
  LI: `${EUROPE42_STORAGE}/liechtenstein.jpg`,
  LT: `${EUROPE42_STORAGE}/lithuania.jpg`,
  LU: `${EUROPE42_STORAGE}/luxembourg.jpg`,
  MT: `${EUROPE42_STORAGE}/malta.jpg`,
  MC: `${EUROPE42_STORAGE}/monaco.jpg`,
  ME: `${EUROPE42_STORAGE}/montenegro.jpg`,
  MK: `${EUROPE42_STORAGE}/northmacedonia.jpg`,
  NO: `${EUROPE42_STORAGE}/norway.jpg`,
  PL: `${EUROPE42_STORAGE}/poland.jpg`,
  PT: `${EUROPE42_STORAGE}/portugal.jpg`,
  RO: `${EUROPE42_STORAGE}/romania.jpg`,
  SM: `${EUROPE42_STORAGE}/sanmarino.jpg`,
  RS: `${EUROPE42_STORAGE}/serbia.jpg`,
  SK: `${EUROPE42_STORAGE}/slovakia.jpg`,
  SI: `${EUROPE42_STORAGE}/slovenia.jpg`,
  SE: `${EUROPE42_STORAGE}/sweden.jpg`,
  TR: `${EUROPE42_STORAGE}/turkey.jpg`,
  UA: `${EUROPE42_STORAGE}/ukraine.jpg`,
  VA: `${EUROPE42_STORAGE}/vatican.jpg`,
  // Major countries from blog root
  FR: `${BLOG_STORAGE}/france-esim-hero.jpg`,
  DE: `${BLOG_STORAGE}/germany-esim-hero.jpg`,
  IT: `${BLOG_STORAGE}/italy-esim-hero.jpg`,
  ES: `${BLOG_STORAGE}/spain-esim-hero.jpg`,
  NL: `${BLOG_STORAGE}/netherlands-esim-hero.jpg`,
  CH: `${BLOG_STORAGE}/switzerland-esim-hero.jpg`,
  GB: `${BLOG_STORAGE}/uk-esim-hero.jpg`,
};

export function Europe42Explorer() {
  const { language, t, localizeField } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCost, setSelectedCost] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Most Expensive');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const stats = useMemo(() => getEurope42Stats(), []);

  const filteredCountries = useMemo(() => {
    let countries = [...EUROPE_42_COUNTRIES];

    // Search filter
    if (searchQuery) {
      countries = searchCountries(searchQuery);
    }

    // Cost filter
    if (selectedCost !== 'All') {
      if (selectedCost === 'Budget (1-3)') {
        countries = countries.filter(c => c.costIndex <= 3);
      } else if (selectedCost === 'Moderate (4-6)') {
        countries = countries.filter(c => c.costIndex >= 4 && c.costIndex <= 6);
      } else if (selectedCost === 'Expensive (7-10)') {
        countries = countries.filter(c => c.costIndex >= 7);
      }
    }

    // Sorting
    switch (sortBy) {
      case 'A-Z':
        countries = sortByName(countries);
        break;
      case 'Most Expensive':
        countries = sortByCost(countries, true);
        break;
      case 'Most Beautiful':
        countries = sortByBeauty(countries, true);
        break;
      case 'Slowest Network':
        countries = sortBySpeed(countries, false);
        break;
      case 'Budget First':
        countries = sortByCost(countries, false);
        break;
    }

    return countries;
  }, [searchQuery, selectedCost, sortBy]);

  const getCostLabel = (costIndex: number) => {
    if (costIndex <= 3) return { label: t('europe42.budget'), color: 'bg-green-500/20 text-green-400' };
    if (costIndex <= 6) return { label: t('europe42.moderate'), color: 'bg-yellow-500/20 text-yellow-400' };
    return { label: t('europe42.expensive'), color: 'bg-red-500/20 text-red-400' };
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case '5G': return 'bg-emerald-500/20 text-emerald-400';
      case '4G': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}
      />
    ));
  };

  return (
    <div className="w-full space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-card/50 rounded-xl border border-border/50">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalCountries}</div>
          <div className="text-xs text-muted-foreground">{t('europe42.countries')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.countriesWith5G}</div>
          <div className="text-xs text-muted-foreground">{t('europe42.fiveGNetworks')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.mostBeautiful.length}</div>
          <div className="text-xs text-muted-foreground">{t('europe42.fiveStarBeauty')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.budgetFriendly.length}</div>
          <div className="text-xs text-muted-foreground">{t('europe42.budgetFriendly')}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('europe42.searchCountries')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Cost Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-background">
                <DollarSign size={14} />
                {selectedCost === 'All' ? t('europe42.cost') : selectedCost.split(' ')[0]}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border-border">
              <DropdownMenuItem onClick={() => setSelectedCost('All')}>
                {t('europe42.all')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCost('Budget (1-3)')}>
                {t('europe42.budgetRange')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCost('Moderate (4-6)')}>
                {t('europe42.moderateRange')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCost('Expensive (7-10)')}>
                {t('europe42.expensiveRange')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-background">
                <Filter size={14} />
                {t(`europe42.${sortBy === 'Most Expensive' ? 'mostExpensive' : sortBy === 'Most Beautiful' ? 'mostBeautiful' : sortBy === 'Slowest Network' ? 'slowestNetwork' : sortBy === 'Budget First' ? 'budgetFirst' : 'budgetFirst'}`)}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border-border">
              <DropdownMenuItem onClick={() => setSortBy('Most Expensive')}>
                {t('europe42.mostExpensive')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('Most Beautiful')}>
                {t('europe42.mostBeautiful')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('Slowest Network')}>
                {t('europe42.slowestNetwork')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('Budget First')}>
                {t('europe42.budgetFirst')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('A-Z')}>
                A-Z
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={14} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {(t('europe42.showing') as string)
          .replace('{current}', String(filteredCountries.length))
          .replace('{total}', String(EUROPE_42_COUNTRIES.length))
        }
      </div>

      {/* Country Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-3'
          }
        >
          {filteredCountries.map((country, index) => (
            <CountryCard
              key={country.code}
              country={country}
              viewMode={viewMode}
              index={index}
              language={language}
              getCostLabel={getCostLabel}
              getSpeedColor={getSpeedColor}
              renderStars={renderStars}
              image={countryImages[country.code]}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* No Results */}
      {filteredCountries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p>{t('europe42.noResults')}</p>
        </div>
      )}
    </div>
  );
}

interface CountryCardProps {
  country: EuropeCountryData;
  viewMode: 'grid' | 'list';
  index: number;
  language: string;
  getCostLabel: (cost: number) => { label: string; color: string };
  getSpeedColor: (speed: string) => string;
  renderStars: (score: number) => React.ReactElement[];
  image?: string;
}

function CountryCard({ 
  country, 
  viewMode, 
  index, 
  language, 
  getCostLabel, 
  getSpeedColor, 
  renderStars,
  image 
}: CountryCardProps) {
  const { localizeField } = useLanguage();
  const costInfo = getCostLabel(country.costIndex);

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.02 }}
        className="flex items-center gap-4 p-4 bg-card/50 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
      >
        {/* Flag and Name */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <span className="text-2xl">{country.flag}</span>
          <div>
            <h3 className="font-semibold">{country.name}</h3>
            <p className="text-xs text-muted-foreground">{country.region}</p>
          </div>
        </div>

        {/* Speed */}
        <Badge className={`${getSpeedColor(country.networkSpeed)} border-0`}>
          {country.networkSpeed}
        </Badge>

        {/* Cost */}
        <Badge className={`${costInfo.color} border-0`}>
          {costInfo.label}
        </Badge>

        {/* Beauty */}
        <div className="flex gap-0.5">
          {renderStars(country.beautyScore)}
        </div>

        {/* Highlight */}
        <p className="flex-1 text-sm text-muted-foreground truncate">
          {localizeField(country, 'highlight')}
        </p>

        {/* Tip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={16} className="text-muted-foreground hover:text-primary" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium mb-1">eSIM Tip:</p>
              <p className="text-sm">{localizeField(country, 'esimTip')}</p>
              {country.carriers.length > 0 && (
                <>
                  <p className="font-medium mt-2 mb-1">Carriers:</p>
                  <p className="text-sm">{country.carriers.join(', ')}</p>
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-all duration-300"
    >
      {/* Image or Gradient Background */}
      <div className="relative h-32 overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={country.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        
        {/* Flag Overlay */}
        <div className="absolute top-3 left-3 text-3xl drop-shadow-lg">
          {country.flag}
        </div>

        {/* Speed Badge */}
        <Badge className={`absolute top-3 right-3 ${getSpeedColor(country.networkSpeed)} border-0`}>
          {country.networkSpeed}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name and Region */}
        <div>
          <h3 className="font-bold text-lg">{country.name}</h3>
          <p className="text-xs text-muted-foreground">{country.region}</p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          {/* Beauty Stars */}
          <div className="flex gap-0.5">
            {renderStars(country.beautyScore)}
          </div>

          {/* Cost Badge */}
          <Badge className={`${costInfo.color} border-0 text-xs`}>
            {costInfo.label}
          </Badge>
        </div>

        {/* Highlight */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {localizeField(country, 'highlight')}
        </p>

        {/* eSIM Tip - Show on Hover */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-start gap-2">
            <Wifi size={14} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              {localizeField(country, 'esimTip')}
            </p>
          </div>
        </div>

        {/* Carriers */}
        {country.carriers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {country.carriers.slice(0, 3).map(carrier => (
              <span key={carrier} className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                {carrier}
              </span>
            ))}
            {country.carriers.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                +{country.carriers.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Europe42Explorer;
