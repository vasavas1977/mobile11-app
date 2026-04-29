import { useState, useMemo } from 'react';
import { Check, ChevronRight, ExternalLink, Smartphone, AlertCircle, Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserFlowData } from './types';
import { 
  COMPATIBLE_DEVICES, 
  searchCompatibleDevices, 
  DeviceBrandKey 
} from '@/constants/compatibleDevices';

interface CompatibilityFlowProps {
  step: string;
  userData: UserFlowData;
  onNavigateStep: (step: string, data?: Partial<UserFlowData>) => void;
  onNavigateToFlow: (flow: string, step?: string) => void;
}

export function CompatibilityFlow({ step, userData, onNavigateStep, onNavigateToFlow }: CompatibilityFlowProps) {
  switch (step) {
    case 'device-selection':
      return <DeviceSelectionStep onSelect={(device) => onNavigateStep('brand-selection', { device })} />;
    case 'brand-selection':
      return (
        <BrandSelectionStep 
          device={userData.device}
          onSelectBrand={(brandKey) => onNavigateStep('model-search', { selectedBrand: brandKey })}
          onNavigateStep={onNavigateStep}
        />
      );
    case 'model-search':
      return (
        <ModelSearchStep 
          brandKey={userData.selectedBrand as DeviceBrandKey}
          onFoundDevice={(isCompatible) => onNavigateStep('result', { isCompatible })}
          onNavigateStep={onNavigateStep}
          onNavigateToFlow={onNavigateToFlow}
        />
      );
    case 'check-eid':
      return <CheckEIDStep device={userData.device} onNavigateStep={onNavigateStep} />;
    case 'result':
      return <ResultStep isCompatible={userData.isCompatible} onNavigateToFlow={onNavigateToFlow} />;
    default:
      return <DeviceSelectionStep onSelect={(device) => onNavigateStep('brand-selection', { device })} />;
  }
}

