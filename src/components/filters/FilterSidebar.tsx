import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface FilterSidebarProps {
  availableDurations: number[];
  selectedDurations: number[];
  onDurationChange: (durations: number[]) => void;
  priceRange: [number, number];
  currentPriceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  dataAmounts: string[];
  selectedDataAmounts: string[];
  onDataAmountChange: (amounts: string[]) => void;
  onClearAll: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function FilterSidebar({
  availableDurations,
  selectedDurations,
  onDurationChange,
  priceRange,
  currentPriceRange,
  onPriceRangeChange,
  dataAmounts,
  selectedDataAmounts,
  onDataAmountChange,
  onClearAll,
  isCollapsed,
  onToggleCollapse,
}: FilterSidebarProps) {
  const { t, formatPrice } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['duration', 'price', 'data']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleDurationToggle = (duration: number) => {
    if (selectedDurations.includes(duration)) {
      onDurationChange(selectedDurations.filter(d => d !== duration));
    } else {
      onDurationChange([...selectedDurations, duration]);
    }
  };

  const handleDataAmountToggle = (amount: string) => {
    if (selectedDataAmounts.includes(amount)) {
      onDataAmountChange(selectedDataAmounts.filter(a => a !== amount));
    } else {
      onDataAmountChange([...selectedDataAmounts, amount]);
    }
  };

  const activeFiltersCount = selectedDurations.length + selectedDataAmounts.length + 
    (currentPriceRange[0] !== priceRange[0] || currentPriceRange[1] !== priceRange[1] ? 1 : 0);

  if (isCollapsed) {
    return (
      <div className="fixed top-24 left-4 z-10">
        <Button
          onClick={onToggleCollapse}
          variant="default"
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          {t('packages.filters')}
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-white text-primary">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear All
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-3 hover:text-primary transition-colors"
        >
          <span className="font-medium text-sm">Price Range</span>
          {expandedSections.has('price') ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {expandedSections.has('price') && (
          <div className="space-y-4">
            <div className="px-2">
              <Slider
                value={currentPriceRange}
                onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                min={priceRange[0]}
                max={priceRange[1]}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPrice(currentPriceRange[0])}</span>
                <span>{formatPrice(currentPriceRange[1])}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Duration Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('duration')}
          className="flex items-center justify-between w-full mb-3 hover:text-primary transition-colors"
        >
          <span className="font-medium text-sm">{t('packages.duration')} ({t('packages.days')})</span>
          {expandedSections.has('duration') ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {expandedSections.has('duration') && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableDurations.map((duration) => (
              <label
                key={duration}
                className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
              >
                <Checkbox
                  checked={selectedDurations.includes(duration)}
                  onCheckedChange={() => handleDurationToggle(duration)}
                />
                <span className="text-sm flex-1">{duration} {t('packages.days')}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Data Amount Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('data')}
          className="flex items-center justify-between w-full mb-3 hover:text-primary transition-colors"
        >
          <span className="font-medium text-sm">{t('packages.dataAmount')}</span>
          {expandedSections.has('data') ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {expandedSections.has('data') && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {dataAmounts.map((amount) => (
              <label
                key={amount}
                className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
              >
                <Checkbox
                  checked={selectedDataAmounts.includes(amount)}
                  onCheckedChange={() => handleDataAmountToggle(amount)}
                />
                <span className="text-sm flex-1">{amount}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
