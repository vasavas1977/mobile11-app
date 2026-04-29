import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wifi } from 'lucide-react';

type PackageTypeValue = 'day_pass' | 'max_speed' | 'limitless';

interface OperatorSimCardProps {
  carrier: string;
  countryName: string;
  packageType?: PackageTypeValue;
  networkType?: '4G' | '5G';
  allCarriers?: string[];
  carrierIndex?: number;
}

// Maps brand hex colors to gradient classes
const COLOR_TO_GRADIENT: Record<string, string> = {
  '#c00': 'from-red-800 via-red-900 to-red-950',
  '#e4002b': 'from-red-700 via-rose-800 to-red-900',
  '#e60000': 'from-red-800 via-red-900 to-red-950',
  '#cd040b': 'from-red-800 via-red-900 to-red-950',
  '#ff0000': 'from-red-700 via-red-800 to-red-900',
  '#0066b3': 'from-blue-800 via-blue-900 to-blue-950',
  '#009fdb': 'from-sky-700 via-blue-800 to-blue-900',
  '#00bfff': 'from-cyan-700 via-cyan-800 to-cyan-900',
  '#00b2a9': 'from-teal-600 via-teal-700 to-teal-800',
  '#00a651': 'from-emerald-700 via-emerald-800 to-emerald-900',
  '#ff7900': 'from-orange-700 via-orange-800 to-orange-900',
  '#f7941d': 'from-amber-700 via-orange-800 to-orange-900',
  '#660099': 'from-purple-800 via-purple-900 to-purple-950',
  '#4f2d7f': 'from-purple-800 via-violet-900 to-purple-950',
  '#e0d4fc': 'from-purple-800 via-violet-900 to-purple-950',
  '#e20074': 'from-pink-700 via-pink-800 to-pink-900',
  '#ffc72c': 'from-amber-600 via-amber-700 to-amber-800',
  '#fff': 'from-slate-600 via-slate-700 to-slate-800',
};

// Fallback palette when carrierIndex is provided but no color match or duplicates
const FALLBACK_GRADIENTS = [
  'from-blue-800 via-indigo-900 to-blue-950',
  'from-red-800 via-red-900 to-red-950',
  'from-cyan-700 via-cyan-800 to-cyan-900',
  'from-emerald-700 via-emerald-800 to-emerald-900',
  'from-purple-800 via-purple-900 to-purple-950',
  'from-amber-600 via-amber-700 to-amber-800',
  'from-slate-600 via-slate-700 to-slate-800',
  'from-pink-700 via-pink-800 to-pink-900',
];

function getCarrierGradient(carrier: string, carrierIndex?: number): string | null {
  // Multi-carrier page: use fallback palette for distinct colors
  if (carrierIndex !== undefined) {
    return FALLBACK_GRADIENTS[carrierIndex % FALLBACK_GRADIENTS.length];
  }
  // Single-carrier: use brand color if available
  const logo = getCarrierLogo(carrier);
  if (logo) {
    const gradient = COLOR_TO_GRADIENT[logo.color];
    if (gradient) return gradient;
  }
  return null;
}

