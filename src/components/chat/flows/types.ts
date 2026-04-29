// Chatbot Flow Types - State Machine for Multi-Step Flows
// Aligned with Mobile11 Support Page, FAQ, and Package terminology
import { DeviceBrandKey } from '@/constants/compatibleDevices';

export type FlowType = 
  | 'home'
  | 'buy-esim'
  | 'install'
  | 'troubleshoot'
  | 'topup'
  | 'find-order'
  | 'compatibility-check'
  | 'billing-help'
  | 'talk-to-support';

export type BuyEsimStep = 
  | 'destination'
  | 'trip-length'
  | 'data-usage'
  | 'service-tier'
  | 'device'
  | 'android-brand-check'
  | 'recommendations'
  | 'checkout-guardrails'
  | 'post-purchase';

export type InstallStep =
  | 'device-selection'
  | 'install-method'
  | 'travel-status'
  | 'iphone-steps'
  | 'android-brand'
  | 'android-steps'
  | 'confirmation';

export type TroubleshootStep =
  | 'symptom-selection'
  | 'checklist'
  | 'diagnostics'
  | 'escalation';

export type TroubleshootSymptom =
  | 'no-signal'
  | 'signal-no-data'
  | 'slow-data'
  | 'qr-wont-install'
  | 'hotspot-not-working'
  | 'cellular-plans-error'
  | 'unable-activate-esim'
  | 'pdp-authentication-failure'
  | 'esim-stopped-working';

export type PurchaseReason = 'first-time' | 'cost-saving' | 'unlimited-data' | 'better-quality' | 'other';
export type DataUsageType = 'light' | 'medium' | 'heavy';
export type DeviceType = 'iphone' | 'android' | 'not-sure';
export type TravelStatus = 'at-home' | 'just-landed' | 'travelling';
export type AndroidBrand = 'samsung' | 'pixel' | 'xiaomi' | 'huawei' | 'other';
export type InstallMethod = 'scan-qr' | 'manual-code' | 'already-installed';

// User data collected during flows
export interface UserFlowData {
  // Conversation flow
  userName?: string;
  hasUsedEsim?: 'yes' | 'no' | 'not-sure';
  purchaseReason?: PurchaseReason;
  purchaseReasonOther?: string;
  
  // Buy eSIM
  destination?: string;
  tripDays?: number;
  dataUsage?: DataUsageType;
  serviceTierPreference?: 'quality' | 'price';
  device?: DeviceType;
  selectedPackageId?: string;
  email?: string;
  
  // Install
  installMethod?: InstallMethod;
  travelStatus?: TravelStatus;
  androidBrand?: AndroidBrand;
  completedSteps?: string[];
  
  // Troubleshoot
  symptom?: TroubleshootSymptom;
  troubleshootChecklist?: Record<string, boolean>;
  diagnosticInfo?: {
    country?: string;
    city?: string;
    deviceModel?: string;
    osVersion?: string;
    orderEmail?: string;
    orderId?: string;
    screenshot?: string;
  };
  
  // Order lookup
  orderEmail?: string;
  orderId?: string;
  
  // Packages for recommendations
  recommendedPackages?: PackageRecommendation[];
  
  // Compatibility check
  isCompatible?: boolean;
  selectedBrand?: DeviceBrandKey;
}

// Package tier types aligned with website terminology
export type PackageTierType = 'limitless' | 'max-speed' | 'day-pass' | 'standard';

export interface PackageRecommendation {
  id: string;
  name: string;
  dataAmount: string;
  validityDays: number;
  price: number;
  currency: string;
  packageType: string;
  packageTier?: PackageTierType;
  tierDescription?: string;
  is5G?: boolean;
  hotspotAllowed?: boolean;
  highlight?: 'best-value' | 'limitless' | 'budget';
  isRegionalPackage?: boolean;
  coveredCountries?: number;
  regionalPlanName?: string;
}

export interface FlowState {
  currentFlow: FlowType;
  currentStep: string | null;
  previousFlow: FlowType | null;
  previousStep: string | null;
  userData: UserFlowData;
  history: { flow: FlowType; step: string | null }[];
}

export interface FlowAction {
  type: 'navigate' | 'back' | 'start-over' | 'update-data' | 'complete-step';
  payload?: {
    flow?: FlowType;
    step?: string;
    data?: Partial<UserFlowData>;
    stepId?: string;
  };
}

