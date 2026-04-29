import { useLanguage } from '@/contexts/LanguageContext';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { OperatorSimCard } from '@/components/my-esims/OperatorSimCard';
import { CarrierStarRating } from '@/components/esim/CarrierStarRating';
import { getBestCarrierFirst } from '@/lib/carrierRatings';
import { Check, Smartphone, ShieldAlert, Phone, Info, Globe } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompatibilityCheckDialog } from '@/components/esim/CompatibilityCheckDialog';

const UNLIMITED_CALL_COUNTRIES = [
  'Argentina', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'France', 'Germany', 'Guam', 'Hong Kong', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Ireland', 'Japan', 'Malaysia', 'Malta',
  'Mexico', 'New Zealand', 'Norway', 'Peru', 'Philippines',
  'Puerto Rico', 'Romania', 'Singapore', 'Slovenia', 'South Korea',
  'Sweden', 'Taiwan', 'Thailand', 'Ukraine', 'United Kingdom',
  'United States', 'Venezuela',
];

// Country-specific package notes
const COUNTRY_PACKAGE_NOTES: Record<string, { en: string[]; th: string[]; ja?: string[]; zh?: string[]; ko?: string[]; fr?: string[]; de?: string[]; es?: string[]; pt?: string[]; ar?: string[] }> = {
  'China:CMCC (TT&GPT)': {
    en: ['Guaranteed to support all social media including TikTok and ChatGPT'],
    th: ['รับประกันการใช้งานโซเชียลมีเดียทั้งหมด รวมถึง TikTok และ ChatGPT'],
    ja: ['TikTokやChatGPTを含むすべてのSNSに対応保証'],
    zh: ['保证支持所有社交媒体，包括TikTok和ChatGPT'],
    ko: ['TikTok 및 ChatGPT를 포함한 모든 소셜 미디어 지원 보장'],
    fr: ['Accès garanti à tous les réseaux sociaux, y compris TikTok et ChatGPT'],
    de: ['Garantierter Zugang zu allen sozialen Medien, einschließlich TikTok und ChatGPT'],
    es: ['Acceso garantizado a todas las redes sociales, incluyendo TikTok y ChatGPT'],
    pt: ['Acesso garantido a todas as redes sociais, incluindo TikTok e ChatGPT'],
    ar: ['وصول مضمون لجميع وسائل التواصل الاجتماعي بما في ذلك TikTok وChatGPT'],
  },
  'China:CMCC': {
    en: ['Does not guarantee access to TikTok and ChatGPT'],
    th: ['ไม่รับประกันการใช้งาน TikTok และ ChatGPT'],
    ja: ['TikTokおよびChatGPTへのアクセスは保証対象外'],
    zh: ['不保证可以访问TikTok和ChatGPT'],
    ko: ['TikTok 및 ChatGPT 접속을 보장하지 않습니다'],
    fr: ['L\'accès à TikTok et ChatGPT n\'est pas garanti'],
    de: ['Der Zugang zu TikTok und ChatGPT ist nicht garantiert'],
    es: ['No se garantiza el acceso a TikTok y ChatGPT'],
    pt: ['O acesso ao TikTok e ChatGPT não é garantido'],
    ar: ['لا يضمن الوصول إلى TikTok وChatGPT'],
  },
  'Maldives': {
    en: [
      'Includes a local phone number with calling credit for local calls',
      'Supports 150 mins local calls (same operator) & 150 SMS',
      'Dial *200# to check data, calls, and texts usage',
    ],
    th: [
      'มาพร้อมเบอร์โทรศัพท์ท้องถิ่นและเครดิตโทรสำหรับโทรในประเทศ',
      'รองรับโทรในประเทศ 150 นาที (เครือข่ายเดียวกัน) และ SMS 150 ข้อความ',
      'กด *200# เพื่อเช็คการใช้งานข้อมูล, โทร และ SMS',
    ],
    ja: [
      '現地電話番号と国内通話クレジットが付属',
      '同一キャリア内150分の国内通話と150通のSMSに対応',
      '*200# でデータ・通話・SMSの利用状況を確認',
    ],
    zh: [
      '包含当地电话号码和本地通话信用额度',
      '支持150分钟本地通话（同运营商）和150条短信',
      '拨打 *200# 查看数据、通话和短信使用情况',
    ],
    ko: [
      '현지 전화번호 및 현지 통화 크레딧 포함',
      '150분 현지 통화(동일 통신사) 및 150건 문자 지원',
      '*200# 으로 데이터, 통화, 문자 사용량 확인',
    ],
    fr: [
      'Inclut un numéro local avec crédit d\'appel pour les appels locaux',
      'Prend en charge 150 min d\'appels locaux (même opérateur) et 150 SMS',
      'Composez *200# pour vérifier l\'utilisation des données, appels et SMS',
    ],
    de: [
      'Enthält eine lokale Telefonnummer mit Guthaben für Ortsgespräche',
      'Unterstützt 150 Min. Ortsgespräche (gleicher Anbieter) & 150 SMS',
      'Wählen Sie *200# um Daten-, Anruf- und SMS-Nutzung zu prüfen',
    ],
    es: [
      'Incluye un número local con crédito para llamadas locales',
      'Soporta 150 min de llamadas locales (mismo operador) y 150 SMS',
      'Marca *200# para consultar el uso de datos, llamadas y SMS',
    ],
    pt: [
      'Inclui número local com crédito para chamadas locais',
      'Suporta 150 min de chamadas locais (mesma operadora) e 150 SMS',
      'Disque *200# para verificar o uso de dados, chamadas e SMS',
    ],
    ar: [
      'يتضمن رقم هاتف محلي مع رصيد للمكالمات المحلية',
      'يدعم 150 دقيقة مكالمات محلية (نفس المشغل) و 150 رسالة نصية',
      'اطلب *200# للتحقق من استخدام البيانات والمكالمات والرسائل',
    ],
  },
  'Australia:Vodafone': {
    en: ['QR code supports one-time download only — save it carefully'],
    th: ['QR code ดาวน์โหลดได้ครั้งเดียวเท่านั้น — กรุณาบันทึกไว้ให้ดี'],
    ja: ['QRコードは1回のみダウンロード可能 — 大切に保存してください'],
    zh: ['QR码仅支持一次下载 — 请妥善保存'],
    ko: ['QR 코드는 1회만 다운로드 가능 — 신중하게 저장하세요'],
    fr: ['Le code QR ne peut être téléchargé qu\'une seule fois — conservez-le précieusement'],
    de: ['QR-Code kann nur einmal heruntergeladen werden — bitte sorgfältig aufbewahren'],
    es: ['El código QR solo se puede descargar una vez — guárdelo con cuidado'],
    pt: ['O código QR suporta apenas um download — salve-o com cuidado'],
    ar: ['رمز QR يدعم التنزيل مرة واحدة فقط — احفظه بعناية'],
  },
  'USA:T-Mobile': {
    en: [
      'Unlimited data & speed on primary device',
      'Hotspot sharing limited to 3 GB at designated speed',
      'Unlimited text messages and calls',
      'Only local US phone numbers can call this number',
      'Must be ordered at least 6 days in advance',
      'Activates at 12:00 PM New York time',
      'Requires IMEI2 and EID2 at checkout',
      'Supports iOS and select Android devices (Pixel, Galaxy, Motorola)',
      'No cancellation after activation',
    ],
    th: [
      'เน็ตไม่อั้นไม่จำกัดความเร็วบนอุปกรณ์หลัก',
      'แชร์ฮอตสปอตได้สูงสุด 3 GB ที่ความเร็วกำหนด',
      'โทรและส่งข้อความไม่อั้น',
      'รับสายได้เฉพาะจากเบอร์โทรศัพท์ในสหรัฐฯ เท่านั้น',
      'ต้องสั่งซื้อล่วงหน้าอย่างน้อย 6 วัน',
      'เปิดใช้งานเวลา 12:00 น. เวลานิวยอร์ก',
      'ต้องกรอก IMEI2 และ EID2 ตอนชำระเงิน',
      'รองรับ iOS และ Android บางรุ่น (Pixel, Galaxy, Motorola)',
      'ไม่สามารถยกเลิกได้หลังเปิดใช้งาน',
    ],
    ja: [
      'メインデバイスでデータ無制限・速度制限なし',
      'テザリングは指定速度で3GBまで',
      'テキストメッセージと通話が無制限',
      'この番号に発信できるのは米国内の電話番号のみ',
      '最低6日前までに注文が必要',
      'ニューヨーク時間12:00に有効化',
      '購入時にIMEI2とEID2が必要',
      'iOSおよび一部Android端末(Pixel、Galaxy、Motorola)に対応',
      '有効化後のキャンセル不可',
    ],
    zh: [
      '主设备无限数据和速度',
      '热点共享限3GB，指定速度',
      '无限短信和通话',
      '仅美国本地号码可拨打此号码',
      '须至少提前6天下单',
      '纽约时间中午12:00激活',
      '结账时需提供IMEI2和EID2',
      '支持iOS和部分Android设备（Pixel、Galaxy、Motorola）',
      '激活后不可取消',
    ],
    ko: [
      '기본 기기에서 무제한 데이터 및 속도',
      '핫스팟 공유 3GB(지정 속도)',
      '무제한 문자 및 통화',
      '미국 현지 번호만 이 번호로 전화 가능',
      '최소 6일 전에 주문해야 합니다',
      '뉴욕 시간 오후 12시에 활성화',
      '결제 시 IMEI2 및 EID2 필요',
      'iOS 및 일부 Android 기기 지원 (Pixel, Galaxy, Motorola)',
      '활성화 후 취소 불가',
    ],
    fr: [
      'Données et vitesse illimitées sur l\'appareil principal',
      'Partage de point d\'accès limité à 3 Go à la vitesse désignée',
      'SMS et appels illimités',
      'Seuls les numéros américains peuvent appeler ce numéro',
      'Doit être commandé au moins 6 jours à l\'avance',
      'Activation à 12h00 heure de New York',
      'IMEI2 et EID2 requis au paiement',
      'Compatible iOS et certains Android (Pixel, Galaxy, Motorola)',
      'Pas d\'annulation après activation',
    ],
    de: [
      'Unbegrenzte Daten & Geschwindigkeit auf dem Hauptgerät',
      'Hotspot-Sharing auf 3 GB bei festgelegter Geschwindigkeit begrenzt',
      'Unbegrenzte SMS und Anrufe',
      'Nur US-amerikanische Nummern können diese Nummer anrufen',
      'Muss mindestens 6 Tage im Voraus bestellt werden',
      'Aktivierung um 12:00 Uhr New Yorker Zeit',
      'IMEI2 und EID2 beim Checkout erforderlich',
      'Unterstützt iOS und ausgewählte Android-Geräte (Pixel, Galaxy, Motorola)',
      'Keine Stornierung nach Aktivierung',
    ],
    es: [
      'Datos y velocidad ilimitados en el dispositivo principal',
      'Compartir hotspot limitado a 3 GB a velocidad designada',
      'Mensajes de texto y llamadas ilimitados',
      'Solo números de EE.UU. pueden llamar a este número',
      'Debe pedirse con al menos 6 días de anticipación',
      'Se activa a las 12:00 PM hora de Nueva York',
      'Requiere IMEI2 y EID2 al pagar',
      'Compatible con iOS y algunos Android (Pixel, Galaxy, Motorola)',
      'Sin cancelación después de la activación',
    ],
    pt: [
      'Dados e velocidade ilimitados no dispositivo principal',
      'Compartilhamento de hotspot limitado a 3 GB na velocidade designada',
      'Mensagens de texto e chamadas ilimitadas',
      'Apenas números dos EUA podem ligar para este número',
      'Deve ser pedido com pelo menos 6 dias de antecedência',
      'Ativa às 12:00 PM horário de Nova York',
      'Requer IMEI2 e EID2 no checkout',
      'Compatível com iOS e alguns Android (Pixel, Galaxy, Motorola)',
      'Sem cancelamento após ativação',
    ],
    ar: [
      'بيانات وسرعة غير محدودة على الجهاز الأساسي',
      'مشاركة نقطة الاتصال محدودة بـ 3 جيجابايت بالسرعة المحددة',
      'رسائل نصية ومكالمات غير محدودة',
      'فقط أرقام الهاتف الأمريكية يمكنها الاتصال بهذا الرقم',
      'يجب الطلب قبل 6 أيام على الأقل',
      'يتم التفعيل الساعة 12:00 ظهراً بتوقيت نيويورك',
      'يتطلب IMEI2 وEID2 عند الدفع',
      'يدعم iOS وبعض أجهزة Android (Pixel، Galaxy، Motorola)',
      'لا إلغاء بعد التفعيل',
    ],
  },
  'Mongolia': {
    en: [
      'Unlimited nationwide calls and SMS',
      'After high-speed data: 128kbps backup speed (FUP)',
      'Dial *1478# to check data balance',
      'Nationwide 5G/4G coverage, valid only in Mongolia',
      'APN: internet',
      'QR code supports one-time download only — save it carefully',
    ],
    th: [
      'โทรและ SMS ไม่อั้นทั่วประเทศ',
      'หลังใช้เน็ตเต็มสปีดหมด: ความเร็วสำรอง 128kbps (FUP)',
      'กด *1478# เพื่อเช็คยอดข้อมูลคงเหลือ',
      'ครอบคลุม 5G/4G ทั่วประเทศ ใช้ได้เฉพาะในมองโกเลีย',
      'APN: internet',
      'QR code ดาวน์โหลดได้ครั้งเดียวเท่านั้น — กรุณาบันทึกไว้ให้ดี',
    ],
    ja: [
      '国内通話とSMSが無制限',
      '高速データ使用後: バックアップ速度128kbps (FUP)',
      '*1478# でデータ残量を確認',
      '全国5G/4Gカバレッジ、モンゴル国内のみ有効',
      'APN: internet',
      'QRコードは1回のみダウンロード可能 — 大切に保存してください',
    ],
    zh: [
      '全国无限通话和短信',
      '高速数据用完后：128kbps备用速度（FUP）',
      '拨打 *1478# 查看数据余额',
      '全国5G/4G覆盖，仅限蒙古使用',
      'APN: internet',
      'QR码仅支持一次下载 — 请妥善保存',
    ],
    ko: [
      '전국 무제한 통화 및 SMS',
      '고속 데이터 소진 후: 128kbps 백업 속도 (FUP)',
      '*1478# 으로 데이터 잔량 확인',
      '전국 5G/4G 커버리지, 몽골에서만 유효',
      'APN: internet',
      'QR 코드는 1회만 다운로드 가능 — 신중하게 저장하세요',
    ],
    fr: [
      'Appels et SMS nationaux illimités',
      'Après les données haute vitesse : vitesse de secours 128kbps (FUP)',
      'Composez *1478# pour vérifier le solde de données',
      'Couverture 5G/4G nationale, valable uniquement en Mongolie',
      'APN: internet',
      'Le code QR ne peut être téléchargé qu\'une seule fois — conservez-le précieusement',
    ],
    de: [
      'Unbegrenzte landesweite Anrufe und SMS',
      'Nach Highspeed-Daten: 128kbps Backup-Geschwindigkeit (FUP)',
      '*1478# wählen um Datenguthaben zu prüfen',
      'Landesweite 5G/4G-Abdeckung, nur in der Mongolei gültig',
      'APN: internet',
      'QR-Code kann nur einmal heruntergeladen werden — bitte sorgfältig aufbewahren',
    ],
    es: [
      'Llamadas y SMS nacionales ilimitados',
      'Después de datos de alta velocidad: velocidad de respaldo 128kbps (FUP)',
      'Marca *1478# para consultar el saldo de datos',
      'Cobertura 5G/4G nacional, válido solo en Mongolia',
      'APN: internet',
      'El código QR solo se puede descargar una vez — guárdelo con cuidado',
    ],
    pt: [
      'Chamadas e SMS nacionais ilimitados',
      'Após dados de alta velocidade: velocidade de backup 128kbps (FUP)',
      'Disque *1478# para verificar o saldo de dados',
      'Cobertura 5G/4G nacional, válido apenas na Mongólia',
      'APN: internet',
      'O código QR suporta apenas um download — salve-o com cuidado',
    ],
    ar: [
      'مكالمات ورسائل نصية محلية غير محدودة',
      'بعد البيانات عالية السرعة: سرعة احتياطية 128kbps (FUP)',
      'اطلب *1478# للتحقق من رصيد البيانات',
      'تغطية 5G/4G على مستوى البلاد، صالحة فقط في منغوليا',
      'APN: internet',
      'رمز QR يدعم التنزيل مرة واحدة فقط — احفظه بعناية',
    ],
  },
};

