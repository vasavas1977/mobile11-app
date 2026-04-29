import { useState } from 'react';
import { Check, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TROUBLESHOOT_SYMPTOMS, TroubleshootSymptom, UserFlowData } from './types';
import { useTroubleshootChecklist, ChecklistItem } from '@/hooks/useTroubleshootChecklist';

interface TroubleshootFlowProps {
  step: string;
  userData: UserFlowData;
  onNavigateStep: (step: string, data?: Partial<UserFlowData>) => void;
  onCompleteStep: (stepId: string) => void;
  isStepCompleted: (stepId: string) => boolean;
  onEscalate: () => void;
}

export function TroubleshootFlow({ 
  step, 
  userData, 
  onNavigateStep, 
  onCompleteStep, 
  isStepCompleted,
  onEscalate 
}: TroubleshootFlowProps) {
  switch (step) {
    case 'symptom-selection':
      return <SymptomSelectionStep onSelect={(symptom) => onNavigateStep('checklist', { symptom })} />;
    case 'checklist':
      return (
        <ChecklistStep 
          symptom={userData.symptom!}
          onComplete={() => onNavigateStep('diagnostics')}
          onCompleteStep={onCompleteStep}
          isStepCompleted={isStepCompleted}
        />
      );
    case 'diagnostics':
      return <DiagnosticsStep onSubmit={(info) => { onNavigateStep('escalation', { diagnosticInfo: info }); onEscalate(); }} />;
    case 'escalation':
      return <EscalationStep />;
    default:
      return <SymptomSelectionStep onSelect={(symptom) => onNavigateStep('checklist', { symptom })} />;
  }
}