const CARRIER_LOGOS: Record<string, { short: string; color: string }> = {
  'DOCOMO': { short: 'docomo', color: '#c00' },
  'NTT Docomo': { short: 'docomo', color: '#c00' },
  'Softbank / KDDI': { short: 'SoftBank', color: '#fff' },
  'SoftBank': { short: 'SoftBank', color: '#fff' },
  'Softbank': { short: 'SoftBank', color: '#fff' },
  'KDDI': { short: 'KDDI', color: '#fff' },
  'au (KDDI)': { short: 'KDDI', color: '#fff' },
  'AIS': { short: 'AIS', color: '#00a651' },
  'Truemove': { short: 'TRUE', color: '#e4002b' },
  'Real Future (Truemove)': { short: 'TRUE', color: '#e4002b' },
  'True': { short: 'TRUE', color: '#e4002b' },
  'DTAC': { short: 'dtac', color: '#00bfff' },
  'Singtel': { short: 'Singtel', color: '#ff0000' },
  'Singtel/StarHub': { short: 'Singtel', color: '#ff0000' },
  'StarHub': { short: 'StarHub', color: '#00a651' },
  'KT': { short: 'KT', color: '#e4002b' },
  'KT/SKT': { short: 'KT', color: '#e4002b' },
  'SK Telecom': { short: 'SKT', color: '#e4002b' },
  'SK / LGU+': { short: 'SKT', color: '#e4002b' },
  'LG U+': { short: 'LG U+', color: '#e4002b' },
  'LG U+/KT': { short: 'LG U+', color: '#e4002b' },
  'Chunghwa': { short: 'CHT', color: '#0066b3' },
  'Chunghwa/FarEasTone': { short: 'CHT', color: '#0066b3' },
  'FarEasTone': { short: 'FET', color: '#f7941d' },
  'Taiwan Mobile': { short: 'TWM', color: '#e4002b' },
  'Telkomsel': { short: 'TSEL', color: '#e4002b' },
  'XL (Excelcom) / Indosat / Telkomsel': { short: 'TSEL', color: '#e4002b' },
  'XL(Excelcom)/Telkomsel': { short: 'TSEL', color: '#e4002b' },
  'Vodafone': { short: 'Vodafone', color: '#e60000' },
  'Vodafone / EE / O2': { short: 'Vodafone', color: '#e60000' },
  'Vodafone / TIM': { short: 'Vodafone', color: '#e60000' },
  'Vodafone / Telefonica O2': { short: 'Vodafone', color: '#e60000' },
  'Vodafone / KPN': { short: 'Vodafone', color: '#e60000' },
  'Vodafone/Turkcell': { short: 'Turkcell', color: '#ffc72c' },
  'Orange': { short: 'Orange', color: '#ff7900' },
  'SFR / Orange': { short: 'Orange', color: '#ff7900' },
  'Orange / Telefonica / Vodafone': { short: 'Orange', color: '#ff7900' },
  'T-Mobile': { short: 'T-Mobile', color: '#e20074' },
  'AT&T / T-Mobile': { short: 'AT&T', color: '#009fdb' },
  'AT&T': { short: 'AT&T', color: '#009fdb' },
  'Verizon': { short: 'Verizon', color: '#cd040b' },
  'Turkcell': { short: 'Turkcell', color: '#ffc72c' },
  'Maxis / Celcom': { short: 'Maxis', color: '#00a651' },
  'Maxis / Celcom / Digi': { short: 'Maxis', color: '#00a651' },
  'Smart / Globe': { short: 'Smart', color: '#00a651' },
  'Globe/Smart': { short: 'Globe', color: '#0066b3' },
  'Vivo': { short: 'Vivo', color: '#660099' },
  'CMCC (TT&GPT)': { short: 'CMCC', color: '#e0d4fc' },
  'CMCC': { short: 'CMCC', color: '#fff' },
  'China Mobile': { short: 'CMCC', color: '#fff' },
  'China Unicom': { short: 'CU', color: '#e4002b' },
  'Bell / Telus / Sasktel': { short: 'Bell', color: '#0066b3' },
  'Optus/Vodafone': { short: 'Optus', color: '#00b2a9' },
  'Optus': { short: 'Optus', color: '#00b2a9' },
  'Reliance Jio/Bharti Airtel': { short: 'Jio', color: '#0066b3' },
  'Etisalat / DU': { short: 'Etisalat', color: '#00a651' },
  'STC/Mobily/Zain': { short: 'STC', color: '#4f2d7f' },
  'Vinaphone / Mobifone / Viettel': { short: 'Viettel', color: '#e4002b' },
  'CMHK': { short: 'CMHK', color: '#0066b3' },
  'CSL': { short: 'CSL', color: '#e4002b' },
  '3HK': { short: '3HK', color: '#e4002b' },
  'PCCW': { short: 'PCCW', color: '#0066b3' },
};

function getCarrierLogo(carrier: string): { short: string; color: string } | null {
  if (CARRIER_LOGOS[carrier]) return CARRIER_LOGOS[carrier];
  const upper = carrier.toUpperCase();
  for (const [key, val] of Object.entries(CARRIER_LOGOS)) {
    if (upper.includes(key.toUpperCase())) return val;
  }
  return null;
}

