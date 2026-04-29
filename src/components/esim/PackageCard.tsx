import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Calendar, Database, Zap, CheckCircle2 } from 'lucide-react';
import { PackageTypeBadge } from './PackageTypeBadge';
import { useLanguage } from '@/contexts/LanguageContext';

interface PackageCardProps {
  id: string;
  packageId: string;  
  name: string;
  shortName?: string;
  description: string;
  countryCode: string;
  countryName: string;
  dataAmount: string;
  validityDays: number;
  price: number;
  currency: string;
  qosSpeed?: string;
  isCancelable?: boolean;
  packageType?: 'day_pass' | 'max_speed' | 'limitless';
  speedAfterLimit?: string;
  dailyDataReset?: boolean;
  dailyResetAmount?: string;
  carrier?: string;
  networkType?: string;
  onOrder: (packageId: string) => void;
}

export function PackageCard({
  id,
  packageId,
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
  packageType,
  speedAfterLimit,
  dailyDataReset,
  dailyResetAmount,
  carrier,
  networkType,
  onOrder
}: PackageCardProps) {
  const { t, formatPrice, currency: userCurrency } = useLanguage();
  
  return (
    <Card className="group relative overflow-hidden border border-border/50 shadow-card hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 rounded-2xl bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-2 flex-wrap">
            {packageType && (
              <PackageTypeBadge packageType={packageType} size="sm" />
            )}
            <Badge variant="secondary" className="text-xs rounded-full bg-primary/10 text-primary border-0">
              {countryCode === 'GLOBAL' ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  Global
                </>
              ) : (
                countryName
              )}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {formatPrice(price)}
            </div>
            <div className="text-xs text-muted-foreground">{t(`currency.${userCurrency}`)}</div>
          </div>
        </div>
        
        <CardTitle className="text-lg group-hover:text-primary transition-colors leading-tight">
          {shortName || name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">
                {packageType === 'limitless' ? 'Unlimited GB' : dataAmount}
              </div>
              <div className="text-xs text-muted-foreground">{t('packages.data')}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">{validityDays} {t('packages.days')}</div>
              <div className="text-xs text-muted-foreground">{t('packages.validity')}</div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/30 space-y-2">
          {qosSpeed && (
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-foreground">
                <span className="text-muted-foreground">Speed:</span> {qosSpeed}
              </span>
            </div>
          )}
          {isCancelable && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">{t('packages.cancelable')}</span>
            </div>
          )}
        </div>

        {packageType && (
          <div className="pt-3 mt-3 border-t border-border/30">
            <div className="text-xs font-semibold text-foreground mb-2">{t('packages.whatYouGet')}</div>
            {packageType === 'day_pass' && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{dailyResetAmount || dataAmount} {t('packages.highSpeedDaily')}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{speedAfterLimit || '384 Kbps'} {t('packages.unlimitedAfter')}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('packages.resetsDaily')}</span>
                </li>
              </ul>
            )}
            {packageType === 'max_speed' && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{dataAmount} at maximum speeds</span>
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
      </CardContent>

      <CardFooter>
        <Button 
          onClick={() => onOrder(id)}
          className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-medium"
          size="sm"
        >
          {t('packages.orderNow')}
        </Button>
      </CardFooter>
    </Card>
  );
}