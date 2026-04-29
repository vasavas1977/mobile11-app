import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, Download, Signal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstallEsimDialog } from './InstallEsimDialog';
import { HowToConnectDialog } from './HowToConnectDialog';
interface ReadyToUseSectionProps {
  order: {
    id: string;
    order_id: string;
    qr_code?: string;
    smdp_address?: string;
    activation_code?: string;
    download_link?: string;
    esim_packages?: {
      country_name: string;
      data_amount: string;
      validity_days: number;
    };
  };
}

type DeviceType = 'ios' | 'android' | null;

const IOS_VERSIONS = ['ios26Later', 'ios17', 'ios16', 'ios15Previous'] as const;

export function ReadyToUseSection({ order }: ReadyToUseSectionProps) {
  const { t } = useLanguage();
  const [deviceType, setDeviceType] = useState<DeviceType>(null);
  const [osVersion, setOsVersion] = useState<string>('ios26Later');
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [osDropdownOpen, setOsDropdownOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const handleDeviceChange = (type: 'ios' | 'android') => {
    setDeviceType(type);
    if (type === 'ios') {
      setOsVersion('ios26Later');
    }
    setDeviceDropdownOpen(false);
  };

  const handleOsChange = (version: string) => {
    setOsVersion(version);
    setOsDropdownOpen(false);
  };

  const getOsOptions = () => {
    return IOS_VERSIONS.map(v => ({
      value: v,
      label: t(`readyToUse.${v}`)
    }));
  };

  const getCurrentOsLabel = () => {
    return t(`readyToUse.${osVersion}`);
  };

  return (
    <>
      <div className="bg-[#F5F1EC] rounded-2xl p-6 space-y-5">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {t('readyToUse.title')}
          </h2>
          <p className="text-gray-600 text-sm">
            {t('readyToUse.subtitle')}
          </p>
        </div>

        {/* Device Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setDeviceDropdownOpen(!deviceDropdownOpen);
              setOsDropdownOpen(false);
            }}
            className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between border border-gray-200 hover:border-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <div className="flex items-center gap-3">
              {deviceType === 'ios' && (
                <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              {deviceType === 'android' && (
                <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.6 11.4c-.1-1.2.4-2.3 1.1-3.2-.4-.6-1.5-1.5-3.2-1.5-1.3 0-2.4.8-3.1.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.9.9-3.8 2.4-1.6 2.8-.4 6.9 1.2 9.2.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1.1 2.8-2.2.5-.7.9-1.4 1.2-2.2-1.6-.6-2.3-2.3-2.3-4.8zM15 3c.7-.8 1.1-1.9 1-3-.9.1-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z"/>
                </svg>
              )}
              <span className="text-gray-800 font-medium">
                {deviceType === null 
                  ? t('readyToUse.selectDevice') 
                  : deviceType === 'ios' 
                    ? t('readyToUse.iosDevice') 
                    : t('readyToUse.androidDevice')}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${deviceDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {deviceDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20">
              <button
                onClick={() => handleDeviceChange('ios')}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-gray-800">{t('readyToUse.iosDevice')}</span>
              </button>
              <button
                onClick={() => handleDeviceChange('android')}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.6 11.4c-.1-1.2.4-2.3 1.1-3.2-.4-.6-1.5-1.5-3.2-1.5-1.3 0-2.4.8-3.1.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.9.9-3.8 2.4-1.6 2.8-.4 6.9 1.2 9.2.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1.1 2.8-2.2.5-.7.9-1.4 1.2-2.2-1.6-.6-2.3-2.3-2.3-4.8zM15 3c.7-.8 1.1-1.9 1-3-.9.1-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z"/>
                </svg>
                <span className="text-gray-800">{t('readyToUse.androidDevice')}</span>
              </button>
            </div>
          )}
        </div>

        {/* OS Version Dropdown - Only show for iOS */}
        {deviceType === 'ios' && (
          <div className="relative">
            <button
              onClick={() => {
                setOsDropdownOpen(!osDropdownOpen);
                setDeviceDropdownOpen(false);
              }}
              className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between border border-gray-200 hover:border-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <span className="text-gray-800 font-medium">{getCurrentOsLabel()}</span>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${osDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {osDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20">
                {getOsOptions().map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => handleOsChange(option.value)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${index > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <span className="text-gray-800">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Install your eSIM Card */}
        <div className="bg-white rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-800 font-semibold mb-1">
                {t('readyToUse.installTitle')}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('readyToUse.installDescription')}
              </p>
              <Button
                onClick={() => setInstallDialogOpen(true)}
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
              >
                {t('readyToUse.installButton')}
              </Button>
            </div>
          </div>
        </div>

        {/* Connect to a network Card */}
        <div className="bg-white rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Signal className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-800 font-semibold mb-1">
                {t('readyToUse.connectTitle')}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('readyToUse.connectDescription')}
              </p>
              <Button
                onClick={() => setConnectDialogOpen(true)}
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800"
              >
                {t('readyToUse.connectButton')}
              </Button>
              
              {/* Android Warning Banner */}
              {deviceType === 'android' && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm">
                    {t('readyToUse.androidWarning')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Install eSIM Dialog */}
      <InstallEsimDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        order={order}
      />

      {/* How to Connect Dialog */}
      <HowToConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
      />
    </>
  );
}
