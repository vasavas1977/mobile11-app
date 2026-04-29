import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { RegionalPackageData, CarrierInfo } from '@/lib/excelRegionalParser';
import { getCountryFlag } from '@/lib/countryFlags';
import { useIsMobile } from '@/hooks/use-mobile';

interface RegionalCountriesDialogProps {
  data: RegionalPackageData;
  trigger?: React.ReactNode;
}

function formatCarrierInfo(carriers: CarrierInfo[]): string {
  if (!carriers || carriers.length === 0) return 'No carrier information';
  
  return carriers
    .map(carrier => `${carrier.name}: ${carrier.networks.join(',')}`)
    .join(' / ');
}

export function RegionalCountriesDialog({ data, trigger }: RegionalCountriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  
  if (!data?.countries || data.countries.length === 0) {
    return null;
  }

  // Filter countries based on search term - memoized
  const filteredCountries = useMemo(() => 
    data.countries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.carriers?.some(carrier => 
        carrier.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [data.countries, searchTerm]
  );

  // Memoize search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoize the shared content to prevent recreation
  const CountriesContent = useMemo(() => (
    <>
      <div className="pb-4 px-6">
        <Input 
          placeholder="Search by country"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500"
          autoComplete="off"
        />
      </div>
      
      <ScrollArea className={`${isMobile ? 'h-[60vh]' : 'h-[50vh]'} overflow-auto px-6`}>
        <div className="space-y-1">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <div 
                key={country.code} 
                className="py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className={`fi fi-${country.code.toLowerCase()} text-xl flex-shrink-0 rounded-sm`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-900">
                      {country.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    {country.carriers && country.carriers.length > 0 ? (
                      country.carriers.map((carrier, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">{carrier.name}</span>
                          {carrier.networks?.[0] && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                              {carrier.networks[0]}
                            </span>
                          )}
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No countries found matching "{searchTerm}"
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="text-sm text-gray-500 pt-4 px-6 border-t border-gray-200">
        Showing {filteredCountries.length} of {data.countries.length} countries
      </div>
    </>
  ), [searchTerm, handleSearchChange, filteredCountries, isMobile, data.countries.length]);

  // Default trigger with proper event handling
  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Globe className="h-4 w-4 mr-2" />
      View {data.countries.length} countries
    </Button>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
          {trigger || defaultTrigger}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh] z-[100] bg-white">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-gray-900">Countries + Networks</DrawerTitle>
          </DrawerHeader>
          {CountriesContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] z-[100] bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Countries + Networks</DialogTitle>
        </DialogHeader>
        {CountriesContent}
      </DialogContent>
    </Dialog>
  );
}
