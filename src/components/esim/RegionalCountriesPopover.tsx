import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, ChevronRight } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { RegionalPackageData } from '@/lib/excelRegionalParser';
import { RegionalCountriesDialog } from './RegionalCountriesDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface RegionalCountriesPopoverProps {
  data: RegionalPackageData;
  trigger?: React.ReactNode;
  className?: string;
}

const MAX_PREVIEW_COUNTRIES = 20;

export function RegionalCountriesPopover({ 
  data, 
  trigger,
  className 
}: RegionalCountriesPopoverProps) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);
  
  const countryCount = data.countries.length;
  const previewCountries = data.countries.slice(0, MAX_PREVIEW_COUNTRIES);
  const hasMore = countryCount > MAX_PREVIEW_COUNTRIES;

  const defaultTrigger = (
    <Badge 
      variant="secondary" 
      className={cn(
        "cursor-pointer hover:bg-secondary/80 transition-colors text-xs gap-1",
        className
      )}
    >
      <Globe className="h-3 w-3" />
      {countryCount} {countryCount === 1 ? t('configurator.country') : t('configurator.countries')}
    </Badge>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Prevent closing when clicking on the dialog/drawer backdrop
          const target = e.target as HTMLElement;
          if (target?.closest('[role="dialog"]') || target?.closest('[data-vaul-drawer]')) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {t('configurator.includedCountries')}
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              {countryCount}
            </Badge>
          </div>
        </div>

        {/* Countries Grid */}
        <ScrollArea className="h-64">
          <div className="p-3 grid grid-cols-2 gap-1.5">
            {previewCountries.map((country) => (
              <div 
                key={country.code}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
              >
                <FlagIcon 
                  countryCode={country.code} 
                  countryName={country.name}
                  size="sm"
                  className="rounded-sm shadow-sm flex-shrink-0"
                />
                <span className="text-xs text-foreground truncate">
                  {country.name}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer - View All Link */}
        {hasMore && (
          <div className="px-4 py-2.5 border-t bg-muted/20">
            <RegionalCountriesDialog 
              data={data}
              trigger={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-auto py-1.5 text-xs justify-between hover:bg-muted/50"
                  onClick={() => setOpen(false)}
                >
                  <span>
                    {t('configurator.viewAllCountries')} ({countryCount})
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