// Chat message type for the new flow system
export interface ChatFlowMessage {
  id: string;
  type: 'bot' | 'user' | 'system';
  content?: string;
  component?: 'quick-actions' | 'destination-search' | 'chips' | 'plan-cards' | 
              'device-buttons' | 'checklist' | 'diagnostic-form' | 'order-result';
  componentProps?: Record<string, any>;
  timestamp: Date;
}

// Quick action buttons for home screen
export interface QuickAction {
  id: string;
  icon: string;
  labelEn: string;
  labelTh: string;
  labelJa: string;
  labelKo: string;
  labelFr: string;
  labelDe: string;
  labelEs: string;
  labelPt: string;
  labelAr: string;
  flow: FlowType;
}

export const HOME_QUICK_ACTIONS: QuickAction[] = [
  { id: 'buy', icon: '🛒', labelEn: 'Sales', labelTh: 'ฝ่ายขาย', labelJa: '購入', labelKo: '구매', labelFr: 'Ventes', labelDe: 'Verkauf', labelEs: 'Ventas', labelPt: 'Vendas', labelAr: 'المبيعات', flow: 'buy-esim' },
  { id: 'support', icon: '👩‍💻', labelEn: 'Support', labelTh: 'ฝ่ายช่วยเหลือ', labelJa: 'サポート', labelKo: '고객지원', labelFr: 'Assistance', labelDe: 'Support', labelEs: 'Soporte', labelPt: 'Suporte', labelAr: 'الدعم', flow: 'talk-to-support' },
];

// Popular destinations for quick selection
export const POPULAR_DESTINATIONS = [
  { code: 'JP', nameEn: 'Japan', nameTh: 'ญี่ปุ่น', nameJa: '日本', nameKo: '일본', nameFr: 'Japon', nameDe: 'Japan', nameEs: 'Japón', namePt: 'Japão', nameAr: 'اليابان', emoji: '🇯🇵' },
  { code: 'KR', nameEn: 'South Korea', nameTh: 'เกาหลีใต้', nameJa: '韓国', nameKo: '한국', nameFr: 'Corée du Sud', nameDe: 'Südkorea', nameEs: 'Corea del Sur', namePt: 'Coreia do Sul', nameAr: 'كوريا الجنوبية', emoji: '🇰🇷' },
  { code: 'EU', nameEn: 'Europe', nameTh: 'ยุโรป', nameJa: 'ヨーロッパ', nameKo: '유럽', nameFr: 'Europe', nameDe: 'Europa', nameEs: 'Europa', namePt: 'Europa', nameAr: 'أوروبا', emoji: '🇪🇺' },
  { code: 'US', nameEn: 'USA', nameTh: 'อเมริกา', nameJa: 'アメリカ', nameKo: '미국', nameFr: 'États-Unis', nameDe: 'USA', nameEs: 'EE.UU.', namePt: 'EUA', nameAr: 'الولايات المتحدة', emoji: '🇺🇸' },
  { code: 'CN', nameEn: 'China', nameTh: 'จีน', nameJa: '中国', nameKo: '중국', nameFr: 'Chine', nameDe: 'China', nameEs: 'China', namePt: 'China', nameAr: 'الصين', emoji: '🇨🇳' },
  { code: 'TH', nameEn: 'Thailand', nameTh: 'ไทย', nameJa: 'タイ', nameKo: '태국', nameFr: 'Thaïlande', nameDe: 'Thailand', nameEs: 'Tailandia', namePt: 'Tailândia', nameAr: 'تايلاند', emoji: '🇹🇭' },
  { code: 'SG', nameEn: 'Singapore', nameTh: 'สิงคโปร์', nameJa: 'シンガポール', nameKo: '싱가포르', nameFr: 'Singapour', nameDe: 'Singapur', nameEs: 'Singapur', namePt: 'Singapura', nameAr: 'سنغافورة', emoji: '🇸🇬' },
  { code: 'TW', nameEn: 'Taiwan', nameTh: 'ไต้หวัน', nameJa: '台湾', nameKo: '대만', nameFr: 'Taïwan', nameDe: 'Taiwan', nameEs: 'Taiwán', namePt: 'Taiwan', nameAr: 'تايوان', emoji: '🇹🇼' },
];

// Trip length options
export const TRIP_LENGTH_OPTIONS = [3, 5, 7, 10, 15, 30];

