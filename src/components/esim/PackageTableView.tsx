import { useState, Fragment } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, ShoppingCart, Database, Calendar, Globe, Infinity } from 'lucide-react';
import { ProviderIndicator } from './ProviderIndicator';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { PackageBadges } from './PackageBadges';
import { PackageTypeBadge } from './PackageTypeBadge';
import { cn } from '@/lib/utils';
import { getCountryFlag } from '@/lib/countryFlags';
import { RegionalCountriesList } from './RegionalCountriesList';
import { RegionalCountriesDialog } from './RegionalCountriesDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { getRegionalData, getCountryCount } from '@/lib/regionalPackageUtils';

interface PackageTableViewProps {
  packages: any[];
  onOrder: (packageId: string, quantity?: number) => void;
  sortField?: 'country' | 'price' | 'data' | 'validity' | 'name';
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: 'country' | 'price' | 'data' | 'validity' | 'name') => void;
  buttonText?: string;
}

export function PackageTableView({ 
  packages, 
  onOrder,
  sortField = 'price',
  sortDirection = 'asc',
  onSortChange,
  buttonText = "Order"
}: PackageTableViewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();
  const { isAdmin } = useAdminCheck();

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field: typeof sortField) => {
    if (onSortChange) {
      onSortChange(field);
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return <ChevronDown className={cn("h-4 w-4 ml-1 inline transition-transform", sortDirection === 'desc' && "rotate-180")} />;
  };

  return (
    <div className="bg-card overflow-hidden relative">
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-8 md:w-12 px-2 md:px-4"></TableHead>
              <TableHead 
                className="hidden md:table-cell cursor-pointer hover:bg-muted/70 transition-colors px-2 lg:px-4"
                onClick={() => handleSort('country')}
              >
                <div className="flex items-center font-semibold text-xs md:text-sm">
                  <Globe className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Country
                  <SortIcon field="country" />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-xs md:text-sm px-1.5 md:px-3 lg:px-4 md:min-w-[140px] lg:min-w-[200px]">Plan Name</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold text-xs md:text-sm px-2 md:px-4">Type</TableHead>
              <TableHead
                className="hidden md:table-cell cursor-pointer hover:bg-muted/70 transition-colors px-2 lg:px-4"
                onClick={() => handleSort('validity')}
              >
                <div className="flex items-center font-semibold text-xs md:text-sm">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Days
                  <SortIcon field="validity" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/70 transition-colors text-right px-2 md:px-4"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end font-semibold text-xs md:text-sm">
                  Price
                  <SortIcon field="price" />
                </div>
              </TableHead>
              {isAdmin && (
                <TableHead className="hidden lg:table-cell font-semibold text-xs md:text-sm px-2 md:px-4">Provider</TableHead>
              )}
              <TableHead className="text-right font-semibold text-xs md:text-sm px-1.5 md:px-4 w-10 md:w-32">
                <span className="hidden md:inline">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg, index) => {
              const isExpanded = expandedRows.has(pkg.id);
              const isUnlimited = pkg.data_amount?.toLowerCase().includes('unlimited');
              const isPopular = index < 3;
              const isBestValue = pkg.validity_days >= 30 && pkg.price < 50;
              const isFeatured = isUnlimited;
              const regionalData = getRegionalData(pkg);
              const isRegional = regionalData && regionalData.countries && regionalData.countries.length > 1;

              return (
                <Fragment key={pkg.id}>
                  <TableRow 
                    className="hover:bg-muted/50 transition-colors border-b border-border/50"
                  >
                    <TableCell className="px-0.5 md:px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 md:h-8 md:w-8 p-0"
                        onClick={() => toggleRow(pkg.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                        ) : (
                          <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium px-2 lg:px-4">
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-lg md:text-2xl">{getCountryFlag(pkg.country_code, pkg.country_name)}</span>
                        <span className="text-xs md:text-sm text-primary font-medium">{pkg.country_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-1.5 md:px-3 lg:px-4">
                      <div className="space-y-0.5 md:space-y-1">
                        {/* Mobile: Show flag + country name + days above plan name */}
                        <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1 md:hidden">
                          <span className="text-base md:text-xl">{getCountryFlag(pkg.country_code, pkg.country_name)}</span>
                          <span className="text-xs md:text-xs text-primary font-medium">{pkg.country_name}</span>
                          <Badge variant="secondary" className="font-semibold text-[10px] md:text-xs ml-auto px-1 md:px-2 py-0">
                            {pkg.validity_days}d
                          </Badge>
                        </div>
                        
                        {/* Plan name (always visible) */}
                        <div className="font-medium text-xs md:text-sm break-words">{pkg.short_name || pkg.name}</div>
                        
                        {/* Regional package indicator */}
                        {isRegional && regionalData && (
                          <div className="text-[10px] md:text-xs text-muted-foreground">
                            {regionalData.countries.length} countries
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="flex flex-col gap-0.5 md:gap-1">
                          {/* Show package type badge on mobile/tablet (hidden on desktop since it has its own column) */}
                          {pkg.package_type && (
                            <div className="lg:hidden">
                              <PackageTypeBadge 
                                packageType={pkg.package_type as any}
                                size="sm"
                                showIcon={true}
                                className="text-[10px] md:text-xs px-1.5 py-0.5"
                              />
                            </div>
                          )}
                          <PackageBadges 
                            isPopular={isPopular} 
                            isBestValue={isBestValue} 
                            isFeatured={isFeatured}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-2 md:px-4">
                      {pkg.package_type && (
                        <PackageTypeBadge 
                          packageType={pkg.package_type as any}
                          size="sm"
                          showIcon={true}
                        />
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-2 lg:px-4">
                      <Badge variant="secondary" className="font-semibold text-xs md:text-sm">
                        {pkg.validity_days}d
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-1.5 md:px-4">
                      <div className="font-bold text-sm md:text-lg text-primary">${pkg.price.toFixed(2)}</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">{pkg.currency}</div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="hidden lg:table-cell px-2 md:px-4">
                        <ProviderIndicator providerCode={pkg.provider_code} />
                      </TableCell>
                    )}
                    <TableCell className="text-right px-0.5 md:px-4">
                      <Button
                        size={isMobile ? "icon" : "sm"}
                        onClick={() => onOrder(pkg.id, 1)}
                        className="h-6 w-6 md:h-auto md:w-auto p-0 md:px-4 rounded-full"
                        title={isMobile ? "Add to cart" : undefined}
                      >
                        <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                        <span className="hidden md:inline">{buttonText}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={isAdmin ? 8 : 7} className="py-2 md:py-4 px-2 md:px-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 text-[10px] md:text-sm min-w-0">
                          {pkg.data_amount?.toLowerCase().includes('unlimited') && (
                            <div className="col-span-2 md:col-span-3 mb-1 md:mb-2">
                              <p className="text-[9px] md:text-[10px] text-muted-foreground">
                                *Fair use policy applies
                              </p>
                            </div>
                          )}

                          {pkg.description && (
                            <div className="col-span-2 md:col-span-3">
                              <span className="font-semibold text-muted-foreground text-[10px] md:text-sm">Description:</span>
                              <p className="text-foreground mt-0.5 md:mt-1 break-words text-[10px] md:text-sm">{pkg.description}</p>
                            </div>
                          )}
                          {pkg.carrier && (
                            <div>
                              <span className="font-semibold text-muted-foreground">Carrier:</span>
                              <p className="text-foreground">{pkg.carrier}</p>
                            </div>
                          )}
                          {pkg.network_type && (
                            <div>
                              <span className="font-semibold text-muted-foreground">Network:</span>
                              <p className="text-foreground break-words">{pkg.network_type}</p>
                            </div>
                          )}
                          {pkg.daily_data_reset && pkg.network_type && (
                            <div>
                              <span className="font-semibold text-muted-foreground">Maximum Speed:</span>
                              <p className="text-foreground break-words">{pkg.network_type}</p>
                            </div>
                          )}
                          {pkg.qos_speed && pkg.daily_data_reset && (
                            <div>
                              <span className="font-semibold text-muted-foreground">Speed After Daily Limit:</span>
                              <p className="text-foreground break-words">{pkg.qos_speed}</p>
                            </div>
                          )}
                          {pkg.qos_speed && !pkg.daily_data_reset && (
                            <div>
                              <span className="font-semibold text-muted-foreground">Speed:</span>
                              <p className="text-foreground break-words">{pkg.qos_speed}</p>
                            </div>
                          )}
                          {pkg.daily_data_reset !== null && pkg.daily_data_reset !== undefined && (
                            <div>
                              <span className="font-semibold text-muted-foreground">Daily Reset:</span>
                              <p className="text-foreground">
                                {pkg.daily_data_reset ? `Yes${pkg.daily_reset_amount ? ` (${pkg.daily_reset_amount})` : ''}` : 'No'}
                              </p>
                            </div>
                          )}
                          {pkg.sim_type && (
                            <div>
                              <span className="font-semibold text-muted-foreground">SIM Type:</span>
                              <p className="text-foreground">{pkg.sim_type}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-muted-foreground">Features:</span>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {pkg.support_voice && <Badge variant="outline" className="text-xs">Voice</Badge>}
                              {pkg.support_sms && <Badge variant="outline" className="text-xs">SMS</Badge>}
                              {pkg.support_data && <Badge variant="outline" className="text-xs">Data</Badge>}
                              {pkg.is_cancelable && <Badge variant="outline" className="text-xs">Cancelable</Badge>}
                            </div>
                          </div>
                          
                          {/* Regional Countries List */}
                          {getRegionalData(pkg) && (
                            <div className="col-span-2 md:col-span-3 pt-4 border-t border-border/50 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-muted-foreground text-sm">Included Countries</span>
                                <RegionalCountriesDialog 
                                  data={getRegionalData(pkg)!}
                                  trigger={
                                    <Button variant="outline" size="sm" className="h-auto py-1 px-3 text-xs">
                                      <Globe className="h-3 w-3 mr-1" />
                                      View all {getCountryCount(pkg)}
                                    </Button>
                                  }
                                />
                              </div>
                              <RegionalCountriesList 
                                data={getRegionalData(pkg)!}
                                defaultExpanded={false}
                                maxInitialDisplay={8}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile Note */}
      <div className="md:hidden p-4 text-center text-xs text-muted-foreground border-t border-border/50">
        Tap to expand for more details
      </div>
      
      {/* Footnote */}
      <div className="p-4 text-center text-xs text-muted-foreground border-t border-border/50">
        *Fair use policy applies to unlimited packages
      </div>
    </div>
  );
}
