import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryFlag } from '@/lib/countryFlags';
import { PackageTypeBadge } from './PackageTypeBadge';
import { getLocalizedDescription } from '@/lib/packageDescriptionUtils';
import { ShoppingCart, Check, Calendar, Wifi, Gauge, Zap, Globe, Signal, Star, Rocket, Shield, Tv, Radio, Smartphone, MessageSquare, Phone, Share2 } from 'lucide-react';
import { trackCTAClick } from '@/lib/journeyTrackingUtils';

interface Package {
  id: string;
  name: string;
  country_name: string;
  country_code: string;
  price: number;
  validity_days: number;
  data_amount: string;
  qos_speed: string | null;
  package_type: string | null;
  description: string | null;
  speed_after_limit: string | null;
  carrier?: string | null;
  network_type?: string | null;
  sim_type?: string | null;
  daily_reset_amount?: string | null;
  support_data?: boolean | null;
  support_sms?: boolean | null;
  support_voice?: boolean | null;
  hot_spot?: boolean | null;
}

interface PackageQuickViewDialogProps {
  package: Package | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (pkg: Package) => void;
  isInCart: boolean;
  justAdded: boolean;
}

export function PackageQuickViewDialog({
  package: pkg,
  open,
  onOpenChange,
  onAddToCart,
  isInCart,
  justAdded,
}: PackageQuickViewDialogProps) {
  const { t, formatPrice } = useLanguage();

  if (!pkg) return null;

  const packageType = pkg.package_type as 'day_pass' | 'max_speed' | 'limitless' | null;

  // Get features based on package type
  const getFeatures = () => {
    const features: string[] = [];
    
    if (packageType === 'limitless') {
      features.push(t('packageQuickView.limitlessFeature'));
      if (pkg.qos_speed) {
        features.push((t('packageQuickView.guaranteedSpeed') as string).replace('{speed}', pkg.qos_speed));
      }
      features.push(t('packageQuickView.noThrottling'));
    } else if (packageType === 'max_speed') {
      features.push((t('packageQuickView.maxSpeedFeature') as string).replace('{data}', pkg.data_amount));
      features.push(t('packageQuickView.fullQuotaTopSpeed'));
      features.push(t('packageQuickView.topUpWhenDone'));
    } else if (packageType === 'day_pass') {
      features.push((t('packageQuickView.dailyHighSpeed') as string).replace('{data}', pkg.data_amount));
      features.push(t('packageQuickView.resets24h'));
      if (pkg.speed_after_limit) {
        features.push((t('packageQuickView.backupSpeed') as string).replace('{speed}', pkg.speed_after_limit));
      }
    } else {
      features.push(t('packageQuickView.highSpeedData'));
    }
    
    features.push(t('packageQuickView.hotspotEnabled'));
    features.push(t('packageQuickView.instantQR'));
    
    return features;
  };

  const localizedDescription = getLocalizedDescription({
    packageType: pkg.package_type || '',
    dataAmount: pkg.data_amount,
    speedAfterLimit: pkg.speed_after_limit || undefined,
    qosSpeed: pkg.qos_speed || undefined,
  }, t);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{getCountryFlag(pkg.country_code, pkg.country_name)}</span>
            <span>{pkg.country_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Package Type Badge & Price */}
          <div className="flex items-center justify-between">
            {packageType && (
              <PackageTypeBadge packageType={packageType} size="md" />
            )}
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{formatPrice(pkg.price)}</div>
              <div className="text-sm text-muted-foreground line-through">{formatPrice(pkg.price * 1.5)}</div>
            </div>
          </div>

          {/* Key Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl bg-muted/50 text-center">
              <Calendar className="w-5 h-5 text-primary mb-1" />
              <span className="text-sm font-semibold">{pkg.validity_days}</span>
              <span className="text-xs text-muted-foreground">{t('packageQuickView.days')}</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-muted/50 text-center">
              <Wifi className="w-5 h-5 text-emerald-500 mb-1" />
              <span className="text-sm font-semibold">∞</span>
              <span className="text-xs text-muted-foreground">{t('packageQuickView.alwaysOn')}</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-muted/50 text-center">
              <Gauge className="w-5 h-5 text-orange-500 mb-1" />
              <span className="text-sm font-semibold">{pkg.qos_speed || '4G/5G'}</span>
              <span className="text-xs text-muted-foreground">{t('packageQuickView.speed')}</span>
            </div>
          </div>

          {/* Package Details Grid */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Signal className="w-4 h-4 text-primary" />
              {t('packageQuickView.packageDetails')}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {pkg.carrier && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t('packageQuickView.carrier')}</span>
                    <p className="font-medium">{pkg.carrier}</p>
                  </div>
                </div>
              )}
              {pkg.network_type && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Signal className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t('packageQuickView.network')}</span>
                    <p className="font-medium">{pkg.network_type}</p>
                  </div>
                </div>
              )}
              {pkg.qos_speed && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t('packageQuickView.maxSpeed')}</span>
                    <p className="font-medium">{pkg.qos_speed}</p>
                  </div>
                </div>
              )}
              {pkg.speed_after_limit && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t('packageQuickView.afterLimit')}</span>
                    <p className="font-medium">{pkg.speed_after_limit}</p>
                  </div>
                </div>
              )}
              {pkg.daily_reset_amount && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t('packageQuickView.dailyReset')}</span>
                    <p className="font-medium">{pkg.daily_reset_amount}</p>
                  </div>
                </div>
              )}
              {pkg.sim_type && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t('packageQuickView.simType')}</span>
                    <p className="font-medium">{pkg.sim_type}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2">
            {pkg.support_data !== false && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                <Wifi className="w-3 h-3" />
                {t('packageQuickView.badgeData')}
              </span>
            )}
            {pkg.support_sms && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
                <MessageSquare className="w-3 h-3" />
                SMS
              </span>
            )}
            {pkg.support_voice && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-medium">
                <Phone className="w-3 h-3" />
                {t('packageQuickView.badgeVoice')}
              </span>
            )}
            {pkg.hot_spot !== false && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
                <Share2 className="w-3 h-3" />
                {t('packageQuickView.badgeHotspot')}
              </span>
            )}
          </div>

          {/* Why Limitless Section - Only for Limitless packages */}
          {packageType === 'limitless' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20">
              <h4 className="font-bold text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                <Star className="w-4 h-4 fill-current" />
                {t('packageQuickView.whyLimitless')}
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Rocket className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{t('packageQuickView.max5gSpeeds')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Shield className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{t('packageQuickView.zeroThrottling')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Tv className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{t('packageQuickView.streamWorryFree')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Globe className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{t('packageQuickView.worksIn151')}</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-amber-700/80 dark:text-amber-400/80 font-medium">
                {t('packageQuickView.browseConfidence')}
              </p>
            </div>
          )}

          {/* Features List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {t('packageQuickView.whatYouGet')}
            </h4>
            <ul className="space-y-2">
              {getFeatures().map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Description */}
          {localizedDescription && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground">{localizedDescription}</p>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={() => {
              trackCTAClick('Add to Cart - Quick View');
              onAddToCart(pkg);
              onOpenChange(false);
            }}
            disabled={justAdded}
            className={`w-full h-12 rounded-xl font-semibold text-base transition-all ${
              justAdded
                ? 'bg-emerald-500 hover:bg-emerald-500'
                : isInCart
                  ? 'bg-primary/90 hover:bg-primary'
                  : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25'
            }`}
          >
            {justAdded ? (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {t('packageSelector.added')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('packageSelector.addToCart')} - {formatPrice(pkg.price)}
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