function SymptomSelectionStep({ onSelect }: { onSelect: (symptom: TroubleshootSymptom) => void }) {
  const { t, localizeField } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-800 mb-3">
          {t('chatbot.flows.whatIssue')}
        </p>
        
        <div className="space-y-2">
          {TROUBLESHOOT_SYMPTOMS.map((symptom) => (
            <button
              key={symptom.id}
              onClick={() => onSelect(symptom.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 
                         rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all group"
            >
              <span className="font-medium text-gray-800 group-hover:text-orange-700">
                {localizeField(symptom, 'label')}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Legacy fallback checklists
function getLegacyChecklist(symptom: TroubleshootSymptom): ChecklistItem[] {
  switch (symptom) {
    case 'signal-no-data':
      return [
        { id: 'ts1', textEn: '⚠️ Turn Data Roaming ON (most common fix!)', textTh: '⚠️ เปิดโรมมิ่งข้อมูล (แก้ปัญหาได้บ่อยสุด!)', textJa: '⚠️ データローミングをオンにする（最も一般的な解決策！）' },
        { id: 'ts2', textEn: 'Set Mobile Data to Mobile11 eSIM', textTh: 'ตั้งข้อมูลเซลลูลาร์เป็น Mobile11 eSIM', textJa: 'モバイルデータをMobile11 eSIMに設定' },
        { id: 'ts3', textEn: 'Toggle Airplane Mode for 10 seconds', textTh: 'เปิด-ปิดโหมดเครื่องบิน 10 วินาที', textJa: '機内モードを10秒間オン/オフ' },
        { id: 'ts4', textEn: 'Restart your phone', textTh: 'รีสตาร์ทโทรศัพท์', textJa: '端末を再起動' },
      ];
    case 'no-signal':
      return [
        { id: 'ts1', textEn: 'Ensure Mobile11 eSIM line is enabled', textTh: 'ตรวจสอบว่าเปิดใช้งาน Mobile11 eSIM แล้ว', textJa: 'Mobile11 eSIM回線が有効か確認' },
        { id: 'ts2', textEn: 'Check if you are in coverage area', textTh: 'ตรวจสอบว่าอยู่ในพื้นที่ครอบคลุม', textJa: 'カバレッジエリア内か確認' },
        { id: 'ts3', textEn: 'Network selection → Manual → Try different carrier', textTh: 'เลือกเครือข่าย → เลือกเอง → ลองเครือข่ายอื่น', textJa: 'ネットワーク選択 → 手動 → 別のキャリアを試す' },
        { id: 'ts4', textEn: 'Restart your phone', textTh: 'รีสตาร์ทโทรศัพท์', textJa: '端末を再起動' },
      ];
    case 'slow-data':
      return [
        { id: 'ts1', textEn: 'Check remaining data balance in your order', textTh: 'ตรวจสอบปริมาณ data ที่เหลือในออเดอร์', textJa: '注文のデータ残量を確認' },
        { id: 'ts2', textEn: 'Try different network carrier manually', textTh: 'ลองเลือกเครือข่ายอื่นด้วยตัวเอง', textJa: '手動で別のキャリアを試す' },
        { id: 'ts3', textEn: 'Move to area with better signal', textTh: 'ย้ายไปบริเวณที่สัญญาณดีกว่า', textJa: '電波の良いエリアに移動' },
        { id: 'ts4', textEn: 'Toggle Airplane Mode / Restart phone', textTh: 'เปิด-ปิดโหมดเครื่องบิน / รีสตาร์ทโทรศัพท์', textJa: '機内モードのオン/オフ / 端末を再起動' },
      ];
    case 'qr-wont-install':
      return [
        { id: 'ts1', textEn: 'Connect to stable WiFi first', textTh: 'เชื่อมต่อ WiFi ที่เสถียรก่อน', textJa: 'まず安定したWiFiに接続' },
        { id: 'ts2', textEn: 'Check if phone is carrier-unlocked', textTh: 'ตรวจสอบว่าโทรศัพท์ปลดล็อคจากค่ายแล้ว', textJa: '端末がSIMロック解除済みか確認' },
        { id: 'ts3', textEn: 'Try manual install with SM-DP+ code', textTh: 'ลองติดตั้งด้วยโค้ด SM-DP+', textJa: 'SM-DP+コードで手動インストールを試す' },
        { id: 'ts4', textEn: 'Delete unused eSIMs (limit: 5-10 per device)', textTh: 'ลบ eSIM ที่ไม่ใช้ (จำกัด 5-10 ต่อเครื่อง)', textJa: '未使用のeSIMを削除（端末あたり5〜10個の制限）' },
      ];
    case 'hotspot-not-working':
      return [
        { id: 'ts1', textEn: 'Check if your plan supports hotspot', textTh: 'ตรวจสอบว่าแพ็กเกจรองรับ Hotspot', textJa: 'プランがテザリング対応か確認' },
        { id: 'ts2', textEn: 'Enable Personal Hotspot in Settings', textTh: 'เปิด Personal Hotspot ในตั้งค่า', textJa: '設定でインターネット共有を有効にする' },
        { id: 'ts3', textEn: 'Restart hotspot feature', textTh: 'ปิดแล้วเปิด Hotspot ใหม่', textJa: 'テザリング機能を再起動' },
        { id: 'ts4', textEn: 'Restart your device', textTh: 'รีสตาร์ทอุปกรณ์', textJa: '端末を再起動' },
      ];
    case 'cellular-plans-error':
      return [
        { id: 'ts1', textEn: 'Go to Settings > General > About', textTh: 'ไปที่ Settings > General > About', textJa: '設定 > 一般 > 情報 を開く' },
        { id: 'ts2', textEn: 'Check "Carrier Lock" - should say "No SIM restrictions"', textTh: 'ดู "Carrier Lock" - ควรแสดง "No SIM restrictions"', textJa: '「キャリアロック」を確認 -「SIM制限なし」と表示されるべき' },
        { id: 'ts3', textEn: 'If locked, contact your carrier to unlock', textTh: 'ถ้าล็อค ติดต่อค่ายเพื่อปลดล็อค', textJa: 'ロックされている場合、キャリアに連絡してロック解除' },
        { id: 'ts4', textEn: 'After unlocking, restart and try again', textTh: 'หลังปลดล็อค รีสตาร์ทแล้วลองใหม่', textJa: 'ロック解除後、再起動してもう一度試す' },
      ];
    case 'unable-activate-esim':
      return [
        { id: 'ts1', textEn: 'Check if eSIM is already installed in Settings > Cellular', textTh: 'ตรวจสอบว่า eSIM ติดตั้งแล้วใน Settings > Cellular', textJa: '設定 > モバイル通信 でeSIMがインストール済みか確認' },
        { id: 'ts2', textEn: 'Ensure device is connected to stable internet', textTh: 'ตรวจสอบว่าเชื่อมต่ออินเทอร์เน็ตเสถียร', textJa: '安定したインターネットに接続されているか確認' },
        { id: 'ts3', textEn: 'Restart your device', textTh: 'รีสตาร์ทอุปกรณ์', textJa: '端末を再起動' },
        { id: 'ts4', textEn: 'Update iOS to latest version', textTh: 'อัปเดต iOS เป็นเวอร์ชันล่าสุด', textJa: 'iOSを最新バージョンに更新' },
      ];
    case 'pdp-authentication-failure':
      return [
        { id: 'ts1', textEn: 'Check APN is set correctly', textTh: 'ตรวจสอบ APN ถูกต้อง', textJa: 'APNが正しく設定されているか確認' },
        { id: 'ts2', textEn: 'Verify you have remaining data on your eSIM', textTh: 'ตรวจสอบว่ายังมี data เหลืออยู่', textJa: 'eSIMにデータ残量があるか確認' },
        { id: 'ts3', textEn: 'Toggle Airplane Mode ON then OFF', textTh: 'เปิด-ปิดโหมดเครื่องบิน', textJa: '機内モードをオン→オフ' },
        { id: 'ts4', textEn: 'Reset Network Settings (last resort)*', textTh: 'รีเซ็ตการตั้งค่าเครือข่าย (วิธีสุดท้าย)*', textJa: 'ネットワーク設定をリセット（最終手段）*' },
      ];
    case 'esim-stopped-working':
      return [
        { id: 'ts1', textEn: 'Check your data balance - may be used up', textTh: 'ตรวจสอบปริมาณ data - อาจหมดแล้ว', textJa: 'データ残量を確認 — 使い切った可能性' },
        { id: 'ts2', textEn: 'Check plan validity - may have expired', textTh: 'ตรวจสอบวันหมดอายุแพ็กเกจ', textJa: 'プランの有効期限を確認 — 期限切れの可能性' },
        { id: 'ts3', textEn: 'Make sure Data Roaming is still ON', textTh: 'ตรวจสอบว่าโรมมิ่งข้อมูลยังเปิดอยู่', textJa: 'データローミングがまだオンか確認' },
        { id: 'ts4', textEn: 'Toggle Airplane Mode / Restart phone', textTh: 'เปิด-ปิดโหมดเครื่องบิน / รีสตาร์ทโทรศัพท์', textJa: '機内モードのオン/オフ / 端末を再起動' },
      ];
    default:
      return [];
  }
}

interface ChecklistStepProps {
  symptom: TroubleshootSymptom;
  onComplete: () => void;
  onCompleteStep: (stepId: string) => void;
  isStepCompleted: (stepId: string) => boolean;
}

function ChecklistStep({ symptom, onComplete, onCompleteStep, isStepCompleted }: ChecklistStepProps) {
  const { t, localizeField } = useLanguage();
  const [stillHasIssue, setStillHasIssue] = useState<boolean | null>(null);
  
  const { data: dbChecklist, isLoading } = useTroubleshootChecklist(symptom);
  
  const checklist = (dbChecklist && dbChecklist.length > 0) ? dbChecklist : getLegacyChecklist(symptom);
  const allCompleted = checklist.every(item => isStepCompleted(item.id));
  
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (stillHasIssue === true) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            {t('chatbot.flows.needMoreInfo')}
          </p>
        </div>
        <button 
          onClick={onComplete}
          className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg
                     hover:bg-orange-600 transition-colors"
        >
          {t('chatbot.flows.continueBtn')}
        </button>
      </div>
    );
  }

  if (stillHasIssue === false) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <span className="text-4xl">🎉</span>
          <p className="text-lg font-semibold text-green-800 mt-2">
            {t('chatbot.flows.great')}
          </p>
          <p className="text-sm text-green-600 mt-1">
            {t('chatbot.flows.issueResolved')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          {t('chatbot.flows.tryTheseSteps')}
        </p>

        <div className="space-y-2">
          {checklist.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onCompleteStep(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                ${isStepCompleted(item.id) 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-200'
                }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${isStepCompleted(item.id) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-white'
                }`}>
                {isStepCompleted(item.id) ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`text-sm text-left ${isStepCompleted(item.id) ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                {localizeField(item, 'text')}
              </span>
            </button>
          ))}
        </div>

        {allCompleted && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-3">
              {t('chatbot.flows.stillHaveIssues')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStillHasIssue(false)}
                className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700
                           hover:bg-green-100 transition-colors"
              >
                {t('chatbot.flows.fixed')}
              </button>
              <button
                onClick={() => setStillHasIssue(true)}
                className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium text-amber-700
                           hover:bg-amber-100 transition-colors"
              >
                {t('chatbot.flows.stillBroken')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DiagnosticInfo {
  country?: string;
  city?: string;
  deviceModel?: string;
  osVersion?: string;
  orderEmail?: string;
  orderId?: string;
}

function DiagnosticsStep({ onSubmit }: { onSubmit: (info: DiagnosticInfo) => void }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<DiagnosticInfo>({});

  const handleSubmit = () => {
    if (formData.orderEmail || formData.orderId) {
      onSubmit(formData);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          {t('chatbot.flows.provideInfo')}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('chatbot.flows.countryCity')}
            </label>
            <input
              type="text"
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('chatbot.flows.deviceModel')}
            </label>
            <input
              type="text"
              value={formData.deviceModel || ''}
              onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
              placeholder="e.g. iPhone 15 Pro, Samsung S24"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('chatbot.flows.orderEmailLabel')}
            </label>
            <input
              type="email"
              value={formData.orderEmail || ''}
              onChange={(e) => setFormData({ ...formData, orderEmail: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('chatbot.flows.orderIdOptional')}
            </label>
            <input
              type="text"
              value={formData.orderId || ''}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 
                       border border-gray-200 rounded-lg text-sm text-gray-600
                       hover:bg-gray-200 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {t('chatbot.flows.uploadScreenshot')}
          </button>

          <button
            onClick={handleSubmit}
            disabled={!formData.orderEmail && !formData.orderId}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg
                       hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-colors"
          >
            {t('chatbot.flows.submitInfo')}
          </button>
        </div>
      </div>
    </div>
  );
}

function EscalationStep() {
  const { t } = useLanguage();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
        <span className="text-3xl">👩‍💻</span>
        <p className="text-sm font-semibold text-blue-800 mt-2">
          {t('chatbot.flows.connectingSupport')}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {t('chatbot.flows.agentResponse')}
        </p>
      </div>
    </div>
  );
}