function DeviceSelectionStep({ onSelect }: { onSelect: (device: 'iphone' | 'android') => void }) {
  const { t } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.whichDevice')}
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelect('iphone')}
            className="flex flex-col items-center p-4 bg-gray-50 border border-gray-200 
                       rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all text-gray-900"
          >
            <span className="text-3xl mb-1">📱</span>
            <span className="text-sm font-bold text-gray-700">iOS</span>
            <span className="text-xs text-gray-500 mt-1">iPhone / iPad</span>
          </button>
          <button
            onClick={() => onSelect('android')}
            className="flex flex-col items-center p-4 bg-gray-50 border border-gray-200 
                       rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all text-gray-900"
          >
            <span className="text-3xl mb-1">🤖</span>
            <span className="text-sm font-bold text-gray-700">Android</span>
            <span className="text-xs text-gray-500 mt-1">Samsung, Pixel, etc.</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function BrandSelectionStep({ 
  device,
  onSelectBrand, 
  onNavigateStep 
}: { 
  device?: string;
  onSelectBrand: (brandKey: DeviceBrandKey) => void;
  onNavigateStep: (step: string, data?: Partial<UserFlowData>) => void;
}) {
  const { t } = useLanguage();
  
  const brands = useMemo(() => {
    if (device === 'iphone') {
      return [{ key: 'apple' as DeviceBrandKey, name: 'Apple', emoji: '🍎' }];
    }
    
    return [
      { key: 'samsung' as DeviceBrandKey, name: 'Samsung', emoji: '📱' },
      { key: 'google' as DeviceBrandKey, name: 'Google Pixel', emoji: '🔷' },
      { key: 'xiaomi' as DeviceBrandKey, name: 'Xiaomi', emoji: '🟠' },
      { key: 'huawei' as DeviceBrandKey, name: 'Huawei', emoji: '🔴' },
      { key: 'oppo' as DeviceBrandKey, name: 'Oppo', emoji: '🟢' },
      { key: 'onePlus' as DeviceBrandKey, name: 'OnePlus', emoji: '⚫' },
      { key: 'motorola' as DeviceBrandKey, name: 'Motorola', emoji: '🔵' },
      { key: 'sony' as DeviceBrandKey, name: 'Sony', emoji: '🟣' },
      { key: 'honor' as DeviceBrandKey, name: 'Honor', emoji: '🔶' },
      { key: 'nothing' as DeviceBrandKey, name: 'Nothing', emoji: '⚪' },
      { key: 'asus' as DeviceBrandKey, name: 'Asus', emoji: '🎮' },
    ];
  }, [device]);

  if (device === 'iphone') {
    onSelectBrand('apple');
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.selectBrand')}
        </p>
        
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {brands.map((brand) => (
            <button
              key={brand.key}
              onClick={() => onSelectBrand(brand.key)}
              className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 
                         rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all text-left text-gray-900"
            >
              <span className="text-lg">{brand.emoji}</span>
              <span className="font-medium text-sm text-gray-900">{brand.name}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onNavigateStep('check-eid')}
          className="w-full mt-3 p-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {t('chatbot.flows.checkWithEid')}
        </button>
      </div>
    </div>
  );
}

function ModelSearchStep({ 
  brandKey,
  onFoundDevice,
  onNavigateStep,
  onNavigateToFlow
}: { 
  brandKey?: DeviceBrandKey;
  onFoundDevice: (isCompatible: boolean) => void;
  onNavigateStep: (step: string, data?: Partial<UserFlowData>) => void;
  onNavigateToFlow: (flow: string, step?: string) => void;
}) {
  const { t, localizeField } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  const brand = brandKey ? COMPATIBLE_DEVICES[brandKey] : null;
  
  const filteredDevices = useMemo(() => {
    if (!brand) return [];
    if (!searchQuery.trim()) return brand.devices;
    const query = searchQuery.toLowerCase();
    return brand.devices.filter(device => device.toLowerCase().includes(query));
  }, [brand, searchQuery]);

  if (!brand) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-600">
          {t('chatbot.flows.brandNotFound')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {brand.hasWarning && brand.warningMessages && brand.warningMessages.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm space-y-2">
          {brand.warningMessages.map((warning, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800">
                {localizeField(warning, '')}
              </p>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.findModel').replace('{brand}', brand.name)}
        </p>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chatbot.flows.typeModel')}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filteredDevices.length > 0 ? (
            filteredDevices.map((device, index) => (
              <button
                key={index}
                onClick={() => onFoundDevice(true)}
                className="w-full flex items-center justify-between p-2 text-left text-sm text-gray-900
                           bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
              >
                <span className="text-gray-900">{device}</span>
                <Check className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100" />
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-gray-500 py-4">
              {t('chatbot.flows.noModels')}
            </p>
          )}
        </div>
        
        <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
          <button
            onClick={() => onNavigateStep('check-eid')}
            className="w-full p-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {t('chatbot.flows.checkModelEid')}
          </button>
          <button
            onClick={() => onFoundDevice(false)}
            className="w-full p-2 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            {t('chatbot.flows.notListed')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckEIDStep({ device, onNavigateStep }: { device?: string; onNavigateStep: (step: string, data?: Partial<UserFlowData>) => void }) {
  const { t, localizeField } = useLanguage();

  const iphoneSteps = [
    { en: 'Go to Settings → General → About', th: 'ไปที่ ตั้งค่า → ทั่วไป → เกี่ยวกับ', ja: '設定 → 一般 → 情報 を開く' },
    { en: 'Scroll down and look for "EID"', th: 'เลื่อนลงและหา "EID"', ja: '下にスクロールして「EID」を探す' },
    { en: 'If you see a 32-digit EID number, your iPhone supports eSIM!', th: 'ถ้าเห็นเลข EID 32 หลัก แสดงว่า iPhone รองรับ eSIM!', ja: '32桁のEID番号が見つかれば、iPhoneはeSIMに対応しています！' },
  ];

  const androidSteps = [
    { en: 'Go to Settings → About Phone', th: 'ไปที่ ตั้งค่า → เกี่ยวกับโทรศัพท์', ja: '設定 → 端末情報 を開く' },
    { en: 'Tap "SIM Status" or "Status Information"', th: 'แตะ "สถานะ SIM" หรือ "ข้อมูลสถานะ"', ja: '「SIMのステータス」または「ステータス情報」をタップ' },
    { en: 'Look for "EID" - if present, your phone supports eSIM!', th: 'หา "EID" - ถ้ามี แสดงว่าโทรศัพท์รองรับ eSIM!', ja: '「EID」を探す — 表示されればeSIM対応です！' },
  ];

  const steps = device === 'iphone' ? iphoneSteps : androidSteps;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <Smartphone className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">
              {t('chatbot.flows.howToCheck')}
            </p>
            <p className="text-xs mt-1 text-blue-600">
              {t('chatbot.flows.followSteps')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          {t('chatbot.flows.stepsFor').replace('{device}', device === 'iphone' ? 'iPhone' : 'Android')}
        </p>

        <div className="space-y-2 mb-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 text-white 
                              flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <span className="text-sm text-gray-700">
                {localizeField(step, '')}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600 mb-3">
            {t('chatbot.flows.foundEidQuestion')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigateStep('result', { isCompatible: true })}
              className="p-3 bg-green-50 border border-green-200 rounded-lg font-medium text-green-700
                         hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              {t('chatbot.flows.yesFoundIt')}
            </button>
            <button
              onClick={() => onNavigateStep('result', { isCompatible: false })}
              className="p-3 bg-red-50 border border-red-200 rounded-lg font-medium text-red-700
                         hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              {t('chatbot.flows.noEidFound')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        <p className="font-semibold mb-1">
          {t('chatbot.flows.important')}
        </p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>{t('chatbot.flows.mustBeUnlocked')}</li>
          <li>{t('chatbot.flows.someLockEsim')}</li>
        </ul>
      </div>
    </div>
  );
}

function ResultStep({ isCompatible, onNavigateToFlow }: { isCompatible?: boolean; onNavigateToFlow: (flow: string, step?: string) => void }) {
  const { t } = useLanguage();

  if (isCompatible) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <span className="text-4xl">✅</span>
          <p className="text-lg font-semibold text-green-800 mt-2">
            {t('chatbot.compatibility.compatible')}
          </p>
          <p className="text-sm text-green-600 mt-1">
            {t('chatbot.compatibility.compatibleNote')}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => onNavigateToFlow('buy-esim', 'destination')}
            className="w-full p-3 bg-orange-500 text-white font-semibold rounded-lg
                       hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            🛒 {t('chatbot.compatibility.buyNow')}
          </button>
          <button
            onClick={() => window.open('/what-is-esim?tab=compatibility', '_blank')}
            className="w-full p-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg
                       hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t('chatbot.flows.viewAllDevices')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-lg font-semibold text-amber-800 mt-2">
          {t('chatbot.compatibility.notCompatible')}
        </p>
        <p className="text-sm text-amber-600 mt-1">
          {t('chatbot.compatibility.notCompatibleNote')}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">
          {t('chatbot.flows.whatYouCanDo')}
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span>1.</span>
            <span>{t('chatbot.flows.doubleCheckUnlocked')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span>2.</span>
            <span>{t('chatbot.flows.viewFullList')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span>3.</span>
            <span>{t('chatbot.flows.contactIfUnsure')}</span>
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => window.open('/what-is-esim?tab=compatibility', '_blank')}
          className="w-full p-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg
                     hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          {t('chatbot.flows.viewDevices')}
        </button>
        <button
          onClick={() => onNavigateToFlow('talk-to-support')}
          className="w-full p-3 bg-orange-500 text-white font-semibold rounded-lg
                     hover:bg-orange-600 transition-colors"
        >
          👩‍💻 {t('chatbot.compatibility.talkToSupport')}
        </button>
      </div>
    </div>
  );
}