export function OperatorSimCard({ 
  carrier, 
  countryName, 
  packageType = 'day_pass',
  networkType = '4G',
  allCarriers,
  carrierIndex,
}: OperatorSimCardProps) {
  const { t } = useLanguage();
  
  const gradientClasses = {
    day_pass: 'from-blue-800 via-indigo-900 to-blue-950',
    max_speed: 'from-orange-700 via-red-800 to-orange-900',
    limitless: 'from-emerald-700 via-teal-800 to-emerald-900'
  };
  
  const accentColors = {
    day_pass: 'text-blue-300',
    max_speed: 'text-orange-300',
    limitless: 'text-emerald-300'
  };

  // Collect all carrier logos when multiple carriers provided
  const carrierLogos = useMemo(() => {
    const carriersToCheck = allCarriers && allCarriers.length > 0 ? allCarriers : [carrier];
    const logos: Array<{ short: string; color: string }> = [];
    const seen = new Set<string>();
    for (const c of carriersToCheck) {
      const logo = getCarrierLogo(c);
      if (logo && !seen.has(logo.short)) {
        seen.add(logo.short);
        logos.push(logo);
      }
    }
    return logos;
  }, [carrier, allCarriers]);

  const hasLogos = carrierLogos.length > 0;

  // Use carrier-specific gradient when carrierIndex is provided (multi-carrier country)
  const carrierGradient = carrierIndex !== undefined ? getCarrierGradient(carrier, carrierIndex) : null;
  const activeGradient = carrierGradient || gradientClasses[packageType];

  return (
    <div 
      className={`relative w-[140px] h-[90px] rounded-xl bg-gradient-to-br ${activeGradient} overflow-hidden shadow-lg flex-shrink-0`}
    >
      {/* Decorative wave pattern */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 140 90"
        preserveAspectRatio="none"
      >
        <path
          d="M0,30 Q35,50 70,30 T140,30 L140,90 L0,90 Z"
          fill="white"
        />
        <path
          d="M0,50 Q35,70 70,50 T140,50 L140,90 L0,90 Z"
          fill="white"
          opacity="0.5"
        />
      </svg>
      
      {/* Top-left: Carrier brand marks OR fallback WiFi */}
      {hasLogos ? (
        <div className="absolute top-2 left-3 z-10 flex items-center gap-1 max-w-[85px] overflow-hidden">
          {carrierLogos.slice(0, 3).map((logo, i) => (
            <span 
              key={i}
              className="text-[9px] font-bold leading-none drop-shadow-sm whitespace-nowrap"
              style={{ color: logo.color }}
            >
              {i > 0 && <span className="text-white/50 mr-0.5">/</span>}
              {logo.short}
            </span>
          ))}
          {carrierLogos.length > 3 && (
            <span className="text-white/50 text-[8px]">+{carrierLogos.length - 3}</span>
          )}
        </div>
      ) : (
        <>
          <div className="absolute top-2 left-3 z-10">
            <div className={`${accentColors[packageType]}`}>
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="absolute top-2 left-9 z-10">
            <span className="text-white/90 text-[10px] font-medium">
              {t('myEsims.internet')}
            </span>
          </div>
        </>
      )}
      
      {/* Network type badge */}
      <div className="absolute top-1.5 right-2 z-10">
        <span className={`text-[10px] font-bold ${accentColors[packageType]} bg-white/10 px-1.5 py-0.5 rounded`}>
          {networkType}
        </span>
      </div>
      
      {/* eSIM chip */}
      <div className="absolute bottom-5 left-3">
        <div className="w-7 h-5 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm flex items-center justify-center shadow-sm">
          <div className="grid grid-cols-3 gap-px">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-yellow-600/60 rounded-[1px]" />
            ))}
          </div>
        </div>
        <span className="text-[8px] text-white/70 mt-0.5 block">eSIM</span>
      </div>
      
      {/* Bottom-right: country name (if logo shown) or carrier name (fallback) */}
      <div className="absolute bottom-2 left-3 right-3">
        <p className="text-white text-[10px] font-semibold text-right leading-tight">
          {hasLogos ? countryName : carrier}
        </p>
      </div>
    </div>
  );
}