// Data usage options
export const DATA_USAGE_OPTIONS: { id: DataUsageType; labelEn: string; labelTh: string; labelJa: string; labelKo: string; labelFr: string; labelDe: string; labelEs: string; labelPt: string; labelAr: string; descEn: string; descTh: string; descJa: string; descKo: string; descFr: string; descDe: string; descEs: string; descPt: string; descAr: string }[] = [
  { id: 'light', labelEn: 'Light', labelTh: 'น้อย', labelJa: '軽量', labelKo: '가벼움', labelFr: 'Léger', labelDe: 'Leicht', labelEs: 'Ligero', labelPt: 'Leve', labelAr: 'خفيف', descEn: 'Maps/Chat', descTh: 'แผนที่/แชท', descJa: '地図/チャット', descKo: '지도/채팅', descFr: 'Cartes/Chat', descDe: 'Karten/Chat', descEs: 'Mapas/Chat', descPt: 'Mapas/Chat', descAr: 'خرائط/دردشة' },
  { id: 'medium', labelEn: 'Medium', labelTh: 'ปานกลาง', labelJa: '中程度', labelKo: '보통', labelFr: 'Moyen', labelDe: 'Mittel', labelEs: 'Medio', labelPt: 'Médio', labelAr: 'متوسط', descEn: 'Social', descTh: 'โซเชียล', descJa: 'SNS', descKo: 'SNS', descFr: 'Réseaux sociaux', descDe: 'Soziale Medien', descEs: 'Redes sociales', descPt: 'Redes sociais', descAr: 'وسائل التواصل' },
  { id: 'heavy', labelEn: 'Heavy', labelTh: 'มาก', labelJa: '大量', labelKo: '많음', labelFr: 'Intensif', labelDe: 'Intensiv', labelEs: 'Intenso', labelPt: 'Intenso', labelAr: 'مكثف', descEn: 'Work/Video', descTh: 'ทำงาน/วิดีโอ', descJa: '仕事/動画', descKo: '업무/영상', descFr: 'Travail/Vidéo', descDe: 'Arbeit/Video', descEs: 'Trabajo/Video', descPt: 'Trabalho/Vídeo', descAr: 'عمل/فيديو' },
];

