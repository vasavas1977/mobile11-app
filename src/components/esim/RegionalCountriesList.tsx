import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RegionalPackageData, IncludedCountry } from '@/lib/excelRegionalParser';
import { cn } from '@/lib/utils';

interface RegionalCountriesListProps {
  data: RegionalPackageData;
  defaultExpanded?: boolean;
  maxInitialDisplay?: number;
  highlightCountry?: string;
}

export function RegionalCountriesList({ 
  data, 
  defaultExpanded = false,
  maxInitialDisplay = 5,
  highlightCountry
}: RegionalCountriesListProps) {
  const [showAll, setShowAll] = useState(defaultExpanded);
  
  if (!data?.countries || data.countries.length === 0) {
    return null;
  }
  
  const displayCountries = showAll ? data.countries : data.countries.slice(0, maxInitialDisplay);
  const hasMore = data.countries.length > maxInitialDisplay;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Included Countries ({data.countries.length})
          </span>
        </div>
        {hasMore && (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show less' : `Show all ${data.countries.length}`}
          </button>
        )}
      </div>
      
      <div className={cn('flex flex-wrap gap-x-1 gap-y-1', !showAll && 'max-h-80 overflow-y-auto')}>
        {displayCountries.map((country: IncludedCountry, idx: number) => {
          const isHighlighted = highlightCountry && country.name.toLowerCase() === highlightCountry.toLowerCase();
          
          return (
            <span key={idx} className="inline-flex items-center">
              <span className={cn(
                "text-sm",
                isHighlighted 
                  ? "text-primary font-bold" 
                  : "text-muted-foreground"
              )}>
                {country.name}
              </span>
              {idx < displayCountries.length - 1 && (
                <span className="text-muted-foreground mx-1.5">•</span>
              )}
            </span>
          );
        })}
      </div>
      
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="mr-2 h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-3 w-3" />
              Show all {data.countries.length} countries
            </>
          )}
        </Button>
      )}
    </div>
  );
}
