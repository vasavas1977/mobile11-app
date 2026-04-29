import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Smartphone, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DeviceInfoFormProps {
  imei2: string;
  eid2: string;
  onImei2Change: (value: string) => void;
  onEid2Change: (value: string) => void;
}

const SUPPORTED_DEVICES = {
  ios: 'All iPhones with eSIM support (iPhone XS and later)',
  pixel: [
    'Pixel 9 Pro Fold', 'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9',
    'Pixel 8a', 'Pixel 8 Pro', 'Pixel 8',
    'Pixel Fold', 'Pixel 7a', 'Pixel 7 Pro', 'Pixel 7',
    'Pixel 6a', 'Pixel 6 Pro 5G', 'Pixel 6 5G',
    'Pixel 4a 5G', 'Pixel 4 XL', 'Pixel 4',
  ],
  samsung: [
    'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25',
    'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S24 FE',
    'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
    'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
    'Galaxy S21 Ultra 5G', 'Galaxy S21+ 5G', 'Galaxy S21 5G',
    'Galaxy Z Fold6', 'Galaxy Z Fold5', 'Galaxy Z Fold4',
    'Galaxy Z Flip6', 'Galaxy Z Flip5', 'Galaxy Z Flip4',
    'Galaxy Note20 Ultra 5G', 'Galaxy Note20 5G',
    'Galaxy A54 5G', 'Galaxy A35 5G', 'Galaxy A16 5G',
    'Galaxy Tab S10+ 5G', 'Galaxy Tab S9 FE 5G',
  ],
  motorola: [
    'moto g power 2025', 'moto g 2025',
    'razr 2024', 'razr+ 2024', 'edge 2024',
    'moto g stylus 5G 2024', 'moto g power 5G 2024', 'moto g 5G 2024',
    'razr 2023', 'razr+ 2023', 'moto g STYLUS 5G 2023',
    'razr 5G',
  ],
};

const texts = {
  en: {
    title: 'Device Information Required',
    subtitle: 'T-Mobile USA eSIM requires your device identifiers',
    imei2Label: 'IMEI2 (15 digits)',
    imei2Placeholder: 'Enter 15-digit IMEI2',
    eid2Label: 'EID2 (32 characters)',
    eid2Placeholder: 'Enter 32-character EID2',
    imei2Error: 'IMEI2 must be exactly 15 digits',
    eid2Error: 'EID2 must be exactly 32 hexadecimal characters',
    imei2Hint: 'Find in Settings → About Phone → IMEI2',
    eid2Hint: 'Find in Settings → About Phone → EID',
    supportedDevices: 'Supported Devices',
    iosDevices: 'iOS',
    pixelDevices: 'Google Pixel',
    samsungDevices: 'Samsung Galaxy',
    motorolaDevices: 'Motorola',
  },
  th: {
    title: 'ต้องกรอกข้อมูลอุปกรณ์',
    subtitle: 'eSIM T-Mobile USA ต้องใช้ข้อมูลอุปกรณ์ของคุณ',
    imei2Label: 'IMEI2 (15 หลัก)',
    imei2Placeholder: 'กรอก IMEI2 15 หลัก',
    eid2Label: 'EID2 (32 ตัวอักษร)',
    eid2Placeholder: 'กรอก EID2 32 ตัวอักษร',
    imei2Error: 'IMEI2 ต้องเป็นตัวเลข 15 หลัก',
    eid2Error: 'EID2 ต้องเป็นตัวอักษร hex 32 ตัว',
    imei2Hint: 'ดูได้ที่ ตั้งค่า → เกี่ยวกับโทรศัพท์ → IMEI2',
    eid2Hint: 'ดูได้ที่ ตั้งค่า → เกี่ยวกับโทรศัพท์ → EID',
    supportedDevices: 'อุปกรณ์ที่รองรับ',
    iosDevices: 'iOS',
    pixelDevices: 'Google Pixel',
    samsungDevices: 'Samsung Galaxy',
    motorolaDevices: 'Motorola',
  },
};

export function DeviceInfoForm({ imei2, eid2, onImei2Change, onEid2Change }: DeviceInfoFormProps) {
  const { language } = useLanguage();
  const t = texts[language];
  const [touched, setTouched] = useState({ imei2: false, eid2: false });

  const imei2Valid = /^\d{15}$/.test(imei2);
  const eid2Valid = /^[0-9a-fA-F]{32}$/.test(eid2);

  return (
    <div className="bg-[#FAF7F2] rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900 text-sm">{t.title}</h3>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 bg-orange-50/50 border border-orange-200 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-700">{t.subtitle}</p>
      </div>

      {/* IMEI2 Input */}
      <div className="space-y-1.5">
        <Label htmlFor="imei2" className="text-sm font-medium text-gray-900">{t.imei2Label}</Label>
        <Input
          id="imei2"
          value={imei2}
          onChange={(e) => onImei2Change(e.target.value.replace(/\D/g, '').slice(0, 15))}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 15);
            onImei2Change(pasted);
          }}
          onBlur={() => setTouched(prev => ({ ...prev, imei2: true }))}
          placeholder={t.imei2Placeholder}
          inputMode="numeric"
          className="bg-white border-gray-200 text-gray-900"
        />
        <p className="text-xs text-gray-500">{t.imei2Hint}</p>
        {touched.imei2 && imei2.length > 0 && !imei2Valid && (
          <p className="text-xs text-red-500">{t.imei2Error}</p>
        )}
      </div>

      {/* EID2 Input */}
      <div className="space-y-1.5">
        <Label htmlFor="eid2" className="text-sm font-medium text-gray-900">{t.eid2Label}</Label>
        <Input
          id="eid2"
          value={eid2}
          onChange={(e) => onEid2Change(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 32))}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/[^0-9a-fA-F]/g, '').slice(0, 32);
            onEid2Change(pasted);
          }}
          onBlur={() => setTouched(prev => ({ ...prev, eid2: true }))}
          placeholder={t.eid2Placeholder}
          inputMode="text"
          className="bg-white border-gray-200 text-gray-900"
        />
        <p className="text-xs text-gray-500">{t.eid2Hint}</p>
        {touched.eid2 && eid2.length > 0 && !eid2Valid && (
          <p className="text-xs text-red-500">{t.eid2Error}</p>
        )}
      </div>

      {/* Supported Devices */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 w-full">
          <Smartphone className="w-4 h-4" />
          <span className="underline">{t.supportedDevices}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
            {/* iOS */}
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">{t.iosDevices}</p>
              <p className="text-xs text-gray-600">{SUPPORTED_DEVICES.ios}</p>
            </div>
            {/* Pixel */}
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">{t.pixelDevices}</p>
              <div className="flex flex-wrap gap-1">
                {SUPPORTED_DEVICES.pixel.map((d) => (
                  <span key={d} className="text-xs bg-[#FAF7F2] border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            </div>
            {/* Samsung */}
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">{t.samsungDevices}</p>
              <div className="flex flex-wrap gap-1">
                {SUPPORTED_DEVICES.samsung.map((d) => (
                  <span key={d} className="text-xs bg-[#FAF7F2] border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            </div>
            {/* Motorola */}
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">{t.motorolaDevices}</p>
              <div className="flex flex-wrap gap-1">
                {SUPPORTED_DEVICES.motorola.map((d) => (
                  <span key={d} className="text-xs bg-[#FAF7F2] border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
