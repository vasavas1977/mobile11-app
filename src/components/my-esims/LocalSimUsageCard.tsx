import { ArrowUpDown, Calendar, Info, Sparkles, Phone, Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface LocalSimUsageCardProps {
  packageData: {
    data_amount: string;
    validity_days: number;
    speed_after_limit?: string;
    package_type?: string;
    description?: string;
  };
  latestActivationTime?: string;
  carrier?: string;
}

export function LocalSimUsageCard({ 
  packageData, 
  latestActivationTime, 
  carrier 
}: LocalSimUsageCardProps) {
  const { t, language } = useLanguage();
  
  // Format activation deadline
  const activateBy = latestActivationTime 
    ? format(new Date(latestActivationTime), language === 'ja' ? 'yyyy年M月d日' : language === 'th' ? 'd MMM yyyy' : 'MMM d, yyyy')
    : null;
  
  // Carrier-specific USSD code
  const ussdCode = carrier === 'AIS' ? '*121*32#' : '*100#';
  
  return (
    <div className="mb-2">
      <p className="text-gray-800 font-semibold text-sm mb-3">
        {t('myEsims.yourPackage') || 'Your Package'}
      </p>
      
      <div className="flex gap-3 mb-3">
        {/* Data box */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <p className="text-gray-800 font-semibold">{packageData.data_amount}</p>
          </div>
          {packageData.speed_after_limit && (
            <p className="text-gray-500 text-xs">
              + {t('myEsims.unlimitedAt') || 'Unlimited at'} {packageData.speed_after_limit}
            </p>
          )}
        </div>
        
        {/* Validity box */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <p className="text-gray-800 font-semibold">
              {packageData.validity_days} {t('myEsims.days')}
            </p>
          </div>
          {activateBy && (
            <p className="text-gray-500 text-xs">
              {t('myEsims.activateBy') || 'Activate by'} {activateBy}
            </p>
          )}
        </div>
      </div>
      
      {/* Package Includes - for AIS carrier */}
      {carrier === 'AIS' && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p className="text-gray-700 font-medium text-sm">
              {t('myEsims.packageIncludes') || 'Package Includes'}
            </p>
          </div>
          <ul className="text-gray-600 text-sm space-y-1.5">
            <li className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              {packageData.data_amount?.includes('50')
                ? `5G Data: ${packageData.data_amount} then unlimited ${packageData.speed_after_limit || '384Kbps'}`
                : (t('myEsims.aisData') || '5G Data: 35GB then unlimited 1Mbps')}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {packageData.data_amount?.includes('50')
                ? 'Call: 100 THB credit (local calls only)'
                : (t('myEsims.aisCall') || 'Call: 30 mins')}
            </li>
            {!packageData.data_amount?.includes('50') && (
              <li className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-gray-400" />
                {t('myEsims.aisWifi') || 'WiFi: 7 days'}
              </li>
            )}
          </ul>
        </div>
      )}
      
      {/* Manual usage check info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-700 text-sm">
            {t('myEsims.localSimUsageInfo') || 'Usage tracking not available for local SIM packages.'}
          </p>
          <p className="text-blue-600 text-xs mt-1">
            {t('myEsims.checkUsageVia') || 'Check usage via'} {carrier} {t('myEsims.appOrDial') || 'app or dial'} {ussdCode}
          </p>
        </div>
      </div>
    </div>
  );
}