interface CountryInfoCardProps {
  countryName: string;
  countryCode: string;
  carrier?: string;
  networkType?: string;
  packageType?: 'day_pass' | 'max_speed' | 'limitless';
  hasDirect?: boolean;
  supportTopUp?: boolean;
  supportVoice?: boolean;
  supportSms?: boolean;
  requiresKyc?: boolean;
  allCarriers?: string[];
  carrierIndex?: number;
  isLocalSim?: boolean;
  initializePolicy?: string;
  bundleCoverage?: string;
}

export function CountryInfoCard({
  countryName,
  countryCode,
  carrier = 'Mobile11',
  networkType = '4G',
  packageType = 'day_pass',
  hasDirect = true,
  supportTopUp = false,
  supportVoice = false,
  supportSms = false,
  requiresKyc = false,
  allCarriers,
  carrierIndex,
  isLocalSim = false,
  initializePolicy,
  bundleCoverage,
}: CountryInfoCardProps) {
  const { t, language } = useLanguage();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left: Country info */}
        <div className="flex-1 space-y-4">
          {/* Country header */}
          <div className="flex items-center gap-3">
            <FlagIcon countryCode={countryCode} size="lg" className="rounded-lg shadow-sm" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{countryName}</h2>
              <p className="text-sm text-gray-500">Mobile11</p>
            </div>
          </div>

          {/* Bundle coverage badge */}
          {bundleCoverage && bundleCoverage !== countryName && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <Globe className="w-3.5 h-3.5" />
                {(t('countryInfo.covers') as string).replace('{name}', bundleCoverage)}
              </span>
            </div>
          )}

          {/* Local SIM badge */}
          {isLocalSim && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-orange-500">
                <Phone className="w-3 h-3" />
                LOCAL SIM
              </span>
              <span className="text-xs text-gray-500">
                {supportVoice && supportSms
                  ? t('countryInfo.dataCallsTexts')
                  : supportVoice
                    ? t('countryInfo.dataCalls')
                    : t('countryInfo.dataOnly')}
              </span>
            </div>
          )}

          {/* Carrier info */}
          <div className="flex items-center gap-2 text-gray-700 flex-wrap">
            <span className="text-sm font-medium">{(() => {
              const { reordered, bestRating } = getBestCarrierFirst(carrier);
              return (
                <>
                  {reordered}
                  {networkType && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      networkType === '5G' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {networkType}
                    </span>
                  )}
                  <CarrierStarRating rating={bestRating} carrierName={reordered} size="sm" />
                </>
              );
            })()}</span>
          </div>

          {/* Compatibility check */}
          <CompatibilityCheckDialog />

          {/* Feature bullets */}
          {hasDirect && (
            <div className="space-y-2 pt-2">
              {/* Voice/SMS bullet - skip for Australia:Vodafone since collapsible covers it */}
              {supportVoice && supportSms && !(countryName === 'Australia' && carrier === 'Vodafone') && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                   <span>
                    {t('countryInfo.includesVoiceSms')}
                  </span>
                </div>
              )}
              {supportTopUp && !isLocalSim && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('countryPage.feature1') || "If you're running low, you can always top up"}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {isLocalSim
                    ? t('countryInfo.localSimActivation')
                    : requiresKyc
                      ? (t('countryPage.feature2Kyc') || 'The package starts after identity verification (KYC) is completed')
                      : (t('countryPage.feature2') || 'The package starts when you connect to the network of destination')}
                </span>
              </div>

              {/* Australia:Vodafone inline notes */}
              {countryName === 'Australia' && carrier === 'Vodafone' && (
                <>
                  {((COUNTRY_PACKAGE_NOTES['Australia:Vodafone'] as any)?.[language] || COUNTRY_PACKAGE_NOTES['Australia:Vodafone']?.en
                  )?.map((note: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Country-specific notes - skip Australia:Vodafone (handled inline above) */}
          {(() => {
            const carrierKey = `${countryName}:${carrier}`;
            if (carrierKey === 'Australia:Vodafone') return null;
            const notes = COUNTRY_PACKAGE_NOTES[carrierKey] || COUNTRY_PACKAGE_NOTES[countryName];
            if (!notes) return null;
            return (
              <div className="mt-3 p-3 bg-[#FAF7F2] border border-gray-200 rounded-xl text-sm text-gray-700 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                  <Info className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  {t('countryInfo.packageDetails')}
                </div>
                {((notes as any)[language] || notes.en).map((note: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 ml-5.5">
                    <span>• {note}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Unlimited calls to 35 countries - for Australia:Vodafone */}
          {countryName === 'Australia' && carrier === 'Vodafone' && (
            <Collapsible>
              <CollapsibleTrigger className="mt-1 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 w-full">
                <Phone className="w-4 h-4" />
                <span className="underline">
                  {t('countryInfo.unlimitedCalls35')}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {UNLIMITED_CALL_COUNTRIES.map((country) => (
                      <span
                        key={country}
                        className="text-xs bg-[#FAF7F2] border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* KYC notice */}
          {requiresKyc && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
               <span>
                {t('countryInfo.kycRequired')}
              </span>
            </div>
          )}
        </div>

        {/* Right: eSIM Card Visual */}
        <div className="flex justify-center md:justify-end">
          <OperatorSimCard
            carrier={carrier}
            countryName={countryName}
            packageType={packageType}
            networkType={networkType?.includes('5G') ? '5G' : '4G'}
            allCarriers={allCarriers}
            carrierIndex={carrierIndex}
          />
        </div>
      </div>
    </div>
  );
}
