import { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  INSTALL_METHODS, 
  TRAVEL_STATUS_OPTIONS, 
  ANDROID_BRAND_OPTIONS,
  InstallMethod, 
  TravelStatus, 
  AndroidBrand,
  UserFlowData 
} from './types';

interface InstallFlowProps {
  step: string;
  userData: UserFlowData;
  onNavigateStep: (step: string, data?: Partial<UserFlowData>) => void;
  onCompleteStep: (stepId: string) => void;
  isStepCompleted: (stepId: string) => boolean;
}

export function InstallFlow({ step, userData, onNavigateStep, onCompleteStep, isStepCompleted }: InstallFlowProps) {
  switch (step) {
    case 'device-selection':
      return <DeviceSelectionStep onSelect={(device) => onNavigateStep('install-method', { device })} />;
    case 'install-method':
      return <InstallMethodStep onSelect={(method) => onNavigateStep('travel-status', { installMethod: method })} />;
    case 'travel-status':
      return (
        <TravelStatusStep 
          onSelect={(status) => {
            const nextStep = userData.device === 'android' ? 'android-brand' : 'iphone-steps';
            onNavigateStep(nextStep, { travelStatus: status });
          }} 
        />
      );
    case 'android-brand':
      return <AndroidBrandStep onSelect={(brand) => onNavigateStep('android-steps', { androidBrand: brand })} />;
    case 'iphone-steps':
      return (
        <IPhoneStepsGuide 
          travelStatus={userData.travelStatus} 
          onComplete={() => onNavigateStep('confirmation')}
          onCompleteStep={onCompleteStep}
          isStepCompleted={isStepCompleted}
        />
      );
    case 'android-steps':
      return (
        <AndroidStepsGuide 
          brand={userData.androidBrand} 
          travelStatus={userData.travelStatus}
          onComplete={() => onNavigateStep('confirmation')}
          onCompleteStep={onCompleteStep}
          isStepCompleted={isStepCompleted}
        />
      );
    case 'confirmation':
      return <ConfirmationStep />;
    default:
      return <DeviceSelectionStep onSelect={(device) => onNavigateStep('install-method', { device })} />;
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
                       rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all"
          >
            <span className="text-3xl mb-1">📱</span>
            <span className="text-sm font-bold text-gray-700">iOS</span>
            <span className="text-xs text-gray-500 mt-1">
              {t('chatbot.flows.easySetup')}
            </span>
          </button>
          <button
            onClick={() => onSelect('android')}
            className="flex flex-col items-center p-4 bg-gray-50 border border-gray-200 
                       rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all"
          >
            <span className="text-3xl mb-1">🤖</span>
            <span className="text-sm font-bold text-gray-700">Android</span>
            <span className="text-xs text-gray-500 mt-1">
              {t('chatbot.flows.selectBrandNext')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function InstallMethodStep({ onSelect }: { onSelect: (method: InstallMethod) => void }) {
  const { localizeField, t } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.howToInstall')}
        </p>
        
        <div className="space-y-2">
          {INSTALL_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 
                         rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all group"
            >
              <span className="font-medium text-gray-800 group-hover:text-orange-700">
                {localizeField(method, 'label')}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TravelStatusStep({ onSelect }: { onSelect: (status: TravelStatus) => void }) {
  const { localizeField, t } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.whereAreYou')}
        </p>
        
        <div className="space-y-2">
          {TRAVEL_STATUS_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 
                         rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all group"
            >
              <span className="font-medium text-gray-800 group-hover:text-orange-700">
                {localizeField(option, 'label')}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AndroidBrandStep({ onSelect }: { onSelect: (brand: AndroidBrand) => void }) {
  const { localizeField, t } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.whatBrand')}
        </p>
        
        <div className="space-y-2">
          {ANDROID_BRAND_OPTIONS.map((brand) => (
            <button
              key={brand.id}
              onClick={() => onSelect(brand.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 
                         rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all group"
            >
              <span className="font-medium text-gray-800 group-hover:text-orange-700">
                {localizeField(brand, 'label')}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StepsGuideProps {
  travelStatus?: TravelStatus;
  onComplete: () => void;
  onCompleteStep: (stepId: string) => void;
  isStepCompleted: (stepId: string) => boolean;
}

function IPhoneStepsGuide({ travelStatus, onComplete, onCompleteStep, isStepCompleted }: StepsGuideProps) {
  const { t, localizeField } = useLanguage();
  
  const steps = [
    { id: 'ip1', textEn: 'Settings → Cellular → Add Cellular Plan', textTh: 'ตั้งค่า → เซลลูลาร์ → เพิ่มแผนเซลลูลาร์', textJa: '設定 → モバイル通信 → モバイル通信プランを追加' },
    { id: 'ip2', textEn: 'Scan your QR code', textTh: 'สแกน QR Code ของคุณ', textJa: 'QRコードをスキャン' },
    { id: 'ip3', textEn: 'Label it: "Mobile11 eSIM"', textTh: 'ตั้งชื่อว่า: "Mobile11 eSIM"', textJa: 'ラベル名：「Mobile11 eSIM」' },
    { id: 'ip4', textEn: 'Cellular Data: choose Mobile11 eSIM', textTh: 'ข้อมูลเซลลูลาร์: เลือก Mobile11 eSIM', textJa: 'モバイルデータ通信：Mobile11 eSIMを選択', note: travelStatus !== 'at-home' },
    { id: 'ip5', textEn: 'Data Roaming: ON (for Mobile11 eSIM)', textTh: 'โรมมิ่งข้อมูล: เปิด (สำหรับ Mobile11 eSIM)', textJa: 'データローミング：オン（Mobile11 eSIM用）', note: travelStatus !== 'at-home' },
    { id: 'ip6', textEn: 'Toggle Airplane Mode / Restart phone', textTh: 'เปิด-ปิดโหมดเครื่องบิน / รีสตาร์ทโทรศัพท์', textJa: '機内モードのオン/オフ / 端末を再起動' },
  ];

  const filteredSteps = steps.filter(s => s.note === undefined || s.note);
  const allCompleted = filteredSteps.every(s => isStepCompleted(s.id));

  return (
    <div className="p-4 space-y-4">
      {travelStatus === 'at-home' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          {t('chatbot.flows.installNowDontSwitch')}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          {t('chatbot.flows.iphoneStepsTitle')}
        </p>

        <div className="space-y-2">
          {filteredSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onCompleteStep(step.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                ${isStepCompleted(step.id) 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-200'
                }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${isStepCompleted(step.id) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-white'
                }`}>
                {isStepCompleted(step.id) ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`text-sm ${isStepCompleted(step.id) ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                {localizeField(step, 'text')}
              </span>
            </button>
          ))}
        </div>

        {allCompleted && (
          <button
            onClick={onComplete}
            className="w-full mt-4 py-3 bg-orange-500 text-white font-semibold rounded-lg
                       hover:bg-orange-600 transition-colors"
          >
            {t('chatbot.flows.done')}
          </button>
        )}
      </div>
    </div>
  );
}

interface AndroidStepsGuideProps extends StepsGuideProps {
  brand?: AndroidBrand;
}

function AndroidStepsGuide({ brand, travelStatus, onComplete, onCompleteStep, isStepCompleted }: AndroidStepsGuideProps) {
  const { t, localizeField } = useLanguage();
  
  const getSteps = () => {
    const baseSteps = [
      { id: 'and1', textEn: 'Settings → Network & Internet → SIMs → Add eSIM', textTh: 'ตั้งค่า → เครือข่ายและอินเทอร์เน็ต → ซิม → เพิ่ม eSIM', textJa: '設定 → ネットワークとインターネット → SIM → eSIMを追加' },
      { id: 'and2', textEn: 'Scan your QR code', textTh: 'สแกน QR Code ของคุณ', textJa: 'QRコードをスキャン' },
      { id: 'and3', textEn: 'Enable the new eSIM', textTh: 'เปิดใช้งาน eSIM ใหม่', textJa: '新しいeSIMを有効にする' },
    ];

    if (brand === 'samsung') {
      baseSteps[0] = { id: 'and1', textEn: 'Settings → Connections → SIM Manager → Add eSIM', textTh: 'ตั้งค่า → การเชื่อมต่อ → ตัวจัดการ SIM → เพิ่ม eSIM', textJa: '設定 → 接続 → SIMマネージャー → eSIMを追加' };
    }

    if (travelStatus !== 'at-home') {
      baseSteps.push(
        { id: 'and4', textEn: 'Set Mobile11 eSIM as mobile data', textTh: 'ตั้ง Mobile11 eSIM เป็นข้อมูลมือถือ', textJa: 'Mobile11 eSIMをモバイルデータに設定' },
        { id: 'and5', textEn: 'Turn on Data Roaming', textTh: 'เปิดโรมมิ่งข้อมูล', textJa: 'データローミングをオンにする' }
      );
    }

    baseSteps.push({ id: 'and6', textEn: 'Toggle Airplane Mode / Restart phone', textTh: 'เปิด-ปิดโหมดเครื่องบิน / รีสตาร์ทโทรศัพท์', textJa: '機内モードのオン/オフ / 端末を再起動' });

    return baseSteps;
  };

  const steps = getSteps();
  const allCompleted = steps.every(s => isStepCompleted(s.id));
  const brandName = brand === 'samsung' ? 'Samsung' : 'Android';

  return (
    <div className="p-4 space-y-4">
      {travelStatus === 'at-home' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          {t('chatbot.flows.installNowDontSwitch')}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          {t('chatbot.flows.androidStepsTitle').replace('{brand}', brandName)}
        </p>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onCompleteStep(step.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                ${isStepCompleted(step.id) 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-200'
                }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${isStepCompleted(step.id) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-white'
                }`}>
                {isStepCompleted(step.id) ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`text-sm ${isStepCompleted(step.id) ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                {localizeField(step, 'text')}
              </span>
            </button>
          ))}
        </div>

        {allCompleted && (
          <button
            onClick={onComplete}
            className="w-full mt-4 py-3 bg-orange-500 text-white font-semibold rounded-lg
                       hover:bg-orange-600 transition-colors"
          >
            {t('chatbot.flows.done')}
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmationStep() {
  const { t } = useLanguage();
  const [hasInternet, setHasInternet] = useState<boolean | null>(null);

  if (hasInternet === null) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-800 mb-3">
            {t('chatbot.flows.haveInternetNow')}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setHasInternet(true)}
              className="p-3 bg-green-50 border border-green-200 rounded-lg font-medium text-green-700
                         hover:bg-green-100 transition-colors"
            >
              {t('chatbot.flows.yesShort')}
            </button>
            <button
              onClick={() => setHasInternet(false)}
              className="p-3 bg-red-50 border border-red-200 rounded-lg font-medium text-red-700
                         hover:bg-red-100 transition-colors"
            >
              {t('chatbot.flows.noShort')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasInternet) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <span className="text-4xl">🎉</span>
          <p className="text-lg font-semibold text-green-800 mt-2">
            {t('chatbot.flows.allSet')}
          </p>
          <p className="text-sm text-green-600 mt-1">
            {t('chatbot.flows.esimWorking')}
          </p>
        </div>

        <div className="space-y-2">
          <button className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm
                             hover:bg-gray-50 transition-colors">
            {t('chatbot.flows.emailGuide')}
          </button>
          <button className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm
                             hover:bg-gray-50 transition-colors">
            {t('chatbot.flows.downloadGuide')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
        <p className="text-sm text-amber-800">
          {t('chatbot.flows.noWorriesTroubleshoot')}
        </p>
      </div>
      <button className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg
                         hover:bg-orange-600 transition-colors">
        {t('chatbot.flows.troubleshootBtn')}
      </button>
    </div>
  );
}
