import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Calendar, Database, Zap, CheckCircle2, Phone, MessageSquare, Wifi, Network, ChevronDown, Minus, Plus, Infinity, Info } from 'lucide-react';
import { usePackageDisplaySettings } from '@/hooks/usePackageDisplaySettings';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { PackageBadges } from './PackageBadges';
import { PackageTypeBadge } from './PackageTypeBadge';
import { getCountryFlag } from '@/lib/countryFlags';
import { getRegionalData, getCountryCount } from '@/lib/regionalPackageUtils';
import { RegionalCountriesList } from '@/components/esim/RegionalCountriesList';
import { RegionalCountriesDialog } from '@/components/esim/RegionalCountriesDialog';
import * as regionalUtils from '@/lib/regionalPackageUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PackageCardDynamicProps {
  id: string;
  packageId: string;
  name: string;
  shortName?: string;
  description?: string;
  countryCode: string;
  countryName: string;
  dataAmount: string;
  validityDays: number;
  price: number;
  currency: string;
  qosSpeed?: string;
  isCancelable?: boolean;
  carrier?: string;
  networkType?: string;
  serviceType?: string;
  simType?: string;
  supportVoice?: boolean;
  supportSms?: boolean;
  supportData?: boolean;
  activationNote?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  isFeatured?: boolean;
  packageType?: 'day_pass' | 'max_speed' | 'limitless';
  speedAfterLimit?: string;
  dailyDataReset?: boolean;
  dailyResetAmount?: string;
  onOrder: (packageId: string, quantity?: number) => void;
  buttonText?: string;
  includedCountries?: any;
  searchedCountry?: string;
}

