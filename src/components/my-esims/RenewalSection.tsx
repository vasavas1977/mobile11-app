import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Calendar, Tag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';

interface RenewalSectionProps {
  order: {
    id: string;
    total_amount: number;
    original_amount?: number;
    discount_amount?: number;
    currency: string;
    promo_code_id?: string;
    esim_packages?: {
      data_amount: string;
      validity_days: number;
    };
  };
}

export function RenewalSection({ order }: RenewalSectionProps) {
  const { t, currency } = useLanguage();
  const [renewalsEnabled, setRenewalsEnabled] = useState(false);
  
  const pkg = order.esim_packages;
  const dataAmount = pkg?.data_amount || '1 GB';
  const validityDays = pkg?.validity_days || 7;
  const currencySymbol = currency === 'THB' ? '฿' : '$';
  
  const hasDiscount = order.discount_amount && order.discount_amount > 0;
  const originalPrice = order.original_amount || order.total_amount;
  const finalPrice = order.total_amount;
  
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        {/* Left: Lottie + Description */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            {/* Lottie Animation */}
            <div className="w-24 h-24 flex-shrink-0">
              <LottieAnimation
                src="/assets/lottie/phone-notification.lottie"
                className="w-full h-full"
                loop={true}
                autoplay={true}
              />
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="font-bold text-gray-800 text-lg mb-2">
                {t('myEsims.neverRunOut')}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('myEsims.renewalDescription')}
              </p>
              
              {/* Renewal Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-gray-700 text-sm">
                  {t('myEsims.renewalsAre')} {renewalsEnabled ? t('myEsims.on') : t('myEsims.off')}
                </span>
                <Switch
                  checked={renewalsEnabled}
                  onCheckedChange={setRenewalsEnabled}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Current Package Table */}
        <div className="lg:w-72 bg-white border border-gray-100 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 text-sm mb-3">
            {t('myEsims.currentPackage')}
          </h4>
          
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3 first:pt-0">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 text-sm">{t('myEsims.data')}</span>
              </div>
              <span className="text-gray-800 text-sm font-semibold">{dataAmount}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 text-sm">{t('myEsims.validity')}</span>
              </div>
              <span className="text-gray-800 text-sm font-semibold">{validityDays} {t('myEsims.days')}</span>
            </div>
            <div className="flex items-center justify-between py-3 last:pb-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 text-sm">{t('myEsims.price')}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasDiscount ? (
                  <>
                    <span className="text-gray-400 text-sm line-through">
                      {currencySymbol}{originalPrice.toFixed(2)}
                    </span>
                    <span className="text-green-600 text-sm font-semibold">
                      {finalPrice === 0 ? t('myEsims.free') : `${currencySymbol}${finalPrice.toFixed(2)}`}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-800 text-sm font-semibold">
                    {currencySymbol}{originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