// Troubleshoot symptoms
export const TROUBLESHOOT_SYMPTOMS: { id: TroubleshootSymptom; labelEn: string; labelTh: string; labelJa: string; labelKo: string; labelFr: string; labelDe: string; labelEs: string; labelPt: string; labelAr: string }[] = [
  { id: 'no-signal', labelEn: 'No signal', labelTh: 'ไม่มีสัญญาณ', labelJa: '電波がない', labelKo: '신호 없음', labelFr: 'Pas de signal', labelDe: 'Kein Signal', labelEs: 'Sin señal', labelPt: 'Sem sinal', labelAr: 'لا توجد إشارة' },
  { id: 'signal-no-data', labelEn: 'Signal but no data', labelTh: 'มีสัญญาณแต่ไม่มีเน็ต', labelJa: '電波はあるがデータなし', labelKo: '신호는 있지만 데이터 없음', labelFr: 'Signal mais pas de données', labelDe: 'Signal aber keine Daten', labelEs: 'Señal pero sin datos', labelPt: 'Sinal mas sem dados', labelAr: 'إشارة بدون بيانات' },
  { id: 'slow-data', labelEn: 'Slow data', labelTh: 'เน็ตช้า', labelJa: 'データ速度が遅い', labelKo: '느린 데이터', labelFr: 'Données lentes', labelDe: 'Langsame Daten', labelEs: 'Datos lentos', labelPt: 'Dados lentos', labelAr: 'بيانات بطيئة' },
  { id: 'qr-wont-install', labelEn: "QR won't install", labelTh: 'สแกน QR ไม่ได้', labelJa: 'QRがインストールできない', labelKo: 'QR 설치 안 됨', labelFr: 'Le QR ne s\'installe pas', labelDe: 'QR lässt sich nicht installieren', labelEs: 'El QR no se instala', labelPt: 'O QR não instala', labelAr: 'رمز QR لا يعمل' },
  { id: 'hotspot-not-working', labelEn: 'Hotspot not working', labelTh: 'ฮอตสปอตใช้ไม่ได้', labelJa: 'テザリングが動作しない', labelKo: '핫스팟 작동 안 함', labelFr: 'Le partage de connexion ne fonctionne pas', labelDe: 'Hotspot funktioniert nicht', labelEs: 'El hotspot no funciona', labelPt: 'Hotspot não funciona', labelAr: 'نقطة الاتصال لا تعمل' },
  { id: 'cellular-plans-error', labelEn: '"Cellular Plans Cannot Be Added" error', labelTh: 'ข้อผิดพลาด "Cellular Plans Cannot Be Added"', labelJa: '「Cellular Plans Cannot Be Added」エラー', labelKo: '"Cellular Plans Cannot Be Added" 오류', labelFr: 'Erreur "Cellular Plans Cannot Be Added"', labelDe: 'Fehler "Cellular Plans Cannot Be Added"', labelEs: 'Error "Cellular Plans Cannot Be Added"', labelPt: 'Erro "Cellular Plans Cannot Be Added"', labelAr: 'خطأ "Cellular Plans Cannot Be Added"' },
  { id: 'unable-activate-esim', labelEn: '"Unable to Activate eSIM" error', labelTh: 'ข้อผิดพลาด "Unable to Activate eSIM"', labelJa: '「Unable to Activate eSIM」エラー', labelKo: '"Unable to Activate eSIM" 오류', labelFr: 'Erreur "Unable to Activate eSIM"', labelDe: 'Fehler "Unable to Activate eSIM"', labelEs: 'Error "Unable to Activate eSIM"', labelPt: 'Erro "Unable to Activate eSIM"', labelAr: 'خطأ "Unable to Activate eSIM"' },
  { id: 'pdp-authentication-failure', labelEn: '"PDP Authentication Failure" error', labelTh: 'ข้อผิดพลาด "PDP Authentication Failure"', labelJa: '「PDP Authentication Failure」エラー', labelKo: '"PDP Authentication Failure" 오류', labelFr: 'Erreur "PDP Authentication Failure"', labelDe: 'Fehler "PDP Authentication Failure"', labelEs: 'Error "PDP Authentication Failure"', labelPt: 'Erro "PDP Authentication Failure"', labelAr: 'خطأ "PDP Authentication Failure"' },
  { id: 'esim-stopped-working', labelEn: 'eSIM was working, now it isn\'t', labelTh: 'eSIM เคยใช้ได้ แต่ตอนนี้ใช้ไม่ได้', labelJa: 'eSIMが動作しなくなった', labelKo: 'eSIM이 작동하다가 멈춤', labelFr: 'L\'eSIM fonctionnait, mais plus maintenant', labelDe: 'eSIM funktionierte, jetzt nicht mehr', labelEs: 'El eSIM funcionaba, ahora no', labelPt: 'O eSIM funcionava, agora não', labelAr: 'كانت eSIM تعمل والآن لا تعمل' },
];

// Install methods
export const INSTALL_METHODS: { id: InstallMethod; labelEn: string; labelTh: string; labelJa: string; labelKo: string; labelFr: string; labelDe: string; labelEs: string; labelPt: string; labelAr: string }[] = [
  { id: 'scan-qr', labelEn: 'Scan QR', labelTh: 'สแกน QR', labelJa: 'QRスキャン', labelKo: 'QR 스캔', labelFr: 'Scanner le QR', labelDe: 'QR scannen', labelEs: 'Escanear QR', labelPt: 'Escanear QR', labelAr: 'مسح رمز QR' },
  { id: 'manual-code', labelEn: 'Manual code (SM-DP+)', labelTh: 'ใส่โค้ดเอง (SM-DP+)', labelJa: '手動コード（SM-DP+）', labelKo: '수동 코드 (SM-DP+)', labelFr: 'Code manuel (SM-DP+)', labelDe: 'Manueller Code (SM-DP+)', labelEs: 'Código manual (SM-DP+)', labelPt: 'Código manual (SM-DP+)', labelAr: 'رمز يدوي (SM-DP+)' },
  { id: 'already-installed', labelEn: 'I already installed', labelTh: 'ติดตั้งแล้ว', labelJa: 'インストール済み', labelKo: '이미 설치함', labelFr: 'Déjà installé', labelDe: 'Bereits installiert', labelEs: 'Ya lo instalé', labelPt: 'Já instalei', labelAr: 'تم التثبيت بالفعل' },
];