export function PackageCardDynamic({
  id,
  name,
  shortName,
  description,
  countryCode,
  countryName,
  dataAmount,
  validityDays,
  price,
  currency,
  qosSpeed,
  isCancelable,
  carrier,
  networkType,
  serviceType,
  simType,
  supportVoice,
  supportSms,
  supportData,
  activationNote,
  isPopular,
  isBestValue,
  isFeatured,
  packageType,
  speedAfterLimit,
  dailyDataReset,
  dailyResetAmount,
  onOrder,
  buttonText,
  includedCountries,
  searchedCountry
}: PackageCardDynamicProps) {
  const { isFieldVisible } = usePackageDisplaySettings();
  const { formatPrice } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const totalPrice = price * quantity;
  const isUnlimitedData = dataAmount.toLowerCase().includes('unlimited') || dataAmount.toLowerCase().includes('∞');
  
  // Get regional package data (with fallback to presets)
  const regionalData = getRegionalData({ included_countries: includedCountries, country_name: countryName, name });
  const isRegional = regionalData && regionalData.countries && regionalData.countries.length > 1;

  return (
    <Card className="group relative overflow-hidden border border-border/50 shadow-card hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 rounded-xl bg-card">
      <CardHeader className="pb-3 pt-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 flex-wrap">
              {packageType && (
                <PackageTypeBadge packageType={packageType} size="sm" />
              )}
              <Badge variant="secondary" className="text-xs rounded-full bg-primary/10 text-primary border-0 w-fit">
                <span className="mr-1">{getCountryFlag(countryCode, countryName)}</span>
                {countryName}
              </Badge>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-foreground">
              {formatPrice(totalPrice)}
            </div>
            {quantity > 1 && (
              <div className="text-xs text-muted-foreground">
                {formatPrice(price)} × {quantity}
              </div>
            )}
          </div>
        </div>
        
        {/* Status Badges - Now in document flow */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          <PackageBadges isPopular={isPopular} isBestValue={isBestValue} isFeatured={isFeatured} />
        </div>
        
        <CardTitle className="text-base group-hover:text-primary transition-colors leading-tight line-clamp-2">
          {shortName || name}
        </CardTitle>
        {isRegional && regionalData && (
          <CardDescription className="text-xs text-muted-foreground mt-1">
            {searchedCountry && regionalUtils.includesCountry({ included_countries: includedCountries }, searchedCountry) ? (
              <>
                <span className="font-semibold text-primary">Regional Package:</span> Covers {regionalData.countries.length} {regionalData.countries.length === 1 ? 'country' : 'countries'} including {searchedCountry}
              </>
            ) : (
              <>Covers {regionalData.countries.length} {regionalData.countries.length === 1 ? 'country' : 'countries'}</>
            )}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {isFieldVisible('data_amount') && (
          <>
            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
          {isUnlimitedData ? (
            <>
              <Infinity className="h-5 w-5 text-primary" />
              <span className="font-bold text-primary">
                {packageType === 'limitless' ? 'Unlimited GB' : 'UNLIMITED*'}
              </span>
            </>
          ) : (
            <>
              <Database className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">{dataAmount}</span>
            </>
          )}
              </div>
              {isFieldVisible('validity_days') && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {validityDays}d
                </div>
              )}
            </div>
          </>
        )}

        {/* Compact Quantity Selector */}
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
          <span className="text-xs font-medium text-foreground">Qty</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs font-semibold min-w-[1.5rem] text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity >= 10}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-muted-foreground hover:text-primary"
            >
              <span className="flex items-center gap-1">
                More details
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </span>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-2 border-t border-border/30 space-y-2 mt-2">
            {isUnlimitedData && (
              <p className="text-[10px] text-muted-foreground">
                *Fair use policy applies
              </p>
            )}

            {isFieldVisible('description') && description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}

            {isFieldVisible('sim_type') && simType && (
              <Badge variant="outline" className="text-xs w-fit">
                {simType}
              </Badge>
            )}

            {isFieldVisible('carrier') && carrier && (
              <div className="flex items-center gap-2">
                <Network className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-foreground">{carrier}</span>
              </div>
            )}

            {isFieldVisible('network_type') && networkType && (
              <div className="flex items-center gap-2">
                <Wifi className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-foreground">{networkType}</span>
              </div>
            )}

            {/* Show consistent speed for non-daily-reset packages */}
            {isFieldVisible('qos_speed') && qosSpeed && !dailyDataReset && (
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  <span className="text-muted-foreground">Speed:</span> {qosSpeed}
                </span>
              </div>
            )}

            {isFieldVisible('is_cancelable') && isCancelable && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-foreground">Cancelable</span>
              </div>
            )}
            
            {/* Regional Package Countries */}
            {regionalData && regionalData.countries && regionalData.countries.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">Included Countries</span>
                  <RegionalCountriesDialog 
                    data={regionalData}
                    trigger={
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        View all {getCountryCount({ included_countries: includedCountries })}
                      </Button>
                    }
                  />
                </div>
                <RegionalCountriesList 
                  data={regionalData} 
                  maxInitialDisplay={5}
                  highlightCountry={searchedCountry}
                />
              </div>
            )}

            {/* Package Type Features */}
            {packageType && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="text-xs font-semibold text-foreground mb-2">What you get:</div>
                {packageType === 'day_pass' && (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{dailyResetAmount || '500MB'} high-speed data daily</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>384 Kbps backup speed unlimited after daily limit</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Resets every 24 hours</span>
                    </li>
                  </ul>
                )}
                {packageType === 'max_speed' && (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{dataAmount} at maximum {networkType || '4G/5G'} speeds</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Use full quota at top speeds</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Top up anytime when data runs out</span>
                    </li>
                  </ul>
                )}
                {packageType === 'limitless' && (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Unlimited at maximum speeds</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Up to 5G network speeds</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>No caps, no throttling</span>
                    </li>
                  </ul>
                )}
              </div>
            )}

            {isFieldVisible('support_voice') && supportVoice && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Voice Calls</span>
              </div>
            )}

            {isFieldVisible('support_sms') && supportSms && (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">SMS</span>
              </div>
            )}

            {isFieldVisible('activation_note') && activationNote && (
              <p className="text-xs text-muted-foreground italic mt-2">
                {activationNote}
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <CardFooter className="pt-3">
        <Button 
          onClick={() => onOrder(id, buttonText ? 1 : quantity)}
          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {buttonText || `Order ${quantity > 1 ? `${quantity}x` : ''} ${formatPrice(totalPrice)}`}
        </Button>
      </CardFooter>
    </Card>
  );
}