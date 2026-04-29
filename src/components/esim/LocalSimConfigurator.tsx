import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Database, Calendar, Minus, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackCTAClick } from '@/lib/journeyTrackingUtils';
import aisSimCard from '@/assets/ais-thailand-sim.png';
import maldivesEsim from '@/assets/maldives-esim.jpg';

const LOCAL_SIM_IMAGES: Record<string, { src: string; alt: string }> = {
  MV: { src: maldivesEsim, alt: 'Maldives eSIM Card' },
};

function getSimImage(countryCode: string) {
  return LOCAL_SIM_IMAGES[countryCode] || { src: aisSimCard, alt: 'Local SIM Card' };
}

interface EsimPackage {
  id: string;
  package_id: string;
  name: string;
  description?: string;
  country_code: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  carrier?: string;
  speed_after_limit?: string | null;
  is_local_sim?: boolean;
  support_data?: boolean | null;
  support_voice?: boolean | null;
  support_sms?: boolean | null;
}

interface LocalSimConfiguratorProps {
  pkg: EsimPackage;
  quantity: number;
  setQuantity: (qty: number) => void;
  onAddToCart: (packageId: string, quantity: number) => void;
}

export function LocalSimConfigurator({
  pkg,
  quantity,
  setQuantity,
  onAddToCart,
}: LocalSimConfiguratorProps) {
  const { t, formatPrice } = useLanguage();

  // Build capability label dynamically
  const capabilities: string[] = [];
  if (pkg.support_voice !== false) capabilities.push('Voice');
  if (pkg.support_data !== false) capabilities.push('Data');
  if (pkg.support_sms !== false) capabilities.push('SMS');
  // If all flags are null/undefined (legacy), show "Data Only" as safe default
  const capabilityLabel = capabilities.length > 0 ? capabilities.join(' + ') : 'Data';

  return (
    <div className="space-y-4">
      {/* Local SIM Badge Header */}
      <div className="flex items-center gap-2">
        <Badge className="bg-orange-500 text-white border-0 hover:bg-orange-600">
          <Phone className="h-3 w-3 mr-1" />
          LOCAL SIM
        </Badge>
        <span className="text-sm text-muted-foreground">{capabilityLabel}</span>
      </div>

      {/* Package Name */}
      <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>

      {/* SIM Card Visual */}
      <div className="relative rounded-xl overflow-hidden">
        <img 
          src={getSimImage(pkg.country_code).src}
          alt={getSimImage(pkg.country_code).alt}
          className="w-full h-auto rounded-xl object-cover"
        />
      </div>

      {/* Data + Validity Boxes */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-900">{pkg.data_amount}</span>
          </div>
          {pkg.speed_after_limit && (
            <p className="text-xs text-muted-foreground mt-1">
              + Unlimited at {pkg.speed_after_limit}
            </p>
          )}
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-900">{pkg.validity_days} {t('configurator.days')}</span>
          </div>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <h3 className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">
          {t('configurator.quantity')}
        </h3>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="rounded-full w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
          >
            <Minus className="h-4 w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5" />
          </Button>
          <span className="text-xl md:text-xl lg:text-2xl font-bold min-w-[50px] text-center text-gray-900">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity(quantity + 1)}
            className="rounded-full w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
          >
            <Plus className="h-4 w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5" />
          </Button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        onClick={() => { trackCTAClick('Add to Cart - Local SIM'); onAddToCart(pkg.id, quantity); }}
        className="w-full rounded-full h-11 md:h-12 md:text-base"
      >
        {t('configurator.addToCart')}
      </Button>
    </div>
  );
}