// Travel status options
export const TRAVEL_STATUS_OPTIONS: { id: TravelStatus; labelEn: string; labelTh: string; labelJa: string; labelKo: string; labelFr: string; labelDe: string; labelEs: string; labelPt: string; labelAr: string }[] = [
  { id: 'at-home', labelEn: "I'm still at home", labelTh: 'ยังอยู่บ้าน', labelJa: 'まだ自宅です', labelKo: '아직 집에 있어요', labelFr: 'Je suis encore chez moi', labelDe: 'Ich bin noch zu Hause', labelEs: 'Todavía estoy en casa', labelPt: 'Ainda estou em casa', labelAr: 'ما زلت في المنزل' },
  { id: 'just-landed', labelEn: 'I just landed', labelTh: 'เพิ่งลงเครื่อง', labelJa: '到着したところです', labelKo: '방금 도착했어요', labelFr: 'Je viens d\'atterrir', labelDe: 'Ich bin gerade gelandet', labelEs: 'Acabo de aterrizar', labelPt: 'Acabei de pousar', labelAr: 'وصلت للتو' },
  { id: 'travelling', labelEn: "I'm already travelling", labelTh: 'กำลังเดินทางอยู่', labelJa: 'すでに旅行中です', labelKo: '이미 여행 중이에요', labelFr: 'Je voyage déjà', labelDe: 'Ich bin bereits unterwegs', labelEs: 'Ya estoy viajando', labelPt: 'Já estou viajando', labelAr: 'أنا في رحلة بالفعل' },
];

// Android brand options with warnings for problematic brands
export const ANDROID_BRAND_OPTIONS: { id: AndroidBrand; labelEn: string; labelTh: string; labelJa: string; labelKo: string; labelFr: string; labelDe: string; labelEs: string; labelPt: string; labelAr: string; hasWarning?: boolean }[] = [
  { id: 'samsung', labelEn: 'Samsung', labelTh: 'Samsung', labelJa: 'Samsung', labelKo: '삼성', labelFr: 'Samsung', labelDe: 'Samsung', labelEs: 'Samsung', labelPt: 'Samsung', labelAr: 'سامسونج' },
  { id: 'pixel', labelEn: 'Google Pixel', labelTh: 'Google Pixel', labelJa: 'Google Pixel', labelKo: 'Google Pixel', labelFr: 'Google Pixel', labelDe: 'Google Pixel', labelEs: 'Google Pixel', labelPt: 'Google Pixel', labelAr: 'Google Pixel' },
  { id: 'xiaomi', labelEn: 'Xiaomi / Redmi', labelTh: 'Xiaomi / Redmi', labelJa: 'Xiaomi / Redmi', labelKo: 'Xiaomi / Redmi', labelFr: 'Xiaomi / Redmi', labelDe: 'Xiaomi / Redmi', labelEs: 'Xiaomi / Redmi', labelPt: 'Xiaomi / Redmi', labelAr: 'Xiaomi / Redmi', hasWarning: true },
  { id: 'huawei', labelEn: 'Huawei', labelTh: 'Huawei', labelJa: 'Huawei', labelKo: 'Huawei', labelFr: 'Huawei', labelDe: 'Huawei', labelEs: 'Huawei', labelPt: 'Huawei', labelAr: 'هواوي', hasWarning: true },
  { id: 'other', labelEn: 'Other Android', labelTh: 'Android อื่นๆ', labelJa: 'その他のAndroid', labelKo: '기타 Android', labelFr: 'Autre Android', labelDe: 'Anderes Android', labelEs: 'Otro Android', labelPt: 'Outro Android', labelAr: 'أندرويد آخر' },
];

// Mapping from UI symptom IDs to kb_articles slugs
export const SYMPTOM_TO_KB_SLUG: Record<TroubleshootSymptom, string> = {
  'signal-no-data': 'esim-showing-4g-5g-no-internet',
  'no-signal': 'no-signal-esim',
  'slow-data': 'slow-internet-speed',
  'qr-wont-install': 'cant-scan-qr-code',
  'hotspot-not-working': 'hotspot-not-working',
  'cellular-plans-error': 'cellular-plans-cannot-be-added',
  'unable-activate-esim': 'esim-not-activating',
  'pdp-authentication-failure': 'pdp-authentication-failure',
  'esim-stopped-working': 'esim-not-working',
};
