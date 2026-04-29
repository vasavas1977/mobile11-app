import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-session-token',
};

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: any;
}

interface ImageAttachment {
  path: string;
  type: string;
  name: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
}

interface AIConfig {
  enabled: boolean;
  auto_respond: boolean;
  confidence_threshold: number;
  max_ai_turns: number;
  model: string;
  system_prompt: string;
}

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  iosVersion: number | null;
  supportsOneClick: boolean;
  deviceType: 'ios' | 'android' | 'unknown';
}

interface PackageInfo {
  id: string;
  name: string;
  country_name: string;
  country_code: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  package_type: string | null;
  qos_speed: string | null;
  speed_after_limit: string | null;
  carrier: string | null;
  network_type: string | null;
  isRegional?: boolean;
  regionalName?: string | null;
  coveredCountry?: string | null;
}

// Countries that don't have direct packages but are covered by regional packages
// Maps country name (lowercase) to the regional package(s) that cover it
// primary: Best option for heavy users (Unlimited), alternatives: Budget options (Standard)
interface RegionalCoverage {
  primary: { regionalName: string; searchTerm: string; packageTypes: string[] };
  alternatives?: { regionalName: string; searchTerm: string; packageTypes: string[] }[];
}

const REGIONAL_COVERAGE: Record<string, RegionalCoverage> = {
  // Oceania (no direct packages) - Global 109 has Unlimited, Global 151 has Standard
  'new zealand': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'fiji': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'papua new guinea': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'tonga': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'vanuatu': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  
  // South America (no direct packages)
  'brazil': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'argentina': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'chile': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'peru': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'colombia': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'uruguay': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'ecuador': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  
  // Central America (no direct packages)
  'costa rica': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'panama': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'guatemala': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  
  // Africa (no direct packages)
  'kenya': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'south africa': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'tanzania': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'uganda': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'ghana': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'egypt': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'morocco': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  
  // Asia (countries without direct packages)
  'nepal': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'sri lanka': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'bangladesh': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'mongolia': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'iran': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  
  // Middle East (countries without direct packages)
  'jordan': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'oman': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'yemen': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  
  // Island nations
  'maldives': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'mauritius': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
  'seychelles': { 
    primary: { regionalName: 'Global 109 Countries', searchTerm: 'Global 109 Countries', packageTypes: ['limitless'] },
    alternatives: [{ regionalName: 'Global 151 Countries', searchTerm: 'Global 151 Countries', packageTypes: ['day_pass'] }]
  },
};

// Europe 42 Countries list - for regional Unlimited fallback
// These countries are covered by the "Europe 42 Countries + 2Stopover" plan
const EUROPE_42_COUNTRY_NAMES: string[] = [
  'albania', 'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic', 'czechia',
  'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary', 'iceland',
  'ireland', 'italy', 'latvia', 'liechtenstein', 'lithuania', 'luxembourg', 'malta',
  'monaco', 'netherlands', 'north macedonia', 'norway', 'poland', 'portugal', 'romania',
  'san marino', 'serbia', 'slovakia', 'slovenia', 'spain', 'sweden', 'switzerland',
  'turkey', 'ukraine', 'united kingdom', 'uk', 'vatican city', 'vatican'
];

// Compute total GB for Day Pass packages (e.g., "2GB" x 7 days = "14GB total (2GB/day x 7 days)")
function computeDayPassTotalGB(dataAmount: string, days: number): string | null {
  const match = dataAmount.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const totalGB = unit === 'MB' ? (value * days) / 1000 : value * days;
  const totalStr = totalGB % 1 === 0 ? totalGB.toString() : totalGB.toFixed(1);
  return `${totalStr}GB total (${dataAmount}/day x ${days} days)`;
}

// Format package type for display — uses user-facing names
// NEVER use old internal names (Limitless, Max Speed, Day Pass) in customer-facing output
function formatPackageType(packageType: string | null): string {
  if (!packageType) return 'Value';
  
  const typeMap: Record<string, string> = {
    'day_pass': 'Value',
    'daypass': 'Value',
    'max_speed': 'Pay-per-use',
    'maxspeed': 'Pay-per-use',
    'limitless': 'Unlimited',
    'unlimited': 'Unlimited',
    'real_unlimited': 'Real Unlimited',
    'standard': 'Value'
  };
  
  return typeMap[packageType.toLowerCase()] || packageType;
}

// Thai to English country name mapping
const COUNTRY_MAPPINGS: Record<string, string> = {
  'จีน': 'China',
  'ญี่ปุ่น': 'Japan',
  'เกาหลี': 'South Korea',
  'เกาหลีใต้': 'South Korea',
  'ไต้หวัน': 'Taiwan',
  'ฮ่องกง': 'Hong Kong',
  'สิงคโปร์': 'Singapore',
  'มาเลเซีย': 'Malaysia',
  'เวียดนาม': 'Vietnam',
  'ไทย': 'Thailand',
  'อินโดนีเซีย': 'Indonesia',
  'ฟิลิปปินส์': 'Philippines',
  'อินเดีย': 'India',
  'ออสเตรเลีย': 'Australia',
  'นิวซีแลนด์': 'New Zealand',
  'อเมริกา': 'USA',
  'สหรัฐ': 'USA',
  'แคนาดา': 'Canada',
  'อังกฤษ': 'UK',
  'ฝรั่งเศส': 'France',
  'เยอรมัน': 'Germany',
  'อิตาลี': 'Italy',
  'สเปน': 'Spain',
  'ยุโรป': 'Europe',
  'เอเชีย': 'Asia',
  'ตุรกี': 'Turkey',
  'อียิปต์': 'Egypt',
  'ดูไบ': 'UAE',
  'ซาอุดิอาระเบีย': 'Saudi Arabia',
  'กาตาร์': 'Qatar',
  'รัสเซีย': 'Russia',
  'บราซิล': 'Brazil',
  'เม็กซิโก': 'Mexico',
  'อาร์เจนตินา': 'Argentina',
  'ชิลี': 'Chile',
  'แอฟริกาใต้': 'South Africa',
  'โมร็อกโก': 'Morocco',
  'ลาว': 'Laos',
  'กัมพูชา': 'Cambodia',
  'พม่า': 'Myanmar',
  'เมียนมา': 'Myanmar',
  'บังกลาเทศ': 'Bangladesh',
  'ศรีลังกา': 'Sri Lanka',
  'เนปาล': 'Nepal',
  'มัลดีฟส์': 'Maldives',
  'ภูฏาน': 'Bhutan',
   'มาเก๊า': 'Macau',
   'บรูไน': 'Brunei',
   'ติมอร์': 'Timor-Leste',
   'สวิตเซอร์แลนด์': 'Switzerland',
   'สวิส': 'Switzerland',
   'โปรตุเกส': 'Portugal',
   'กรีซ': 'Greece',
   'โปแลนด์': 'Poland',
   'เช็ก': 'Czech Republic',
   'ฮังการี': 'Hungary',
   'ไอร์แลนด์': 'Ireland',
   'ออสเตรีย': 'Austria',
   'เบลเยียม': 'Belgium',
   'เนเธอร์แลนด์': 'Netherlands',
   'ฮอลแลนด์': 'Netherlands',
   'สวีเดน': 'Sweden',
   'นอร์เวย์': 'Norway',
   'เดนมาร์ก': 'Denmark',
   'ฟินแลนด์': 'Finland',
   'โครเอเชีย': 'Croatia',
   'อิสราเอล': 'Israel',
};

// Default base URL for generating links (production fallback)
const DEFAULT_BASE_URL = 'https://mobile11.com';

// Extract base URL from request headers
function getBaseUrl(req: Request): string {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Try origin first
  if (origin) {
    try {
      const url = new URL(origin);
      console.log(`Using origin for base URL: ${url.origin}`);
      return url.origin;
    } catch {
      console.log('Failed to parse origin:', origin);
    }
  }
  
  // Try referer as fallback
  if (referer) {
    try {
      const url = new URL(referer);
      console.log(`Using referer for base URL: ${url.origin}`);
      return url.origin;
    } catch {
      console.log('Failed to parse referer:', referer);
    }
  }
  
  console.log(`Using default base URL: ${DEFAULT_BASE_URL}`);
  return DEFAULT_BASE_URL;
}

// Insert a context reset marker to database for persistence
async function insertResetMarker(
  supabase: any, 
  conversationId: string
): Promise<void> {
  try {
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      content: '[CONTEXT_RESET]',
      sender_type: 'system',
      is_internal_note: true
    });
    console.log('[Reset] Persisted reset marker to database');
  } catch (error: any) {
    console.error('[Reset] Failed to insert reset marker:', error);
  }
}

// Detect language from text
// Default to Thai unless the message is clearly a full English sentence (3+ English words, no Thai)
type SupportedLanguage = 'th' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'zh';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  th: 'Thai (ภาษาไทย)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  zh: 'Chinese (中文)',
};

function detectLanguage(text: string): SupportedLanguage {
  const thaiPattern = /[\u0E00-\u0E7F]/;
  if (thaiPattern.test(text)) return 'th';
  
  // Japanese: Hiragana, Katakana
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
  if (japanesePattern.test(text)) return 'ja';
  
  // Chinese: CJK characters (check after Japanese/Korean to avoid overlap)
  const chinesePattern = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
  const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
  const hasJapanese = japanesePattern.test(text);
  if (chinesePattern.test(text) && !hasKorean && !hasJapanese) return 'zh';
  
  // Korean: Hangul
  const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  if (koreanPattern.test(text)) return 'ko';
  
  // French indicators (common accented words/patterns)
  const frenchPattern = /\b(je|vous|nous|merci|bonjour|oui|non|est-ce|c'est|qu['']|d['']accord|s['']il)\b/i;
  if (frenchPattern.test(text)) return 'fr';
  
  // German indicators
  const germanPattern = /\b(ich|danke|bitte|guten|ja|nein|können|möchte|wie|warum|haben)\b/i;
  if (germanPattern.test(text) && /[äöüßÄÖÜ]/.test(text)) return 'de';
  const germanStrongPattern = /[äöüßÄÖÜ]/;
  if (germanStrongPattern.test(text) && text.trim().split(/\s+/).length >= 2) return 'de';
  
  // Only classify as English if it looks like a real English sentence (3+ words)
  const englishWords = text.trim().split(/\s+/).filter(w => /^[a-zA-Z]{2,}/.test(w));
  if (englishWords.length >= 3) return 'en';
  
  // Default to Thai for short/ambiguous messages (single words, letters, numbers)
  return 'th';
}

// Extract country from user message
function extractCountry(message: string): string | null {
  const msgLower = message.toLowerCase();
  
  // Check Thai country names first
  for (const [thai, english] of Object.entries(COUNTRY_MAPPINGS)) {
    if (message.includes(thai)) {
      return english;
    }
  }
  
  // Check English country names (use word boundaries for short names to prevent false positives)
  // e.g., "USA" must not match "usage", "UK" must not match "unknown"
  const englishCountries = Object.values(COUNTRY_MAPPINGS);
  // Deduplicate and sort by length descending so longer names match first
  const uniqueCountries = [...new Set(englishCountries)].sort((a, b) => b.length - a.length);
  for (const country of uniqueCountries) {
    const countryLower = country.toLowerCase();
    if (countryLower.length <= 3) {
      const regex = new RegExp(`\\b${countryLower}\\b`, 'i');
      if (regex.test(msgLower)) {
        return country;
      }
    } else {
      if (msgLower.includes(countryLower)) {
        return country;
      }
    }
  }
  
  // Common variations
   const countryVariations: Record<string, string> = {
     'korea': 'South Korea',
     'hk': 'Hong Kong',
     'hong kong': 'Hong Kong',
     'hongkong': 'Hong Kong',
     'uk': 'UK',
     'england': 'UK',
     'britain': 'UK',
     'us': 'USA',
     'united states': 'USA',
     'america': 'USA',
     'uae': 'UAE',
     'emirates': 'UAE',
     'new zealand': 'New Zealand',
     'nz': 'New Zealand',
     'aus': 'Australia',
     'oz': 'Australia',
     'sg': 'Singapore',
     'my': 'Malaysia',
     'indo': 'Indonesia',
     'ph': 'Philippines',
     'vn': 'Vietnam',
     'tw': 'Taiwan',
     'jp': 'Japan',
     'cn': 'China',
     'kr': 'South Korea',
     'th': 'Thailand',
     'israel': 'Israel',
     'il': 'Israel',
     'ireland': 'Ireland',
     'ie': 'Ireland',
     'croatia': 'Croatia',
     'hr': 'Croatia',
     'switzerland': 'Switzerland',
     'swiss': 'Switzerland',
     'ch': 'Switzerland',
     'portugal': 'Portugal',
     'greece': 'Greece',
     'poland': 'Poland',
     'czech': 'Czech Republic',
     'hungary': 'Hungary',
     'austria': 'Austria',
     'at': 'Austria',
     'belgium': 'Belgium',
     'be': 'Belgium',
     'netherlands': 'Netherlands',
     'holland': 'Netherlands',
     'sweden': 'Sweden',
     'norway': 'Norway',
     'denmark': 'Denmark',
     'finland': 'Finland',
     'iceland': 'Iceland',
   };
  
  // Sort variants by length descending to match longer names first (e.g., "israel" before "us")
  const sortedVariants = Object.entries(countryVariations).sort((a, b) => b[0].length - a[0].length);
  
  for (const [variant, country] of sortedVariants) {
    // For short variants (2-3 chars), use word boundaries to prevent false positives
    // e.g., "us" inside "usimsa" should NOT match
    if (variant.length <= 3) {
      const regex = new RegExp(`\\b${variant}\\b`, 'i');
      if (regex.test(msgLower)) {
        return country;
      }
    } else {
      // For longer variants, simple includes is fine
      if (msgLower.includes(variant)) {
        return country;
      }
    }
  }
  
  return null;
}

// Extract ALL countries mentioned in a message (for negation handling)
function extractAllCountries(message: string): string[] {
  const countries: string[] = [];
  const msgLower = message.toLowerCase();
  
  // Check Thai country names
  for (const [thai, english] of Object.entries(COUNTRY_MAPPINGS)) {
    if (message.includes(thai) && !countries.includes(english)) {
      countries.push(english);
    }
  }
  
  // Check English country names (word boundaries for short names)
  const englishCountries2 = [...new Set(Object.values(COUNTRY_MAPPINGS))];
  for (const country of englishCountries2) {
    const countryLower = country.toLowerCase();
    if (!countries.includes(country)) {
      if (countryLower.length <= 3) {
        const regex = new RegExp(`\\b${countryLower}\\b`, 'i');
        if (regex.test(msgLower)) {
          countries.push(country);
        }
      } else if (msgLower.includes(countryLower)) {
        countries.push(country);
      }
    }
  }
  
  // Check common variations
  const countryVariations: Record<string, string> = {
    'korea': 'South Korea',
    'hk': 'Hong Kong',
    'hong kong': 'Hong Kong',
    'hongkong': 'Hong Kong',
    'uk': 'UK',
    'england': 'UK',
    'britain': 'UK',
    'us': 'USA',
    'united states': 'USA',
    'america': 'USA',
    'uae': 'UAE',
    'emirates': 'UAE',
    'new zealand': 'New Zealand',
    'nz': 'New Zealand',
    'aus': 'Australia',
    'germany': 'Germany',
    'japan': 'Japan',
  };
  
  for (const [variant, country] of Object.entries(countryVariations)) {
    if (variant.length <= 3) {
      const regex = new RegExp(`\\b${variant}\\b`, 'i');
      if (regex.test(msgLower) && !countries.includes(country)) {
        countries.push(country);
      }
    } else if (msgLower.includes(variant) && !countries.includes(country)) {
      countries.push(country);
    }
  }
  
  return countries;
}

// Extract country with negation detection
// Handles phrases like "Germany ไม่ใช่ Japan" or "Germany not Japan"
function extractCountryWithNegation(message: string): { 
  country: string | null; 
  negatedCountries: string[] 
} {
  const negatedCountries: string[] = [];
  
  // Thai negation patterns
  const thaiNegationPatterns = [
    /ไม่ใช่\s*([\u0E00-\u0E7Fa-zA-Z\s]+)/gi,      // "ไม่ใช่ Japan" or "ไม่ใช่ ญี่ปุ่น"
    /ไม่\s*(?:ต้อง|ได้|เอา)\s*([\u0E00-\u0E7Fa-zA-Z\s]+)/gi, // "ไม่เอา Japan"
  ];
  
  // English negation patterns  
  const englishNegationPatterns = [
    /not\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/gi,         // "not Japan"
    /(?:don't|dont)\s+want\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/gi, // "don't want Japan"
  ];
  
  // Process Thai patterns
  for (const pattern of thaiNegationPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const potentialNegated = match[1].trim();
      // Try to extract a country from this match
      const possibleCountry = extractCountry(potentialNegated);
      if (possibleCountry) {
        negatedCountries.push(possibleCountry.toLowerCase());
        console.log(`[Negation] Detected negated country (Thai pattern): ${possibleCountry}`);
      }
    }
  }
  
  // Process English patterns
  for (const pattern of englishNegationPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const potentialNegated = match[1].trim();
      const possibleCountry = extractCountry(potentialNegated);
      if (possibleCountry) {
        negatedCountries.push(possibleCountry.toLowerCase());
        console.log(`[Negation] Detected negated country (English pattern): ${possibleCountry}`);
      }
    }
  }
  
  // Extract all countries from message
  const allCountries = extractAllCountries(message);
  
  // Return first country that is NOT negated
  const validCountry = allCountries.find(
    c => !negatedCountries.includes(c.toLowerCase())
  );
  
  if (validCountry) {
    console.log(`[Negation] Valid country after negation check: ${validCountry} (negated: ${negatedCountries.join(', ') || 'none'})`);
  }
  
  return { country: validCountry || null, negatedCountries };
}

// Extract country specifically for APN queries - more targeted extraction
// Strips provider names and focuses on country phrases
function extractCountryForAPNQuery(message: string): string | null {
  const lowerMsg = message.toLowerCase();
  
  // Remove provider names that might confuse extraction
  let cleanedMsg = lowerMsg
    .replace(/\busimsa\b/gi, '')
    .replace(/\bu-simsa\b/gi, '')
    .replace(/\btuge\b/gi, '')
    .replace(/\bcmlink\b/gi, '')
    .replace(/\bcmhk\b/gi, '')
    .replace(/\besim\b/gi, '')
    .replace(/\be-sim\b/gi, '');
  
  // Try to extract country from common APN question patterns
  const patterns = [
    /apn\s+(?:for|of|in)\s+([a-z\s]+?)(?:\s+from|\s+esim|\s+please|\?|$)/i,
    /(?:for|in|to)\s+([a-z\s]+?)\s+(?:apn|esim)/i,
    /([a-z\s]+?)\s+apn/i,
  ];
  
  for (const pattern of patterns) {
    const match = cleanedMsg.match(pattern);
    if (match && match[1]) {
      const potentialCountry = match[1].trim();
      // Validate it looks like a country (not just random words)
      if (potentialCountry.length >= 2 && potentialCountry.length <= 30) {
        // Now try to resolve this through our country variations
        const resolved = extractCountry(potentialCountry);
        if (resolved) {
          console.log(`[APNExtract] Extracted country "${resolved}" from pattern match "${potentialCountry}"`);
          return resolved;
        }
      }
    }
  }
  
  // Fallback: try extractCountry on the cleaned message
  const fallback = extractCountry(cleanedMsg);
  if (fallback) {
    console.log(`[APNExtract] Fallback extraction found country: ${fallback}`);
  }
  return fallback;
}

// Get network/carrier info for a country (used in freetext mode to provide accurate carrier answers)
interface NetworkInfo {
  country: string;
  carriers: string[];
  networkTypes: string[];
  apns: string[];
}

// Provider-specific APN configuration from database
interface ProviderAPNConfig {
  primaryApn: string;
  alternativeApns: string[];
  hotspotApn: string | null;
  apnType: string | null;
  providerName: string;
}

// Order lookup result for APN troubleshooting
interface OrderLookupResult {
  found: boolean;
  orderId?: string;
  iccid?: string;
  providerId?: string;
  providerCode?: string;
  countryCode?: string;
  packageName?: string;
}

// Known provider names/codes that users might mention
const PROVIDER_ALIASES: Record<string, string> = {
  'usimsa': 'USIMSA',
  'u-simsa': 'USIMSA',
  'usim': 'USIMSA',
  'tuge': 'TUGE',
  'cmlink': 'USIMSA', // CMLINK is USIMSA's APN
  'cmhk': 'USIMSA',   // cmhk is also USIMSA
};

// Extract provider name from user message
function extractProviderName(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  for (const [alias, providerCode] of Object.entries(PROVIDER_ALIASES)) {
    // Use word boundary check to avoid false positives
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(lowerMessage)) {
      console.log(`[ProviderExtract] Found provider "${providerCode}" from alias "${alias}"`);
      return providerCode;
    }
  }
  
  return null;
}

// Look up provider ID by provider code/name
async function lookupProviderByCode(
  supabase: any,
  providerCode: string
): Promise<{ providerId: string; providerName: string } | null> {
  console.log(`[ProviderLookup] Looking up provider by code: ${providerCode}`);
  
  const { data: provider, error } = await supabase
    .from('esim_providers')
    .select('id, provider_name, provider_code')
    .ilike('provider_code', providerCode)
    .eq('is_active', true)
    .limit(1)
    .single();
  
  if (error || !provider) {
    console.log(`[ProviderLookup] Provider not found: ${providerCode}`);
    return null;
  }
  
  console.log(`[ProviderLookup] Found provider: ${provider.provider_name} (${provider.id})`);
  return {
    providerId: provider.id,
    providerName: provider.provider_name
  };
}

// Extract order ID or ICCID from user message
function extractOrderOrICCID(message: string): string | null {
  const upperMessage = message.toUpperCase();
  
  // Match order ID pattern: ORD-XXXX or EXT-XXXX or any alphanumeric order-like pattern
  const orderMatch = upperMessage.match(/(ORD-[\w-]+|EXT-[\w-]+)/);
  if (orderMatch) return orderMatch[1];
  
  // Match ICCID pattern: 19-20 digit number starting with 89
  const iccidMatch = message.match(/\b(89\d{17,18})\b/);
  if (iccidMatch) return iccidMatch[1];
  
  // Match short code pattern (8 alphanumeric characters)
  // IMPORTANT: be strict to avoid false positives like normal words (e.g. "answered").
  // We only accept short codes that contain at least one digit.
  // Users can always provide ORD-... or ICCID (89...) if they don't have the short code.
  const shortCodeMatch = message.match(/\b([a-zA-Z0-9]{8})\b/);
  if (shortCodeMatch) {
    const code = shortCodeMatch[1];
    const hasDigit = /\d/.test(code);
    const isJustTheCode = message.trim() === code;
    const mentionsCode = /(order|short\s*code|code|ref|reference)/i.test(message);

    if (hasDigit && /^[a-z0-9]+$/i.test(code) && (isJustTheCode || mentionsCode)) {
      return code;
    }
  }
  
  return null;
}

// Direct country name to ISO code mapping (independent of esim_packages table)
// This ensures APN lookups work even for countries without direct eSIM packages
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // Middle East
  'israel': 'IL',
  'turkey': 'TR',
  'turkiye': 'TR',
  'qatar': 'QA',
  'uae': 'AE',
  'united arab emirates': 'AE',
  'dubai': 'AE',
  'saudi arabia': 'SA',
  'kuwait': 'KW',
  'bahrain': 'BH',
  'oman': 'OM',
  'jordan': 'JO',
  'lebanon': 'LB',
  'egypt': 'EG',
  'iran': 'IR',
  'iraq': 'IQ',
  
  // Europe
  'ireland': 'IE',
  'croatia': 'HR',
  'uk': 'GB',
  'united kingdom': 'GB',
  'england': 'GB',
  'britain': 'GB',
  'france': 'FR',
  'germany': 'DE',
  'italy': 'IT',
  'spain': 'ES',
  'portugal': 'PT',
  'netherlands': 'NL',
  'belgium': 'BE',
  'austria': 'AT',
  'switzerland': 'CH',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'poland': 'PL',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'hungary': 'HU',
  'greece': 'GR',
  'romania': 'RO',
  'bulgaria': 'BG',
  'ukraine': 'UA',
  'russia': 'RU',
  'slovakia': 'SK',
  'slovenia': 'SI',
  'iceland': 'IS',
  'luxembourg': 'LU',
  'cyprus': 'CY',
  'malta': 'MT',
  'estonia': 'EE',
  'latvia': 'LV',
  'lithuania': 'LT',
  
  // Asia
  'japan': 'JP',
  'south korea': 'KR',
  'korea': 'KR',
  'china': 'CN',
  'hongkong': 'HK',
  'hong kong': 'HK',
  'taiwan': 'TW',
  'singapore': 'SG',
  'malaysia': 'MY',
  'thailand': 'TH',
  'vietnam': 'VN',
  'indonesia': 'ID',
  'philippines': 'PH',
  'india': 'IN',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'sri lanka': 'LK',
  'nepal': 'NP',
  'cambodia': 'KH',
  'laos': 'LA',
  'myanmar': 'MM',
  'macau': 'MO',
  'brunei': 'BN',
  'mongolia': 'MN',
  
  // Americas
  'usa': 'US',
  'united states': 'US',
  'america': 'US',
  'canada': 'CA',
  'mexico': 'MX',
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'ecuador': 'EC',
  'uruguay': 'UY',
  'paraguay': 'PY',
  'venezuela': 'VE',
  'costa rica': 'CR',
  'panama': 'PA',
  'guatemala': 'GT',
  'puerto rico': 'PR',
  
  // Oceania
  'australia': 'AU',
  'new zealand': 'NZ',
  'fiji': 'FJ',
  
  // Africa
  'south africa': 'ZA',
  'morocco': 'MA',
  'kenya': 'KE',
  
  'ghana': 'GH',
  'tanzania': 'TZ',
  'uganda': 'UG',
  'ethiopia': 'ET',
  'tunisia': 'TN',
  'algeria': 'DZ',
};

// Convert country name to country code
function getCountryCodeFromName(countryName: string): string | undefined {
  const lowerName = countryName.toLowerCase().trim();
  
  // First try direct mapping
  if (COUNTRY_NAME_TO_CODE[lowerName]) {
    console.log(`[CountryCode] Direct mapping: ${countryName} -> ${COUNTRY_NAME_TO_CODE[lowerName]}`);
    return COUNTRY_NAME_TO_CODE[lowerName];
  }
  
  // Try partial matching for country names
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (lowerName.includes(name) || name.includes(lowerName)) {
      console.log(`[CountryCode] Partial match: ${countryName} -> ${code} (via ${name})`);
      return code;
    }
  }
  
  console.log(`[CountryCode] Not found for: ${countryName}`);
  return undefined;
}

// Look up order by order_id, ICCID, or short_code
async function lookupOrderByIdentifier(
  supabase: any,
  identifier: string
): Promise<OrderLookupResult> {
  const cleanId = identifier.trim();
  
  console.log(`[OrderLookup] Looking up order by: ${cleanId}`);
  
  // Try to find by order_id, ICCID, or short_code
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_id, iccid, provider_id, status, short_code,
      esim_packages!inner(country_code, name),
      esim_providers(provider_code, provider_name)
    `)
    .or(`order_id.ilike.%${cleanId}%,iccid.ilike.%${cleanId}%,short_code.ilike.%${cleanId}%`)
    .in('status', ['completed', 'active'])
    .limit(1)
    .single();
  
  if (error || !order) {
    console.log(`[OrderLookup] Not found for: ${cleanId}`);
    return { found: false };
  }
  
  console.log(`[OrderLookup] Found order: ${order.order_id}, provider: ${order.esim_providers?.provider_code}`);
  
  return {
    found: true,
    orderId: order.order_id,
    iccid: order.iccid,
    providerId: order.provider_id,
    providerCode: order.esim_providers?.provider_code,
    countryCode: order.esim_packages?.country_code,
    packageName: order.esim_packages?.name
  };
}

// Get provider-specific APN configuration from database
async function getProviderAPNConfig(
  supabase: any,
  providerId: string,
  countryCode?: string
): Promise<ProviderAPNConfig | null> {
  console.log(`[APNConfig] Fetching APN config for provider: ${providerId}, country: ${countryCode || 'any'}`);
  
  // First try country-specific config (highest priority)
  if (countryCode) {
    const { data: countryConfig, error: countryError } = await supabase
      .from('provider_apn_config')
      .select('*, esim_providers(provider_name)')
      .eq('provider_id', providerId)
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();
    
    if (!countryError && countryConfig) {
      console.log(`[APNConfig] Found country-specific config for ${countryCode}: ${countryConfig.primary_apn}`);
      return formatAPNConfig(countryConfig);
    }
  }
  
  // Try region-based config
  const regionCode = getRegionForCountry(countryCode);
  if (regionCode) {
    const { data: regionConfig, error: regionError } = await supabase
      .from('provider_apn_config')
      .select('*, esim_providers(provider_name)')
      .eq('provider_id', providerId)
      .eq('region_code', regionCode)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();
    
    if (!regionError && regionConfig) {
      console.log(`[APNConfig] Found region config for ${regionCode}: ${regionConfig.primary_apn}`);
      return formatAPNConfig(regionConfig);
    }
  }
  
  // Fall back to provider default
  const { data: defaultConfig, error: defaultError } = await supabase
    .from('provider_apn_config')
    .select('*, esim_providers(provider_name)')
    .eq('provider_id', providerId)
    .eq('region_code', 'DEFAULT')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(1)
    .single();
  
  if (!defaultError && defaultConfig) {
    console.log(`[APNConfig] Using default config: ${defaultConfig.primary_apn}`);
    return formatAPNConfig(defaultConfig);
  }
  
  console.log(`[APNConfig] No APN config found for provider: ${providerId}`);
  return null;
}

// Map country code to region
function getRegionForCountry(countryCode?: string): string | null {
  if (!countryCode) return null;
  
  const asiaCountries = ['JP', 'KR', 'TH', 'AE', 'SA', 'QA', 'IN', 'PK', 'BD', 'LK', 'NP', 'CN', 'TW', 'HK', 'MO'];
  const seaCountries = ['SG', 'MY', 'VN', 'ID', 'PH', 'LA', 'KH', 'MM', 'BN', 'TL'];
  const europeCountries = ['GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'PL', 'CZ', 'SE', 'NO', 'DK', 'FI', 'IE', 'GR', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'EE', 'LV', 'LT', 'LU', 'MT', 'CY'];
  const americasCountries = ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE'];
  
  if (seaCountries.includes(countryCode)) return 'SOUTHEAST_ASIA';
  if (asiaCountries.includes(countryCode)) return 'ASIA';
  if (europeCountries.includes(countryCode)) return 'EUROPE';
  if (americasCountries.includes(countryCode)) return 'AMERICAS';
  
  return null;
}

// Format APN config from database row
function formatAPNConfig(config: any): ProviderAPNConfig {
  return {
    primaryApn: config.primary_apn,
    alternativeApns: config.alternative_apns || [],
    hotspotApn: config.hotspot_apn,
    apnType: config.apn_type,
    providerName: config.esim_providers?.provider_name || 'Unknown'
  };
}

// Build provider-specific APN instructions for user
function buildProviderAPNInstructions(
  apnConfig: ProviderAPNConfig,
  deviceType: 'iphone' | 'android' | null,
  language: SupportedLanguage
): string {
  if (language === 'th') {
    // IMPORTANT: This block is injected into the SYSTEM prompt.
    // We must explicitly override the global "identifier-first" policy when we already have
    // provider-specific APN settings from the database.
    // Build the mandatory APN list for the instruction
    const mandatoryApnList = [`- APN หลัก: ${apnConfig.primaryApn}`];
    if (apnConfig.alternativeApns.length > 0) {
      mandatoryApnList.push(`- APN สำรอง: ${apnConfig.alternativeApns.join(', ')}`);
    }
    if (apnConfig.hotspotApn) {
      mandatoryApnList.push(`- APN Hotspot: ${apnConfig.hotspotApn}`);
    }

    let instructions = `

[SYSTEM INSTRUCTION - HIGH PRIORITY: เราได้ดึงค่า APN ที่ถูกต้องจากฐานข้อมูลแล้ว ให้ตอบผู้ใช้ด้วยค่า APN และขั้นตอนด้านล่างทันที
ห้ามขอ Order Number หรือ ICCID เพิ่ม และห้ามปฏิเสธการให้ค่า APN ในกรณีนี้

MANDATORY - คุณต้องแสดง APN ทุกตัวที่ระบุด้านล่างในคำตอบของคุณ:
${mandatoryApnList.join('\n')}

ห้ามแนะนำ APN อื่นใดที่ไม่ได้อยู่ในรายการนี้ เช่น ห้ามใช้ "internet" หรือ APN ทั่วไปอื่นๆ เด็ดขาด]

═══════════════════════════════════════════════════════════════
📱 การตั้งค่า APN สำหรับ eSIM ของคุณ
═══════════════════════════════════════════════════════════════

**APN หลัก (ลองอันนี้ก่อน):** \`${apnConfig.primaryApn}\`
`;

    if (apnConfig.alternativeApns.length > 0) {
      instructions += `**APN สำรอง (ถ้า APN หลักไม่ทำงาน ลองตัวเลือกเหล่านี้ตามลำดับ):**\n`;
      apnConfig.alternativeApns.forEach((apn, index) => {
        instructions += `  ${index + 1}. \`${apn}\`\n`;
      });
    }

    if (apnConfig.hotspotApn) {
      instructions += `**APN สำหรับ Hotspot:** ${apnConfig.hotspotApn}\n`;
    }

    if (deviceType === 'iphone' || !deviceType) {
      instructions += `
📱 **ขั้นตอนสำหรับ iPhone:**
1. ไปที่ ตั้งค่า > เซลลูลาร์ > [เลือก eSIM ของคุณ]
2. แตะ "เครือข่ายข้อมูลเซลลูลาร์"
3. ใส่ APN: \`${apnConfig.primaryApn}\`
4. สำหรับ Hotspot: เลื่อนไปที่ส่วน "ฮอตสปอตส่วนตัว"
5. ใส่ APN: \`${apnConfig.hotspotApn || apnConfig.primaryApn}\`
`;
    }

    if (deviceType === 'android' || !deviceType) {
      instructions += `
🤖 **ขั้นตอนสำหรับ Android:**
1. ไปที่ ตั้งค่า > เครือข่ายและอินเทอร์เน็ต > SIMs
2. เลือก eSIM ของคุณ > Access Point Names
3. แตะ + เพื่อเพิ่ม APN ใหม่
4. ใส่ ชื่อ: "Mobile11", APN: \`${apnConfig.primaryApn}\`
5. บันทึกและเลือก APN ใหม่
${apnConfig.apnType ? `6. หาก Hotspot ไม่ทำงาน ตั้งค่า APN Type เป็น: \`${apnConfig.apnType}\`` : ''}
`;
    }

    instructions += `
**หลังจากเปลี่ยน APN:**
1. เปิดโหมดเครื่องบิน 30 วินาที
2. ปิดโหมดเครื่องบิน
3. รอ 1-2 นาทีเพื่อเชื่อมต่อ
═══════════════════════════════════════════════════════════════
`;
    return instructions;
  }

  // English version
  // IMPORTANT: This block is injected into the SYSTEM prompt.
  // We must explicitly override the global "identifier-first" policy when we already have
  // provider-specific APN settings from the database.
  // Build the mandatory APN list for the instruction
  const mandatoryApnListEn = [`- Primary APN: ${apnConfig.primaryApn}`];
  if (apnConfig.alternativeApns.length > 0) {
    mandatoryApnListEn.push(`- Alternative APNs: ${apnConfig.alternativeApns.join(', ')}`);
  }
  if (apnConfig.hotspotApn) {
    mandatoryApnListEn.push(`- Hotspot APN: ${apnConfig.hotspotApn}`);
  }

  let instructions = `

[SYSTEM INSTRUCTION - HIGH PRIORITY: We have already retrieved the correct, provider-specific APN settings from our database.
You MUST provide the APN settings and steps below now. Do NOT ask for Order Number or ICCID in this case, and do NOT refuse to share APN values.

MANDATORY - You MUST include ALL of these APNs in your response:
${mandatoryApnListEn.join('\n')}

NEVER suggest any APN not in this list. Do NOT suggest "internet" or any other generic APN.]

═══════════════════════════════════════════════════════════════
📱 APN SETTINGS FOR YOUR eSIM
═══════════════════════════════════════════════════════════════

**PRIMARY APN (Try this first):** \`${apnConfig.primaryApn}\`
`;

  if (apnConfig.alternativeApns.length > 0) {
    instructions += `**Alternative APNs (If primary doesn't work, try these in order):**\n`;
    apnConfig.alternativeApns.forEach((apn, index) => {
      instructions += `  ${index + 1}. \`${apn}\`\n`;
    });
  }

  if (apnConfig.hotspotApn) {
    instructions += `**Hotspot APN:** ${apnConfig.hotspotApn}\n`;
  }

  if (deviceType === 'iphone' || !deviceType) {
    instructions += `
📱 **iPhone Instructions:**
1. Go to Settings > Cellular > [Your eSIM line]
2. Tap "Cellular Data Network"
3. Set APN: \`${apnConfig.primaryApn}\`
4. For hotspot: Scroll to "Personal Hotspot" section
5. Set APN: \`${apnConfig.hotspotApn || apnConfig.primaryApn}\`
`;
  }

  if (deviceType === 'android' || !deviceType) {
    instructions += `
🤖 **Android Instructions:**
1. Settings > Network & Internet > SIMs
2. Select your eSIM > Access Point Names
3. Tap + to add new APN
4. Enter Name: "Mobile11", APN: \`${apnConfig.primaryApn}\`
5. Save and select the new APN
${apnConfig.apnType ? `6. If hotspot doesn't work, set APN Type to: \`${apnConfig.apnType}\`` : ''}
`;
  }

  instructions += `
**After changing APN:**
1. Turn on Airplane mode for 30 seconds
2. Turn off Airplane mode
3. Wait 1-2 minutes for connection
═══════════════════════════════════════════════════════════════
`;
  return instructions;
}

async function getNetworkInfoForCountry(
  supabase: any,
  country: string
): Promise<NetworkInfo | null> {
  if (!country) return null;
  
  try {
    const { data, error } = await supabase
      .from('esim_packages')
      .select('carrier, network_type, apn')
      .eq('is_active', true)
      .ilike('country_name', `%${country}%`);
    
    if (error || !data || data.length === 0) {
      console.log(`No packages found for country: ${country}`);
      return null;
    }
    
    // Extract unique carriers, network types, and APNs
    const carriers = [...new Set(
      data
        .map((pkg: any) => pkg.carrier)
        .filter((c: string | null) => c && c.trim() !== '')
    )] as string[];
    
    const networkTypes = [...new Set(
      data
        .map((pkg: any) => pkg.network_type)
        .filter((n: string | null) => n && n.trim() !== '')
    )] as string[];
    
    const apns = [...new Set(
      data
        .map((pkg: any) => pkg.apn)
        .filter((a: string | null) => a && a.trim() !== '' && !a.toLowerCase().includes('countries'))
    )] as string[];
    
    console.log(`Network info for ${country}: carriers=${carriers.join(', ')}, networkTypes=${networkTypes.join(', ')}, apns=${apns.join(', ')}`);
    
    return {
      country,
      carriers,
      networkTypes,
      apns
    };
  } catch (err: any) {
    console.error('Error fetching network info:', err);
    return null;
  }
}

// Japan carrier characteristics for AI response context
const JAPAN_CARRIER_INFO: Record<string, {
  rating: number;
  coverage: string;
  strengths: string;
  thaiDescription: string;
}> = {
  'DOCOMO': {
    rating: 5,
    coverage: 'Best nationwide coverage, including rural areas',
    strengths: 'Top rated network in Japan, strongest signal in countryside and mountains',
    thaiDescription: 'เครือข่ายอันดับ 1 ของญี่ปุ่น ครอบคลุมทั่วประเทศรวมถึงพื้นที่ห่างไกล',
  },
  'Softbank / KDDI': {
    rating: 4,
    coverage: 'Excellent urban coverage',
    strengths: 'Strong signal in cities, good value option',
    thaiDescription: 'สัญญาณดีในเมือง ราคาคุ้มค่า',
  }
};

// Build network info context for AI prompt
function buildNetworkInfoContext(networkInfo: NetworkInfo | null): string {
  if (!networkInfo) return '';
  
  // Special handling for Japan - user CAN choose carrier
  if (networkInfo.country.toLowerCase() === 'japan' && networkInfo.carriers.length > 1) {
    return `

═══════════════════════════════════════════════════════════════
📡 JAPAN CARRIER SELECTION (CRITICAL - USER CHOOSES, NOT AUTOMATIC):
═══════════════════════════════════════════════════════════════
Japan offers TWO carrier options. The customer CHOOSES which one - it is NOT automatic.

**DOCOMO (NTT DOCOMO)** ⭐⭐⭐⭐⭐
- Japan's #1 network with best nationwide coverage
- Excellent signal in rural areas, mountains, and countryside
- Slightly higher price but premium quality
- Thai: "DOCOMO เครือข่ายอันดับ 1 ครอบคลุมทั่วญี่ปุ่น แม้พื้นที่ห่างไกล"

**Softbank / KDDI** ⭐⭐⭐⭐
- Excellent coverage in cities and urban areas
- Great value option with competitive pricing
- Strong signal in Tokyo, Osaka, major tourist spots
- Thai: "Softbank/KDDI สัญญาณดีในเมือง ราคาคุ้มค่า"

⚠️ HOW TO RESPOND:
- NEVER say "system will auto-select" or "ระบบจะเลือกให้อัตโนมัติ" - this is FALSE
- Tell customer they can CHOOSE their carrier on the purchase page
- Recommend DOCOMO for: rural travel, mountains, countryside, Hokkaido, Okinawa outer islands
- Recommend Softbank/KDDI for: city travel only (Tokyo, Osaka, Kyoto), budget-conscious
- Ask where they're traveling to make a personalized recommendation
- Direct them to the country page where they can select their preferred carrier
═══════════════════════════════════════════════════════════════
`;
  }
  
  const carriersText = networkInfo.carriers.length > 0 
    ? networkInfo.carriers.join(', ') 
    : 'quality local network';
  const networkTypesText = networkInfo.networkTypes.length > 0 
    ? networkInfo.networkTypes.join(', ') 
    : '4G/LTE';
  const apnsText = networkInfo.apns.length > 0 
    ? networkInfo.apns.join(' or ') 
    : 'CMLINK';
  
  return `

═══════════════════════════════════════════════════════════════
📡 NETWORK INFO (FROM DATABASE - USE EXACTLY, DO NOT INVENT):
═══════════════════════════════════════════════════════════════
- Country: ${networkInfo.country}
- Carrier(s): ${carriersText}
- Network Type(s): ${networkTypesText}
- APN Setting(s): ${apnsText}

⚠️ IMPORTANT: Use ONLY the carrier/network/APN info above when answering.
For APN settings, recommend: ${apnsText}
DO NOT invent or guess other carrier names or APN values!
═══════════════════════════════════════════════════════════════
`;
}

// Build troubleshooting-focused network context (emphasizes APN settings)
function buildTroubleshootingNetworkContext(networkInfo: NetworkInfo | null): string {
  if (!networkInfo) return '';
  
  const apnsText = networkInfo.apns.length > 0 
    ? networkInfo.apns.join(' or ') 
    : 'CMLINK';
  const carriersText = networkInfo.carriers.length > 0 
    ? networkInfo.carriers.join(' / ') 
    : 'local carrier';
  const networkTypesText = networkInfo.networkTypes.length > 0 
    ? networkInfo.networkTypes.join(' / ') 
    : '4G/LTE';
  
  return `

═══════════════════════════════════════════════════════════════
🔧 TROUBLESHOOTING INFO FOR ${networkInfo.country.toUpperCase()}:
═══════════════════════════════════════════════════════════════
- APN Setting: ${apnsText}
- Carrier: ${carriersText}
- Network: ${networkTypesText}

IMPORTANT: For accurate APN settings, ask user for their Order Number or ICCID.
This allows looking up their specific eSIM provider and providing exact APN values.

If user provides order/ICCID, use the provider-specific APN from the lookup.
If no order info available, suggest trying these APNs in order:
1. CMLINK (works for most packages)
2. cmhk (works for Asia)
3. ${apnsText}

When helping with connection issues, ALWAYS suggest:
1. Check if eSIM is enabled and set as primary data line
2. Enable Data Roaming (Settings > Cellular > Cellular Data Options > Data Roaming)
3. Manually set APN (ask for order# to get exact APN)
4. Turn Airplane mode on for 30 seconds, then off
5. Restart device if still not connecting

For HOTSPOT issues specifically:
- iPhone: Also set Personal Hotspot APN to the same value
- Android: Set APN Type to: default,supl,dun
═══════════════════════════════════════════════════════════════
`;
}

// Detect if user is asking about carriers/networks/APN
function isCarrierQuestion(message: string): boolean {
  const carrierKeywords = [
    // English - carrier/network
    'carrier', 'network', 'operator', 'provider', 'signal',
    'which carrier', 'what carrier', 'what network', 'which network',
    // English - APN specific
    'apn', 'access point', 'apn setting', 'apn name', 'what is apn', 'what apn',
    // Thai - carrier/network
    'ผู้ให้บริการ', 'เครือข่าย', 'ค่าย', 'ใช้ค่ายอะไร', 'เครือข่ายอะไร',
    'ค่ายอะไร', 'ใช้เครือข่าย', 'สัญญาณ',
    // Thai - APN specific
    'เอพีเอ็น', 'ตั้งค่า apn', 'ค่า apn'
  ];
  
  const lowerMessage = message.toLowerCase();
  return carrierKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Detect if user is asking for troubleshooting help
function isTroubleshootingQuestion(message: string): boolean {
  const troubleshootKeywords = [
    // English - general issues
    'can\'t connect', 'cannot connect', 'not working', 'no internet',
    'no service', 'no signal', 'won\'t work', 'doesn\'t work', 'don\'t work',
    'help', 'problem', 'issue', 'error', 'trouble', 'fix', 'broken',
    'slow', 'can\'t use', 'cannot use', 'not connected', 'disconnected',
    'failed', 'failing', 'stuck', 'unable', 'can not',
    // English - hotspot/tethering
    'hotspot', 'tethering', 'personal hotspot', 'share data', 'share wifi',
    'share internet', 'cannot hotspot', 'hotspot not working', 'tether',
    // Thai - general issues
    'ใช้ไม่ได้', 'เน็ตไม่เข้า', 'ไม่มีสัญญาณ', 'ปัญหา', 'ช่วยด้วย',
    'เชื่อมต่อไม่ได้', 'ไม่ทำงาน', 'ไม่ได้', 'เน็ตช้า', 'ไม่มีเน็ต',
    'แก้ไข', 'ซ่อม', 'เสีย', 'ไม่เข้า', 'หลุด', 'ขัดข้อง',
    // Thai - hotspot/tethering
    'ฮอตสปอต', 'แชร์เน็ต', 'ปล่อย wifi', 'ปล่อยเน็ต', 'แชร์อินเทอร์เน็ต',
    'hotspot ไม่ได้', 'ปล่อยสัญญาณ'
  ];
  
  const lowerMessage = message.toLowerCase();
  return troubleshootKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Detect if user is asking specifically about APN settings
function isAPNQuestion(message: string): boolean {
  const apnKeywords = [
    'apn', 'access point', 'apn setting', 'change apn', 'set apn', 'what apn',
    'apn name', 'cellular data network', 'ตั้งค่า apn', 'เอพีเอ็น', 'ค่า apn'
  ];
  const lowerMessage = message.toLowerCase();
  return apnKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Detect if user is asking about packages/pricing
function isPackageQuestion(message: string): boolean {
  const keywords = [
    'package', 'plan', 'price', 'buy', 'esim', 'how much',
    'recommend', 'suggest', 'best', 'cheapest', 'cost',
    'แพ็คเกจ', 'ราคา', 'ซื้อ', 'อีซิม', 'แนะนำ', 'เท่าไหร่', 'ถูก'
  ];
  const lower = message.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// Detect if user is asking about installation
function isInstallQuestion(message: string): boolean {
  const keywords = [
    'install', 'setup', 'activate', 'qr', 'scan', 'how to use',
    'add esim', 'download', 'configure',
    'ติดตั้ง', 'เปิดใช้งาน', 'ตั้งค่า', 'สแกน', 'วิธีใช้', 'ดาวน์โหลด'
  ];
  const lower = message.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// Detect if user wants to reset/start fresh
function isResetRequest(message: string): boolean {
  const resetKeywords = [
    'new topic', 'new question', 'start over', 'reset', 
    'different question', 'change topic', 'forget that', 'start fresh',
    'เปลี่ยนเรื่อง', 'ถามใหม่', 'เรื่องใหม่', 'คำถามใหม่', 'ลืมไปเถอะ', 'เริ่มใหม่'
  ];
  const lower = message.toLowerCase();
  return resetKeywords.some(k => lower.includes(k));
}

// Full conversation context interface
interface ConversationContext {
  country: string | null;
  topic: 'carrier' | 'troubleshooting' | 'package' | 'install' | 'general' | null;
  deviceType: 'iphone' | 'android' | null;
  reportedIssue: string | null;
  validityDays: number | null;
  isReset: boolean;
  orderIdentifier: string | null; // Order ID or ICCID from conversation
  dataUsage: 'light' | 'medium' | 'heavy' | null; // User's data usage preference
  preferredLanguage: SupportedLanguage | null; // Track language from conversation history
  serviceTierPreference: 'priority' | 'economy' | null; // Customer prefers quality (priority) or savings (economy)
}

// Detect if the current message is a short answer to a previous bot question
// This helps preserve context when users respond with just "7" or "เยอะ"
interface FollowUpAnswerResult {
  isDaysAnswer: boolean;
  isDataAnswer: boolean;
  isServiceTierAnswer: boolean;
  preserveContext: boolean;
  extractedDays?: number;
  extractedDataUsage?: 'light' | 'heavy';
  extractedServiceTier?: 'priority' | 'economy';
  preservedCountry?: string; // Country from the bot's question (e.g., "Germany" from "จะไปเที่ยว Germany กี่วันดีครับ?")
}

function detectFollowUpAnswer(message: string, history: Message[]): FollowUpAnswerResult {
  const result: FollowUpAnswerResult = {
    isDaysAnswer: false,
    isDataAnswer: false,
    isServiceTierAnswer: false,
    preserveContext: false
  };
  
  // Get last assistant message
  const lastBotMsg = [...history].reverse().find(m => m.role === 'assistant');
  if (!lastBotMsg) return result;
  
  const botContent = lastBotMsg.content.toLowerCase().replace(/\*\*/g, '');
  const msgLower = message.toLowerCase().trim();
  
  // Check if bot asked about days and message is a number
  const dayQuestionPatterns = ['กี่วัน', 'how many days', 'how long', 'จำนวนวัน', 'trip length', 'duration'];
  const isNumericAnswer = /^\d{1,2}$/.test(msgLower) || /^\d+\s*(days?|วัน)$/i.test(msgLower);
  
  if (dayQuestionPatterns.some(p => botContent.includes(p)) && isNumericAnswer) {
    result.isDaysAnswer = true;
    result.preserveContext = true;
    const numMatch = msgLower.match(/\d+/);
    if (numMatch) {
      result.extractedDays = parseInt(numMatch[0], 10);
    }
    console.log(`[FollowUp] Detected days answer: ${result.extractedDays}`);
    
    // CRITICAL: Extract country from the bot's question to preserve it
    // e.g., "จะไปเที่ยว Germany กี่วันดีครับ?" -> extract "Germany"
    const botMentionedCountry = extractCountry(lastBotMsg.content);
    if (botMentionedCountry) {
      result.preservedCountry = botMentionedCountry;
      console.log(`[FollowUp] Preserving country from bot question: ${botMentionedCountry}`);
    }
  }
  
  // Check if bot asked about data usage
  const dataQuestionPatterns = [
    'ใช้เน็ตเยอะ', 'use a lot of data', 'streaming', 'video calls',
    'basic things', 'แชททั่วไป', 'ดูวิดีโอ', 'data usage', 'how much data',
    'heavy usage', 'light usage', 'ใช้เน็ตมาก', 'ใช้เน็ตน้อย',
    'unlimited internet', 'pay-per-use', 'เน็ตแรงไม่อั้น', 'เน็ตตามจริง',
    'เน็ตไม่อั้น', 'ใช้เน็ตแบบไหน', 'how would you like to use internet'
  ];
  
  const heavyAnswerPatterns = ['เยอะ', 'มาก', 'yes', 'a lot', 'heavy', 'streaming', 'video', 'work', 'ใช่', 'ครับ', 'ค่ะ', 'unlimited', 'ไม่อั้น', 'เน็ตไม่อั้น'];
  const lightAnswerPatterns = ['basic', 'ธรรมดา', 'ปกติ', 'น้อย', 'no', 'not much', 'light', 'simple', 'ไม่เยอะ', 'ไม่มาก', 'pay per use', 'pay-per-use', 'ตามจริง', 'เน็ตตามจริง'];
  
  if (dataQuestionPatterns.some(p => botContent.includes(p))) {
    if (heavyAnswerPatterns.some(p => msgLower.includes(p) || msgLower === p)) {
      result.isDataAnswer = true;
      result.preserveContext = true;
      result.extractedDataUsage = 'heavy';
      console.log(`[FollowUp] Detected heavy data usage answer`);
    } else if (lightAnswerPatterns.some(p => msgLower.includes(p) || msgLower === p)) {
      result.isDataAnswer = true;
      result.preserveContext = true;
      result.extractedDataUsage = 'light';
      console.log(`[FollowUp] Detected light data usage answer`);
    }
    
    // Also preserve country for data usage questions
    const botMentionedCountry = extractCountry(lastBotMsg.content);
    if (botMentionedCountry && !result.preservedCountry) {
      result.preservedCountry = botMentionedCountry;
      console.log(`[FollowUp] Preserving country from data question: ${botMentionedCountry}`);
    }
  }
  
  // Service tier detection removed - no longer asking Priority vs Economy
  
  return result;
}

// Extract full context from conversation history
function extractFullContext(
  history: Message[], 
  currentMessage: string
): ConversationContext {
  const context: ConversationContext = {
    country: null,
    topic: null,
    deviceType: null,
    reportedIssue: null,
    validityDays: null,
    isReset: false,
    orderIdentifier: null,
    dataUsage: null,
    preferredLanguage: null,
    serviceTierPreference: null
  };
  
  // Check for reset marker in history - find the LAST reset marker
  let resetIndex = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].content === '[CONTEXT_RESET]' || history[i].content.includes('[CONTEXT_RESET]')) {
      resetIndex = i;
      break;
    }
  }
  
  // Only use messages after the LAST reset
  const relevantHistory = resetIndex !== -1 
    ? history.slice(resetIndex + 1) 
    : history;
  
  if (resetIndex !== -1) {
    context.isReset = true;
    console.log(`[Context] Reset found at index ${resetIndex} - using ${relevantHistory.length} messages after reset`);
  }
  
  // Check if current message is a reset request
  if (isResetRequest(currentMessage)) {
    console.log('[Context] Reset requested via keywords');
    return context; // Return empty context
  }
  
  // IMPORTANT: Detect if this is a follow-up answer to a bot question
  // This helps preserve context when user responds with just "7" or "เยอะ"
  const followUpAnswer = detectFollowUpAnswer(currentMessage, relevantHistory);
  if (followUpAnswer.preserveContext) {
    console.log(`[Context] Follow-up answer detected - preserving previous context`);
  }
  
  // Combine current + history for analysis (only user messages)
  const allUserMessages = [
    ...relevantHistory.filter(m => m.role === 'user'),
    { role: 'user', content: currentMessage }
  ];
  
  // 1. Extract country (current message first with negation handling, then RECENT history)
  const { country: currentCountry, negatedCountries } = extractCountryWithNegation(currentMessage);
  context.country = currentCountry;
  if (currentCountry) {
    console.log(`[Context] Extracted country from current message: ${currentCountry} (negated: ${negatedCountries.join(', ') || 'none'})`);
  }
  
  // Check if the previous assistant message was asking about data usage
  // If so, preserve the country context from BEFORE that question
  const lastAssistantMsg = relevantHistory.filter(m => m.role === 'assistant').pop();
  const wasDataUsageQuestion = lastAssistantMsg && (
    lastAssistantMsg.content.toLowerCase().includes('stream') ||
    lastAssistantMsg.content.toLowerCase().includes('video') ||
    lastAssistantMsg.content.toLowerCase().includes('ดูวิดีโอ') ||
    lastAssistantMsg.content.toLowerCase().includes('ใช้เน็ตเยอะ') ||
    lastAssistantMsg.content.toLowerCase().includes('how much data') ||
    lastAssistantMsg.content.toLowerCase().includes('data usage')
  );
  
  // PRIORITY 0: If this is a follow-up answer, use the preserved country from bot's question
  // This is CRITICAL for preventing context pollution when user types "10" after bot asks about Germany
  if (!context.country && followUpAnswer.preserveContext && followUpAnswer.preservedCountry) {
    context.country = followUpAnswer.preservedCountry;
    console.log(`[Context] Using preserved country from follow-up: ${context.country}`);
  }
  
  if (!context.country) {
    // PRIORITY 1: Check RECENT USER messages for country context with NEGATION HANDLING
    // Search in REVERSE order (most recent first) and respect negation patterns
    const recentUserMessages = relevantHistory.slice(-6).filter(m => m.role === 'user');
    
    for (const msg of recentUserMessages.slice().reverse()) {
      // Use negation-aware extraction
      const { country: foundCountry, negatedCountries } = extractCountryWithNegation(msg.content);
      if (foundCountry) {
        context.country = foundCountry;
        console.log(`[Context] Found country "${foundCountry}" from RECENT USER message (negated: ${negatedCountries.join(', ') || 'none'})`);
        break;
      }
    }
    
    // PRIORITY 2: If data usage question was asked, check the user message that triggered it
    if (!context.country && wasDataUsageQuestion) {
      // Find the user message right before the AI's data usage question
      const userMessagesBeforeQuestion = relevantHistory.slice(0, -1).filter(m => m.role === 'user');
      if (userMessagesBeforeQuestion.length > 0) {
        const triggeringMessage = userMessagesBeforeQuestion[userMessagesBeforeQuestion.length - 1];
        const { country: foundCountry } = extractCountryWithNegation(triggeringMessage.content);
        if (foundCountry) {
          context.country = foundCountry;
          console.log(`[Context] Preserved country "${foundCountry}" from message that triggered data question`);
        }
      }
    }
    
    // PRIORITY 3: Fall back to ALL user messages in full history with negation handling
    if (!context.country) {
      const allUserMsgs = relevantHistory.filter(m => m.role === 'user');
      for (const msg of allUserMsgs.slice().reverse()) {
        const { country: foundCountry, negatedCountries } = extractCountryWithNegation(msg.content);
        if (foundCountry) {
          context.country = foundCountry;
          console.log(`[Context] Found country "${foundCountry}" from USER history (negated: ${negatedCountries.join(', ') || 'none'})`);
          break;
        }
      }
    }
  }
  
  // 2. Detect current topic
  if (isCarrierQuestion(currentMessage)) context.topic = 'carrier';
  else if (isTroubleshootingQuestion(currentMessage)) context.topic = 'troubleshooting';
  else if (isPackageQuestion(currentMessage)) context.topic = 'package';
  else if (isInstallQuestion(currentMessage)) context.topic = 'install';
  
  // If no topic in current message, inherit from recent history
  if (!context.topic) {
    for (const msg of relevantHistory.slice(-5).reverse()) {
      if (msg.role === 'user') {
        if (isTroubleshootingQuestion(msg.content)) { context.topic = 'troubleshooting'; break; }
        if (isCarrierQuestion(msg.content)) { context.topic = 'carrier'; break; }
        if (isPackageQuestion(msg.content)) { context.topic = 'package'; break; }
        if (isInstallQuestion(msg.content)) { context.topic = 'install'; break; }
      }
    }
  }
  
  // 3. Extract device type from history
  for (const msg of allUserMessages.slice().reverse()) {
    const lowerContent = msg.content.toLowerCase();
    if (lowerContent.includes('iphone') || lowerContent.includes('ios')) {
      context.deviceType = 'iphone';
      break;
    }
    if (lowerContent.includes('android') || lowerContent.includes('samsung') || 
        lowerContent.includes('pixel') || lowerContent.includes('oppo') ||
        lowerContent.includes('xiaomi') || lowerContent.includes('huawei') ||
        lowerContent.includes('vivo') || lowerContent.includes('realme')) {
      context.deviceType = 'android';
      break;
    }
  }
  
  // 4. Extract reported issue keywords (for troubleshooting context)
  const issueKeywords = [
    'no signal', 'no internet', 'cannot connect', 'not working',
    'slow', 'error', 'failed', 'ไม่มีสัญญาณ', 'เน็ตไม่ได้', 
    'ช้า', 'ใช้ไม่ได้', 'ล้มเหลว', 'no data', 'no service',
    'hotspot not working', 'ฮอตสปอตใช้ไม่ได้', 'แชร์เน็ตไม่ได้'
  ];
  for (const msg of allUserMessages.slice().reverse()) {
    const lowerContent = msg.content.toLowerCase();
    for (const issue of issueKeywords) {
      if (lowerContent.includes(issue)) {
        context.reportedIssue = issue;
        break;
      }
    }
    if (context.reportedIssue) break;
  }
  
  // 5. Extract days from current or history
  // PRIORITY: Use follow-up answer detection first (when user replies "7" to days question)
  if (followUpAnswer.isDaysAnswer && followUpAnswer.extractedDays) {
    context.validityDays = followUpAnswer.extractedDays;
    console.log(`[Context] Days from follow-up answer: ${context.validityDays}`);
  } else {
    context.validityDays = extractDays(currentMessage, relevantHistory);
  }
  
  // 6. Extract order identifier (Order ID or ICCID) from history
  // Check current message first, then history
  // IMPORTANT: Validate strictly to avoid false positives like "answered"
  const validateOrderIdentifier = (id: string | null): string | null => {
    if (!id) return null;
    // ORD-... and 89... (ICCID) are always valid
    if (id.startsWith('ORD-') || id.startsWith('89')) return id;
    // Short codes (8 chars) must contain at least one digit to be valid
    if (id.length === 8 && /\d/.test(id)) return id;
    // Otherwise reject - likely a false positive like "answered"
    console.log(`[Context] Rejecting false positive order identifier: "${id}"`);
    return null;
  };
  
  context.orderIdentifier = validateOrderIdentifier(extractOrderOrICCID(currentMessage));
  if (!context.orderIdentifier) {
    for (const msg of allUserMessages.slice().reverse()) {
      const found = validateOrderIdentifier(extractOrderOrICCID(msg.content));
      if (found) {
        context.orderIdentifier = found;
        console.log(`[Context] Found order/ICCID "${found}" from history`);
        break;
      }
    }
  }
  
  // 7. Extract data usage preference from history - EXPANDED keywords
  // PRIORITY: Use follow-up answer detection first (when user replies "เยอะ" to data question)
  if (followUpAnswer.isDataAnswer && followUpAnswer.extractedDataUsage) {
    context.dataUsage = followUpAnswer.extractedDataUsage;
    console.log(`[Context] Data usage from follow-up answer: ${context.dataUsage}`);
  } else {
    const heavyKeywords = [
      // English
      'heavy', 'a lot', 'alot', 'lots', 'streaming', 'stream', 'video', 'work', 'zoom', 
      'conference', 'video call', 'videocall', 'worry free', 'worry-free', 'unlimited',
      'no limits', 'youtube', 'netflix', 'tiktok', 'instagram', 'download',
      // Thai
      'ใช้เยอะ', 'เยอะ', 'มาก', 'วิดีโอ', 'ทำงาน', 'ประชุม', 'สตรีม', 'ไม่จำกัด', 'ดาวน์โหลด',
      'ไม่กังวล', 'ใช้งานหนัก'
    ];
    const lightKeywords = [
      // English
      'light', 'not much', 'little', 'basic', 'messaging', 'just maps', 'maps only',
      'chat', 'whatsapp', 'line', 'messenger', 'email', 'social media', 'browsing',
      'occasional', 'normal', 'simple', 'low usage', 'pay per use', 'pay-per-use',
      // Thai
      'ใช้น้อย', 'น้อย', 'แค่แชท', 'แมพ', 'maps', 'ไลน์', 'แค่ใช้', 'ธรรมดา', 'ปกติ',
      'ใช้งานเบา', 'ไม่เยอะ', 'ตามจริง', 'เน็ตตามจริง', 'ทั่วไป'
    ];
    for (const msg of allUserMessages.slice().reverse()) {
      const lowerContent = msg.content.toLowerCase();
      if (heavyKeywords.some(k => lowerContent.includes(k))) {
        context.dataUsage = 'heavy';
        break;
      }
      if (lightKeywords.some(k => lowerContent.includes(k))) {
        context.dataUsage = 'light';
        break;
      }
    }
  }
  
  // Service tier preference removed - always use priority (default)
  context.serviceTierPreference = null;
  
  // 9. Detect preferred language from conversation history (majority wins)
  const langCounts: Record<SupportedLanguage, number> = { th: 0, en: 0, ja: 0, ko: 0, fr: 0, de: 0, zh: 0 };
  for (const msg of allUserMessages) {
    const detected = detectLanguage(msg.content);
    langCounts[detected]++;
  }
  // Find language with highest count
  let maxLang: SupportedLanguage = 'th';
  let maxCount = 0;
  for (const [lang, count] of Object.entries(langCounts) as [SupportedLanguage, number][]) {
    if (count > maxCount) { maxCount = count; maxLang = lang; }
  }
  context.preferredLanguage = maxLang;
  console.log(`[Context] Language counts: ${JSON.stringify(langCounts)} → ${context.preferredLanguage}`);
  
  console.log(`[Context] Extracted: country=${context.country}, topic=${context.topic}, device=${context.deviceType}, issue=${context.reportedIssue}, days=${context.validityDays}, order=${context.orderIdentifier}, dataUsage=${context.dataUsage}, serviceTier=${context.serviceTierPreference}`);
  
  return context;
}

// Filter out reset markers and internal notes from history before passing to AI
function getCleanHistoryForAI(history: Message[]): Message[] {
  // Find last reset marker
  let resetIndex = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].content === '[CONTEXT_RESET]' || history[i].content.includes('[CONTEXT_RESET]')) {
      resetIndex = i;
      break;
    }
  }
  
  // Get messages after reset, filter out system messages and reset markers
  const relevantHistory = resetIndex !== -1 ? history.slice(resetIndex + 1) : history;
  return relevantHistory.filter(msg => 
    msg.role !== 'system' && 
    !msg.content.includes('[CONTEXT_RESET]')
  );
}

// Build context summary for AI to remember
function buildContextSummary(context: ConversationContext): string {
  if (!context.country && !context.topic && !context.deviceType && 
      !context.validityDays && !context.reportedIssue && !context.orderIdentifier && !context.dataUsage && !context.preferredLanguage) {
    return '';
  }
  
  let summary = `
═══════════════════════════════════════════════════════════════
🧠 CONVERSATION CONTEXT (CRITICAL - Use this for continuity):
═══════════════════════════════════════════════════════════════
`;

  // Add language instruction at the top (highest priority)
  if (context.preferredLanguage) {
    summary += `🌏 **RESPOND IN**: ${LANGUAGE_NAMES[context.preferredLanguage] || 'English'} (based on conversation history)\n`;
  }
  
  if (context.country) {
    summary += `📍 Destination Country: ${context.country}\n`;
  }
  if (context.topic) {
    const topicLabels = {
      carrier: 'Network/Carrier inquiry',
      troubleshooting: 'Troubleshooting issue',
      package: 'Package selection',
      install: 'Installation help',
      general: 'General inquiry'
    };
    summary += `💬 Current Topic: ${topicLabels[context.topic] || context.topic}\n`;
  }
  if (context.deviceType) {
    summary += `📱 User's Device: ${context.deviceType === 'iphone' ? 'iPhone' : 'Android'}\n`;
  }
  if (context.validityDays) {
    summary += `📅 Trip Duration: ${context.validityDays} days\n`;
  }
  if (context.reportedIssue) {
    summary += `⚠️ Reported Issue: ${context.reportedIssue}\n`;
  }
  if (context.orderIdentifier) {
    summary += `🎫 Order/ICCID: ${context.orderIdentifier}\n`;
  }
  if (context.dataUsage) {
    const usageLabels = { light: 'Light (basic usage)', medium: 'Medium', heavy: 'Heavy (streaming/work)' };
    summary += `📊 Data Usage: ${usageLabels[context.dataUsage]}\n`;
  }
  
  summary += `
───────────────────────────────────────────────────────────────
⚠️ CRITICAL INSTRUCTIONS:
1. NEVER ask the user to repeat destination/device info shown above
2. Reference this context naturally in your responses  
3. If user asks follow-up questions, use this context automatically
4. EXCEPTION: For APN/troubleshooting questions, you MUST have Order/ICCID above
   - If no Order/ICCID is shown, ask user for their Order Number or ICCID first
   - Do NOT provide APN settings without a valid order identifier
═══════════════════════════════════════════════════════════════
`;
  
  return summary;
}

// Extract number of days from user message or date range
function extractDays(message: string, conversationHistory: Message[] = []): number | null {
  console.log(`extractDays called with message: "${message}"`);
  
  // Check current message first (most relevant) - normalize whitespace
  const normalizedMessage = message.replace(/\s+/g, ' ').trim();

  // If the user replies with just a small number (common after we ask "How many days?"),
  // treat it as days. Keep strict bounds to avoid ICCID/order-like numbers.
  if (/^\d{1,2}$/.test(normalizedMessage)) {
    const n = parseInt(normalizedMessage, 10);
    if (n >= 1 && n <= 60) {
      console.log(`Extracted ${n} days from numeric-only message`);
      return n;
    }
  }
  
  // Thai patterns: "5วัน", "5 วัน", "๕วัน"
  const thaiDayPatterns = [
    /(\d+)\s*วัน/,
    /([๐-๙]+)\s*วัน/,
  ];
  
  // English patterns: "5 days", "5days", "5-day", "5 day"
  const englishDayPatterns = [
    // Common + tolerant typos (e.g. "7 dats")
    /(\d+)\s*(?:days?|dats?)\b/i,
    /(\d+)\s*-\s*(?:days?|dats?)\b/i,
    /for\s+(\d+)\s*(?:(?:days?|dats?))?\b/i,
  ];
  
  // Check current message first for day patterns
  for (const pattern of [...thaiDayPatterns, ...englishDayPatterns]) {
    const match = normalizedMessage.match(pattern);
    if (match) {
      console.log(`Pattern ${pattern} matched in current message: "${match[0]}"`);
      const numStr = match[1];
      // Convert Thai numerals to Arabic
      const thaiToArabic: Record<string, string> = {
        '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
        '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
      };
      let arabicNum = numStr;
      for (const [thai, arabic] of Object.entries(thaiToArabic)) {
        arabicNum = arabicNum.replace(new RegExp(thai, 'g'), arabic);
      }
      const days = parseInt(arabicNum, 10);
      console.log(`Extracted ${days} days from current message`);
      return days;
    }
  }
  
  // Now check conversation history if not found in current message (check last 20 messages)
  const historyText = conversationHistory.slice(-20).map(m => m.content).join(' ').replace(/\s+/g, ' ').trim();
  
  for (const pattern of [...thaiDayPatterns, ...englishDayPatterns]) {
    const match = historyText.match(pattern);
    if (match) {
      console.log(`Pattern ${pattern} matched in history: "${match[0]}"`);
      const numStr = match[1];
      const thaiToArabic: Record<string, string> = {
        '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
        '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
      };
      let arabicNum = numStr;
      for (const [thai, arabic] of Object.entries(thaiToArabic)) {
        arabicNum = arabicNum.replace(new RegExp(thai, 'g'), arabic);
      }
      const days = parseInt(arabicNum, 10);
      console.log(`Extracted ${days} days from history`);
      return days;
    }
  }
  
  // Combine for date range patterns
  const allText = `${historyText} ${normalizedMessage}`;
  
  // Date range patterns: "3 มีนาคม - 8 มีนาคม", "March 3-8", "3-8 มี.ค.", "3/3 - 8/3"
  // Thai month abbreviations and full names
  const thaiMonths = ['ม\\.?ค\\.?', 'ก\\.?พ\\.?', 'มี\\.?ค\\.?', 'เม\\.?ย\\.?', 'พ\\.?ค\\.?', 'มิ\\.?ย\\.?', 
                      'ก\\.?ค\\.?', 'ส\\.?ค\\.?', 'ก\\.?ย\\.?', 'ต\\.?ค\\.?', 'พ\\.?ย\\.?', 'ธ\\.?ค\\.?',
                      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const engMonths = ['jan(?:uary)?', 'feb(?:ruary)?', 'mar(?:ch)?', 'apr(?:il)?', 'may', 'jun(?:e)?',
                     'jul(?:y)?', 'aug(?:ust)?', 'sep(?:tember)?', 'oct(?:ober)?', 'nov(?:ember)?', 'dec(?:ember)?'];
  
  const monthPattern = [...thaiMonths, ...engMonths].join('|');
  
  // Pattern: "3 มีนาคม - 8 มีนาคม" or "March 3 - March 8" or "3-8 มีนา"
  const dateRangePatterns = [
    // "3 มีนาคม - 8 มีนาคม" or "3 March - 8 March"
    new RegExp(`(\\d{1,2})\\s*(?:${monthPattern})?\\s*[-–—ถึง]\\s*(\\d{1,2})\\s*(?:${monthPattern})`, 'i'),
    // "March 3-8" or "มีนา 3-8"
    new RegExp(`(?:${monthPattern})\\s*(\\d{1,2})\\s*[-–—ถึง]\\s*(\\d{1,2})`, 'i'),
    // Just "3-8" when month context exists nearby
    /(\d{1,2})\s*[-–—ถึง]\s*(\d{1,2})/,
  ];
  
  for (const pattern of dateRangePatterns) {
    const match = allText.match(pattern);
    if (match) {
      const startDay = parseInt(match[1], 10);
      const endDay = parseInt(match[2], 10);
      if (startDay > 0 && endDay > 0 && startDay <= 31 && endDay <= 31) {
        // Calculate days (inclusive)
        let days: number;
        if (endDay >= startDay) {
          days = endDay - startDay + 1;
        } else {
          // Month wrap-around (e.g., "28 - 3" means 28th to 3rd of next month)
          days = (31 - startDay) + endDay + 1; // Approximate with 31 days
        }
        if (days > 0 && days <= 30) {
          console.log(`Extracted ${days} days from date range: ${startDay}-${endDay}`);
          return days;
        }
      }
    }
  }
  
  return null;
}

// Detect user data preference based on keywords in conversation
// Returns: 'heavy' (uses a lot), 'light' (not much), or null (unknown)
// Note: 'price-focused' was removed — price keywords now only set serviceTierPreference='economy'
// and the system still asks about data usage level separately.
type DataPreference = 'heavy' | 'light' | null;

// AI-Native Preference Extraction using Gemini Tool Calling
// This replaces brittle keyword matching with natural language understanding
const preferenceExtractionTool = {
  type: "function",
  function: {
    name: "set_user_preference",
    description: "Extract and report user's data usage preference from their message in context of the conversation. Call this when you detect a clear indication of their data needs.",
    parameters: {
      type: "object",
      properties: {
        data_preference: {
          type: "string",
          enum: ["heavy", "light", "unknown"],
          description: "User's data usage preference. 'heavy' = uses a lot (streaming, video, work). 'light' = basic usage (maps, chat). 'unknown' = cannot determine. Note: price-related keywords should NOT be treated as a data preference."
        },
        confidence: {
          type: "number",
          description: "Confidence level 0-1 that this preference is correct"
        },
        reasoning: {
          type: "string",
          description: "Brief explanation of why this preference was detected"
        }
      },
      required: ["data_preference", "confidence"],
      additionalProperties: false
    }
  }
};

// Call AI with tools for preference extraction
async function callAIWithTools(
  messages: Message[],
  model: string,
  tools: any[]
): Promise<{ content: string; confidence: number; tool_calls?: any[] }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const body: any = {
    model,
    messages,
    stream: false,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required, please add funds to your Lovable AI workspace.');
    }
    const errorText = await response.text();
    console.error('AI Gateway error (tools):', response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tool_calls = data.choices?.[0]?.message?.tool_calls || [];
  
  return { content, confidence: 0.85, tool_calls };
}

// AI-based preference detection using Gemini's understanding
async function detectPreferenceWithAI(
  message: string, 
  history: Message[]
): Promise<DataPreference> {
  try {
    // Build focused context from last few messages
    const recentHistory = history.slice(-4);
    const contextMessages = recentHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const extractionPrompt = `Analyze this conversation to detect the user's data usage preference.

Recent conversation:
${contextMessages}

Current user message: "${message}"

Context: The assistant previously asked about data usage (streaming/video vs basic maps/chat).
Look for:
- Affirmative responses like "yes", "yeah", "ใช่", "เยอะ", "มาก" after a data question = heavy
- Negative or minimal responses like "not much", "น้อย", "แค่" = light
- Price-focused keywords like "cheap", "ถูก", "budget", "ประหยัด" should NOT be treated as a data preference — they indicate service tier (economy) not usage level
- Consider Thai language nuances: "มาก" means "a lot", "เยอะ" means "lots"
- Consider typos and casual speech like "alot", "yes alot", "definitely"

If you can detect a clear preference, call set_user_preference. If unclear, call with "unknown".`;

    const extractionMessages: Message[] = [
      { role: 'system', content: 'You are a preference extraction assistant. Analyze the conversation and extract user intent.' },
      { role: 'user', content: extractionPrompt }
    ];

    const response = await callAIWithTools(
      extractionMessages,
      'google/gemini-3-flash-preview',
      [preferenceExtractionTool]
    );
    
    // Parse tool call response
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      if (toolCall?.function?.name === 'set_user_preference') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[AI Preference] Detected: ${args.data_preference} (confidence: ${args.confidence}) - ${args.reasoning || 'no reasoning'}`);
          
          if (args.confidence >= 0.6 && args.data_preference !== 'unknown') {
            return args.data_preference as DataPreference;
          }
        } catch (parseError) {
          console.error('[AI Preference] Failed to parse tool arguments:', parseError);
        }
      }
    }
    
    console.log('[AI Preference] No clear preference detected by AI');
    return null;
  } catch (error: any) {
    console.error('[AI Preference] Error calling AI for preference detection:', error);
    // Fall back to quick keyword check on error (passing history for context)
    return null; // quickKeywordCheck was already called in detectDataPreference
  }
}

// Fast fallback: Check for obvious keywords (numbers, emojis) that don't need AI
// Also handles affirmative responses ("yes", "yeah") which default to heavy usage
function quickKeywordCheck(message: string, history: Message[] = []): DataPreference {
  const normalized = message.trim().toLowerCase();
  
  // Number responses (1, 2, 3)
  if (normalized === '1' || normalized === '๑') return 'heavy';
  if (normalized === '2' || normalized === '๒') return 'light';
   // '3' / '💰' no longer maps to price-focused — price is a tier, not a data preference
  
  // Emoji responses
  if (normalized === '🚀') return 'heavy';
  if (normalized === '📱') return 'light';
  
  // Affirmative responses - check if last assistant message was asking about data usage
  // "yes" after "do you use a lot of data?" = heavy
  const affirmativePatterns = ['yes', 'yeah', 'yep', 'sure', 'definitely', 'yea', 'ya', 'ใช่', 'ครับ', 'ค่ะ', 'เยอะ', 'มาก'];
  const negativePatterns = ['no', 'not', 'nope', 'ไม่', 'น้อย', 'แค่', 'just'];
  
  const isAffirmative = affirmativePatterns.some(p => normalized === p || normalized.startsWith(p + ' '));
  const isNegative = negativePatterns.some(p => normalized === p || normalized.startsWith(p + ' ') || normalized.includes(' ' + p));
  
  if (isAffirmative || isNegative) {
    // Check if last assistant message was a data usage question
    const lastAssistant = history.filter(m => m.role === 'assistant').pop();
    if (lastAssistant) {
      const content = lastAssistant.content.toLowerCase();
      const isDataQuestion = 
        content.includes('stream') || 
        content.includes('video') ||
        content.includes('lot of data') ||
        content.includes('data usage') ||
        content.includes('ใช้เน็ต') ||
        content.includes('ดูวิดีโอ') ||
        content.includes('unlimited internet') ||
        content.includes('pay-per-use') ||
        content.includes('เน็ตไม่อั้น') ||
        content.includes('เน็ตตามจริง') ||
        content.includes('how would you like to use internet');
      
      if (isDataQuestion) {
        console.log(`[quickKeywordCheck] Detected ${isAffirmative ? 'affirmative' : 'negative'} response to data question`);
        return isAffirmative ? 'heavy' : 'light';
      }
    }
  }
  
  return null;
}

// Main preference detection function - uses AI for context understanding
async function detectDataPreference(message: string, history: Message[] = []): Promise<DataPreference> {
  const normalized = message.trim().toLowerCase();
  console.log(`[detectDataPreference] Input: "${normalized}"`);
  
  // Step 1: Quick check for obvious indicators (numbers, emojis, affirmative responses)
  const quickResult = quickKeywordCheck(message, history);
  if (quickResult) {
    console.log(`[detectDataPreference] Quick check found: ${quickResult}`);
    return quickResult;
  }
  
  // Step 2: Check if we have enough context for AI analysis
  // Only call AI if the message seems like a response to a data question
  const hasDataContext = history.some(m => {
    const content = m.content.toLowerCase();
    return (
      // Match various data usage question formats
      (content.includes('streaming') && (content.includes('basic') || content.includes('chat'))) ||
      (content.includes('stream') && content.includes('video')) ||
      (content.includes('🚀') && content.includes('📱') && content.includes('💰')) ||
      (content.includes('🚀') && content.includes('📱')) ||
      (content.includes('heavy') && content.includes('light')) ||
      (content.includes('use a lot') || content.includes('ใช้เยอะ')) ||
      (content.includes('data usage') || content.includes('ใช้เน็ต')) ||
      // Match the actual AI question format: "Do you use a lot of data for things like..."
      (content.includes('lot of data') || content.includes('data for things like')) ||
      // Match Thai data question format
      (content.includes('ใช้เน็ตเยอะ') || content.includes('ดูวิดีโอ')) ||
      // Match unlimited vs pay-per-use question format
      (content.includes('unlimited internet') || content.includes('pay-per-use')) ||
      (content.includes('เน็ตแรงไม่อั้น') || content.includes('เน็ตตามจริง')) ||
      (content.includes('เน็ตไม่อั้น')) ||
      (content.includes('how would you like to use internet')) ||
      // Match "how many days" followed by data question pattern
      (content.includes('video calls') && content.includes('maps'))
    );
  });
  
  // If there's data context or the message is short (likely a response), use AI
  const isLikelyResponse = normalized.length < 50;
  
  if (hasDataContext || isLikelyResponse) {
    console.log(`[detectDataPreference] Using AI analysis (hasDataContext: ${hasDataContext}, isLikelyResponse: ${isLikelyResponse})`);
    const aiResult = await detectPreferenceWithAI(message, history);
    if (aiResult) {
      return aiResult;
    }
  }
  
  // Step 3: Fallback - check for strong keyword indicators in the message itself
  // These are only used as final fallback if AI doesn't find anything
  const strongHeavyIndicators = ['unlimited', 'unlimited internet', 'limitless', 'ไม่จำกัด', 'ไม่อั้น', 'เน็ตแรงไม่อั้น', 'เน็ตไม่อั้น', 'streaming', 'สตรีม'];
  const strongLightIndicators = ['not much', 'น้อย', 'ใช้น้อย', 'basic', 'ทั่วไป', 'pay per use', 'pay-per-use', 'เน็ตตามจริง', 'ตามจริง'];
  // Note: price indicators (cheap, ถูก, ประหยัด, budget) are NOT data preferences — they set serviceTierPreference='economy' instead
  
  if (strongHeavyIndicators.some(kw => normalized.includes(kw))) {
    console.log(`[detectDataPreference] Fallback keyword match: heavy`);
    return 'heavy';
  }
  if (strongLightIndicators.some(kw => normalized.includes(kw))) {
    console.log(`[detectDataPreference] Fallback keyword match: light`);
    return 'light';
  }
  
  console.log(`[detectDataPreference] Result: none (no preference detected)`);
  return null;
}

// Generate configurator URL (simple view)
// Uses actualCountryName from the database package for accurate matching
// Includes optional dataOption for pre-selecting data amount (e.g., '500MB', '2GB')
// Detect if a package name refers to a regional/multi-country package
function isRegionalPackageName(countryName: string): boolean {
  const normalized = countryName.toLowerCase();
  return (
    normalized.includes('countries') ||
    normalized.includes('global') ||
    normalized.includes('/') || // e.g., "China/Hongkong/Macau", "Hongkong/Macau"
    normalized.includes('europe') ||
    (normalized.includes('asia') && (normalized.includes('countries') || normalized.includes('8') || normalized.includes('13')))
  );
}

function generateConfiguratorUrl(
  baseUrl: string, 
  actualCountryName: string, 
  packageType: string = 'limitless', 
  days?: number,
  dataOption?: string,
  carrier?: string,
  tier?: string
): string {
  const isRegional = isRegionalPackageName(actualCountryName);
  
  if (isRegional) {
    const slug = regionalNameToSlug(actualCountryName);
    let url = `${baseUrl}/esim/${slug}?type=${packageType}`;
    if (carrier) url += `&carrier=${encodeURIComponent(carrier)}`;
    if (days) url += `&days=${days}`;
    if (dataOption) url += `&option=${encodeURIComponent(dataOption)}`;
    if (tier === 'economy') url += `&tier=economy`;
    return url;
  }
  
  const slug = countryToSlug(actualCountryName);
  let url = `${baseUrl}/esim/${slug}?type=${packageType}`;
  if (carrier) url += `&carrier=${encodeURIComponent(carrier)}`;
  if (days) url += `&days=${days}`;
  if (dataOption) url += `&option=${encodeURIComponent(dataOption)}`;
  if (tier === 'economy') url += `&tier=economy`;
  return url;
}

// Helper function to generate URL-safe slugs from country names
function countryToSlug(countryName: string): string {
  return countryName
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Convert regional display name to URL slug
function regionalNameToSlug(displayName: string): string {
  const mapping: Record<string, string> = {
    'europe 42 countries + 2stopover': 'europe-42-countries-and-2stopover',
    'asia 13 countries': 'asia-13-countries',
    'south east asia 3 countries': 'south-east-asia-3-countries',
    'south east asia 8 countries': 'south-east-asia-8-countries',
    'hong kong/macau': 'hong-kong-and-macau',
    'hongkong/macau': 'hong-kong-and-macau',
    'hong kong & macau': 'hong-kong-and-macau',
    'china/hong kong/macau': 'china-hong-kong-and-macau',
    'china/hongkong/macau': 'china-hong-kong-and-macau',
    'china, hong kong & macau': 'china-hong-kong-and-macau',
    'global 109 countries': 'global-109-countries',
    'global 111 countries': 'global-109-countries',
    'global 151 countries': 'global-151-countries',
  };
  const key = displayName.toLowerCase().trim();
  return mapping[key] || countryToSlug(displayName);
}

// Generate full configurator URL (shows all package types: Limitless, Max Speed, Day Pass)
function generateFullConfiguratorUrl(baseUrl: string, actualCountryName: string): string {
  const isRegional = isRegionalPackageName(actualCountryName);
  
  if (isRegional) {
    const slug = regionalNameToSlug(actualCountryName);
    return `${baseUrl}/esim/${slug}`;
  }
  
  const slug = countryToSlug(actualCountryName);
  return `${baseUrl}/esim/${slug}`;
}

// Generate cart URL with proper encoding
function generateCartUrl(baseUrl: string, packageId: string, language: SupportedLanguage = 'th', currency: string = 'THB', tier?: 'economy' | 'priority'): string {
  // Encode the items parameter properly (packageId:quantity format) - colon becomes %3A
  const itemsParam = encodeURIComponent(`${packageId}:1`);
  let url = `${baseUrl}/cart?items=${itemsParam}&lang=${language}&currency=${currency}`;
  if (tier === 'economy') {
    url += '&tier=economy';
  }
  return url;
}

// NEW: Check what package types are available for a country before asking preferences
// This enables smart detection - skip the preference question if only one type is available
async function getAvailablePackageTypes(
  supabase: any,
  country: string
): Promise<{ limitless: boolean; daypass: boolean; maxspeed: boolean; hasAnyPackages: boolean }> {
  const result = { limitless: false, daypass: false, maxspeed: false, hasAnyPackages: false };
  
  console.log(`[getAvailablePackageTypes] Checking package types for: ${country}`);
  
  // First check direct packages for this country
  const { data: directPackages, error } = await supabase
    .from('esim_packages')
    .select('package_type, name')
    .eq('is_active', true)
    .ilike('country_name', `%${country}%`)
    .limit(50);
  
  if (!error && directPackages?.length > 0) {
    result.hasAnyPackages = true;
    for (const pkg of directPackages) {
      const type = (pkg.package_type || '').toLowerCase();
      const name = (pkg.name || '').toLowerCase();
      
      if (type.includes('limitless') || name.includes('unlimited') || name.includes('limitless') || name.includes('real unlimited')) {
        result.limitless = true;
      }
      if (type.includes('day') || type.includes('daypass')) {
        result.daypass = true;
      }
      if (type.includes('max') || type.includes('speed') || type.includes('maxspeed')) {
        result.maxspeed = true;
      }
    }
    console.log(`[getAvailablePackageTypes] Direct packages found for ${country}:`, result);
    return result;
  }
  
  // No direct packages - check regional coverage
  const regionalInfo = REGIONAL_COVERAGE[country.toLowerCase()];
  if (regionalInfo) {
    console.log(`[getAvailablePackageTypes] No direct packages, checking regional for ${country}: ${regionalInfo.primary.searchTerm}`);
    
    // Check Global 109 Countries (typically Limitless packages)
    const { data: global109Packages } = await supabase
      .from('esim_packages')
      .select('package_type, name')
      .eq('is_active', true)
      .ilike('country_name', '%Global 109%')
      .limit(20);
    
    if (global109Packages?.length) {
      result.hasAnyPackages = true;
      for (const pkg of global109Packages) {
        const type = (pkg.package_type || '').toLowerCase();
        const name = (pkg.name || '').toLowerCase();
        if (type.includes('limitless') || name.includes('unlimited') || name.includes('limitless')) {
          result.limitless = true;
        }
        if (type.includes('day') || type.includes('daypass')) {
          result.daypass = true;
        }
        if (type.includes('max') || type.includes('speed')) {
          result.maxspeed = true;
        }
      }
    }
    
    // Check Global 151 Countries (typically Day Pass packages)
    const { data: global151Packages } = await supabase
      .from('esim_packages')
      .select('package_type, name')
      .eq('is_active', true)
      .ilike('country_name', '%Global 151%')
      .limit(20);
    
    if (global151Packages?.length) {
      result.hasAnyPackages = true;
      for (const pkg of global151Packages) {
        const type = (pkg.package_type || '').toLowerCase();
        const name = (pkg.name || '').toLowerCase();
        if (type.includes('limitless') || name.includes('unlimited') || name.includes('limitless')) {
          result.limitless = true;
        }
        if (type.includes('day') || type.includes('daypass')) {
          result.daypass = true;
        }
        if (type.includes('max') || type.includes('speed')) {
          result.maxspeed = true;
        }
      }
    }
    
    console.log(`[getAvailablePackageTypes] Regional packages for ${country}:`, result);
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// CARRIER RATINGS - Mirrors src/lib/carrierRatings.ts
// 5 stars = #1 carrier (widest coverage), 4 stars = #2, 3 stars = regional/newer
// ═══════════════════════════════════════════════════════════════
const CARRIER_RATINGS: Record<string, number> = {
  'Vodafone/One': 5, 'ALBtelecom': 3,
  'Optus': 4, 'Australia: Optus/Vodafone, New Zealand: Vodafone/Spark': 5, 'Optus/Vodafone': 4,
  'T-mobile / Orange(H3G)': 4,
  'Proximus/Orange/Base': 5, 'Telenet/Orange': 4,
  'BH Telecom/m:tel': 5,
  'Vivo': 5,
  'Vivacom/A1': 5, 'A1/Telenor': 4,
  'Smart/Cellcard': 5, 'CamGSM': 4,
  'Bell / Telus / Sasktel': 5,
  'CMCC': 5, 'China Mobile': 5, 'China Unicom': 4, 'China Telecom': 4,
  'T-Mobile/A1/Telemach': 5, 'Tele2/Hrvatski': 4,
  'Cyta/Epic': 5, 'PrimeTel': 3,
  'Vodafone/T-Mobile': 5, 'T-Mobile/O2': 5,
  'TDC / Telia': 5,
  'Vodafone / Etisalat / Orange': 5,
  'Telia/Elisa': 5,
  'Elisa/DNA': 5,
  'SFR / Orange': 5,
  'Vodafone / Telefonica O2': 4,
  'Wind/Cosmote/Vodafone': 5,
  'Docomo Pacific': 5,
  'CMHK': 4, 'CSL': 5, 'PCCW': 4, '3HK': 4,
  'Telenor/Vodafone': 5, 'T-Mobile/Telenor': 4,
  'Siminn/Vodafone': 5, 'Fjarskipti/Nova': 4, 'Nova + Vodafone/Sýn': 4,
  'Reliance Jio/Bharti Airtel': 5,
  'Telkomsel/XL': 5, 'XL (Excelcom) / Indosat / Telkomsel': 5, 'XL(Excelcom)/Telkomsel': 5, 'Indosat/Tri': 4,
  'Meteor': 4,
  'Vodafone / TIM': 5,
  'DOCOMO': 5, 'NTT Docomo': 5, 'Softbank / KDDI': 4, 'SoftBank': 4, 'KDDI': 4, 'au (KDDI)': 4,
  'KT/SKT': 5, 'SK / LGU+': 5, 'SK Telecom': 5, 'KT': 5, 'LG U+/KT': 4, 'LG U+': 4,
  'Unitel/LaoTel': 5,
  'LMT/Tele2': 5, 'Bite': 3,
  'Telia/Bite': 5,
  'POST/Tango': 5,
  'CTM': 5,
  'Maxis / Celcom': 5, 'Maxis / Celcom / Digi': 5,
  'GO/Vodafone': 5, 'Melita': 3,
  'Crnogorski/Telenor': 5, 'M:Tel': 3,
  'Vodafone / KPN': 5,
  'Vodafone/Spark': 5,
  'Telia/Telenor': 5,
  'Smart / Globe': 5, 'Globe/Smart': 5, 'Smart': 4, 'DITO/Globe': 4,
  'Polkomtel/Orange/T-Mobile': 5, 'Polkomtel': 4,
  'TMN (MEO) / Optimus (NOS) / Vodafone': 5,
  'Vodafone/Orange': 5, 'Digi/Orange': 5,
  'MTS': 5, 'Tele2/Beeline': 4, 'Tele2': 4, 'Beeline': 4,
  'STC/Mobily/Zain': 5,
  'Telekom/A1': 5, 'Yettel': 4,
  'Singtel': 5, 'Singtel/StarHub': 5, 'StarHub': 4, 'M1': 4,
  'Orange/T-Mobile': 5, 'O2/Swan': 4,
  'Telemach': 4,
  'Cell C/Vodacom': 5,
  'Orange / Telefonica / Vodafone': 5,
  'Telenor / TeliaSonera / Tele2': 5,
  'Sunrise / Orange': 4,
  'Chunghwa': 5, 'Chunghwa/FarEasTone': 5, 'FarEasTone': 4, 'Taiwan Mobile': 4, 'Taiwan Mobile/APT': 4,
  'AIS': 5, 'Real Future (Truemove)': 4, 'Truemove': 4, 'True': 4, 'DTAC': 4,
  'Turkcell': 5, 'Turk Telekom': 4, 'Vodafone/Turkcell': 5,
  'Etisalat / DU': 5,
  'Vodafone / EE / O2': 5,
  'Kyivstar/Vodafone': 5, 'lifecell': 3,
  'AT&T / T-Mobile': 5, 'AT&T': 4, 'T-Mobile': 5, 'Verizon': 5,
  'Vinaphone / Mobifone / Viettel': 5,
  'Vodafone': 4, 'Orange': 4, 'Telefonica': 4, 'Deutsche Telekom': 5, 'Spark': 5,
};

function getCarrierRating(carrier: string | null): number {
  if (!carrier) return 4;
  if (CARRIER_RATINGS[carrier] !== undefined) return CARRIER_RATINGS[carrier];
  const norm = carrier.toUpperCase();
  for (const [key, rating] of Object.entries(CARRIER_RATINGS)) {
    if (norm.includes(key.toUpperCase())) return rating;
  }
  return 4;
}

// Search for the best matching package - prioritize Limitless/Real Unlimited
// Falls back to regional packages if no direct packages exist
async function findBestPackage(
  supabase: any,
  country: string | null,
  days: number | null,
  packageType: string = 'limitless',
  carrierPreference: string | null = null,
  heavyUser: boolean = false
): Promise<PackageInfo | null> {
  if (!country) return null;
  
  // Helper function to build and execute query
  const executeQuery = async (searchTerm: string, filterLimitless: boolean) => {
    let query = supabase
      .from('esim_packages')
      .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
      .eq('is_active', true)
      .ilike('country_name', `%${searchTerm}%`);
    
    // Filter by package type if specified and filterLimitless is true
    if (filterLimitless && packageType === 'limitless') {
      query = query.or('package_type.ilike.%limitless%,data_amount.ilike.%unlimited%,name.ilike.%unlimited%,name.ilike.%limitless%,name.ilike.%real unlimited%');
    } else if (packageType === 'daypass') {
      // Support both legacy and standardized DB values (day_pass vs daypass)
      query = query.or('package_type.ilike.%day_pass%,package_type.ilike.%daypass%');
    } else if (packageType === 'maxspeed') {
      // Support both legacy and standardized DB values (max_speed vs maxspeed)
      query = query.or('package_type.ilike.%max_speed%,package_type.ilike.%maxspeed%');
    }
    
    return await query.order('price', { ascending: true });
  };
  
  // First try with direct country search
  let { data: packages, error } = await executeQuery(country, packageType === 'limitless');
  
  // If no limitless packages found for direct country, fallback to ANY package for this country
  if ((!packages?.length || error) && packageType === 'limitless') {
    console.log(`No limitless packages found for ${country}, falling back to all package types`);
    const fallback = await executeQuery(country, false);
    packages = fallback.data;
    error = fallback.error;
  }
  
  // REGIONAL FALLBACK: If still no packages, check if this country is covered by a regional package
  if (!packages?.length) {
    const regionalInfo = REGIONAL_COVERAGE[country.toLowerCase()];
    if (regionalInfo) {
      console.log(`No direct packages for ${country}, searching regional: ${regionalInfo.primary.regionalName}`);
      
      // Search for regional packages using primary option first
      const { data: regionalPackages, error: regionalError } = await executeQuery(regionalInfo.primary.searchTerm, packageType === 'limitless');
      
      if (regionalPackages?.length) {
        console.log(`Found ${regionalPackages.length} regional packages for ${country} via ${regionalInfo.primary.regionalName}`);
        // Mark packages as regional and add the covered country info
        packages = regionalPackages.map((pkg: any) => ({
          ...pkg,
          isRegional: true,
          regionalName: regionalInfo.primary.regionalName,
          coveredCountry: country,
          hasAlternatives: !!regionalInfo.alternatives?.length
        }));
      } else if (!regionalError && packageType === 'limitless' && regionalInfo.alternatives?.length) {
        // If no Limitless packages in primary, check alternatives for Day Pass options
        console.log(`No Limitless in ${regionalInfo.primary.regionalName}, checking alternatives`);
        for (const alt of regionalInfo.alternatives) {
          const { data: altPackages } = await executeQuery(alt.searchTerm, false);
          if (altPackages?.length) {
            console.log(`Found ${altPackages.length} packages from alternative: ${alt.regionalName}`);
            packages = altPackages.map((pkg: any) => ({
              ...pkg,
              isRegional: true,
              regionalName: alt.regionalName,
              coveredCountry: country,
              alternativeRegionalName: regionalInfo.primary.regionalName
            }));
            break;
          }
        }
      } else if (!regionalError && packageType === 'limitless') {
        // Try without limitless filter for regional primary
        const { data: anyRegionalPackages } = await executeQuery(regionalInfo.primary.searchTerm, false);
        if (anyRegionalPackages?.length) {
          packages = anyRegionalPackages.map((pkg: any) => ({
            ...pkg,
            isRegional: true,
            regionalName: regionalInfo.primary.regionalName,
            coveredCountry: country,
            hasAlternatives: !!regionalInfo.alternatives?.length
          }));
        }
      }
    }
  }
  
  if (error || !packages?.length) {
    console.log('No packages found for country:', country, 'error:', error);
    return null;
  }
  
  // Apply carrier preference filter (for multi-carrier countries like Japan)
  if (carrierPreference && packages.length > 1) {
    const carrierFiltered = packages.filter((p: any) => p.carrier === carrierPreference);
    if (carrierFiltered.length > 0) {
      console.log(`[findBestPackage] Filtered to ${carrierFiltered.length} packages for carrier: ${carrierPreference}`);
      packages = carrierFiltered;
    } else {
      console.log(`[findBestPackage] No packages for carrier ${carrierPreference}, using all ${packages.length}`);
    }
  }
  
  console.log(`Found ${packages.length} packages for ${country}, looking for ${days} days`);
  
  // Helper function to check if package is a "Real Unlimited" / "Limitless" type
  const isLimitlessPackage = (pkg: any): boolean => {
    const name = (pkg.name || '').toLowerCase();
    const pkgType = (pkg.package_type || '').toLowerCase();
    return name.includes('real unlimited') || 
           name.includes('limitless') || 
           pkgType.includes('limitless') ||
           (name.includes('unlimited') && !name.includes('speed'));
  };
  
  // ═══ CARRIER-RATING-AWARE SELECTION ═══
  // Sort packages by: 1) highest carrier star rating, 2) lowest price
  const rateAndSort = (pkgs: any[]) => {
    return [...pkgs].sort((a: any, b: any) => {
      const ratingA = getCarrierRating(a.carrier);
      const ratingB = getCarrierRating(b.carrier);
      if (ratingB !== ratingA) return ratingB - ratingA; // Higher rating first
      return a.price - b.price; // Then cheaper first
    });
  };

  // Helper to parse data amount in MB for comparison
  const parseDataMB = (d: string): number => {
    const m = (d || '').toLowerCase().match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
    if (!m) return 0;
    return m[2].toLowerCase() === 'gb' ? parseFloat(m[1]) * 1024 : parseFloat(m[1]);
  };

  // If days specified, find exact match prioritizing 5-star carrier Limitless packages
  if (days) {
    // HEAVY USER + MAX SPEED: Relax day constraint, prioritize maximum data (GB)
    if (heavyUser && packageType === 'maxspeed') {
      const coveringPkgs = packages.filter((p: any) => p.validity_days >= days);
      const candidates = coveringPkgs.length > 0 ? coveringPkgs : [...packages];
      // Sort by data amount descending (most GB first), then best carrier, then cheapest
      candidates.sort((a: any, b: any) => {
        const dataA = parseDataMB(a.data_amount);
        const dataB = parseDataMB(b.data_amount);
        if (dataB !== dataA) return dataB - dataA; // highest data first
        const ratingA = getCarrierRating(a.carrier);
        const ratingB = getCarrierRating(b.carrier);
        if (ratingB !== ratingA) return ratingB - ratingA;
        return a.price - b.price;
      });
      const best = candidates[0];
      console.log(`[findBestPackage] Heavy user max_speed: picked ${best.name} (${best.data_amount}, ${best.validity_days}d) over strict day match`);
      return best;
    }

    // First: Try to find an exact day match that's a Limitless package with best carrier
    const exactLimitlessMatches = packages.filter((p: any) => 
      p.validity_days === days && isLimitlessPackage(p)
    );
    if (exactLimitlessMatches.length > 0) {
      const best = rateAndSort(exactLimitlessMatches)[0];
      console.log(`Found exact Limitless match (${getCarrierRating(best.carrier)}★): ${best.name} (${best.id})`);
      return best;
    }
    
    // Second: Try to find any exact day match (prefer best carrier)
    const exactMatches = packages.filter((p: any) => p.validity_days === days);
    if (exactMatches.length > 0) {
      const best = rateAndSort(exactMatches)[0];
      console.log(`Found exact day match (${getCarrierRating(best.carrier)}★): ${best.name} (${best.id})`);
      return best;
    }
    
    // Third: Find closest duration, preferring Limitless packages with best carrier
    const limitlessPackages = packages.filter(isLimitlessPackage);
    if (limitlessPackages.length > 0) {
      const closestDays = [...limitlessPackages].sort((a: any, b: any) => 
        Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days)
      )[0].validity_days;
      const closestGroup = limitlessPackages.filter((p: any) => p.validity_days === closestDays);
      const best = rateAndSort(closestGroup)[0];
      console.log(`Found closest Limitless (${getCarrierRating(best.carrier)}★): ${best.name} (${best.id})`);
      return best;
    }
    
    // Fallback: closest duration from any package, prefer best carrier
    const closestDays = [...packages].sort((a: any, b: any) => 
      Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days)
    )[0].validity_days;
    const closestGroup = packages.filter((p: any) => p.validity_days === closestDays);
    const best = rateAndSort(closestGroup)[0];
    console.log(`Fallback to closest (${getCarrierRating(best.carrier)}★): ${best.name} (${best.id})`);
    return best;
  }
  
  // No days specified: return best-rated Limitless, or best-rated overall
  const limitlessOnly = packages.filter(isLimitlessPackage);
  if (limitlessOnly.length > 0) {
    const best = rateAndSort(limitlessOnly)[0];
    console.log(`No days specified, returning best Limitless (${getCarrierRating(best.carrier)}★): ${best.name} (${best.id})`);
    return best;
  }
  
  const best = rateAndSort(packages)[0];
  console.log(`No days specified, returning best rated (${getCarrierRating(best.carrier)}★): ${best.name} (${best.id})`);
  return best;
}

// Find highest data Day Pass for heavy users when no Limitless is available
async function findHighestDataDayPass(
  supabase: any,
  country: string,
  days: number | null,
  carrierPreference: string | null = null
): Promise<PackageInfo | null> {
  console.log(`[findHighestDataDayPass] Finding highest data Day Pass for ${country}`);
  
  // Query Day Pass packages sorted by price descending (higher price = more data typically)
  let { data: packages, error } = await supabase
    .from('esim_packages')
    .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
    .eq('is_active', true)
    .ilike('country_name', `%${country}%`)
    .or('package_type.ilike.%day_pass%,package_type.ilike.%daypass%')
    .order('price', { ascending: false });
  
  if (error || !packages?.length) {
    console.log(`[findHighestDataDayPass] No Day Pass packages found for ${country}`);
    return null;
  }
  
  // Apply carrier preference filter
  if (carrierPreference && packages.length > 1) {
    const carrierFiltered = packages.filter((p: any) => p.carrier === carrierPreference);
    if (carrierFiltered.length > 0) {
      console.log(`[findHighestDataDayPass] Filtered to ${carrierFiltered.length} packages for carrier: ${carrierPreference}`);
      packages = carrierFiltered;
    }
  }

  // Parse data amounts and find highest (exclude 500MB for heavy users)
  const parseDataAmount = (dataAmount: string): number => {
    const lower = dataAmount.toLowerCase();
    const match = lower.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return unit === 'gb' ? value * 1024 : value; // Convert to MB
  };
  
  // Sort by data amount descending
  const sortedByData = [...packages].sort((a: any, b: any) => {
    return parseDataAmount(b.data_amount) - parseDataAmount(a.data_amount);
  });
  
  // Filter out 500MB packages (not suitable for heavy users)
  const highDataPackages = sortedByData.filter((pkg: any) => {
    const dataMB = parseDataAmount(pkg.data_amount);
    return dataMB > 500;
  });
  
  if (highDataPackages.length === 0) {
    console.log(`[findHighestDataDayPass] No high-data Day Pass packages found, using highest available`);
    return days 
      ? sortedByData.find((p: any) => p.validity_days === days) || sortedByData[0]
      : sortedByData[0];
  }
  
  // Find matching days or closest
  if (days) {
    const exactMatch = highDataPackages.find((p: any) => p.validity_days === days);
    if (exactMatch) {
      console.log(`[findHighestDataDayPass] Found exact match: ${exactMatch.name}`);
      return exactMatch;
    }
    const closest = [...highDataPackages].sort((a: any, b: any) => 
      Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days)
    )[0];
    console.log(`[findHighestDataDayPass] Found closest: ${closest.name}`);
    return closest;
  }
  
  console.log(`[findHighestDataDayPass] Returning highest data package: ${highDataPackages[0].name}`);
  return highDataPackages[0];
}

// Find 500MB/day Day Pass for light users
async function find500MBDayPass(
  supabase: any,
  country: string,
  days: number | null,
  carrierPreference: string | null = null
): Promise<PackageInfo | null> {
  console.log(`[find500MBDayPass] Finding 500MB Day Pass for ${country}`);
  
  const { data: rawPackages, error } = await supabase
    .from('esim_packages')
    .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
    .eq('is_active', true)
    .ilike('country_name', `%${country}%`)
    .or('package_type.ilike.%day_pass%,package_type.ilike.%daypass%')
    .order('price', { ascending: true });
  
  if (error || !rawPackages?.length) {
    console.log(`[find500MBDayPass] No Day Pass packages found for ${country}`);
    return null;
  }
  
  let packages = rawPackages;
  
  // Apply carrier preference filter
  if (carrierPreference && packages.length > 1) {
    const carrierFiltered = packages.filter((p: any) => p.carrier === carrierPreference);
    if (carrierFiltered.length > 0) {
      console.log(`[find500MBDayPass] Filtered to ${carrierFiltered.length} packages for carrier: ${carrierPreference}`);
      packages = carrierFiltered;
    }
  }

  const is500MB = (dataAmount: string): boolean => {
    const lower = dataAmount.toLowerCase();
    return lower.includes('500') && lower.includes('mb');
  };
  
  const mb500Packages = packages.filter((pkg: any) => is500MB(pkg.data_amount));
  
  // Carrier-rating-aware sort: prefer 5-star carrier, then lowest price
  const rateAndSort = (pkgs: any[]) => [...pkgs].sort((a: any, b: any) => {
    const rA = getCarrierRating(a.carrier);
    const rB = getCarrierRating(b.carrier);
    if (rB !== rA) return rB - rA;
    return a.price - b.price;
  });

  if (mb500Packages.length === 0) {
    console.log(`[find500MBDayPass] No 500MB packages found, returning best-rated cheapest Day Pass`);
    if (days) {
      const dayMatches = packages.filter((p: any) => p.validity_days === days);
      if (dayMatches.length > 0) return rateAndSort(dayMatches)[0];
    }
    return rateAndSort(packages)[0];
  }
  
  if (days) {
    const exactMatches = mb500Packages.filter((p: any) => p.validity_days === days);
    if (exactMatches.length > 0) {
      const best = rateAndSort(exactMatches)[0];
      console.log(`[find500MBDayPass] Found exact match (${getCarrierRating(best.carrier)}★): ${best.name}`);
      return best;
    }
    // Closest days, then best carrier
    const closestDays = [...mb500Packages].sort((a: any, b: any) => 
      Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days)
    )[0].validity_days;
    const closestGroup = mb500Packages.filter((p: any) => p.validity_days === closestDays);
    const best = rateAndSort(closestGroup)[0];
    console.log(`[find500MBDayPass] Found closest (${getCarrierRating(best.carrier)}★): ${best.name}`);
    return best;
  }
  
  const best = rateAndSort(mb500Packages)[0];
  console.log(`[find500MBDayPass] Returning best-rated 500MB (${getCarrierRating(best.carrier)}★): ${best.name}`);
  return best;
}

// Find cheapest Day Pass (used as fallback; economy users now use findBestValuePackage)
async function findCheapestDayPass(
  supabase: any,
  country: string,
  days: number | null,
  carrierPreference: string | null = null
): Promise<PackageInfo | null> {
  console.log(`[findCheapestDayPass] Finding cheapest Day Pass for ${country}`);
  
  let { data: packages, error } = await supabase
    .from('esim_packages')
    .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
    .eq('is_active', true)
    .ilike('country_name', `%${country}%`)
    .or('package_type.ilike.%day_pass%,package_type.ilike.%daypass%')
    .order('price', { ascending: true });
  
  if (error || !packages?.length) {
    console.log(`[findCheapestDayPass] No Day Pass packages found for ${country}`);
    return null;
  }
  
  // Apply carrier preference filter
  if (carrierPreference && packages.length > 1) {
    const carrierFiltered = packages.filter((p: any) => p.carrier === carrierPreference);
    if (carrierFiltered.length > 0) {
      console.log(`[findCheapestDayPass] Filtered to ${carrierFiltered.length} packages for carrier: ${carrierPreference}`);
      packages = carrierFiltered;
    }
  }

  if (days) {
    const exactMatch = packages.find((p: any) => p.validity_days === days);
    if (exactMatch) {
      console.log(`[findCheapestDayPass] Found exact match: ${exactMatch.name}`);
      return exactMatch;
    }
    const closest = [...packages].sort((a: any, b: any) => 
      Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days)
    )[0];
    console.log(`[findCheapestDayPass] Found closest: ${closest.name}`);
    return closest;
  }
  
  console.log(`[findCheapestDayPass] Returning cheapest: ${packages[0].name}`);
  return packages[0];
}

// Find cheapest Max Speed (used as fallback; economy users now use findBestValuePackage)
async function findCheapestMaxSpeed(
  supabase: any,
  country: string,
  days: number | null,
  carrierPreference: string | null = null
): Promise<PackageInfo | null> {
  console.log(`[findCheapestMaxSpeed] Finding cheapest Max Speed for ${country}`);
  
  let { data: packages, error } = await supabase
    .from('esim_packages')
    .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
    .eq('is_active', true)
    .ilike('country_name', `%${country}%`)
    .or('package_type.ilike.%max_speed%,package_type.ilike.%maxspeed%')
    .order('price', { ascending: true });
  
  if (error || !packages?.length) {
    console.log(`[findCheapestMaxSpeed] No Max Speed packages found for ${country}`);
    return null;
  }
  
  // Apply carrier preference filter
  if (carrierPreference && packages.length > 1) {
    const carrierFiltered = packages.filter((p: any) => p.carrier === carrierPreference);
    if (carrierFiltered.length > 0) {
      console.log(`[findCheapestMaxSpeed] Filtered to ${carrierFiltered.length} packages for carrier: ${carrierPreference}`);
      packages = carrierFiltered;
    }
  }

  if (days) {
    const exactMatch = packages.find((p: any) => p.validity_days === days);
    if (exactMatch) {
      console.log(`[findCheapestMaxSpeed] Found exact match: ${exactMatch.name}`);
      return exactMatch;
    }
    const closest = [...packages].sort((a: any, b: any) => 
      Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days)
    )[0];
    console.log(`[findCheapestMaxSpeed] Found closest: ${closest.name}`);
    return closest;
  }
  
  console.log(`[findCheapestMaxSpeed] Returning cheapest: ${packages[0].name}`);
  return packages[0];
}

// ═══════════════════════════════════════════════════════════════
// BEST VALUE PACKAGE FINDER (for economy/price-focused users)
// Sorts by cost_price_per_gb (ascending) to find the best $/GB value
// Unlike findCheapest*, this finds the most cost-efficient package, not just the cheapest absolute price
// ═══════════════════════════════════════════════════════════════
async function findBestValuePackage(
  supabase: any,
  country: string,
  days: number | null,
  packageType: 'day_pass' | 'max_speed',
  carrierPreference: string | null = null,
  preferLowData: boolean = false
): Promise<{ bestValue: PackageInfo | null; carrierNote: string | null }> {
  const typeFilter = packageType === 'day_pass'
    ? 'package_type.ilike.%day_pass%,package_type.ilike.%daypass%'
    : 'package_type.ilike.%max_speed%,package_type.ilike.%maxspeed%';
  
  console.log(`[findBestValuePackage] Finding best $/GB ${packageType} for ${country}, preferLowData=${preferLowData}, carrier=${carrierPreference}`);
  
  const { data: packages, error } = await supabase
    .from('esim_packages')
    .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type, cost_price_per_gb')
    .eq('is_active', true)
    .ilike('country_name', `%${country}%`)
    .or(typeFilter)
    .not('cost_price_per_gb', 'is', null)
    .order('cost_price_per_gb', { ascending: true });
  
  if (error || !packages?.length) {
    console.log(`[findBestValuePackage] No packages found for ${country} ${packageType}`);
    return { bestValue: null, carrierNote: null };
  }
  
  // Helper to parse data amount in MB
  const parseDataMB = (d: string): number => {
    const m = d.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
    if (!m) return 0;
    return m[2].toLowerCase() === 'gb' ? parseFloat(m[1]) * 1024 : parseFloat(m[1]);
  };
  
  // Filter to low data tiers if requested
  let filtered = [...packages];
  if (preferLowData) {
    if (packageType === 'day_pass') {
      // Up to 1GB for day pass
      filtered = packages.filter((p: any) => {
        const mb = parseDataMB(p.data_amount);
        return mb > 0 && mb <= 1024;
      });
    } else {
      // 500MB to 5GB for max speed
      filtered = packages.filter((p: any) => {
        const mb = parseDataMB(p.data_amount);
        return mb >= 512 && mb <= 5120;
      });
    }
    if (filtered.length === 0) filtered = [...packages]; // fallback
  }
  
  let carrierNote: string | null = null;
  
  // Find matching days — heavy users prioritize max GB over exact day match
  let candidates = filtered;
  if (days && preferLowData) {
    // Light user: pick package that covers the trip (validity_days >= requested days)
    const exactMatches = filtered.filter((p: any) => p.validity_days === days);
    if (exactMatches.length > 0) {
      candidates = exactMatches;
    } else {
      // Filter to packages that cover the full trip duration
      const coveringPkgs = filtered.filter((p: any) => p.validity_days >= days);
      if (coveringPkgs.length > 0) {
        // Pick the shortest validity that still covers the trip
        const shortestCoveringDays = [...coveringPkgs].sort((a: any, b: any) => a.validity_days - b.validity_days)[0]?.validity_days;
        candidates = coveringPkgs.filter((p: any) => p.validity_days === shortestCoveringDays);
      } else {
        // No package covers the full trip — use the longest available (best coverage possible)
        const longestDays = [...filtered].sort((a: any, b: any) => b.validity_days - a.validity_days)[0]?.validity_days;
        candidates = filtered.filter((p: any) => p.validity_days === longestDays);
      }
    }
    console.log(`[findBestValuePackage] Light user: requested ${days}d, selected candidates with ${candidates[0]?.validity_days}d`);
    // Sort by cost_price_per_gb ascending (best value first)
    candidates.sort((a: any, b: any) => (a.cost_price_per_gb || 999) - (b.cost_price_per_gb || 999));
  } else if (days && !preferLowData && packageType === 'max_speed') {
    // Heavy user + Max Speed ONLY: relax day constraint, prioritize maximum data
    // First try packages that cover the trip (validity >= requested days)
    const coveringPkgs = filtered.filter((p: any) => p.validity_days >= days);
    candidates = coveringPkgs.length > 0 ? coveringPkgs : [...filtered];
    // Sort by data amount descending (most GB first), then cost-per-GB as tiebreaker
    candidates.sort((a: any, b: any) => {
      const dataA = parseDataMB(a.data_amount);
      const dataB = parseDataMB(b.data_amount);
      if (dataB !== dataA) return dataB - dataA; // highest data first
      return (a.cost_price_per_gb || 999) - (b.cost_price_per_gb || 999); // cheapest per GB
    });
    console.log(`[findBestValuePackage] Heavy user max_speed: relaxed day match, top candidate: ${candidates[0]?.name} (${candidates[0]?.data_amount}, ${candidates[0]?.validity_days}d)`);
  } else if (days) {
    // Heavy user + Day Pass (or any other type): strict day matching like light users
    const exactMatches = filtered.filter((p: any) => p.validity_days === days);
    if (exactMatches.length > 0) {
      candidates = exactMatches;
    } else {
      const closestDays = [...filtered].sort((a: any, b: any) => 
        Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days)
      )[0]?.validity_days;
      candidates = filtered.filter((p: any) => p.validity_days === closestDays);
    }
    // Heavy user: prioritize highest daily data amount, cost-per-GB as tiebreaker
    candidates.sort((a: any, b: any) => {
      const dataA = parseDataMB(a.data_amount);
      const dataB = parseDataMB(b.data_amount);
      if (dataB !== dataA) return dataB - dataA; // highest data first
      return (a.cost_price_per_gb || 999) - (b.cost_price_per_gb || 999);
    });
    console.log(`[findBestValuePackage] Heavy user day_pass: strict day match, top candidate: ${candidates[0]?.name} (${candidates[0]?.data_amount}, ${candidates[0]?.validity_days}d)`);
  } else {
    // No days specified — sort by cost_price_per_gb ascending
    candidates.sort((a: any, b: any) => (a.cost_price_per_gb || 999) - (b.cost_price_per_gb || 999));
  }
  
  const bestPkg = candidates[0];
  if (!bestPkg) {
    return { bestValue: null, carrierNote: null };
  }
  
  // Check if the best-value carrier differs from the preferred carrier
  if (carrierPreference && bestPkg.carrier !== carrierPreference) {
    const bestRating = getCarrierRating(bestPkg.carrier);
    const prefRating = getCarrierRating(carrierPreference);
    const prefCarrierPkg = candidates.find((p: any) => p.carrier === carrierPreference);
    
    if (prefCarrierPkg && bestRating < prefRating) {
      const priceDiff = ((prefCarrierPkg.cost_price_per_gb - bestPkg.cost_price_per_gb) / prefCarrierPkg.cost_price_per_gb * 100).toFixed(0);
      const starBest = '★'.repeat(bestRating) + '☆'.repeat(5 - bestRating);
      const starPref = '★'.repeat(prefRating) + '☆'.repeat(5 - prefRating);
      carrierNote = `CARRIER NOTE: This package uses ${bestPkg.carrier} (${starBest} ${bestRating === 3 ? 'Regional Coverage' : '#' + (6 - bestRating) + ' Coverage'}).
For wider coverage, ${carrierPreference} (${starPref} ${prefRating >= 5 ? '#1 Coverage' : '#' + (6 - prefRating) + ' Coverage'}) is available at ~${priceDiff}% more per GB.
Let the customer know they're trading coverage quality for a lower price.`;
      console.log(`[findBestValuePackage] Carrier trade-off: ${bestPkg.carrier} (${bestRating}★) vs ${carrierPreference} (${prefRating}★)`);
    }
  }
  
  // Even without explicit carrier preference, flag low-rated carriers
  if (!carrierNote && bestPkg.carrier) {
    const bestRating = getCarrierRating(bestPkg.carrier);
    if (bestRating <= 3) {
      const premiumAlt = candidates.find((p: any) => getCarrierRating(p.carrier) >= 5);
      if (premiumAlt) {
        const starBest = '★'.repeat(bestRating) + '☆'.repeat(5 - bestRating);
        carrierNote = `CARRIER NOTE: This package uses ${bestPkg.carrier} (${starBest} Regional Coverage).
For wider coverage, ${premiumAlt.carrier} (★★★★★ #1 Coverage) is available at ${premiumAlt.currency} ${premiumAlt.cost_price_per_gb?.toFixed(2)}/GB vs ${bestPkg.currency} ${bestPkg.cost_price_per_gb?.toFixed(2)}/GB.
Let the customer know they're trading coverage quality for a lower price.`;
      }
    }
  }
  
  console.log(`[findBestValuePackage] Best value: ${bestPkg.name} at ${bestPkg.cost_price_per_gb?.toFixed(4)}/GB, carrier=${bestPkg.carrier}`);
  return { bestValue: bestPkg, carrierNote };
}

// Find regional Limitless package for heavy users when direct country Limitless is unavailable
// Priority: Europe 42 Countries Limitless (if in Europe) → Global 109 Countries Limitless
async function findRegionalLimitless(
  supabase: any,
  country: string,
  days: number | null
): Promise<PackageInfo | null> {
  const countryLower = country.toLowerCase();
  const targetDays = days || 7; // Default to 7 days if not specified
  
  // Priority 1: Check Europe 42 if country is in Europe
  if (EUROPE_42_COUNTRY_NAMES.includes(countryLower)) {
    console.log(`[findRegionalLimitless] ${country} is in Europe 42, checking Europe 42 Limitless`);
    
    const { data: europe42, error: e42Error } = await supabase
      .from('esim_packages')
      .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
      .eq('is_active', true)
      .ilike('country_name', '%Europe 42%')
      .or('package_type.ilike.%limitless%,name.ilike.%limitless%,name.ilike.%unlimited%')
      .order('validity_days', { ascending: true })
      .order('price', { ascending: true });
    
    if (!e42Error && europe42?.length) {
      // Find exact day match or closest
      const exactMatch = europe42.find((p: any) => p.validity_days === targetDays);
      if (exactMatch) {
        console.log(`[findRegionalLimitless] Found Europe 42 Limitless exact match: ${exactMatch.name}`);
        return {
          ...exactMatch,
          isRegional: true,
          regionalName: 'Europe 42 Countries + 2Stopover',
          coveredCountry: country
        };
      }
      
      // Find closest days
      const closest = [...europe42].sort((a: any, b: any) => 
        Math.abs(a.validity_days - targetDays) - Math.abs(b.validity_days - targetDays)
      )[0];
      
      console.log(`[findRegionalLimitless] Found Europe 42 Limitless closest: ${closest.name}`);
      return {
        ...closest,
        isRegional: true,
        regionalName: 'Europe 42 Countries + 2Stopover',
        coveredCountry: country
      };
    }
  }
  
  // Priority 2: Check Global 109 Countries Limitless (for any supported country)
  console.log(`[findRegionalLimitless] Checking Global 109 Limitless for ${country}`);
  const { data: global109, error: g109Error } = await supabase
    .from('esim_packages')
    .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
    .eq('is_active', true)
    .ilike('country_name', '%Global 109%')
    .or('package_type.ilike.%limitless%,name.ilike.%limitless%,name.ilike.%unlimited%')
    .order('validity_days', { ascending: true })
    .order('price', { ascending: true });
  
  if (!g109Error && global109?.length) {
    // Find exact day match or closest
    const exactMatch = global109.find((p: any) => p.validity_days === targetDays);
    if (exactMatch) {
      console.log(`[findRegionalLimitless] Found Global 109 Limitless exact match: ${exactMatch.name}`);
      return {
        ...exactMatch,
        isRegional: true,
        regionalName: 'Global 109 Countries',
        coveredCountry: country
      };
    }
    
    // Find closest days
    const closest = [...global109].sort((a: any, b: any) => 
      Math.abs(a.validity_days - targetDays) - Math.abs(b.validity_days - targetDays)
    )[0];
    
    console.log(`[findRegionalLimitless] Found Global 109 Limitless closest: ${closest.name}`);
    return {
      ...closest,
      isRegional: true,
      regionalName: 'Global 109 Countries',
      coveredCountry: country
    };
  }
  
  console.log(`[findRegionalLimitless] No regional Limitless found for ${country}`);
  return null;
}

// ═══════════════════════════════════════════════════════════════
// ALTERNATIVE PACKAGE FINDER
// For heavy users with Limitless primary → find Day Pass (highest GB/day, same carrier)
// For light users with Day Pass primary → find Max Speed (lowest GB, same carrier)
// ═══════════════════════════════════════════════════════════════
async function findAlternativePackage(
  supabase: any,
  country: string,
  days: number | null,
  primaryType: 'limitless' | 'daypass' | 'maxspeed',
  primaryCarrier: string | null
): Promise<PackageInfo | null> {
  console.log(`[findAlternativePackage] Finding alternative for primary=${primaryType}, carrier=${primaryCarrier}, country=${country}, days=${days}`);
  
  const parseDataAmountMB = (dataAmount: string): number => {
    const lower = dataAmount.toLowerCase();
    const match = lower.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return unit === 'gb' ? value * 1024 : value;
  };

  if (primaryType === 'limitless' || primaryType === 'maxspeed') {
    // Alternative for Limitless/MaxSpeed → Day Pass with HIGHEST GB/day, same carrier, same days
    const { data: packages, error } = await supabase
      .from('esim_packages')
      .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
      .eq('is_active', true)
      .ilike('country_name', `%${country}%`)
      .or('package_type.ilike.%day_pass%,package_type.ilike.%daypass%')
      .order('price', { ascending: false });
    
    if (error || !packages?.length) {
      console.log(`[findAlternativePackage] No Day Pass packages found for ${country}`);
      return null;
    }

    // Sort by data amount descending (highest GB/day first)
    const sorted = [...packages].sort((a: any, b: any) => 
      parseDataAmountMB(b.data_amount) - parseDataAmountMB(a.data_amount)
    );

    // Try same carrier + same days first
    if (primaryCarrier && days) {
      const match = sorted.find((p: any) => p.carrier === primaryCarrier && p.validity_days === days);
      if (match) {
        console.log(`[findAlternativePackage] Found Day Pass alt (same carrier+days): ${match.name}`);
        return match;
      }
    }
    // Try same carrier, any days
    if (primaryCarrier) {
      const carrierMatches = sorted.filter((p: any) => p.carrier === primaryCarrier);
      if (carrierMatches.length > 0) {
        const match = days 
          ? carrierMatches.sort((a: any, b: any) => Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days))[0]
          : carrierMatches[0];
        console.log(`[findAlternativePackage] Found Day Pass alt (same carrier): ${match.name}`);
        return match;
      }
    }
    // Fallback: any carrier, prefer matching days
    if (days) {
      const dayMatch = sorted.find((p: any) => p.validity_days === days);
      if (dayMatch) return dayMatch;
    }
    console.log(`[findAlternativePackage] Returning highest data Day Pass: ${sorted[0].name}`);
    return sorted[0];
    
  } else {
    // Alternative for Day Pass → Max Speed with LOWEST GB, same carrier, same days
    const { data: packages, error } = await supabase
      .from('esim_packages')
      .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
      .eq('is_active', true)
      .ilike('country_name', `%${country}%`)
      .or('package_type.ilike.%max_speed%,package_type.ilike.%maxspeed%')
      .order('price', { ascending: true });
    
    if (error || !packages?.length) {
      console.log(`[findAlternativePackage] No Max Speed packages found for ${country}`);
      return null;
    }

    // Sort by data amount ascending (lowest GB first)
    const sorted = [...packages].sort((a: any, b: any) => 
      parseDataAmountMB(a.data_amount) - parseDataAmountMB(b.data_amount)
    );

    // Try same carrier + same days first
    if (primaryCarrier && days) {
      const match = sorted.find((p: any) => p.carrier === primaryCarrier && p.validity_days === days);
      if (match) {
        console.log(`[findAlternativePackage] Found Max Speed alt (same carrier+days): ${match.name}`);
        return match;
      }
    }
    // Try same carrier, any days
    if (primaryCarrier) {
      const carrierMatches = sorted.filter((p: any) => p.carrier === primaryCarrier);
      if (carrierMatches.length > 0) {
        const match = days 
          ? carrierMatches.sort((a: any, b: any) => Math.abs(a.validity_days - days) - Math.abs(b.validity_days - days))[0]
          : carrierMatches[0];
        console.log(`[findAlternativePackage] Found Max Speed alt (same carrier): ${match.name}`);
        return match;
      }
    }
    // Fallback: any carrier, prefer matching days
    if (days) {
      const dayMatch = sorted.find((p: any) => p.validity_days === days);
      if (dayMatch) return dayMatch;
    }
    console.log(`[findAlternativePackage] Returning lowest GB Max Speed: ${sorted[0].name}`);
    return sorted[0];
  }
}

// Structured package for frontend display
interface StructuredPackage {
  id: string;
  name: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price: number;
  currency: string;
  package_type: string | null;
  cartUrl: string;
}

interface PackageSearchResult {
  context: string;
  recommendedPackage: PackageInfo | null;
  alternativePackage?: PackageInfo | null;
  packages: StructuredPackage[];
  configuratorUrl: string | null;
  fullConfiguratorUrl: string | null;
  country: string | null;
  days: number | null;
  availableTypes?: { limitless: boolean; daypass: boolean; maxspeed: boolean; hasAnyPackages: boolean };
  [key: string]: any;
}

// Detect carrier preference from conversation history (e.g., user chose DOCOMO or bot recommended it)
function detectCarrierPreference(message: string, conversationHistory: Message[]): string | null {
  const allMessages = [...conversationHistory.map(m => m.content), message];
  
  // Carrier patterns to detect (check most recent messages first)
  const carrierPatterns: { pattern: RegExp; carrier: string }[] = [
    { pattern: /\bdocomo\b/i, carrier: 'DOCOMO' },
    { pattern: /\bsoftbank\b/i, carrier: 'Softbank / KDDI' },
    { pattern: /\bkddi\b/i, carrier: 'Softbank / KDDI' },
  ];

  // Scan from most recent to oldest
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const text = allMessages[i];
    for (const { pattern, carrier } of carrierPatterns) {
      if (pattern.test(text)) {
        console.log(`[detectCarrierPreference] Found carrier "${carrier}" in message: "${text.substring(0, 80)}..."`);
        return carrier;
      }
    }
  }
  
  return null;
}

// Search for relevant eSIM packages with enhanced context
async function searchPackages(
  supabase: any,
  message: string,
  language: SupportedLanguage,
  baseUrl: string,
  conversationHistory: Message[] = [],
  overrideDataPreference: DataPreference = null, // Optional: pass pre-detected preference from original message
  serviceTierPreference: 'priority' | 'economy' | null = null // Optional: customer's service tier preference
): Promise<PackageSearchResult> {
  // Extract country from current message first, then check history
  let country = extractCountry(message);
  if (!country) {
    // Check conversation history for country context
    for (const msg of conversationHistory.slice().reverse()) {
      country = extractCountry(msg.content);
      if (country) {
        console.log(`Found country "${country}" from conversation history`);
        break;
      }
    }
  }
  
  // Extract days, passing conversation history for context
  const days = extractDays(message, conversationHistory);
  
  // Use override preference if provided, otherwise detect from message
  // This is important for freetext mode where the search query is constructed (e.g., "germany 7 days")
  // but we want to use the preference detected from the original user message (e.g., "มาก")
  const dataPreference = overrideDataPreference !== null 
    ? overrideDataPreference 
    : await detectDataPreference(message, conversationHistory);
  console.log(`Extracted - Country: ${country}, Days: ${days}, Data Preference: ${dataPreference || 'none'}${overrideDataPreference !== null ? ' (override)' : ''}`);
  
  if (!country) {
    return { context: '', recommendedPackage: null, alternativePackage: null, packages: [], configuratorUrl: null, fullConfiguratorUrl: null, country: null, days: null, availableTypes: { limitless: false, daypass: false, maxspeed: false, hasAnyPackages: false } };
  }
  
  // USER-TYPE-BASED RECOMMENDATION FLOW
  // Heavy user → Limitless first, then highest data Day Pass
  // Light user → 500MB/day Day Pass
  // Economy tier + known usage → best $/GB via findBestValuePackage (handled in dual-option section below)
  // No preference → Ask user
  let recommendedPackage: PackageInfo | null = null;
  let autoSelectedType: string | null = null;
  let availableTypes = { limitless: false, daypass: false, maxspeed: false, hasAnyPackages: false };
  let dataOption: string | null = null; // For URL pre-selection
  
  // Check what package types are available
  console.log(`[UserType] Checking available package types for ${country}...`);
  availableTypes = await getAvailablePackageTypes(supabase, country);
  console.log(`[UserType] Available types for ${country}:`, availableTypes);
  
  const hasLimitless = availableTypes.limitless;
  const hasDayPass = availableTypes.daypass;
  const hasMaxSpeed = availableTypes.maxspeed;
  const hasNormal = hasDayPass || hasMaxSpeed;
  
  // Detect carrier preference from conversation history (important for Japan multi-carrier)
  const carrierPreference = detectCarrierPreference(message, conversationHistory);
  if (carrierPreference) {
    console.log(`[UserType] Detected carrier preference: ${carrierPreference}`);
  }
  
  // Select package based on user's data preference
  if (dataPreference === 'heavy') {
    // HEAVY USER: Priority order:
    // 1. Direct Country Limitless
    // 2. Direct Country highest Day Pass (prefer direct packages over regional)
    // 3. Direct Country Max Speed
    // 4. Regional Limitless (Europe 42 → Global 109) — only if NO direct packages exist
    console.log(`[UserType] Heavy user - checking direct packages first, then regional fallback`);
    
    // Step 1: Check for direct country Limitless
    if (hasLimitless) {
      recommendedPackage = await findBestPackage(supabase, country, days, 'limitless', carrierPreference);
      autoSelectedType = 'limitless-heavy';
      console.log(`[UserType] Found direct Limitless for ${country}`);
    }
    
    // Step 2: If no direct Limitless, use direct country Day Pass (highest data)
    if (!recommendedPackage && hasDayPass) {
      console.log(`[UserType] No direct Limitless for ${country}, finding highest data Day Pass`);
      recommendedPackage = await findHighestDataDayPass(supabase, country, days, carrierPreference);
      autoSelectedType = 'daypass-high-data';
      if (recommendedPackage) {
        dataOption = recommendedPackage.data_amount;
        console.log(`[UserType] Found direct Day Pass: ${recommendedPackage.name}`);
      }
    }
    
    // Step 3: If no direct Day Pass, use direct Max Speed (with heavy user max-GB priority)
    if (!recommendedPackage && hasMaxSpeed) {
      recommendedPackage = await findBestPackage(supabase, country, days, 'maxspeed', carrierPreference, true);
      autoSelectedType = 'maxspeed-fallback';
      console.log(`[UserType] Found direct Max Speed for ${country}`);
    }
    
    // Step 4: Only if NO direct packages at all, fall back to regional Limitless
    if (!recommendedPackage) {
      console.log(`[UserType] No direct packages for ${country}, checking regional Limitless`);
      recommendedPackage = await findRegionalLimitless(supabase, country, days);
      if (recommendedPackage) {
        autoSelectedType = 'limitless-regional';
        console.log(`[UserType] Found regional Limitless via ${recommendedPackage.regionalName}`);
      }
    }
  } else if (dataPreference === 'light') {
    // LIGHT USER: 500MB/day Day Pass
    console.log(`[UserType] Light user - finding 500MB Day Pass`);
    if (hasDayPass) {
      recommendedPackage = await find500MBDayPass(supabase, country, days, carrierPreference);
      autoSelectedType = 'daypass-light';
      dataOption = '500MB';
    } else if (hasMaxSpeed) {
      recommendedPackage = await findCheapestMaxSpeed(supabase, country, days, carrierPreference);
      autoSelectedType = 'maxspeed-light';
    } else if (hasLimitless) {
      recommendedPackage = await findBestPackage(supabase, country, days, 'limitless', carrierPreference);
      autoSelectedType = 'limitless-only';
    }
  } else {
    // NO PREFERENCE: Use old Unlimited-First flow to ask user
    console.log(`[UserType] No preference detected - will ask user`);
    if (hasLimitless) {
      console.log(`[UserType] Showing Limitless packages for ${country}`);
      autoSelectedType = hasNormal ? 'limitless-with-cheaper' : 'limitless';
      recommendedPackage = await findBestPackage(supabase, country, days, 'limitless', carrierPreference);
    } else if (hasNormal) {
      console.log(`[UserType] Only normal packages available for ${country}`);
      autoSelectedType = 'normal';
      recommendedPackage = await findBestPackage(supabase, country, days, 'daypass', carrierPreference);
      if (!recommendedPackage) {
        recommendedPackage = await findBestPackage(supabase, country, days, 'maxspeed', carrierPreference);
      }
    } else {
      console.log(`[UserType] No packages found for ${country}`);
      recommendedPackage = null;
    }
  }
  
  // ═══ FIND ALTERNATIVE PACKAGE (dual-option system) ═══
  let alternativePackage: PackageInfo | null = null;
  let altDataOption: string | null = null;
  let economyCarrierNote: string | null = null; // Carrier quality note for economy users
  
  // ═══ ECONOMY TIER: Use best-value ($/GB) logic instead of standard recommendation ═══
  if (serviceTierPreference === 'economy' && dataPreference && recommendedPackage) {
    console.log(`[Economy] Economy tier detected with ${dataPreference} usage - using best-value logic`);
    
    if (dataPreference === 'heavy') {
      // Heavy + Economy: Find best $/GB in high-data packages (no carrier lock)
      if (hasDayPass) {
        const { bestValue, carrierNote } = await findBestValuePackage(supabase, country, days, 'day_pass', carrierPreference, false);
        if (bestValue) {
          recommendedPackage = bestValue;
          autoSelectedType = 'daypass-economy-heavy';
          dataOption = bestValue.data_amount;
          economyCarrierNote = carrierNote;
          console.log(`[Economy] Heavy best-value DayPass: ${bestValue.name}`);
        }
      }
      if (!recommendedPackage || autoSelectedType !== 'daypass-economy-heavy') {
        if (hasMaxSpeed) {
          const { bestValue, carrierNote } = await findBestValuePackage(supabase, country, days, 'max_speed', carrierPreference, false);
          if (bestValue) {
            recommendedPackage = bestValue;
            autoSelectedType = 'maxspeed-economy-heavy';
            economyCarrierNote = carrierNote;
          }
        }
      }
      // Alt: Limitless at 0.7x as convenience option
      if (hasLimitless) {
        alternativePackage = await findBestPackage(supabase, country, days, 'limitless', carrierPreference);
        if (alternativePackage) {
          altDataOption = alternativePackage.data_amount;
          console.log(`[Economy] Heavy alt: Limitless ${alternativePackage.name}`);
        }
      }
    } else if (dataPreference === 'light') {
      // Light + Economy: Find best $/GB in small data packages (no carrier lock)
      if (hasDayPass) {
        const { bestValue, carrierNote } = await findBestValuePackage(supabase, country, days, 'day_pass', carrierPreference, true);
        if (bestValue) {
          recommendedPackage = bestValue;
          autoSelectedType = 'daypass-economy-light';
          dataOption = bestValue.data_amount;
          economyCarrierNote = carrierNote;
          console.log(`[Economy] Light best-value DayPass: ${bestValue.name}`);
        }
      }
      // Alt: Cheapest small MaxSpeed
      if (hasMaxSpeed) {
        const { bestValue: altValue } = await findBestValuePackage(supabase, country, days, 'max_speed', carrierPreference, true);
        if (altValue && altValue.id !== recommendedPackage?.id) {
          alternativePackage = altValue;
          altDataOption = altValue.data_amount;
          console.log(`[Economy] Light alt: MaxSpeed ${altValue.name}`);
        }
      }
    }
  } else if (recommendedPackage && (dataPreference === 'heavy' || dataPreference === 'light')) {
    // ═══ PRIORITY TIER: Standard dual-option logic ═══
    const primaryPkgType = (recommendedPackage.package_type || '').toLowerCase();
    const primaryName = (recommendedPackage.name || '').toLowerCase();
    const isLimitlessPrimary = primaryPkgType.includes('limitless') || primaryName.includes('limitless') || primaryName.includes('real unlimited') || (primaryName.includes('unlimited') && !primaryName.includes('speed'));
    const isDayPassPrimary = primaryPkgType.includes('day_pass') || primaryPkgType.includes('daypass');
    const isMaxSpeedPrimary = primaryPkgType.includes('max_speed') || primaryPkgType.includes('maxspeed');
    
    if (dataPreference === 'heavy' && isLimitlessPrimary) {
      alternativePackage = await findAlternativePackage(supabase, country, days, 'limitless', recommendedPackage.carrier || null);
      if (alternativePackage) {
        altDataOption = alternativePackage.data_amount;
        console.log(`[DualOption] Heavy user alt: Day Pass ${alternativePackage.data_amount}/day - ${alternativePackage.name}`);
      }
    } else if (dataPreference === 'heavy' && isDayPassPrimary) {
      // Heavy user with direct Day Pass primary — offer regional Limitless as unlimited alternative
      alternativePackage = await findRegionalLimitless(supabase, country, days);
      if (alternativePackage) {
        altDataOption = alternativePackage.data_amount;
        console.log(`[DualOption] Heavy user alt: Regional Limitless ${alternativePackage.name}`);
      }
      // Fallback: try Max Speed if no regional Limitless
      if (!alternativePackage && hasMaxSpeed) {
        alternativePackage = await findAlternativePackage(supabase, country, days, 'daypass', recommendedPackage.carrier || null);
        if (alternativePackage) {
          altDataOption = alternativePackage.data_amount;
          console.log(`[DualOption] Heavy user alt fallback: Max Speed ${alternativePackage.name}`);
        }
      }
    } else if (dataPreference === 'light' && isDayPassPrimary) {
      // Light user with Day Pass primary — try Max Speed first
      alternativePackage = await findAlternativePackage(supabase, country, days, 'daypass', recommendedPackage.carrier || null);
      if (alternativePackage) {
        altDataOption = alternativePackage.data_amount;
        console.log(`[DualOption] Light user alt: Max Speed ${alternativePackage.data_amount} - ${alternativePackage.name}`);
      }
      // Fallback: offer a higher-tier Day Pass (e.g., 1GB/day vs 500MB/day)
      if (!alternativePackage && hasDayPass) {
        const { data: dayPassPkgs } = await supabase
          .from('esim_packages')
          .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
          .eq('is_active', true)
          .ilike('country_name', `%${country}%`)
          .or('package_type.ilike.%day_pass%,package_type.ilike.%daypass%')
          .order('price', { ascending: true });
        if (dayPassPkgs?.length) {
          const alt = dayPassPkgs.find((p: any) => p.id !== recommendedPackage!.id && (!days || p.validity_days >= days));
          if (alt) {
            alternativePackage = alt;
            altDataOption = alt.data_amount;
            console.log(`[DualOption] Light user alt fallback: Day Pass ${alt.data_amount}/day - ${alt.name}`);
          }
        }
      }
    } else if (dataPreference === 'light' && isMaxSpeedPrimary) {
      // Light user with Max Speed primary — try Day Pass as alternative
      if (hasDayPass) {
        alternativePackage = await find500MBDayPass(supabase, country, days, carrierPreference);
        if (alternativePackage && alternativePackage.id !== recommendedPackage.id) {
          altDataOption = alternativePackage.data_amount;
          console.log(`[DualOption] Light MaxSpeed user alt: Day Pass ${alternativePackage.data_amount}/day - ${alternativePackage.name}`);
        } else {
          alternativePackage = null;
        }
      }
    } else if (dataPreference === 'light' && isLimitlessPrimary) {
      // Light user forced to Limitless (only option) — try Day Pass or Max Speed
      if (hasDayPass) {
        alternativePackage = await find500MBDayPass(supabase, country, days, carrierPreference);
        if (alternativePackage) {
          altDataOption = alternativePackage.data_amount;
          console.log(`[DualOption] Light Limitless-only alt: Day Pass ${alternativePackage.name}`);
        }
      }
      if (!alternativePackage && hasMaxSpeed) {
        alternativePackage = await findCheapestMaxSpeed(supabase, country, days, carrierPreference);
        if (alternativePackage && alternativePackage.id !== recommendedPackage.id) {
          altDataOption = alternativePackage.data_amount;
          console.log(`[DualOption] Light Limitless-only alt: Max Speed ${alternativePackage.name}`);
        } else {
          alternativePackage = null;
        }
      }
    } else if (dataPreference === 'heavy' && isMaxSpeedPrimary) {
      // Heavy user with Max Speed primary — try Limitless or Day Pass
      if (hasLimitless) {
        alternativePackage = await findBestPackage(supabase, country, days, 'limitless', carrierPreference);
        if (alternativePackage) {
          altDataOption = alternativePackage.data_amount;
          console.log(`[DualOption] Heavy MaxSpeed user alt: Limitless ${alternativePackage.name}`);
        }
      }
      if (!alternativePackage && hasDayPass) {
        alternativePackage = await findAlternativePackage(supabase, country, days, 'maxspeed', recommendedPackage.carrier || null);
        if (alternativePackage) {
          altDataOption = alternativePackage.data_amount;
          console.log(`[DualOption] Heavy MaxSpeed user alt: Day Pass ${alternativePackage.name}`);
        }
      }
    }
  }
  
  // Alias for backward compatibility
  const limitlessPackage = recommendedPackage;
  
  // Determine the search term for alternatives - use regional package name if applicable
  const regionalInfo = REGIONAL_COVERAGE[country.toLowerCase()];
  let alternativesSearchTerm = country;
  
  // Check if the country requires regional fallback
  if (regionalInfo) {
    const { data: directCheck } = await supabase
      .from('esim_packages')
      .select('id')
      .eq('is_active', true)
      .ilike('country_name', `%${country}%`)
      .limit(1);
    
    if (!directCheck?.length) {
      alternativesSearchTerm = regionalInfo.primary.searchTerm;
      console.log(`[Alternatives] Using regional search for ${country}: ${alternativesSearchTerm}`);
    }
  }
  
  // Build query for Limitless alternatives ONLY (Unlimited-First flow)
  let alternativesQuery = supabase
    .from('esim_packages')
    .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
    .eq('is_active', true)
    .ilike('country_name', `%${alternativesSearchTerm}%`)
    .or('package_type.ilike.%limitless%,name.ilike.%limitless%,name.ilike.%real unlimited%,name.ilike.%unlimited%');
  
  console.log(`[Alternatives] Filtering for Limitless packages only`);
  
  const { data: alternatives, error } = await alternativesQuery
    .order('price', { ascending: true })
    .limit(12);
  
  // Also fetch alternative regional packages (e.g., Global 151 when showing Global 109)
  let allAlternatives: any[] = alternatives || [];
  
  if (regionalInfo?.alternatives?.length && allAlternatives.length < 8) {
    console.log(`[Alternatives] Fetching regional alternatives:`, regionalInfo.alternatives.map(a => a.regionalName));
    
    for (const altRegional of regionalInfo.alternatives) {
      const { data: altPackages } = await supabase
        .from('esim_packages')
        .select('id, name, country_name, country_code, data_amount, validity_days, price, currency, package_type, qos_speed, speed_after_limit, carrier, network_type')
        .eq('is_active', true)
        .ilike('country_name', `%${altRegional.searchTerm}%`)
        .order('price', { ascending: true })
        .limit(6);
      
      if (altPackages?.length) {
        // Filter by package types if specified
        let filteredAltPackages = altPackages;
        if (altRegional.packageTypes?.length) {
          filteredAltPackages = altPackages.filter((pkg: any) => {
            const pkgType = pkg.package_type?.toLowerCase() || '';
            return altRegional.packageTypes.some((t: string) => 
              pkgType.includes(t.toLowerCase())
            );
          });
        }
        console.log(`[Alternatives] Found ${filteredAltPackages.length} ${altRegional.regionalName} packages`);
        allAlternatives = [...allAlternatives, ...filteredAltPackages];
      }
    }
  }
  
  if (error) {
    console.error('Error fetching packages:', error);
    return { context: '', recommendedPackage: null, alternativePackage: null, packages: [], configuratorUrl: null, fullConfiguratorUrl: null, country, days, availableTypes };
  }

  // Fetch Standard (day_pass) packages for simple-configurator pricing
  const { data: standardPricingPkgs } = await supabase
    .from('esim_packages')
    .select('id, name, price, validity_days, package_type, data_amount, daily_reset_amount')
    .eq('is_active', true)
    .ilike('country_name', `%${alternativesSearchTerm}%`)
    .or('package_type.ilike.%day_pass%,package_type.ilike.%daypass%')
    .order('price', { ascending: true })
    .limit(30);

  // Mirror simple configurator tier logic to filter standard packages
  const parseDailyGB = (amt: string | null): number => {
    if (!amt) return 0;
    const match = amt.match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i);
    if (!match) return 0;
    return match[2].toUpperCase() === 'GB' ? parseFloat(match[1]) : parseFloat(match[1]) / 1024;
  };

  const allDailyAmounts = [...new Set(
    (standardPricingPkgs || []).map((p: any) => parseDailyGB(p.daily_reset_amount)).filter((v: number) => v > 0)
  )];

  let visibleTiers: number[];
  if (allDailyAmounts.includes(5)) {
    visibleTiers = [5, 3, 1].filter(d => allDailyAmounts.includes(d));
  } else if (allDailyAmounts.includes(3)) {
    visibleTiers = [3, 1].filter(d => allDailyAmounts.includes(d));
  } else if (allDailyAmounts.includes(2)) {
    visibleTiers = [2, 1].filter(d => allDailyAmounts.includes(d));
  } else {
    visibleTiers = allDailyAmounts.slice(0, 1) as number[];
  }

  // Filter standard packages to only simple-configurator-visible tiers
  const simpleStandardPkgs = (standardPricingPkgs || []).filter((p: any) =>
    visibleTiers.includes(parseDailyGB(p.daily_reset_amount))
  );

  console.log(`[Standard Pricing] Found ${standardPricingPkgs?.length || 0} day_pass pkgs, visible tiers: [${visibleTiers}], filtered to ${simpleStandardPkgs.length} pkgs`);
  
  let context = '';
  
  // Check if we need to ask the data preference question (STEP 2 of consultative flow)
  // SMART DETECTION: Only ask if BOTH package types are available
  if (country && !limitlessPackage && dataPreference === null && !autoSelectedType) {
    // Both types available OR no packages found - ask preference or report no packages
    if (!availableTypes.hasAnyPackages) {
      console.log(`No packages available for ${country}`);
      context = `
⚠️ NO PACKAGES AVAILABLE FOR ${country.toUpperCase()} — ESCALATE TO AGENT

Unfortunately, we don't have any eSIM packages that cover ${country} at this time.
The customer should be connected to a human agent who can check availability and follow up.

IMPORTANT: You MUST set needsEscalation to true in your response. This will connect the customer with our team.

For Thai customers:
"ขออภัยนะคะพี่ ขณะนี้เรายังไม่มีแพ็กเกจ eSIM สำหรับประเทศ ${country} โดยตรงค่ะ น้องขอส่งต่อให้ทีมงานตรวจสอบและติดต่อกลับนะคะ 😊"

For English customers:
"I'm sorry, we don't currently have eSIM packages for ${country} right now. Let me connect you with our team who can check availability and get back to you. 😊"
`;
    return { 
        context, 
        recommendedPackage: null,
        alternativePackage: null,
        packages: [],
        configuratorUrl: null,
        fullConfiguratorUrl: null,
        country,
        days,
        availableTypes
      };
    }
    
    console.log('Country detected but no preference - returning ask-preference context');
    context = `
🚨 CRITICAL: DATA USAGE PREFERENCE NOT YET DETECTED - DO NOT RECOMMEND PACKAGES YET!

Customer mentioned they want eSIM for: **${country}**${days ? ` for ${days} days` : ''}

═══════════════════════════════════════════════════════════════
❓ YOUR NEXT STEP: ASK THE DATA USAGE QUESTION
═══════════════════════════════════════════════════════════════

You MUST ask the customer about their data usage before recommending any package.
DO NOT recommend specific packages, prices, or product names yet.

Use this format based on language:

For Thai customers:
"พี่ต้องการใช้งานแบบไหนคะ? 

🚀 **ใช้เน็ตเยอะ**: วิดีโอคอล ทำงาน สตรีมหนัง Netflix/YouTube → แนะนำ Unlimited

📱 **ใช้เน็ตทั่วไป**: แชท แมพ ไลน์ ใช้งานเบาๆ → แนะนำ Value"

For English customers:
"What's your data usage like?

🚀 **Heavy data user**: Video calls, remote work, streaming → Unlimited

📱 **Regular user**: Chat, maps, messaging, browsing → Value"

⛔ WAIT for the customer to respond with their usage type before showing any packages!
⚠️ IMPORTANT: 500MB/day Day Pass is ONLY suitable for light users - NOT for heavy users!
`;
    
    return { 
      context, 
      recommendedPackage: null,
      alternativePackage: null,
      packages: [],
      configuratorUrl: null,
      fullConfiguratorUrl: null,
      country,
      days,
      availableTypes
    };
  }

  // Simplified: Just provide country page URL instead of detailed package recommendations
  const countryPageUrl = generateFullConfiguratorUrl(baseUrl, country);
  
  // Build available types info for context
  const typesAvailable: string[] = [];
  if (availableTypes.limitless) typesAvailable.push('Unlimited');
  if (availableTypes.daypass) typesAvailable.push('Value');
  if (availableTypes.maxspeed) typesAvailable.push('Pay-per-use');
  
  // Calculate starting prices per day for each plan type from available packages
  const allPackagesForPricing = [...(allAlternatives || []), ...simpleStandardPkgs];
  let unlimitedStartingPerDay: number | null = null;
  let standardStartingPerDay: number | null = null;
  
  for (const pkg of allPackagesForPricing) {
    const pkgType = (pkg.package_type || '').toLowerCase();
    const pricePerDay = pkg.validity_days > 0 ? pkg.price / pkg.validity_days : pkg.price;
    
    if (pkgType.includes('limitless') || pkgType.includes('unlimited')) {
      if (unlimitedStartingPerDay === null || pricePerDay < unlimitedStartingPerDay) {
        unlimitedStartingPerDay = pricePerDay;
      }
    } else if (pkgType.includes('day_pass') || pkgType.includes('daypass') || pkgType.includes('standard')) {
      if (standardStartingPerDay === null || pricePerDay < standardStartingPerDay) {
        standardStartingPerDay = pricePerDay;
      }
    }
  }
  
  // Build pricing info string
  let pricingInfo = '';
  const hasStandard = standardStartingPerDay !== null;
  const hasUnlimited = unlimitedStartingPerDay !== null;
  
  if (hasStandard && hasUnlimited) {
    pricingInfo = `💰 Starting prices: $${standardStartingPerDay!.toFixed(2)}/day for Value, $${unlimitedStartingPerDay!.toFixed(2)}/day for Unlimited`;
  } else if (hasStandard) {
    pricingInfo = `💰 Starting price: $${standardStartingPerDay!.toFixed(2)}/day`;
  } else if (hasUnlimited) {
    pricingInfo = `💰 Starting price: $${unlimitedStartingPerDay!.toFixed(2)}/day`;
  }
  
  console.log(`[Pricing] ${country}: Standard=$${standardStartingPerDay?.toFixed(2)}/day, Unlimited=$${unlimitedStartingPerDay?.toFixed(2)}/day`);
  
  context = `
📍 DESTINATION: ${country}
${typesAvailable.length > 0 ? `📦 Available plan types: ${typesAvailable.join(', ')}` : '⚠️ No packages found for this destination'}
${pricingInfo}

🔗 COUNTRY PAGE URL: ${countryPageUrl}

INSTRUCTION: Direct the customer to browse packages on the country page.
- Use this link: [${language === 'th' ? `ดูแพ็กเกจ eSIM สำหรับ ${country}` : `View eSIM packages for ${country}`}](${countryPageUrl})
- Mention the starting price(s) per day as shown above.
${hasStandard && hasUnlimited ? '- Mention BOTH Value and Unlimited starting prices.' : '- Show just the single starting price.'}
- In Thai responses, write plan names as: "Value (คุ้มค่า)" and "Unlimited (ไม่จำกัด)"
- Do NOT mention Lite unless the customer explicitly asks for it.
- Let the customer browse and choose on the page themselves
- Keep the response short and friendly (2-4 sentences max)
`;

  // Build simplified configurator URL
  const configuratorUrl = countryPageUrl;
  const fullConfiguratorUrl = countryPageUrl;

  return { 
    context, 
    recommendedPackage: recommendedPackage,
    alternativePackage,
    packages: [],
    configuratorUrl,
    fullConfiguratorUrl,
    country,
    days,
    availableTypes,
    primaryCartUrl: null,
    primaryConfiguratorUrl: null,
    altCartUrl: null,
    altConfiguratorUrl: null,
    browseAllUrl: countryPageUrl,
  };
}

// Search KB articles for relevant content (respects source visibility)
async function searchKBArticles(
  supabase: any,
  query: string,
  language: string,
  limit: number = 5
): Promise<KBArticle[]> {
  // Filter by source: only include articles visible to chatbot
  const { data: articles, error } = await supabase
    .from('kb_articles')
    .select('id, title, content, category, language, source')
    .eq('is_published', true)
    .eq('is_internal', false)
    .in('source', ['both', 'chatbot']) // Single source of truth: only chatbot-visible articles
    .limit(limit * 4); // Fetch more, then filter by language
  
  // Filter by language preference (prefer user's language, fallback to English)
  const languageFiltered = (articles || []).filter((article: any) => 
    article.language === language || article.language === 'en'
  );

  if (error) {
    console.error('Error fetching KB articles:', error);
    return [];
  }

  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scoredArticles = languageFiltered.map((article: KBArticle) => {
    const text = `${article.title} ${article.content}`.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (text.includes(word)) score++;
    }
    if (article.language === language) score += 2;
    return { ...article, score };
  });

  return scoredArticles
    .filter((a: any) => a.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);
}

// Check if user has completed orders (for history limit tier)
async function hasPurchasedOrders(supabase: any, userId: string | null): Promise<boolean> {
  if (!userId) return false;
  
  const { count, error: orderError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');
  
  if (orderError) {
    console.error('Error checking purchase status:', orderError);
    return false;
  }
  
  return (count ?? 0) > 0;
}

// Get conversation history - INCLUDES reset markers for context detection
async function getConversationHistory(
  supabase: any,
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  // CRITICAL FIX: Fetch NEWEST messages first to get the correct context window
  // Then reverse to restore chronological order for downstream logic
  const { data: messages, error } = await supabase
    .from('conversation_messages')
    .select('content, sender_type, created_at, is_internal_note, id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })  // Newest first
    .order('id', { ascending: false })           // Tie-breaker for same timestamp
    .limit(limit);

  if (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }

  // Reverse to get chronological order (oldest to newest) for downstream logic
  const chronologicalMessages = (messages || []).slice().reverse();

  // Map messages: keep reset markers but filter other internal notes
  return chronologicalMessages
    .filter((msg: any) => {
      // Always keep CONTEXT_RESET markers
      if (msg.content === '[CONTEXT_RESET]' || msg.content.includes('[CONTEXT_RESET]')) {
        return true;
      }
      // Filter out other internal notes
      return !msg.is_internal_note;
    })
    .map((msg: any) => ({
      role: msg.sender_type === 'customer' ? 'user' : 
            msg.sender_type === 'system' ? 'system' : 'assistant',
      content: msg.content
    }));
}

// Count AI turns in conversation
function countAITurns(history: Message[]): number {
  return history.filter(m => m.role === 'assistant').length;
}

// Build context from KB articles
function buildKBContext(articles: KBArticle[]): string {
  if (articles.length === 0) return '';
  
  const context = articles.map(a => 
    `### ${a.title}\n${a.content}`
  ).join('\n\n');
  
  return `\n\n---\nKNOWLEDGE BASE CONTEXT:\n${context}\n---\n`;
}

// Build device-specific installation guidance
function buildInstallationGuidance(deviceInfo?: DeviceInfo, language: SupportedLanguage = 'en'): string {
  if (!deviceInfo) {
    return `
## 📱 INSTALLATION GUIDANCE (Device Unknown)
When the customer asks about installation, first ask what device they're using:

Thai: "พี่ใช้โทรศัพท์รุ่นอะไรคะ? (iPhone หรือ Android) น้องจะได้แนะนำขั้นตอนที่ถูกต้องค่ะ 😊"
English: "What phone are you using? (iPhone or Android) I'll provide the right setup instructions! 😊"

Once they answer:
- iPhone iOS 17.4+: Recommend Quick Install (1-click)
- Older iPhone: QR Code scan via Settings → Cellular → Add eSIM
- Android: QR Code scan via Settings → SIM Manager → Add eSIM
`;
  }

  if (deviceInfo.supportsOneClick) {
    return `
## 📱 DEVICE-SPECIFIC INSTALLATION GUIDANCE
✨ DETECTED: iPhone with iOS ${deviceInfo.iosVersion}+ (Supports ONE-CLICK QUICK INSTALL!)

When customer asks about installation, PRIORITIZE the Quick Install option:

### Quick Install Instructions (RECOMMENDED - Fastest Method!)

**Thai Response:**
"🎉 ยินดีค่ะพี่! พี่ใช้ iPhone ที่รองรับการติดตั้งด่วนแบบ 1 คลิกเลย!

📱 **วิธีติดตั้ง (ง่ายมาก!):**
1. ไปที่หน้ารายละเอียดคำสั่งซื้อ หรือเปิดอีเมลยืนยันคำสั่งซื้อ
2. กดปุ่ม **"ติดตั้ง eSIM เลย"** หรือคลิกลิงก์ Quick Install
3. ระบบจะเปิดการตั้งค่าให้อัตโนมัติ - แค่ยืนยันการติดตั้ง เสร็จเลย!

✅ ไม่ต้องสแกน QR Code
✅ ไม่ต้องใส่ข้อมูลเอง
✅ ติดตั้งเสร็จใน 30 วินาที 🚀"

**English Response:**
"🎉 Great news! You're using an iPhone that supports One-Click Quick Install!

📱 **How to Install (Super Easy!):**
1. Go to your Order Detail page or open your order confirmation email
2. Tap the **'Install eSIM Now'** button or Quick Install link
3. Your settings will open automatically - just confirm to install!

✅ No QR code scanning needed
✅ No manual data entry
✅ Install in 30 seconds 🚀"

**Important Notes:**
- Make sure they have WiFi or mobile data before installing
- The Quick Install button is on their Order Detail page AND in their email
- If they're using the same iPhone to order AND install, Quick Install is perfect!
`;
  } else if (deviceInfo.isIOS) {
    return `
## 📱 DEVICE-SPECIFIC INSTALLATION GUIDANCE  
DETECTED: iPhone with iOS ${deviceInfo.iosVersion || '< 17.4'} (Older iOS - QR Code method required)

When customer asks about installation, guide them through QR Code scanning:

**Thai Response:**
"สำหรับ iPhone ของพี่ ให้ทำตามขั้นตอนนี้นะคะ:

📱 **วิธีติดตั้ง eSIM:**
1. ✅ ตรวจสอบว่าเชื่อมต่อ WiFi แล้ว
2. ไปที่ **Settings** (การตั้งค่า)
3. กด **Cellular** (เซลลูลาร์) หรือ **Mobile Data**
4. กด **Add eSIM** หรือ **เพิ่ม eSIM**
5. เลือก **Use QR Code** แล้วสแกน QR Code จากหน้าคำสั่งซื้อหรืออีเมล

⏱️ ใช้เวลาประมาณ 2-3 นาทีค่ะ 😊

💡 **Tips:** 
- หากมีมือถืออีกเครื่อง ให้เปิด QR Code บนเครื่องนั้นแล้วใช้ iPhone สแกน
- หากมีเครื่องเดียว สามารถใช้วิธีใส่รหัสด้วยตนเองได้ค่ะ"

**English Response:**
"For your iPhone, here's how to install your eSIM:

📱 **Installation Steps:**
1. ✅ Make sure you're connected to WiFi
2. Go to **Settings**
3. Tap **Cellular** (or **Mobile Data**)
4. Tap **Add eSIM**
5. Choose **Use QR Code** and scan from your Order page or email

⏱️ Takes about 2-3 minutes! 😊

💡 **Tips:**
- If you have another device, display the QR there and scan with your iPhone
- If you only have one device, you can use manual entry instead"
`;
  } else if (deviceInfo.isAndroid) {
    return `
## 📱 DEVICE-SPECIFIC INSTALLATION GUIDANCE
DETECTED: Android device

When customer asks about installation, guide them through QR Code scanning:

**Thai Response:**
"สำหรับ Android ให้ทำตามขั้นตอนนี้นะคะพี่:

📱 **วิธีติดตั้ง eSIM:**
1. ✅ ตรวจสอบว่าเชื่อมต่อ WiFi แล้ว
2. ไปที่ **Settings** (การตั้งค่า)
3. กด **Connections** หรือ **Network & Internet**
4. กด **SIM Manager** หรือ **SIM cards**
5. กด **Add eSIM** หรือ **+**
6. เลือก **Scan QR Code** แล้วสแกน QR Code จากหน้าคำสั่งซื้อหรืออีเมล

⏱️ ใช้เวลาประมาณ 2-3 นาทีค่ะ 😊

💡 **หมายเหตุ:** ขั้นตอนอาจแตกต่างกันเล็กน้อยขึ้นกับยี่ห้อโทรศัพท์ (Samsung, Pixel, Xiaomi ฯลฯ)"

**English Response:**
"For your Android device, here's how to install your eSIM:

📱 **Installation Steps:**
1. ✅ Make sure you're connected to WiFi
2. Go to **Settings**
3. Tap **Connections** or **Network & Internet**
4. Tap **SIM Manager** or **SIM cards**
5. Tap **Add eSIM** or **+**
6. Choose **Scan QR Code** and scan from your Order page or email

⏱️ Takes about 2-3 minutes! 😊

💡 **Note:** Steps may vary slightly depending on your phone brand (Samsung, Pixel, Xiaomi, etc.)"
`;
  }

  // Unknown device fallback
  return `
## 📱 INSTALLATION GUIDANCE (Device type unclear)
When the customer asks about installation, ask what device they're using to provide the best instructions.

Thai: "พี่ใช้โทรศัพท์รุ่นอะไรคะ? (iPhone หรือ Android) น้องจะได้แนะนำขั้นตอนที่เหมาะกับเครื่องพี่ค่ะ 😊"
English: "What phone are you using? (iPhone or Android) I'll provide the right setup instructions for you! 😊"
`;
}

// Build enhanced system prompt for conversational sales agent
function buildSalesAgentPrompt(basePrompt: string, language: SupportedLanguage, deviceInfo?: DeviceInfo): string {
  const installationGuidance = buildInstallationGuidance(deviceInfo, language);
  
  const languageRules: Record<SupportedLanguage, string> = {
    th: `You MUST respond ONLY in Thai (ภาษาไทย) for this conversation.
- Use Thai polite particles: ค่ะ/คะ (feminine). NEVER use ครับ.
- Always refer to yourself as "น้อง" and address the customer as "พี่"
- All text must be in Thai, except technical terms (eSIM, QR Code, APN, etc.)
- DO NOT switch to English even if examples below show English options.`,
    en: `You MUST respond ONLY in English for this conversation.
- Use friendly, conversational English.
- Do NOT switch to Thai or any other language even if examples below show them.`,
    ja: `You MUST respond ONLY in Japanese (日本語) for this conversation.
- Use polite です/ます form.
- Keep the tone warm and natural.
- Do NOT switch to English or Thai even if examples below show them.`,
    ko: `You MUST respond ONLY in Korean (한국어) for this conversation.
- Use polite and natural customer-facing Korean.
- Keep the tone warm and helpful.
- Do NOT switch to English or Thai even if examples below show them.`,
    fr: `You MUST respond ONLY in French (Français) for this conversation.
- Use polite "vous" form.
- Keep the tone warm and conversational.
- Do NOT switch to English or Thai even if examples below show them.`,
    de: `You MUST respond ONLY in German (Deutsch) for this conversation.
- Use polite "Sie" form.
- Keep the tone warm and conversational.
- Do NOT switch to English or Thai even if examples below show them.`,
    zh: `You MUST respond ONLY in Simplified Chinese (简体中文) for this conversation.
- Use polite and professional Chinese.
- Keep the tone warm, friendly, and helpful.
- Currency: $ (USD). Convert to ¥ (CNY) when helpful.
- Do NOT switch to English or Thai even if examples below show them.`,
  };

  const languageEnforcement = `## 🌏 LANGUAGE REQUIREMENT (CRITICAL - FOLLOW THIS!)
${languageRules[language]}`;

const salesPrompt = `
${languageEnforcement}
You are Mobile11's friendly support agent - warm, helpful, and conversational like talking to a friend.
You can help with ANYTHING customers need - sales, support, troubleshooting, billing, orders, and general questions.

## ⚠️ ANTI-HALLUCINATION RULES (CRITICAL - READ FIRST)
**NEVER INVENT OR MAKE UP:**
- Loyalty program names, tiers, points, or thresholds
- Refund policy details or timeframes
- Payment methods or currencies
- Carrier or network names
- Technical specifications or speeds
- Pricing or discount percentages
- Company policies or procedures

**ALWAYS:**
- Use ONLY information from KNOWLEDGE BASE CONTEXT below
- If KB content exists, quote or paraphrase it accurately
- If no KB content is available, say "I don't have specific details on that - please contact our support team" rather than guessing
- Match the exact terminology used in KB articles

## Mobile11 Loyalty Program (EXACT FACTS - DO NOT MODIFY)
- Currency: **Mobile11 Money** (cashback credits, NOT points, NOT M-Points)
- Tiers (EXACT thresholds - use these ONLY):
  - Explorer: Starting tier, 5% cashback
  - Silver Explorer: $50 USD (฿1,750), 7% cashback  
  - Gold Explorer: $100 USD (฿3,500), 10% cashback
  - Platinum Explorer: $200 USD (฿7,000), 15% cashback
- Cashback earned on purchases WITHOUT discount/referral codes
- Mobile11 Money expires after 1 year of inactivity
- Expiration resets to 1 year from date of ANY of these activities:
  • Any eSIM purchase (even partial Mobile11 Money payment)
  • Top-up purchases
  • Earning new referral rewards
- If customer stays active, balance NEVER expires
- NEVER use terms: "M-Points", "loyalty points", "Blue tier", "reward points"

## Refund Policy (EXACT FACTS - DO NOT MODIFY)
- Full refund: ONLY if eSIM has NOT been installed yet
- Full refund: Technical issues preventing installation (verified by team)
- Full refund: Order placed in error (within 24 hours)
- NO refund: eSIM installed and activated
- NO refund: Any data consumed
- NO refund: QR code revealed/downloaded
- NO refund: More than 30 days since purchase
- Refund processing: 5-10 business days to original payment method
- NEVER say "refunds within 24 hours if unused" - this is WRONG

## Payment Methods (EXACT - DO NOT INVENT)
- Credit/Debit cards (Visa, Mastercard)
- PromptPay (Thai QR payment)
- Mobile11 Money balance
- NEVER invent other payment methods

## 🎉 SONGKRAN 2026 PROMOTION (March 14 – April 10, 2026)
- **Active Period:** March 14, 2026 to April 10, 2026
- **Promo Code:** SK2026
- **Discount:** 40% off any eSIM package
- **Policy:** Buy now, use within 180 days — customers can purchase during the promo and activate the eSIM anytime within 6 months
- If a customer asks about promotions, discounts, or Songkran deals during this period, proactively mention this offer
- Thai: "ตอนนี้มีโปรฯ สงกรานต์ลด 40% ค่ะพี่! ใช้โค้ด SK2026 ตอนชำระเงิน ซื้อตอนนี้เก็บไว้ใช้ได้ภายใน 180 วันเลยค่ะ 🎉💦"
- English: "We have a Songkran promotion — 40% off with code SK2026! Buy now and activate within 180 days 🎉💦"
- Check the dynamic promotion context below for the current promotion status — it contains today's real date and whether the promo is active right now.
- Always defer to the dynamic promotion grounding facts over any static date logic.

## 🎯 YOUR ROLE: CONVERSATIONAL SUPPORT AGENT
You are a knowledgeable support agent who can:
- Answer any questions about eSIMs, ordering, pricing, installation
- Help troubleshoot connectivity issues
- Assist with account and order inquiries
- Provide travel eSIM advice
- Explain refund and billing policies
- Guide through installation steps

## ⚠️ BREVITY IS CRITICAL - READ THIS FIRST!
- Keep responses to 1-3 SHORT sentences max
- Do NOT show specific prices or package details - direct users to the country page instead
- Let the user ask if they want more info
- NEVER write long paragraphs or bullet lists unless specifically asked
- Talk like a friendly human support agent, not a robotic assistant

## 🚫 ABSOLUTE RULE: ONE QUESTION PER MESSAGE — ZERO EXCEPTIONS
- NEVER combine two questions in the same message
- The word "Also" followed by a second question is FORBIDDEN
- If you catch yourself about to add a second question, DELETE IT and end the message

## URL RULES (CRITICAL)
- ONLY use exact URLs from context - NEVER invent URLs
- No /product/, /shop/, /buy/ paths - these don't exist!
- For other options, ALWAYS use the configurator URL provided in context

## 🙋 HUMAN AGENT HANDOFF (LINE & Facebook only)
Do NOT proactively mention human agents unless the user explicitly asks for one, expresses strong frustration, or you truly cannot help. The persistent menu and UI already provide a "Talk to Agent" button — do not duplicate it in your messages. Only mention the agent option when the user is clearly stuck or upset after multiple failed attempts.

## CONVERSATION FLOW (STRICT STEP BY STEP - ONLY ONE STEP PER MESSAGE)
⚠️ CRITICAL: You MUST follow these steps IN ORDER. Each step = ONE message. Do NOT combine or skip steps. Do NOT show carrier info, plan types, prices, or links until step 6.

1. **Value-prop welcome** → Open with an exciting hook about unlimited 5G at unbelievably low prices, then ask if they want to buy eSIM or need support.
   - Thai: "สวัสดีค่ะพี่! 🌏✨ เมื่อพี่เดินทางไปต่างประเทศ ไม่ต้องกังวลว่าเน็ตพี่หมด กับเน็ต 5G แบบไม่อั้น!\n\nน้องช่วยอะไรพี่ได้คะ? ซื้อ eSIM 🛒 หรือ ต้องการความช่วยเหลือ 💬 บอกน้องได้เลยค่ะ ยินดีให้บริการนะคะ 😊"
   - English: "Hi! 🌏✨ Imagine unlimited 5G internet wherever you travel — at an unbelievably low price! How can I help? Buy eSIM 🛒 or Support 💬"
   - If customer wants to buy eSIM → go to step 2
   - If customer has a support question → handle in support mode

2. **eSIM experience check** → "พี่เคยใช้ eSIM มาก่อนไหมคะ?" / "Have you used eSIM before?"
   - If YES → Customer already knows what eSIM is and their device supports it. Skip step 3 entirely. Go directly to step 4 (ask destination + days).
   - If NO / Not sure → Deliver a short eSIM pitch, then go to step 3 (device compatibility check):
     - Thai: "eSIM คือซิมดิจิทัลที่ลงในมือถือได้เลยค่ะพี่ ไม่ต้องเปลี่ยนซิม ไม่ต้องหาร้านซิม ลงเครื่องบินปุ๊บ เปิดเน็ตได้ปั๊บเลยค่ะ! 🎉 พี่ใช้มือถือรุ่นอะไรคะ?"
     - English: "eSIM is a digital SIM built into your phone — no swapping SIMs, no hunting for SIM shops. Land at the airport and you're instantly connected! 🎉 What phone are you using?"
   - NOTE: You may combine the eSIM pitch with the device question (step 3) in one message for users who said NO, to keep the conversation short.

3. **Device compatibility check** → (Only reached if user has NOT used eSIM before)
   - "พี่ใช้มือถือรุ่นอะไรคะ?" / "What phone are you using?" (if not already asked in step 2)
   - iPhone XS or newer → confirm support. Mention that iPhone supports TWO easy install methods: (1) Quick Install — one click automatic installation, no QR code needed (available on iOS 17.4+), and (2) QR code scan — just scan and follow the prompts. Both are very easy! Then go to step 4.
     - Thai example: "รุ่นนี้รองรับ eSIM เลยค่ะพี่! 🎉 สำหรับ iPhone ติดตั้งง่ายมากค่ะ มี 2 วิธี: (1) Quick Install — กดติดตั้งอัตโนมัติแค่คลิกเดียว ไม่ต้องสแกน QR Code เลยค่ะ (2) สแกน QR Code — สแกนแล้วทำตามขั้นตอนง่ายๆ ทั้งสองวิธีง่ายมากค่ะพี่ 😊"
     - English example: "Your phone supports eSIM! 🎉 iPhones have 2 super easy install methods: (1) Quick Install — one-click automatic setup, no QR code needed, and (2) QR code scan — just scan and follow the prompts. Both are very easy! 😊"
   - Android (Samsung S20+, Pixel 3+, etc.) that you are 100% certain supports eSIM → confirm support, go to step 4
   - Android model you are NOT certain about → guide them to dial *#06# and check for a 32-digit EID number. If EID found → proceed to step 4. If not → suggest they check SIM Manager settings for "Add eSIM" option.
   - If customer already mentioned their device earlier or says "I know my phone supports it" → skip this step, go to step 4

4. **Ask destination AND trip duration together** → Ask both in ONE message.
   - Thai: "พี่ไปประเทศไหน กี่วันคะ?" / English: "Where are you traveling to and for how many days?"
   - If multi-country → note all countries
   - If customer already mentioned the destination earlier → only ask about days
   - If customer already mentioned both destination and days → SKIP this step entirely
   - Example (TH): "ดีเลยค่ะพี่! พี่จะไปประเทศไหน กี่วันคะ? 😊"
   - Example (EN): "Great! Which country are you heading to and for how many days?"
   - ⚠️ DO NOT show carrier info, plan types, prices, or links in this message

5. **AFTER the customer answers with destination and days** → Show price per day. Do NOT show carrier names or links.
    - **Value price**: Find the LOWEST price-per-day across ALL Value (day_pass) packages for that country with data tiers of 1GB/day or higher (exclude 500MB). Present as "starting from" price.
    - **Unlimited price**: Find the Unlimited (limitless) package whose validity_days is closest to (but >= ) the customer's requested trip days. Calculate price ÷ validity_days for that specific package. Present as the rate for their trip duration (NOT "starting from").
    - ⚠️ CRITICAL: NEVER mix prices between plan types. Unlimited prices come ONLY from packages with package_type='limitless'. Value prices come ONLY from packages with package_type='day_pass'. Double-check you are reading the correct plan type before quoting.
    - If BOTH types exist: show both prices.
    - If only ONE type exists: show just that one.
    - In Thai responses, ALWAYS write plan names as: "Value (คุ้มค่า)" and "Unlimited (ไม่จำกัด)"
    - Do NOT mention Lite proactively.
    - **DO NOT show a link or carrier names in this step.**
    - End by asking: "พี่สนใจดูแพ็กเกจไหมคะ?" / "Would you like to see the packages?"
    - **CURRENCY RULE (CRITICAL):** Thai → ฿ (1 USD = 35 THB, rounded). English → $.
    - Example (TH, both types): "ราคา Value (คุ้มค่า) เริ่มต้นที่ ฿73/วัน และ Unlimited (ไม่จำกัด) สำหรับ 7 วัน อยู่ที่ ฿220/วัน ค่ะพี่ พี่สนใจดูแพ็กเกจไหมคะ?"
    - Example (EN, both types): "Value plans start from $2.09/day, and Unlimited for 7 days is $6.28/day. Would you like to see the packages?"

6. **Show link** → Only AFTER the customer confirms interest (says yes, OK, ดูเลย, สนใจ, etc.), provide the country page link.
   - Provide a clickable link to the country eSIM page: [ดูแพ็กเกจ](country-url) / [View packages](country-url)
   - For multi-country travel → link to regional page if available
   - Example (TH): "ดูแพ็กเกจ eSIM ญี่ปุ่นได้ที่นี่เลยค่ะพี่ 👉 [ดูแพ็กเกจญี่ปุ่น](url) 😊"
   - Example (EN): "Here you go! 👉 [View Japan packages](url) 😊"

7. Let the customer browse and decide on the page themselves. Do NOT show detailed prices or try to close the sale in chat.
8. **ONLY if the customer explicitly asks "which plan should I pick?" or requests a recommendation**, then ask about usage level and suggest:
   - Heavy video/streaming user → recommend **Unlimited** plan (in Thai: "Unlimited (ไม่จำกัด)")
   - Regular user → recommend **Value** plan (in Thai: "Value (คุ้มค่า)")
   - Do NOT proactively mention Lite. Only mention Lite if the customer explicitly asks for the cheapest/budget option. (in Thai: "Lite (ประหยัด)")

## CONVERSATION WRAP-UP (MANDATORY — NEVER SKIP)

1. When the customer says "thank you" or similar MID-conversation (after receiving info/link but NOT explicitly saying they're done), ask ONCE:
   "Is there anything else I can help with?" / "มีอะไรให้น้องช่วยเพิ่มเติมไหมคะพี่?"

2. When the customer EXPLICITLY says they don't need more help (ไม่มีแล้ว, ไม่ต้อง, nothing else, that's all, no thanks, I'm good, พอแล้ว, เท่านี้, ไม่มีอะไรแล้ว, etc.) — DO NOT ask "anything else?" again. Proceed DIRECTLY to step 3.

3. Close warmly and ask for rating:
   - Thai: "ขอบคุณมากค่ะพี่! 😊 น้องอยากขอให้พี่ช่วยให้คะแนนบทสนทนานี้เพื่อปรับปรุงผู้ช่วย AI ของเราค่ะ กรุณาให้คะแนนด้านล่างนี้ได้เลยค่ะ"
   - English: "Thank you so much! 😊 We'd love your feedback — please rate this conversation below!"

4. CRITICAL: NEVER ask "anything else?" more than once per conversation. If you already asked and the customer responded (positively or negatively), do NOT repeat the question.

5. If the customer says "thank you" + confirms they'll take action (e.g., "will order tonight", "จะสั่งเข้าไปนะคะ", "เดี๋ยวจะสั่ง"), treat this as confirmation they're done — go directly to step 3.

## SUPPORT MODE - HANDLE ANY QUESTION

**SUPPORT MODE BEHAVIOR:**
When the conversation intent is 'support' (passed via the intent field), you MUST:
1. Try your best to answer the customer's question using knowledge base articles and your training
2. Be helpful and thorough in troubleshooting
3. **CRITICAL: Always end EVERY support response with this reminder line:**
   - If responding in Thai: "หากพี่ต้องการคุยกับเจ้าหน้าที่จริง พิมพ์ 'agent' ได้เลยนะคะ 😊"
   - If responding in English: "If you'd like to talk to a real agent, just type 'agent' anytime 😊"
4. This reminder must appear at the END of every single response when in support mode, no exceptions

## PACKAGE TYPES (For reference only — USE THESE EXACT DESCRIPTIONS)
⚠️ IMPORTANT: NEVER use the old internal names "Limitless", "Max Speed", "Day Pass", "Low usage", "Budget", or "Standard" when talking to customers. ALWAYS use these user-facing names:
⚠️ In Thai responses, ALWAYS pair English with Thai: "Value (คุ้มค่า)", "Unlimited (ไม่จำกัด)", "Lite (ประหยัด)".
- **Unlimited**: เน็ตไม่จำกัด ไม่ลดสปีด / Unlimited data, no throttling — Best for heavy video streaming, video calls, and users who want worry-free connectivity all day. Recommended if you plan to watch YouTube, Netflix, or use video calls frequently throughout the trip. (ONLY recommend if exists for that destination!)
- **Value**: โควต้ารายวัน รีเซ็ตทุกวัน คุ้มค่า / Daily quota at full speed, resets every 24 hours — Perfect for normal everyday usage: social media, messaging, maps, browsing, and occasional video streaming. You CAN watch YouTube and use social media, just not all day long. Best value for most travelers.
- **Lite**: มีโควต้ารวม ความเร็วเต็ม ราคาประหยัด / Fixed total quota at full speed — Suitable for basic usage like maps and chat only. (ONLY mention if customer explicitly asks for cheapest option or says they only need maps/chat - NEVER proactively mention)

⚠️ CRITICAL ACCURACY: Do NOT describe Value as "only for maps and messaging" — Value supports everything including YouTube, social media, and video, just with a daily data quota. The difference from Unlimited is that Value has a daily limit while Unlimited has no limit.

## VALUE (DAY_PASS) USAGE ESTIMATES BY TIER
When a customer asks what they can do with a Standard plan, or asks "is X GB enough?", use these estimates:

**5GB/day:**
- เล่น Facebook / LINE / แชตทั่วไปตลอดวัน
- ดูวิดีโอ TikTok / Instagram / Reels ประมาณ 6–8 ชั่วโมงต่อวัน*
- ดู YouTube ได้ประมาณ 3–8 ชั่วโมง/วัน*
- แชร์ Hotspot หรือดูวิดีโอสตรีมมิ่งเบา ๆ ได้ด้วย

**3GB/day:**
- Facebook ได้ทั้งวัน
- TikTok / Instagram ได้ประมาณ 4–6 ชั่วโมง/วัน*
- ดู YouTube ได้ประมาณ 2–5 ชั่วโมง/วัน*
- แชต, แผนที่, ท่องเว็บ ได้สบาย

**2GB/day:**
- เล่น Facebook / LINE / แชตทั่วไป ประมาณ 2–3 ชั่วโมงต่อวัน*
- ดูวิดีโอ TikTok / Instagram / Reels ประมาณ 2–3 ชั่วโมงต่อวัน*
- ดู YouTube ได้ประมาณ 1–3 ชั่วโมง/วัน*

**1GB/day:**
- เล่น Facebook / แชต / LINE / แผนที่ ประมาณ 1–2 ชั่วโมงต่อวัน*
- ดูวิดีโอบน TikTok / Instagram / Reels แบบเบา ๆ ประมาณ 30–60 นาทีต่อวัน*
- ดู YouTube ได้ประมาณ 30–120 นาที/วัน*

*Disclaimer: ระยะเวลาการใช้งานขึ้นอยู่กับประเภทคอนเทนต์ ความละเอียดวิดีโอ และการตั้งค่า YouTube / Actual usage depends on content type, video quality, and YouTube settings.

Always include the disclaimer when providing usage estimates.
For English responses, translate the bullet points naturally.


## CARRIER/NETWORK INFORMATION (CRITICAL - DO NOT INVENT)
- **DO NOT proactively mention carrier names.** Only provide carrier information when the customer specifically asks about network quality, which carrier is used, or signal coverage.
- Use the CARRIER field from package data when answering network questions
- **BEST NETWORK MESSAGING (CRITICAL):** When the customer asks about carriers, ALWAYS reassure that Mobile11 carefully selects the best network in each country for the best experience. Example:
  - Thai: "eSIM สำหรับประเทศญี่ปุ่นใช้เครือข่าย DOCOMO ซึ่งเป็นเครือข่ายที่ดีที่สุดค่ะพี่ เราเลือกเครือข่ายที่ดีที่สุดในแต่ละประเทศเพื่อประสบการณ์ที่ดีที่สุดสำหรับพี่ค่ะ 😊"
  - English: "Our Japan eSIM uses the DOCOMO network — we always choose the best network in each country to give you the best experience! 😊"
- Example: "eSIM สำหรับประเทศไทยใช้เครือข่าย Real Future (Truemove) ค่ะพี่" 
- If carrier is null or empty, say "quality local network" - DO NOT invent carrier names
- NEVER make up carrier names like AIS, DTAC, True, etc. unless the data explicitly provides it

**JAPAN SPECIAL CASE (CRITICAL):**
- Japan has 2 carriers: DOCOMO and Softbank/KDDI - customers CHOOSE which one at purchase time
- NEVER say "ระบบจะเลือกให้อัตโนมัติ" or "system auto-selects" - this is WRONG!
- Explain the difference and help customer pick based on their travel plans:
  - DOCOMO: Best for rural/mountain travel, Hokkaido, countryside (5-star, premium coverage)
  - Softbank/KDDI: Best for cities like Tokyo, Osaka, Kyoto (4-star, value option)
- Ask where they're traveling in Japan to give personalized recommendation
- Direct to the Japan eSIM page where they can select their preferred carrier

**CHINA SPECIAL CASE (CRITICAL):**
- China has 2 eSIM options with different carrier labels:
  - **CMCC (TT&GPT)**: GUARANTEED to support TikTok and ChatGPT. Recommended for users who need social media and AI tools.
  - **CMCC**: Does NOT guarantee TikTok and ChatGPT access. May work, but not guaranteed.
- When a customer asks about China, briefly explain both options so they can choose.
- In Thai: "CMCC (TT&GPT) รับประกันการใช้งาน TikTok และ ChatGPT ส่วน CMCC ไม่รับประกันการใช้งาน TikTok และ ChatGPT"
- Direct to the China eSIM page where they can see both options.

## STOPOVER / TRANSIT / LAYOVER GUIDANCE (CRITICAL)
When a customer mentions a stopover, layover, or transit at an airport (typically 1-5 hours), provide 3 options ranked from cheapest to most expensive:

1. **Cheapest: Airport WiFi (FREE)** — Most international airports have free WiFi. For a short stopover (under 5 hours), this is the most cost-effective option. Mention this first.
   - Thai: "ถ้าพี่แวะพักแค่ไม่กี่ชั่วโมง ใช้ WiFi ของสนามบินได้เลยค่ะ ฟรี! ✈️"
   - English: "For a short layover, airport WiFi is free and works great! ✈️"

2. **Budget option: Separate eSIM** — Buy a separate cheap eSIM for the stopover country (e.g., a 1-day Standard plan). This costs a little but gives mobile data.
   - Thai: "หรือถ้าพี่อยากมีเน็ตมือถือใช้ ซื้อ eSIM แยกสำหรับ [stopover country] แบบ 1 วันก็ได้ค่ะ ราคาไม่แพง"
   - English: "Or you can get a separate 1-day eSIM for [stopover country] — affordable option!"

3. **Convenience option: Regional plan** — A regional package (e.g., Asia 13, Europe 42) that covers BOTH the stopover country and the final destination in one eSIM. More expensive but most convenient — no need to switch eSIMs.
   - Thai: "หรือจะซื้อแพ็กเกจ Regional ที่ครอบคลุมทั้ง [stopover] และ [destination] ในซิมเดียว สะดวกสุดแต่ราคาสูงกว่าค่ะ"
   - English: "Or get a regional plan covering both [stopover] and [destination] in one eSIM — most convenient but pricier."

Always present all 3 options and let the customer choose. If they ask for a recommendation, suggest airport WiFi for stopovers under 3 hours, and a separate 1-day eSIM for 3-5 hours.

IMPORTANT: Only trigger this advice when the customer explicitly mentions a stopover/layover/transit. Do NOT assume a stopover from a multi-country trip — they might be visiting both countries fully.

## DEVICE COMPATIBILITY CHECK (CRITICAL - DO NOT HALLUCINATE)
- NEVER confidently state that a specific phone model supports eSIM unless you are 100% certain.
- Well-known eSIM-supported devices you CAN confirm: iPhone XS and newer, iPad Pro (3rd gen+), Samsung Galaxy S20 and newer, Google Pixel 3 and newer.
- For ANY Android phone you are NOT 100% sure about (e.g., Vivo, Oppo, Xiaomi, Huawei, OnePlus, etc.):
  - Ask the user to dial the code star-hash-zero-six-hash (written as: *#06#). IMPORTANT: Always write this dial code exactly as *#06# with the asterisk symbol — NEVER escape it as \\*#06# or \\*\\#06\\#.
  - If they see an "EID" number (32 digits), their phone supports eSIM
  - Alternative: Go to Settings > About Phone > look for "EID"
  - Thai: "ลองกด *#06# บนโทรศัพท์ดูนะคะพี่ ถ้าเห็นหมายเลข EID (32 หลัก) แสดงว่าเครื่องพี่รองรับ eSIM ค่ะ 😊"
  - English: "Try dialing *#06# on your phone. If you see an EID number (32 digits), your phone supports eSIM! 😊"
- Also suggest checking: Settings > Connections/Network > SIM Manager — if there's an "Add eSIM" option, the phone supports it.
- NEVER say "supports eSIM for sure" for any Android model you're uncertain about. Always guide them to check first.
- IMPORTANT: When guiding users through device compatibility checks, NEVER use escalation phrases like "ส่งต่อให้ทีมงาน", "ส่งต่อให้เจ้าหน้าที่", "connect you with our team", or "transfer". Just guide them through the *#06# check. Compatibility checking does NOT require a human agent. Only use escalation phrases when the customer explicitly asks for a human agent.
- Link to compatibility page: /what-is-esim?tab=compatibility

## IMAGE / SCREENSHOT ANALYSIS (VISION ENABLED)
- You CAN see and analyze images/screenshots/photos sent by customers. When an image is attached, carefully examine it.
- You can read text in BOTH Thai and English from screenshots, including device settings screens, error messages, and *#06# screens.
- For *#06# screenshots: Look for "EID" followed by a 32-digit number. If you only see IMEI1 and IMEI2 (no EID), the phone likely does NOT support eSIM. Guide them to also check Settings > Connections/Network > SIM Manager for an "Add eSIM" option.
- For device compatibility screenshots: Read the device model, OS version, and any eSIM-related settings visible in Thai or English.
- For Thai-language screenshots (e.g., device settings in Thai): Read and translate the relevant Thai text to help the customer.
- If an image is blurry or unclear, politely ask the customer to send a clearer photo.
- NEVER assume or hallucinate information not visible in the image. Only describe what you can actually see.
- If NO image is attached but the customer says they sent one, ask them to re-upload it.
- IMPORTANT: If the customer says they only see IMEI1 and IMEI2 (no EID), this means their phone likely does NOT support eSIM.

- Only mention network details that are in the package context above

## HUMAN AGENT HANDOFF (CRITICAL)
When a customer asks to talk to a real person, human agent, or staff member, you MUST:
1. Respond with a friendly handoff message
2. Include the word "connect you with a human" (in English) or "ส่งต่อให้เจ้าหน้าที่" (in Thai) so the system detects escalation
3. Example Thai: "น้องส่งต่อให้เจ้าหน้าที่ดูแลนะคะพี่ ทีมของน้องจะติดต่อกลับโดยเร็วที่สุดค่ะ 😊 หากพี่ต้องการกลับมาคุยกับแชทบอท พิมพ์ 'bot' ได้เลยนะคะ"
4. Example English: "I'll connect you with our support team -- they'll get back to you ASAP! 😊 If you'd like to return to the chatbot anytime, just type 'bot'"
5. Do NOT continue asking questions or offering help after the handoff message

Detection phrases (trigger handoff):
- English: "talk to a person", "human agent", "real person", "speak to someone", "talk to support", "real human", "live agent"
- Thai: "คุยกับเจ้าหน้าที่", "ขอคุยกับคน", "ต้องการคุยกับคน", "ขอเจ้าหน้าที่", "คุยกับคน", "ขอคุยกับพนักงาน"

## CONVERSATION CLOSURE (IMPORTANT — DO NOT ESCALATE)
When the customer confirms they want to CLOSE or END the conversation (e.g., "ปิดเลย", "ปิดได้เลย", "ปิดครับ", "ปิดค่ะ", "close it", "yes close", "ปิดเลยครับ", "ปิดเลยค่ะ"), you MUST:
1. Thank the customer warmly
2. Close the conversation naturally — do NOT escalate or transfer to a human agent
3. "ปิด" in the context of a conversation = end chat. It does NOT mean cancel service.

Example Thai: "ขอบคุณมากค่ะพี่! 😊🙏 หากมีคำถามเพิ่มเติม กลับมาคุยกับน้องได้ตลอดนะคะ ขอให้มีความสุขค่ะ ✨"
Example English: "Thank you so much! 😊 If you have any questions in the future, feel free to come back anytime. Have a great day! ✨"

NEVER use escalation phrases like "ส่งต่อให้เจ้าหน้าที่" or "connect you with a human" when the customer just wants to close the chat.
DO NOT confuse "ปิด" (close conversation) with service cancellation — these are completely different intents.

## RESPONSE LANGUAGE (HIGHEST PRIORITY)
The customer's UI language is: \${LANGUAGE_NAMES[language] || 'English'}
You MUST respond in \${LANGUAGE_NAMES[language] || 'English'} at ALL times, unless the customer explicitly writes in a different language.
- Japanese: Use polite です/ます form. Use Katakana for loanwords. Call yourself "私たち/Mobile11". Currency: $ (USD).
- Korean: Use formal 합니다체. Currency: $ (USD).
- French: Use formal "vous" form. Currency: $ (USD) or € (EUR).
- German: Use formal "Sie" form. Currency: $ (USD) or € (EUR).
- Thai: Use น้อง/พี่ pronouns with ค่ะ/คะ. Currency: ฿ (USD×35).
- English: Friendly, conversational. Currency: $ (USD).

## STYLE
- Match user's language - be conversational like chatting with a friend
- Use emojis naturally 😊 💪 🌏
- Be warm, helpful, and empathetic - especially for support issues
- Always use FULL absolute URLs starting with https://mobile11.com (e.g., https://mobile11.com/esim/japan), never relative paths
- Use markdown links for URLs: [ข้อความ](https://mobile11.com/esim/japan)

## KNOWN INTERNAL URLS (USE THESE EXACT PATHS)
- Installation guide / how to install / วิธีติดตั้ง: /installation-guide
- What is eSIM / compatibility check: /what-is-esim
- Support / help center: /support
- Country packages: /esim/{country-slug} (e.g., /esim/japan, /esim/hong-kong)
- NEVER invent URLs like /esim/how-to-install, /how-to-install, /guide/install, etc.
- For Thai: Use polite particles (ค่ะ/คะ) and friendly tone

## THAI PRONOUN RULES (CRITICAL)
- Always refer to yourself as "น้อง" (not "ผม", "ฉัน", or "เรา")
- Always address the customer as "พี่" (not "คุณ" or "ลูกค้า")
- Use ค่ะ/คะ as polite particles (feminine, friendly tone)
- This creates intimacy and keeps customers engaged
- Example: "พี่ไปประเทศไหนคะ?" NOT "คุณไปประเทศไหนครับ?"
- Example: "น้องแนะนำแพ็กเกจนี้ค่ะพี่" NOT "เราแนะนำแพ็กเกจนี้ครับ"

${basePrompt}

${installationGuidance}
`;
  
  return salesPrompt;
}

// Sanitize AI response to remove invalid URLs that the AI invented
function sanitizeAIResponse(
  response: string, 
  validCartUrl: string | null,
  configuratorUrl: string | null = null,
  fullConfiguratorUrl: string | null = null,
  placeholderUrls: {
    primaryCartUrl?: string | null;
    primaryConfiguratorUrl?: string | null;
    altCartUrl?: string | null;
    altConfiguratorUrl?: string | null;
    browseAllUrl?: string | null;
  } = {},
  availableTypes?: { limitless: boolean; daypass: boolean; maxspeed: boolean; hasAnyPackages: boolean } | null
): string {
  // UUID pattern for valid package IDs
  const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  
  // Pattern to find markdown links with invalid /product/ or /shop/ or /buy/ paths
  const invalidProductUrlPattern = /\[([^\]]+)\]\(https?:\/\/[^)]*\/product\/[^)]*\)/gi;
  const invalidShopUrlPattern = /\[([^\]]+)\]\(https?:\/\/[^)]*\/shop\/[^)]*\)/gi;
  const invalidBuyUrlPattern = /\[([^\]]+)\]\(https?:\/\/[^)]*\/buy\/[^)]*\)/gi;
  
  // Pattern to find cart URLs with INVALID (non-UUID) package IDs
  const invalidCartUrlPattern = new RegExp(
    `\\[([^\\]]+)\\]\\(https?:\\/\\/[^)]*\\/cart\\?items=(?!${UUID_PATTERN}:)[^:)]+:\\d+[^)]*\\)`,
    'gi'
  );
  
  let sanitized = response;
  let hadInvalidUrls = false;
  
  // Derive baseUrl from available URL parameters for fallback link building
  let baseUrl = 'https://mobile11.com';
  try {
    if (fullConfiguratorUrl) baseUrl = new URL(fullConfiguratorUrl).origin;
    else if (configuratorUrl) baseUrl = new URL(configuratorUrl).origin;
    else if (validCartUrl) baseUrl = new URL(validCartUrl).origin;
  } catch { /* keep default */ }
  
  // ═══ DETERMINISTIC PLACEHOLDER REPLACEMENT ═══
  // Replace {{BUY_OPTION1}}, {{CUSTOMIZE_OPTION1}}, {{BUY_OPTION2}}, {{CUSTOMIZE_OPTION2}}, {{BROWSE_ALL}}
  // with actual URLs. This is deterministic and cannot be mixed up by the AI.
  if (placeholderUrls.primaryCartUrl) {
    sanitized = sanitized.replace(/\{\{BUY_?OPTION1\}\}/g, placeholderUrls.primaryCartUrl);
  }
  if (placeholderUrls.primaryConfiguratorUrl) {
    sanitized = sanitized.replace(/\{\{CUSTOMIZE_?OPTION1\}\}/g, placeholderUrls.primaryConfiguratorUrl);
  }
  if (placeholderUrls.altCartUrl) {
    sanitized = sanitized.replace(/\{\{BUY_?OPTION2\}\}/g, placeholderUrls.altCartUrl);
  }
  if (placeholderUrls.altConfiguratorUrl) {
    sanitized = sanitized.replace(/\{\{CUSTOMIZE_?OPTION2\}\}/g, placeholderUrls.altConfiguratorUrl);
  }
  if (placeholderUrls.browseAllUrl) {
    sanitized = sanitized.replace(/\{\{BROWSE_?ALL\}\}/g, placeholderUrls.browseAllUrl);
  }
  
  console.log('Placeholder replacement applied:', {
    hadBuy1: sanitized !== response && !!placeholderUrls.primaryCartUrl,
    hadCustomize1: !!placeholderUrls.primaryConfiguratorUrl,
    hadBuy2: !!placeholderUrls.altCartUrl,
    hadCustomize2: !!placeholderUrls.altConfiguratorUrl,
  });

  // Global rewrite: AI sometimes hallucinates wrong URL paths instead of /esim/
  sanitized = sanitized.replace(/\/configurator\//gi, '/esim/');
  sanitized = sanitized.replace(/\/plans\//gi, '/esim/');
  
   // Global rewrite: AI hallucinates /configurator?iso=XX, /configurator?country=XX, or /plans?iso=XX query-param URLs
   // Convert these to /esim/country-slug using a common ISO/name mapping
   const isoToSlug: Record<string, string> = {
    'JP': 'japan', 'TH': 'thailand', 'US': 'united-states', 'GB': 'united-kingdom', 'UK': 'united-kingdom',
    'FR': 'france', 'DE': 'germany', 'IT': 'italy', 'ES': 'spain', 'CH': 'switzerland',
    'KR': 'south-korea', 'CN': 'china', 'SG': 'singapore', 'MY': 'malaysia', 'ID': 'indonesia',
    'AU': 'australia', 'NZ': 'new-zealand', 'CA': 'canada', 'MX': 'mexico', 'BR': 'brazil',
    'IN': 'india', 'VN': 'vietnam', 'PH': 'philippines', 'TW': 'taiwan', 'HK': 'hong-kong',
    'AE': 'united-arab-emirates', 'TR': 'turkey', 'EG': 'egypt', 'ZA': 'south-africa',
    'NL': 'netherlands', 'BE': 'belgium', 'AT': 'austria', 'SE': 'sweden', 'NO': 'norway',
    'DK': 'denmark', 'FI': 'finland', 'PT': 'portugal', 'GR': 'greece', 'PL': 'poland',
    'CZ': 'czech-republic', 'HU': 'hungary', 'IE': 'ireland', 'IL': 'israel', 'SA': 'saudi-arabia',
    'QA': 'qatar', 'KW': 'kuwait', 'OM': 'oman', 'BH': 'bahrain', 'JO': 'jordan',
    'LA': 'laos', 'KH': 'cambodia', 'MM': 'myanmar', 'NP': 'nepal', 'LK': 'sri-lanka',
    'BD': 'bangladesh', 'PK': 'pakistan', 'RU': 'russia', 'UA': 'ukraine', 'RO': 'romania',
    'BG': 'bulgaria', 'HR': 'croatia', 'RS': 'serbia', 'SI': 'slovenia', 'SK': 'slovakia',
    'LT': 'lithuania', 'LV': 'latvia', 'EE': 'estonia', 'IS': 'iceland', 'LU': 'luxembourg',
    'MT': 'malta', 'CY': 'cyprus', 'MO': 'macao', 'PE': 'peru', 'CL': 'chile',
    'CO': 'colombia', 'AR': 'argentina', 'EC': 'ecuador', 'CR': 'costa-rica', 'PA': 'panama',
  };
   sanitized = sanitized.replace(
     /\/(?:configurator|plans)\?iso=([A-Z]{2})/gi,
     (match, iso) => {
       const slug = isoToSlug[iso.toUpperCase()];
       if (slug) {
         console.log(`[Rewrite] /configurator?iso=${iso} → /esim/${slug}`);
         return `/esim/${slug}?`;
       }
       console.log(`[Rewrite] /configurator?iso=${iso} → /esim/${iso.toLowerCase()} (fallback)`);
       return `/esim/${iso.toLowerCase()}?`;
     }
   );
   
   // Global rewrite: AI hallucinates /configurator?country=XX (ISO code like CH, JP)
   // Convert to /esim/country-slug
   sanitized = sanitized.replace(
     /\/(?:configurator|plans)\?country=([A-Z]{2})(?=[&)\s]|$)/gi,
     (match, iso) => {
       const slug = isoToSlug[iso.toUpperCase()];
       if (slug) {
         console.log(`[Rewrite] /configurator?country=${iso} → /esim/${slug}`);
         return `/esim/${slug}?`;
       }
       console.log(`[Rewrite] /configurator?country=${iso} → /esim/${iso.toLowerCase()} (fallback)`);
       return `/esim/${iso.toLowerCase()}?`;
     }
   );
   
   // Global rewrite: AI hallucinates /skus=XXX URLs (completely invalid path)
   // These should be stripped or rewritten to cart URLs
   sanitized = sanitized.replace(
     /\[([^\]]+)\]\((https?:\/\/[^)]*)?\/skus=[^)]*\)/gi,
     (match, text) => {
       console.log(`[Rewrite] Stripped hallucinated /skus= link: ${match}`);
       if (placeholderUrls.primaryCartUrl) {
         return `[${text}](${placeholderUrls.primaryCartUrl})`;
       }
       return text; // Strip to plain text if no cart URL available
     }
   );
   sanitized = sanitized.replace(
     /https?:\/\/[^\s)]*\/skus=[^\s)]*/gi,
     (match) => {
       console.log(`[Rewrite] Stripped hallucinated raw /skus= URL: ${match}`);
       return placeholderUrls.primaryCartUrl || '';
     }
   );
  
   // Fix escaped *#06# dial code
   sanitized = sanitized.replace(/\\+\*#06#/g, '*#06#');
   sanitized = sanitized.replace(/\\#06#/g, '*#06#');

   // Global rewrite: AI sometimes hallucinates ?class= instead of ?tier=
  sanitized = sanitized.replace(/[?&]class=(economy|priority)/gi, (match) => {
    return match.replace(/class=/i, 'tier=');
  });

  // Replace legacy placeholder URLs
  if (configuratorUrl) {
    sanitized = sanitized.replace(/\(CONFIGURATOR_URL\)/gi, `(${configuratorUrl})`);
    sanitized = sanitized.replace(/CONFIGURATOR_URL/gi, configuratorUrl);
  }
  if (fullConfiguratorUrl) {
    sanitized = sanitized.replace(/\(FULL_CONFIGURATOR_URL\)/gi, `(${fullConfiguratorUrl})`);
    sanitized = sanitized.replace(/FULL_CONFIGURATOR_URL/gi, fullConfiguratorUrl);
  }

  // NEW: Rewrite legacy /configurator links (often hallucinated or from old versions) to the valid packages page.
  // This fixes cases like: https://mobile11.com/configurator?country=germany&days=7
  if (fullConfiguratorUrl || configuratorUrl) {
    const replacement = (fullConfiguratorUrl || configuratorUrl)!;
    const beforeConfiguratorFix = sanitized;

    // Markdown links
    sanitized = sanitized.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]*?)\/configurator\?[^)]*\)/gi,
      `[$1](${replacement})`
    );

    // Raw URLs
    sanitized = sanitized.replace(
      /https?:\/\/[^\s)]*\/configurator\?[^\s)]*/gi,
      replacement
    );

    if (beforeConfiguratorFix !== sanitized) {
      hadInvalidUrls = true;
      console.log('Rewrote legacy /configurator links to valid /packages links');
    }

  }

  // Keep valid /esim/{country} links as-is — these are the correct unified route
  // Only rewrite if the link points to an external domain (hallucinated mobile11.com links)
  // Convert them to relative /esim/{slug} paths
  {
    const beforeEsimFix = sanitized;

    // Markdown links: [text](https://...mobile11.com/esim/japan?duration=7) → [text](/esim/japan)
    sanitized = sanitized.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]*?)\/esim\/([a-zA-Z\-]+)(\?[^)]*)?\)/gi,
      (_match: string, text: string, _domain: string, country: string, qs?: string) => {
        // Keep the /esim/ path but make it relative and preserve query params
        const target = `/esim/${country.toLowerCase()}${qs || ''}`;
        console.log(`[LinkFix] Normalized /esim/${country} markdown link to ${target}`);
        return `[${text}](${target})`;
      }
    );

    // Raw URLs: https://...mobile11.com/esim/japan → /esim/japan
    sanitized = sanitized.replace(
      /https?:\/\/[^\s)]*\/esim\/([a-zA-Z\-]+)(\?[^\s)]*)?/gi,
      (_match: string, country: string, qs?: string) => {
        const target = `/esim/${country.toLowerCase()}${qs || ''}`;
        console.log(`[LinkFix] Normalized /esim/${country} raw link to ${target}`);
        return target;
      }
    );

    // Also catch relative /esim/ links in markdown
    sanitized = sanitized.replace(
      /\[([^\]]+)\]\(\/esim\/([a-zA-Z\-]+)(\?[^)]*)?\)/gi,
      (_match: string, text: string, country: string, qs?: string) => {
        const target = `/esim/${country.toLowerCase()}${qs || ''}`;
        console.log(`[LinkFix] Normalized relative /esim/${country} link to ${target}`);
        return `[${text}](${target})`;
      }
    );

    if (beforeEsimFix !== sanitized) {
      hadInvalidUrls = true;
      console.log('Rewrote hallucinated /esim/ links to valid /packages links');
    }
  }

  // NEW: If AI hardcodes mobile11.com for internal links, rewrite to the current site origin
  // (use the origin of fullConfiguratorUrl/configuratorUrl as the canonical base).
  if (fullConfiguratorUrl || configuratorUrl) {
    try {
      const origin = new URL(fullConfiguratorUrl || configuratorUrl!).origin;
      const beforeDomainFix = sanitized;

      // Rewrite markdown + raw links that point to mobile11.com for known internal paths
      sanitized = sanitized.replace(
        /https?:\/\/(?:www\.)?mobile11\.com(?=\/(?:packages|cart|my-esims|business|support|orders|esim|installation-guide|what-is-esim|guide)\b)/gi,
        origin
      );

      if (beforeDomainFix !== sanitized) {
        hadInvalidUrls = true;
        console.log('Rewrote mobile11.com internal links to current origin');
      }
    } catch {
      // ignore URL parse errors
    }
  }
  
  // Replace invalid /product/, /shop/, /buy/ URLs
  if (validCartUrl) {
    const before = sanitized;
    sanitized = sanitized.replace(invalidProductUrlPattern, `[$1](${validCartUrl})`);
    sanitized = sanitized.replace(invalidShopUrlPattern, `[$1](${validCartUrl})`);
    sanitized = sanitized.replace(invalidBuyUrlPattern, `[$1](${validCartUrl})`);
    if (before !== sanitized) hadInvalidUrls = true;
  } else {
    const before = sanitized;
    sanitized = sanitized.replace(invalidProductUrlPattern, '$1');
    sanitized = sanitized.replace(invalidShopUrlPattern, '$1');
    sanitized = sanitized.replace(invalidBuyUrlPattern, '$1');
    if (before !== sanitized) hadInvalidUrls = true;
  }
  
  // Replace cart URLs with invalid (non-UUID) package IDs
  const beforeCartFix = sanitized;
  if (validCartUrl) {
    sanitized = sanitized.replace(invalidCartUrlPattern, `[$1](${validCartUrl})`);
  } else {
    // Remove the markdown link but keep the text
    sanitized = sanitized.replace(invalidCartUrlPattern, '$1');
  }
  if (beforeCartFix !== sanitized) {
    hadInvalidUrls = true;
    console.log('Fixed AI-invented cart URLs with invalid package IDs');
  }
  
  // NEW: Catch cart URLs with ?id= format (hallucinated by AI, e.g. /cart?id=253&duration=7)
  const invalidCartIdPattern = /\[([^\]]+)\]\((?:https?:\/\/[^)]*)?\/cart\?id=[^)]*\)/gi;
  const rawInvalidCartIdPattern = /https?:\/\/[^\s)]*\/cart\?id=[^\s)]*/gi;
  const relativeCartIdPattern = /\[([^\]]+)\]\(\/cart\?id=[^)]*\)/gi;
  const beforeCartIdFix = sanitized;
  if (validCartUrl) {
    sanitized = sanitized.replace(invalidCartIdPattern, `[$1](${validCartUrl})`);
    sanitized = sanitized.replace(relativeCartIdPattern, `[$1](${validCartUrl})`);
    sanitized = sanitized.replace(rawInvalidCartIdPattern, validCartUrl);
  } else {
    sanitized = sanitized.replace(invalidCartIdPattern, '$1');
    sanitized = sanitized.replace(relativeCartIdPattern, '$1');
    sanitized = sanitized.replace(rawInvalidCartIdPattern, '');
  }
  if (beforeCartIdFix !== sanitized) {
    hadInvalidUrls = true;
     console.log('Fixed AI-invented cart URLs with ?id= format');
   }
   
   // Catch hallucinated /cart?product= URLs (AI invents product slugs like /cart?product=switzerland-limitless-7-days)
   const invalidCartProductPattern = /\[([^\]]+)\]\((?:https?:\/\/[^)]*)?\/cart\?product=[^)]*\)/gi;
   const rawInvalidCartProductPattern = /https?:\/\/[^\s)]*\/cart\?product=[^\s)]*/gi;
   const beforeCartProductFix = sanitized;
   if (validCartUrl) {
     sanitized = sanitized.replace(invalidCartProductPattern, `[$1](${validCartUrl})`);
     sanitized = sanitized.replace(rawInvalidCartProductPattern, validCartUrl);
   } else {
     sanitized = sanitized.replace(invalidCartProductPattern, '$1');
     sanitized = sanitized.replace(rawInvalidCartProductPattern, '');
   }
   if (beforeCartProductFix !== sanitized) {
     hadInvalidUrls = true;
     console.log('Fixed AI-invented cart URLs with ?product= format');
   }
   
   // Catch bare country path URLs (e.g., mobile11.com/switzerland, mobile11.com/japan-esim)
   // These are NOT valid routes — rewrite to /esim/{slug}
   sanitized = sanitized.replace(
     /\[([^\]]+)\]\((https?:\/\/(?:www\.)?mobile11\.com)\/([a-z][a-z\-]+?)(?:-esim)?\s*\)/gi,
     (_match: string, text: string, domain: string, slug: string) => {
       // Skip known valid paths
       if (/^(?:packages|cart|esim|my-esims|business|support|orders|about|faq|blog|help|admin|auth|login|signup|register|checkout|privacy|terms|affiliate)$/.test(slug)) {
         return _match;
       }
       const newUrl = `${domain}/esim/${slug}`;
       console.log(`[Rewrite] Bare country path /${slug} → /esim/${slug}`);
       return `[${text}](${newUrl})`;
     }
    );

    // Catch hallucinated installation/guide URLs → /installation-guide
    sanitized = sanitized.replace(
      /https?:\/\/[^\s)]*\/(?:esim\/)?how-to-install[^\s)]*/gi,
      'https://mobile11.com/installation-guide'
    );
    sanitized = sanitized.replace(
      /\[([^\]]+)\]\((?:https?:\/\/[^)]*)?\/(?:esim\/)?how-to-install[^)]*\)/gi,
      '[$1](https://mobile11.com/installation-guide)'
    );
    
   // Also catch raw bare country URLs
   sanitized = sanitized.replace(
     /(https?:\/\/(?:www\.)?mobile11\.com)\/([a-z][a-z\-]+?)(?:-esim)?(?=[\s)\]\n,]|$)/gi,
     (_match: string, domain: string, slug: string) => {
       if (/^(?:packages|cart|esim|my-esims|business|support|orders|about|faq|blog|help|admin|auth|login|signup|register|checkout|privacy|terms|affiliate)$/.test(slug)) {
         return _match;
       }
       console.log(`[Rewrite] Raw bare country path /${slug} → /esim/${slug}`);
       return `${domain}/esim/${slug}`;
     }
   );
   
   // Also catch any raw invalid URLs (not in markdown format)
  const rawInvalidUrlPattern = /https?:\/\/[^\s)]*\/(?:product|shop|buy|checkout)(?:\/[^\s)]*|[?\s)])/gi;
  const beforeRaw = sanitized;
  if (validCartUrl) {
    sanitized = sanitized.replace(rawInvalidUrlPattern, validCartUrl);
  } else {
    sanitized = sanitized.replace(rawInvalidUrlPattern, '');
  }
  if (beforeRaw !== sanitized) hadInvalidUrls = true;
  
  // Catch raw cart URLs with invalid package IDs
  const rawInvalidCartPattern = new RegExp(
    `https?:\\/\\/[^\\s)]*\\/cart\\?items=(?!${UUID_PATTERN}:)[^:\\s)]+:\\d+`,
    'gi'
  );
  const beforeRawCart = sanitized;
  if (validCartUrl) {
    sanitized = sanitized.replace(rawInvalidCartPattern, validCartUrl);
  } else {
    sanitized = sanitized.replace(rawInvalidCartPattern, '');
  }
  if (beforeRawCart !== sanitized) {
    hadInvalidUrls = true;
    console.log('Fixed raw AI-invented cart URLs with invalid package IDs');
  }
  
  // ═══ NUCLEAR SAFETY: Replace ALL cart?items= URLs with known-good cart URLs ═══
  // The AI can hallucinate syntactically valid UUIDs that don't exist in the database.
  // Since we have the real cart URLs from the search results, force-replace ALL cart links.
  if (validCartUrl) {
    // Count cart URLs in markdown links to determine which known-good URL to use
    let cartLinkCount = 0;
    sanitized = sanitized.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]*\/cart\?items=[^)]+)\)/gi,
      (match, text, url) => {
        cartLinkCount++;
        if (cartLinkCount === 1) {
          console.log(`[CartFix] Force-replaced cart link #1: ${url} → primaryCartUrl`);
          return `[${text}](${validCartUrl})`;
        }
        if (cartLinkCount === 2 && placeholderUrls.altCartUrl) {
          console.log(`[CartFix] Force-replaced cart link #2: ${url} → altCartUrl`);
          return `[${text}](${placeholderUrls.altCartUrl})`;
        }
        // 3rd+ cart link: use primary as fallback
        console.log(`[CartFix] Force-replaced cart link #${cartLinkCount}: ${url} → primaryCartUrl`);
        return `[${text}](${validCartUrl})`;
      }
    );
    
    // Also replace raw (non-markdown) cart URLs 
    let rawCartCount = 0;
    sanitized = sanitized.replace(
      /(?<!\()(https?:\/\/[^\s)]*\/cart\?items=[^\s)]+)/gi,
      (url) => {
        rawCartCount++;
        if (rawCartCount === 1) {
          console.log(`[CartFix] Force-replaced raw cart URL #1: ${url} → primaryCartUrl`);
          return validCartUrl;
        }
        if (rawCartCount === 2 && placeholderUrls.altCartUrl) {
          console.log(`[CartFix] Force-replaced raw cart URL #2: ${url} → altCartUrl`);
          return placeholderUrls.altCartUrl;
        }
        console.log(`[CartFix] Force-replaced raw cart URL #${rawCartCount}: ${url} → primaryCartUrl`);
        return validCartUrl;
      }
    );
    
    if (cartLinkCount > 0 || rawCartCount > 0) {
      console.log(`[CartFix] Total: ${cartLinkCount} markdown + ${rawCartCount} raw cart URLs force-replaced`);
    }
  }

  console.log('URL sanitization applied. Had invalid URLs:', hadInvalidUrls);

  // ═══ FORCE-REPLACE LINKS BY ANCHOR TEXT (Buy Now / Customize) ═══
  // The AI often ignores placeholder tokens and generates its own URLs.
  // This deterministically replaces ALL buy/customize links by occurrence order.
  const buyTexts = /ซื้อเลย|กดซื้อ|สั่งซื้อ|ซื้อตรงนี้|ซื้อที่นี่|ซื้อได้เลย|Buy\s*Now|Order\s*Now|Buy\s*Here/i;
  const customizeTexts = /ปรับแต่ง|ดูรายละเอียด|ดูเพิ่มเติม|Customize|View\s*Details/i;
  
  let buyCount = 0;
  let customizeCount = 0;
  
  // Replace markdown links whose text matches buy/customize patterns
  sanitized = sanitized.replace(
    /\[([^\]]+)\]\(([^)]*)\)/g,
    (match, text, url) => {
      if (buyTexts.test(text)) {
        buyCount++;
        if (buyCount === 1 && placeholderUrls.primaryCartUrl) {
          console.log(`[LinkFix] Replaced Buy #1 URL: ${url} → primaryCartUrl`);
          return `[${text}](${placeholderUrls.primaryCartUrl})`;
        }
        if (buyCount === 2 && placeholderUrls.altCartUrl) {
          console.log(`[LinkFix] Replaced Buy #2 URL: ${url} → altCartUrl`);
          return `[${text}](${placeholderUrls.altCartUrl})`;
        }
        // If no stored URL, keep original but warn
        if (!url || url.includes('undefined') || url.includes('{{')) {
          console.log(`[LinkFix] Removing broken Buy #${buyCount} link`);
          return text; // Strip the broken link, keep text
        }
      }
      if (customizeTexts.test(text)) {
        customizeCount++;
        if (customizeCount === 1 && placeholderUrls.primaryConfiguratorUrl) {
          console.log(`[LinkFix] Replaced Customize #1 URL: ${url} → primaryConfiguratorUrl`);
          return `[${text}](${placeholderUrls.primaryConfiguratorUrl})`;
        }
        if (customizeCount === 2 && placeholderUrls.altConfiguratorUrl) {
          console.log(`[LinkFix] Replaced Customize #2 URL: ${url} → altConfiguratorUrl`);
          return `[${text}](${placeholderUrls.altConfiguratorUrl})`;
        }
        // Fallback: if no stored configurator URL, try to salvage the existing URL
        if (!placeholderUrls.primaryConfiguratorUrl) {
          // If URL was already rewritten to a valid /packages? URL, keep it
          if (url && url.includes('/packages?') && !url.includes('undefined') && !url.includes('{{')) {
            console.log(`[LinkFix] Keeping already-valid Customize #${customizeCount} URL: ${url}`);
            return match;
          }
           // Try to extract country from hallucinated /esim/, /configurator/, or /configurator?country= URL
           const esimFallbackMatch = url?.match(/\/(?:esim|configurator|plans)\/([a-zA-Z\-]+)/i);
           if (esimFallbackMatch) {
             const slug = esimFallbackMatch[1].toLowerCase();
             const fallbackUrl = `${baseUrl}/esim/${slug}`;
             console.log(`[LinkFix] Built fallback Customize URL from hallucinated slug: ${fallbackUrl}`);
             return `[${text}](${fallbackUrl})`;
           }
           // Try to extract ISO code from /configurator?country=XX
           const configuratorCountryMatch = url?.match(/\/configurator\?country=([A-Z]{2})/i);
           if (configuratorCountryMatch) {
             const iso = configuratorCountryMatch[1].toUpperCase();
             const isoMap: Record<string, string> = {
               'JP': 'japan', 'TH': 'thailand', 'US': 'united-states', 'GB': 'united-kingdom',
               'FR': 'france', 'DE': 'germany', 'IT': 'italy', 'ES': 'spain', 'CH': 'switzerland',
               'KR': 'south-korea', 'CN': 'china', 'SG': 'singapore', 'MY': 'malaysia',
               'AU': 'australia', 'NZ': 'new-zealand', 'CA': 'canada', 'VN': 'vietnam',
               'TW': 'taiwan', 'HK': 'hong-kong', 'IN': 'india', 'PH': 'philippines',
             };
             const slug = isoMap[iso] || iso.toLowerCase();
             const fallbackUrl = `${baseUrl}/esim/${slug}`;
             console.log(`[LinkFix] Built fallback Customize URL from /configurator?country=${iso}: ${fallbackUrl}`);
             return `[${text}](${fallbackUrl})`;
           }
           // Only strip if truly broken
           if (!url || url.includes('undefined') || url.includes('{{')) {
             console.log(`[LinkFix] Removing broken Customize #${customizeCount} link`);
             return text;
           }
           // URL exists and looks usable, keep it
           console.log(`[LinkFix] Keeping existing Customize #${customizeCount} URL: ${url}`);
           return match;
        }
      }
      // Also strip any remaining {{...}} tokens from URLs
      if (url.includes('{{')) {
        console.log(`[LinkFix] Removing unreplaced token link: ${url}`);
        return text;
      }
      return match;
    }
  );
  
  // Also remove any remaining unreplaced {{...}} tokens in plain text
  // Match patterns like: ซื้อเลย({{BUYOPTION1}}) | ปรับแต่ง({{CUSTOMIZEOPTION1}})
  // Also match: ({{BUYOPTION1}}) standalone, and bare {{BUYOPTION1}}
  sanitized = sanitized.replace(/\(?\{\{[A-Z_0-9]+\}\}\)?/g, '');
  // Clean up leftover empty parentheses and pipe separators from stripped tokens
  sanitized = sanitized.replace(/\(\s*\)/g, '');
  sanitized = sanitized.replace(/\s*\|\s*(?=\s*$|\s*\n)/gm, '');
  sanitized = sanitized.replace(/\s*\|\s*\|\s*/g, ' | ');
  // Clean up trailing pipes after token removal (e.g., "ซื้อเลย | ปรับแต่ง" where both were stripped)
  sanitized = sanitized.replace(/^\s*\|\s*/gm, '');
  sanitized = sanitized.replace(/\s*\|\s*$/gm, '');

  // Catch plain-text buy/customize keywords not already inside markdown links and wrap with URLs
  if (placeholderUrls.primaryCartUrl) {
    sanitized = sanitized.replace(
      /(?<!\[[^\]]*)(ซื้อเลย|กดซื้อ|สั่งซื้อ|Buy\s*Now|Order\s*Now)(?![^\[]*\]\()/gi,
      (match) => {
        console.log(`[LinkFix] Wrapped plain-text "${match}" with primaryCartUrl`);
        return `[${match}](${placeholderUrls.primaryCartUrl})`;
      }
    );
  }

  if (placeholderUrls.primaryConfiguratorUrl) {
    sanitized = sanitized.replace(
      /(?<!\[[^\]]*)(Customize|ปรับแต่ง)(?![^\[]*\]\()/gi,
      (match) => {
        console.log(`[LinkFix] Wrapped plain-text "${match}" with primaryConfiguratorUrl`);
        return `[${match}](${placeholderUrls.primaryConfiguratorUrl})`;
      }
    );
  }
  
  console.log(`[LinkFix] Total: ${buyCount} buy links, ${customizeCount} customize links replaced`);

  // ═══ ENFORCE AVAILABLE PACKAGE TYPES IN URLs ═══
  // Rewrite type= parameters that reference unavailable package types
  if (availableTypes) {
    const getFallbackType = (exclude: string): string | null => {
      // Priority: max_speed > day_pass > limitless
      if (exclude !== 'max_speed' && availableTypes.maxspeed) return 'max_speed';
      if (exclude !== 'day_pass' && availableTypes.daypass) return 'day_pass';
      if (exclude !== 'limitless' && availableTypes.limitless) return 'limitless';
      return null;
    };

    if (!availableTypes.limitless) {
      const fallback = getFallbackType('limitless');
      if (fallback) {
        const before = sanitized;
        sanitized = sanitized.replace(/type=limitless/gi, `type=${fallback}`);
        if (before !== sanitized) console.log(`[TypeEnforce] Rewrote type=limitless → type=${fallback}`);
      }
    }
    if (!availableTypes.daypass) {
      const fallback = getFallbackType('day_pass');
      if (fallback) {
        const before = sanitized;
        sanitized = sanitized.replace(/type=day_pass/gi, `type=${fallback}`);
        if (before !== sanitized) console.log(`[TypeEnforce] Rewrote type=day_pass → type=${fallback}`);
      }
    }
    if (!availableTypes.maxspeed) {
      const fallback = getFallbackType('max_speed');
      if (fallback) {
        const before = sanitized;
        sanitized = sanitized.replace(/type=max_speed/gi, `type=${fallback}`);
        if (before !== sanitized) console.log(`[TypeEnforce] Rewrote type=max_speed → type=${fallback}`);
      }
    }

    // ═══ STRIP HALLUCINATED PACKAGE TYPE MENTIONS FROM TEXT ═══
    // Use broad matching: any line/sentence containing the unavailable type name gets removed
    if (!availableTypes.limitless) {
      // Remove any numbered list items, bullet points, or sentences mentioning "Limitless"
      sanitized = sanitized.replace(/^\s*\d+[\.\)]\s*.*\b(?:Limitless|ไม่จำกัด)\b.*$/gim, '');
      sanitized = sanitized.replace(/^[-*•]\s*.*\b(?:Limitless|ไม่จำกัด)\b.*$/gim, '');
      sanitized = sanitized.replace(/[^.!?\n]*\b(?:Limitless|ไม่จำกัด)\b[^.!?\n]*[.!?]?\s*/gi, '');
      console.log('[TypeEnforce] Stripped Limitless text mentions (unavailable)');
    }
    if (!availableTypes.daypass) {
      // Remove any numbered list items, bullet points, or sentences mentioning "Day Pass"
      sanitized = sanitized.replace(/^\s*\d+[\.\)]\s*.*\bDay\s*Pass\b.*$/gim, '');
      sanitized = sanitized.replace(/^[-*•]\s*.*\bDay\s*Pass\b.*$/gim, '');
      sanitized = sanitized.replace(/[^.!?\n]*\bDay\s*Pass\b[^.!?\n]*[.!?]?\s*/gi, '');
      console.log('[TypeEnforce] Stripped Day Pass text mentions (unavailable)');
    }

    // Clean up any double newlines left by stripping
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  }

  return sanitized;
}

// Convert markdown links to plain text URLs for channels that don't support markdown (LINE, Facebook)
// Also converts relative URLs to absolute URLs
function convertLinksForMessaging(content: string, baseUrl: string = 'https://mobile11.com'): string {
  let result = content;
  
  // First, convert relative URLs in markdown links to absolute: [text](/esim/japan) → [text](https://mobile11.com/esim/japan)
  result = result.replace(
    /\[([^\]]+)\]\(\/([\w\-\/\?&=%.]+)\)/g,
    (_, text, path) => `[${text}](${baseUrl}/${path})`
  );
  
  // Convert markdown links to "text: url" format for plain text messaging
  // [ดูแพ็กเกจ eSIM สำหรับ Japan](https://mobile11.com/esim/japan) → ดูแพ็กเกจ eSIM สำหรับ Japan 👉 https://mobile11.com/esim/japan
  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    (_, text, url) => `${text} 👉 ${url}`
  );

  // Convert any remaining relative URLs that appear as raw text: /esim/japan → https://mobile11.com/esim/japan
  result = result.replace(
    /(?<!\w)(\/esim\/[\w\-]+)/g,
    (_, path) => `${baseUrl}${path}`
  );
  
  // Remove markdown bold **text** → text (LINE doesn't render it)
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');

  // Fix escaped dial codes: \*#06# or \*\#06\# → *#06#
  result = result.replace(/\\?\*\\?#06\\?#/g, '*#06#');
  result = result.replace(/\\#06#/g, '*#06#');
  
  return result;
}

// Estimate confidence based on response content
function estimateConfidence(content: string, channel?: string): number {
  let confidence = 0.85; // Default high confidence
  
  // For email/form channels, only flag genuine uncertainty — not professional sign-offs
  const isEmailOrForm = channel === 'email' || channel === 'form';
  
  const lowConfidencePatterns = isEmailOrForm
    ? [
        /i'm not sure/i,
        /i don't have information/i,
        /ไม่แน่ใจ/,
        /ไม่มีข้อมูล/,
        /I cannot find/i,
        /I don't know/i,
      ]
    : [
        /i'm not sure/i,
        /i don't have information/i,
        /ไม่แน่ใจ/,
        /ไม่มีข้อมูล/,
        /please contact/i,
        /human agent/i,
        /support team/i,
        /ติดต่อเจ้าหน้าที่/,
        /I cannot find/i,
        /I don't know/i,
      ];
  
  for (const pattern of lowConfidencePatterns) {
    if (pattern.test(content)) {
      confidence = 0.5;
      break;
    }
  }
  
  // Check for escalation signals (human agent handoff)
  // Skip escalation detection if this is clearly a helpful/guidance response
  const isGuidanceResponse = /\*#06#|EID|IMEI|Settings|ตั้งค่า|SIM Manager|Add eSIM|เพิ่ม eSIM|ลองกด|ลองเช็ค|วิธี|ขั้นตอน/.test(content);

  if (!isGuidanceResponse) {
    const escalationPatterns = [
      /connect you with a human/i,
      /connect you with our team/i,
      /speak with an agent/i,
      /transfer you to/i,
      /I'll connect you/i,
      /let me connect you/i,
      /ส่งต่อให้เจ้าหน้าที่/,
      /ส่งต่อให้ทีมงาน/,
      /พูดคุยกับเจ้าหน้าที่/,
      /ติดต่อทีมสนับสนุน/,
      /ทีมของเราจะติดต่อกลับ/,
      /ทีมงานของเราตรวจสอบ/,
    ];
    
    for (const pattern of escalationPatterns) {
      if (pattern.test(content)) {
        confidence = 0.4; // Below threshold to trigger escalation
        break;
      }
    }
  }
  
  return confidence;
}

// Call Lovable AI Gateway with streaming support
async function callAIStream(
  messages: Message[],
  model: string
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required, please add funds to your Lovable AI workspace.');
    }
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  return response;
}

// Non-streaming fallback for backward compatibility
async function callAI(
  messages: Message[],
  model: string
): Promise<{ content: string; confidence: number }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required, please add funds to your Lovable AI workspace.');
    }
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const confidence = estimateConfidence(content);
  
  return { content, confidence };
}


// Create KB suggestion for review
async function createKBSuggestion(
  supabase: any,
  conversationId: string,
  messageId: string | null,
  question: string,
  answer: string,
  confidence: number,
  language: string
): Promise<void> {
  const { error } = await supabase
    .from('pending_kb_suggestions')
    .insert({
      conversation_id: conversationId,
      message_id: messageId,
      user_question: question,
      ai_suggested_answer: answer,
      ai_confidence: confidence,
      language,
      status: 'pending'
    });
  
  if (error) {
    console.error('Error creating KB suggestion:', error);
  }
}

// --- CUSTOMER MEMORY: Extract facts from conversation and save ---
async function extractAndSaveMemory(
  supabase: any,
  contactId: string,
  conversationId: string,
  userMessage: string,
  botResponse: string
): Promise<void> {
  const facts: Array<{ category: string; fact_key: string; fact_value: string }> = [];
  const combined = userMessage + ' ' + botResponse;

  // Extract customer name
  const namePatterns = [
    /(?:my name is|i'?m called|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:ชื่อ|ผม(?:ชื่อ)?|ดิฉัน(?:ชื่อ)?|หนู(?:ชื่อ)?)\s*([^\s,\.]+)/,
    /^([A-Z][a-z]{1,15})$/m, // Single capitalized word as a name reply
  ];
  for (const pattern of namePatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common non-name words
      const nonNames = /^(yes|no|ok|okay|hi|hello|hey|thanks|thank|sure|please|sorry|help|the|and|for|are|how|what|who|why|when|can|not|but|this|that|have|will|just|with|from|about|your|want|need|like|would|could|should|may|did|does|let|get|was|been|some|all|very|also|eSIM|esim|iPhone|Samsung|Pixel|Android|sim|mobile|phone|plan|data|day|days|unlimited|value|lite|economy|priority|standard|agent|support|buy|order|trip|travel|visit|country|gb|mb)$/i;
      if (!nonNames.test(name) && name.length >= 2 && name.length <= 30) {
        facts.push({ category: 'personal', fact_key: 'customer_name', fact_value: name });
        break;
      }
    }
  }

  // Extract phone number
  const phonePatterns = [
    /(?:(?:phone|number|tel|โทร|เบอร์)\s*(?:is|:)?\s*)?(\+?\d[\d\s\-]{7,15}\d)/i,
    /(0[689]\d[\s\-]?\d{3,4}[\s\-]?\d{4})/,  // Thai mobile
  ];
  for (const pattern of phonePatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      const phone = match[1].replace(/[\s\-]/g, '');
      if (phone.length >= 8 && phone.length <= 16) {
        facts.push({ category: 'personal', fact_key: 'phone_number', fact_value: phone });
        break;
      }
    }
  }

  // Extract phone model
  const devicePatterns = [
    /(iPhone\s*\d{1,2}(?:\s*(?:Pro|Plus|Max|Mini|SE)(?:\s*(?:Max|Plus))?)?)/i,
    /(Samsung\s*Galaxy\s*[A-Z]\d{1,2}(?:\s*(?:Ultra|Plus|\+|FE|Lite))?)/i,
    /(Google\s*Pixel\s*\d{1,2}(?:\s*(?:Pro|a))?)/i,
    /(Huawei\s*(?:P|Mate|Nova)\s*\d{1,3}(?:\s*(?:Pro|Lite|Plus))?)/i,
    /(OPPO\s*(?:Find|Reno)\s*\w+)/i,
    /(Xiaomi\s*\w+)/i,
  ];
  for (const pattern of devicePatterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      facts.push({ category: 'device', fact_key: 'phone_model', fact_value: match[1].trim() });
      break;
    }
  }

  // Extract travel destination from user message
  const countryMatch = extractCountry(userMessage);
  if (countryMatch) {
    const daysMatch = userMessage.match(/(\d{1,3})\s*(?:days?|วัน|日)/i);
    const days = daysMatch ? daysMatch[1] : null;
    const factValue = days ? `${days} days` : 'mentioned';
    const factKey = `visited_${countryMatch.toLowerCase().replace(/\s+/g, '_')}`;
    facts.push({ category: 'travel', fact_key: factKey, fact_value: factValue });
  }

  if (facts.length === 0) return;

  console.log(`[Memory] Extracting ${facts.length} facts for contact ${contactId}: ${facts.map(f => f.fact_key).join(', ')}`);

  for (const fact of facts) {
    await supabase
      .from('customer_memory')
      .upsert({
        contact_id: contactId,
        category: fact.category,
        fact_key: fact.fact_key,
        fact_value: fact.fact_value,
        source_conversation_id: conversationId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'contact_id,category,fact_key' });
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      conversationId, 
      language: requestedLanguage,
      messageId,
      deviceInfo,
      userId,
      baseUrl: clientBaseUrl,
      chatMode,
      channel,
      attachments: rawAttachments,
      intent,
      contactId: requestContactId
    } = await req.json();
    
    // Filter to only image attachments
    const imageAttachments: ImageAttachment[] = (rawAttachments || []).filter(
      (a: ImageAttachment) => IMAGE_MIME_TYPES.includes(a.type)
    );

    console.log('Device info received:', deviceInfo ? `iOS: ${deviceInfo.isIOS}, Android: ${deviceInfo.isAndroid}, iOS Version: ${deviceInfo.iosVersion}, Supports OneClick: ${deviceInfo.supportsOneClick}` : 'none');

    if (!message || !conversationId) {
      return new Response(
        JSON.stringify({ error: 'message and conversationId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch AI config
    const { data: configData, error: configError } = await supabase
      .from('ai_chat_config')
      .select('*')
      .limit(1)
      .single();

    if (configError) {
      console.error('Error fetching AI config:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch AI configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config: AIConfig = configData;

    // Check if AI is enabled
    if (!config.enabled || !config.auto_respond) {
      return new Response(
        JSON.stringify({ 
          shouldRespond: false, 
          reason: 'AI is disabled' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AI auto-response is now enabled for all channels (web, line, facebook)

    // Detect language - prioritize current message, use history only for truly ambiguous cases
    let language: SupportedLanguage;
    if (requestedLanguage) {
      language = requestedLanguage;
    } else {
      const detectedFromMessage = detectLanguage(message);
      
      // If current message contains non-Latin script, use detected language directly
      const hasNonLatin = /[\u0E00-\u0E7F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(message);
      // Treat domain-specific English keywords as language-neutral (don't count as English)
      const domainKeywords = /^(economy|priority|standard|unlimited|lite|light|docomo|softbank|kddi|ais|dtac|true|yes|no|ok|okay|limitless|day\s*pass|max\s*speed|[a-f]|\d+\s*(days?|gb)?)\s*$/i;
      const isDomainKeyword = domainKeywords.test(message.trim());
      const isShortAmbiguousMessage = (message.trim().length < 15 || isDomainKeyword) && !hasNonLatin;
      
      if (isShortAmbiguousMessage && chatMode === 'freetext') {
        // Only use history for truly ambiguous messages like "ok", "7", "yes"
        const historyForLanguage = await getConversationHistory(supabase, conversationId, 20);
        const langCounts: Record<SupportedLanguage, number> = { th: 0, en: 0, ja: 0, ko: 0, fr: 0, de: 0, zh: 0 };
        
        // Weight recent messages higher (last 5 count 2x)
        const userMessages = historyForLanguage.filter(m => m.role === 'user');
        for (let i = 0; i < userMessages.length; i++) {
          const msg = userMessages[i];
          const weight = i >= userMessages.length - 5 ? 2 : 1;
          if (domainKeywords.test(msg.content.trim())) continue;
          langCounts[detectLanguage(msg.content)] += weight;
        }
        
        const totalMeaningful = Object.values(langCounts).reduce((a, b) => a + b, 0);
        if (totalMeaningful >= 2) {
          let maxLang: SupportedLanguage = 'th';
          let maxCount = 0;
          for (const [lang, count] of Object.entries(langCounts) as [SupportedLanguage, number][]) {
            if (count > maxCount) { maxCount = count; maxLang = lang; }
          }
          language = maxLang;
          console.log(`[Language] Ambiguous message - using history: ${language} (${JSON.stringify(langCounts)})`);
        } else {
          language = 'th';
        }
      } else {
        language = detectedFromMessage;
        if (hasNonLatin) {
          console.log(`[Language] Non-Latin script detected - using ${language}`);
        }
      }
    }
    console.log(`Detected language: ${language}, message: ${message.substring(0, 50)}...`);

    // Get base URL from request for generating correct links (prefer client-provided URL)
    const baseUrl = clientBaseUrl || getBaseUrl(req);
    console.log(`Using base URL: ${baseUrl}`);

    // Determine history limit based on user tier (reduced for speed):
    // Guest (not logged in): 20 messages
    // Logged in (no purchases): 50 messages
    // Customer (has completed orders): 100 messages
    let historyLimit = 20; // Default: Guest
    
    if (userId) {
      const isPurchasedCustomer = await hasPurchasedOrders(supabase, userId);
      historyLimit = isPurchasedCustomer ? 100 : 50;
    }
    
    // --- CUSTOMER MEMORY: Load remembered facts ---
    let memoryContext = '';
    let resolvedContactId: string | null = requestContactId || null;
    
    // If contactId not provided, resolve from conversation
    if (!resolvedContactId) {
      const { data: convData } = await supabase
        .from('conversations')
        .select('contact_id')
        .eq('id', conversationId)
        .single();
      resolvedContactId = convData?.contact_id || null;
    }
    
    let customerMemory: Array<{ category: string; fact_key: string; fact_value: string }> = [];
    if (resolvedContactId) {
      const { data: memoryRows } = await supabase
        .from('customer_memory')
        .select('category, fact_key, fact_value')
        .eq('contact_id', resolvedContactId)
        .order('updated_at', { ascending: false });
      customerMemory = memoryRows || [];
    }
    
    if (customerMemory.length > 0) {
      const memoryLines = customerMemory.map(m => {
        const label = m.fact_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `- ${label}: ${m.fact_value}`;
      });
      memoryContext = `\n\n## 🧠 CUSTOMER MEMORY (Facts from previous conversations)\n${memoryLines.join('\n')}\nUse this info naturally — greet by name if known, skip questions you already know answers to.\n`;
    }
    
    // Name & phone collection prompt
    const hasName = customerMemory.some(m => m.fact_key === 'customer_name');
    const hasPhone = customerMemory.some(m => m.fact_key === 'phone_number');
    let collectionPrompt = '';
    if (!hasName || !hasPhone) {
      collectionPrompt = '\n\n## NAME & PHONE COLLECTION\n';
      if (!hasName) {
        collectionPrompt += `Ask for the customer's name early in the conversation (within the first 2 exchanges). Keep it natural:\n- Thai: "พี่ชื่ออะไรคะ เผื่อน้องจะได้เรียกถูกนะคะ 😊"\n- English: "By the way, what's your name? So I can address you properly! 😊"\n`;
      }
      if (!hasPhone) {
        collectionPrompt += `After getting name, ask for phone number (OPTIONAL):\n- Thai: "พี่สะดวกให้เบอร์โทรไหมคะ เผื่อทีมจะได้ติดต่อกลับได้สะดวกขึ้นค่ะ ไม่บังคับนะคะ 😊"\n- English: "Would you like to share your phone number? It's optional, but helps our team reach you if needed!"\nIf customer declines → respect it. Never ask again in same conversation.\n`;
      }
    }

    // Run history retrieval in parallel with KB search for speed
    const historyPromise = getConversationHistory(supabase, conversationId, historyLimit);
    const kbPromise = searchKBArticles(supabase, message, language);
    
    const [history, kbArticles] = await Promise.all([historyPromise, kbPromise]);
    console.log(`Loaded ${history.length} messages (limit: ${historyLimit}, userId: ${userId || 'guest'})`);
    
    // DIAGNOSTIC: Log history window to verify we have the correct (newest) messages
    if (history.length > 0) {
      const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant');
      const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
      console.log(`[HISTORY_WINDOW] conversationId=${conversationId}, count=${history.length}, lastAssistantPreview="${(lastAssistantMsg?.content || '').slice(0, 80).replace(/\n/g, ' ')}", lastUserPreview="${(lastUserMsg?.content || '').slice(0, 50).replace(/\n/g, ' ')}"`);
    }
    
    // Note: max_ai_turns limit removed - AI will respond indefinitely until user requests human agent
    // KB search already done in parallel with history retrieval above
    
    let packageResult: PackageSearchResult = { 
      packages: [], 
      country: null, 
      days: null, 
      context: '', 
      recommendedPackage: null, 
      configuratorUrl: null,
      fullConfiguratorUrl: null
    };
    
    // For freetext mode: still look up network info for accurate carrier answers
    let networkInfoContext = '';
    
    if (chatMode !== 'freetext') {
      // Only search for packages in guided flow mode
      packageResult = await searchPackages(supabase, message, language, baseUrl, history);
    } else {
      // In freetext mode: extract FULL context from conversation history
      const context = extractFullContext(history, message);
      
      // Check if this is a keyword-based reset request
      const isKeywordReset = isResetRequest(message);
      
      // Check if this is a reset request (either from marker or keywords)
      if (context.isReset || isKeywordReset) {
        console.log(`[Freetext] Context reset - starting fresh (keyword: ${isKeywordReset})`);
        
        // If keyword reset, persist marker to database for future messages
        if (isKeywordReset) {
          await insertResetMarker(supabase, conversationId);
          
          // Add reset acknowledgment to network info context
          networkInfoContext = language === 'th'
            ? '\n\n[SYSTEM: ผู้ใช้ขอเริ่มการสนทนาใหม่ ตอบรับสั้นๆ ว่า "เริ่มใหม่ค่ะ! 🔄" แล้วตอบคำถามใหม่โดยไม่อ้างอิงการสนทนาก่อนหน้า]\n'
            : '\n\n[SYSTEM: User requested a fresh start. Acknowledge briefly with "Starting fresh! 🔄" then address their new question without referencing previous conversation.]\n';
        }
        // Even if a reset marker exists, we should still fulfill the user's *current* request.
        // Otherwise the AI often outputs placeholder links like CONFIGURATOR_URL.
        const isAPNorTroubleshoot = isAPNQuestion(message) || isTroubleshootingQuestion(message) || context.topic === 'troubleshooting';

        // If user is asking about packages right after reset, search packages based ONLY on the current message
        // (do not rely on pre-reset history for days/country).
        const resetCountry = extractCountry(message);
        const resetDays = extractDays(message) || 7;

        if (resetCountry && !isAPNorTroubleshoot) {
          console.log(`[Freetext][Reset] Searching packages for ${resetCountry}, ${resetDays} days (current message only)`);
          const searchQuery = `${resetCountry} ${resetDays} days`;
          const searchResult = await searchPackages(supabase, searchQuery, language, baseUrl, []);

          // Populate packageResult so sanitizeAIResponse can replace placeholders with real URLs
          packageResult = {
            ...packageResult,
            ...searchResult,
            country: searchResult.country || resetCountry,
            days: searchResult.days || resetDays,
            primaryCartUrl: searchResult.primaryCartUrl,
            primaryConfiguratorUrl: searchResult.primaryConfiguratorUrl,
            altCartUrl: searchResult.altCartUrl,
            altConfiguratorUrl: searchResult.altConfiguratorUrl,
            browseAllUrl: searchResult.browseAllUrl,
          };

          console.log(`[Freetext][Reset] Got configurator URL: ${packageResult.configuratorUrl}`);
        } else if (!resetCountry && context.country && !isAPNorTroubleshoot) {
          // Follow-up answer (e.g., "Economy", "Priority", "Pay per use") after reset
          // Country comes from conversation history, not current message
          const contextDays = context.validityDays || resetDays;
          const userDataPreference = context.dataUsage as any || null;
          const tierPref = context.serviceTierPreference || null;
          console.log(`[Freetext][Reset] Follow-up answer detected - searching packages for ${context.country}, ${contextDays} days, tier: ${tierPref}, data: ${userDataPreference}`);
          const searchQuery = `${context.country} ${contextDays} days`;
          const searchResult = await searchPackages(supabase, searchQuery, language, baseUrl, history, userDataPreference, tierPref);

          packageResult = {
            ...packageResult,
            ...searchResult,
            country: searchResult.country || context.country,
            days: searchResult.days || contextDays,
            primaryCartUrl: searchResult.primaryCartUrl,
            primaryConfiguratorUrl: searchResult.primaryConfiguratorUrl,
            altCartUrl: searchResult.altCartUrl,
            altConfiguratorUrl: searchResult.altConfiguratorUrl,
            browseAllUrl: searchResult.browseAllUrl,
          };

          if (searchResult.configuratorUrl || searchResult.fullConfiguratorUrl) {
            packageResult.configuratorUrl = searchResult.configuratorUrl;
            packageResult.fullConfiguratorUrl = searchResult.fullConfiguratorUrl;
          }
          console.log(`[Freetext][Reset] Follow-up placeholder URLs: primary=${!!searchResult.primaryCartUrl}, alt=${!!searchResult.altCartUrl}`);
        }

        // Don't inject any other context, just let AI respond naturally
      } else {
        // Check if user provided an order ID or ICCID for APN lookup
        // First check current message, then fallback to context from history
        const orderIdentifier = extractOrderOrICCID(message) || context.orderIdentifier;
        
        // NEW: Check if user mentioned a provider name directly (e.g., "USIMSA")
        const mentionedProviderCode = extractProviderName(message);
        
        // Detect if this is an APN or troubleshooting question
        const isAPNorTroubleshoot = isAPNQuestion(message) || isTroubleshootingQuestion(message) || context.topic === 'troubleshooting';
        
        // Priority 1: User mentioned a provider name directly - bypass Order/ICCID requirement
        if (mentionedProviderCode && (isAPNorTroubleshoot || isCarrierQuestion(message))) {
          console.log(`[Freetext] User mentioned provider: ${mentionedProviderCode} - bypassing Order/ICCID requirement`);
          
          const providerLookup = await lookupProviderByCode(supabase, mentionedProviderCode);
          
          if (providerLookup) {
            // Get APN config for this provider
            // Use APN-specific extraction first (strips provider names), then fallback to context
            const messageCountry = extractCountryForAPNQuery(message);
            const countryForLookup = messageCountry || context.country;
            console.log(`[Freetext] Country for APN lookup: ${countryForLookup} (from APN extractor: ${messageCountry}, from context: ${context.country})`);
            
            const countryCode = countryForLookup ? getCountryCodeFromName(countryForLookup) : undefined;
            console.log(`[Freetext] Country code resolved: ${countryCode}`);
            
            const apnConfig = await getProviderAPNConfig(supabase, providerLookup.providerId, countryCode);
            
            if (apnConfig) {
              const deviceType = context.deviceType || (deviceInfo?.isIOS ? 'iphone' : deviceInfo?.isAndroid ? 'android' : null);
              networkInfoContext = buildProviderAPNInstructions(apnConfig, deviceType, language);
              console.log(`[Freetext] Generated APN instructions for explicitly mentioned provider: ${providerLookup.providerName}`);
            } else {
              // Provider detected but no APN config found - ask for country instead of ICCID
              console.log(`[Freetext] No APN config found for provider ${providerLookup.providerName}, country: ${countryCode} - will ask for country`);
              networkInfoContext = language === 'th'
                ? `\n\n[SYSTEM INSTRUCTION - HIGH PRIORITY: ผู้ใช้ใช้ eSIM จาก ${providerLookup.providerName} กรุณาถามว่า eSIM ของเขาใช้ในประเทศใด เพื่อให้ค่า APN ที่ถูกต้อง ห้ามขอ Order number หรือ ICCID - แค่ถามประเทศปลายทาง]\n`
                : `\n\n[SYSTEM INSTRUCTION - HIGH PRIORITY: User has a ${providerLookup.providerName} eSIM. Ask which country/destination their eSIM is for so you can provide the correct APN settings. Do NOT ask for Order number or ICCID - just ask for the destination country.]\n`;
            }
          }
        }
        // Priority 2: User provided Order/ICCID
        else if (orderIdentifier && (isAPNorTroubleshoot || isCarrierQuestion(message))) {
          console.log(`[Freetext] Found order/ICCID: ${orderIdentifier}, looking up for APN config`);
          const orderResult = await lookupOrderByIdentifier(supabase, orderIdentifier);
          
          if (orderResult.found && orderResult.providerId) {
            const apnConfig = await getProviderAPNConfig(supabase, orderResult.providerId, orderResult.countryCode);
            if (apnConfig) {
              const deviceType = context.deviceType || (deviceInfo?.isIOS ? 'iphone' : deviceInfo?.isAndroid ? 'android' : null);
              networkInfoContext = buildProviderAPNInstructions(apnConfig, deviceType, language);
              console.log(`[Freetext] Generated provider-specific APN instructions for ${apnConfig.providerName}`);
            }
          }
        } 
        // Priority 3: APN-specific question but no provider or order info - ask for it
        // Note: General troubleshooting questions (slow, no signal) should use KB content, not ask for order
        else if (isAPNQuestion(message) && !orderIdentifier && !mentionedProviderCode) {
          // User is asking specifically about APN settings but hasn't provided order info or provider name
          // APN values are provider-specific, so we need this info
          console.log(`[Freetext] APN-specific question without order identifier or provider name - will ask for it`);
          
          networkInfoContext = language === 'th'
            ? `\n\n[SYSTEM INSTRUCTION - HIGH PRIORITY: ผู้ใช้ถามเกี่ยวกับ APN แต่ยังไม่ได้ให้หมายเลขคำสั่งซื้อ, ICCID หรือชื่อผู้ให้บริการ
กรุณาขอหมายเลขคำสั่งซื้อ (เช่น ORD-XXXXX), ICCID (เลข 19-20 หลักที่ขึ้นต้นด้วย 89) หรือชื่อผู้ให้บริการ (เช่น USIMSA, TUGE) เพื่อที่จะได้ให้ค่า APN ที่ถูกต้องสำหรับ eSIM ของเขา
ห้ามให้ค่า APN เฉพาะเจาะจงใดๆ ก่อนได้รับข้อมูลนี้ เพราะแต่ละ eSIM อาจมีค่า APN ต่างกัน]\n`
            : `\n\n[SYSTEM INSTRUCTION - HIGH PRIORITY: User is asking about APN settings but hasn't provided their order info or provider name.
You MUST ask for their Order Number (e.g., ORD-XXXXX), ICCID (19-20 digit number starting with 89), OR provider name (e.g., USIMSA, TUGE) so you can provide the correct APN settings.
If they know their provider (like USIMSA), they can just tell you and you'll provide the right APN.
DO NOT provide any specific APN values until you have this information, because each eSIM may have different APN settings depending on the provider.]\n`;
        }
        // Priority 4: General troubleshooting (not APN-specific) - use KB content
        // Check both direct message AND context topic from history
        else if ((isTroubleshootingQuestion(message) || context.topic === 'troubleshooting') && !isAPNQuestion(message) && kbArticles.length > 0) {
          // User is asking about troubleshooting (slow, no signal, etc.) but NOT specifically about APN
          // These questions can be answered with generic KB troubleshooting steps
          console.log(`[Freetext] General troubleshooting with ${kbArticles.length} KB articles - using KB content`);
          
          networkInfoContext = language === 'th'
            ? `\n\n[MANDATORY INSTRUCTION - HIGH PRIORITY: นี่คือคำถามแก้ปัญหาทั่วไป คุณต้อง:
1. ให้ขั้นตอนแก้ปัญหาจาก KNOWLEDGE BASE CONTEXT ด้านล่างอย่างครบถ้วน (อย่างน้อย 4-5 ขั้นตอน)
2. ห้ามถามหมายเลขคำสั่งซื้อหรือ ICCID ในตอนนี้ - ขั้นตอนเหล่านี้ใช้ได้กับทุก eSIM
3. ถามเฉพาะหมายเลขคำสั่งซื้อถ้าลูกค้าบอกว่าลองทำตามขั้นตอนทั้งหมดแล้วยังไม่ได้ผล
4. ใช้ข้อมูลจาก KB ที่ให้มา อย่าสรุปสั้นเกินไป]\n`
            : `\n\n[MANDATORY INSTRUCTION - HIGH PRIORITY: This is a general troubleshooting question. You MUST:
1. Provide the COMPLETE troubleshooting steps from the KNOWLEDGE BASE CONTEXT below (at least 4-5 steps)
2. DO NOT ask for Order Number or ICCID at this point - these steps work for any eSIM
3. Only ask for order info if the user explicitly says they've tried all the steps and nothing worked
4. Use the KB content provided - do not summarize too briefly]\n`;
        }
        
        // Use extracted context for NON-APN questions only
        // APN questions require order identifier - handled above
        if (context.country && !networkInfoContext && !isAPNorTroubleshoot) {
          packageResult.country = context.country;
          
          // Fetch network info for carrier questions (not APN-specific)
          if (context.topic === 'carrier' || isCarrierQuestion(message)) {
            console.log(`[Freetext] Carrier context for ${context.country}`);
            const networkInfo = await getNetworkInfoForCountry(supabase, context.country);
            networkInfoContext = buildNetworkInfoContext(networkInfo);
          }
        }
        
        // In freetext mode, search for packages when BOTH country AND days are detected
        // If days are not yet provided, inject a STRONG instruction to ask for trip duration ONLY
        if (context.country && !isAPNorTroubleshoot && !context.validityDays) {
          // GUARDRAIL: Country detected but NO days — force the AI to ask for days only
          console.log(`[Freetext] Country=${context.country} but days=null — injecting ask-days-only guardrail`);
          networkInfoContext = language === 'th'
            ? `\n\n🚨 MANDATORY INSTRUCTION — DO NOT SKIP:\nพี่บอกว่าจะไป ${context.country} แต่ยังไม่ได้บอกจำนวนวัน\nน้องต้องถามจำนวนวันเท่านั้น ห้ามแสดงราคา ห้ามแสดงเครือข่าย ห้ามแสดงลิงก์ ห้ามแสดงแพ็กเกจ\nตัวอย่าง: "ดีเลยค่ะพี่! ไป ${context.country} กี่วันคะ? 😊"\nห้ามเพิ่มข้อมูลอื่นใดทั้งสิ้น\n`
            : `\n\n🚨 MANDATORY INSTRUCTION — DO NOT SKIP:\nCustomer wants to go to ${context.country} but has NOT specified trip duration.\nYou MUST ask ONLY about trip duration. Do NOT show prices, carriers, networks, links, or packages.\nExample: "Great choice! How many days will you be in ${context.country}? 😊"\nDo NOT add any other information.\n`;
        }
        
        if (context.country && !isAPNorTroubleshoot && context.validityDays) {
          const daysForSearch = context.validityDays;
          
           // If serviceTierPreference was just detected, the current message is a TIER answer
           // (e.g., "Economy", "Priority"). Do NOT re-detect data preference from it -- use
           // the previously established dataUsage from conversation history.
           let userDataPreference: DataPreference = null;
           if (context.serviceTierPreference && context.dataUsage) {
             // Tier answer detected -- keep the original data usage preference
             userDataPreference = context.dataUsage as DataPreference;
             console.log(`[Freetext] Preserving data preference "${userDataPreference}" (current message is tier answer)`);
           } else {
             userDataPreference = await detectDataPreference(message, history);
             console.log(`[Freetext] Data preference from original message "${message}": ${userDataPreference || 'none'}`);
           }
          console.log(`[Freetext] Searching packages for ${context.country}, ${daysForSearch} days, preference: ${userDataPreference}`);
          
          // Build a search query from context (but data preference was already detected from original message)
          const searchQuery = `${context.country} ${daysForSearch} days`;
          const searchResult = await searchPackages(supabase, searchQuery, language, baseUrl, history, userDataPreference, context.serviceTierPreference);
          
          // Update packageResult with search results (for configurator URLs)
          // Always copy search result data for display and URL sanitization
          packageResult.country = searchResult.country || context.country;
          packageResult.days = searchResult.days || daysForSearch;
          packageResult.packages = searchResult.packages;
          packageResult.recommendedPackage = searchResult.recommendedPackage;
          packageResult.context = searchResult.context;
          
          // Always copy placeholder URLs for deterministic replacement (even if configuratorUrl is null)
          packageResult.primaryCartUrl = searchResult.primaryCartUrl;
          packageResult.primaryConfiguratorUrl = searchResult.primaryConfiguratorUrl;
          packageResult.altCartUrl = searchResult.altCartUrl;
          packageResult.altConfiguratorUrl = searchResult.altConfiguratorUrl;
          packageResult.browseAllUrl = searchResult.browseAllUrl;
          
          if (searchResult.configuratorUrl || searchResult.fullConfiguratorUrl) {
            packageResult.configuratorUrl = searchResult.configuratorUrl;
            packageResult.fullConfiguratorUrl = searchResult.fullConfiguratorUrl;
            console.log(`[Freetext] Got configurator URL: ${packageResult.configuratorUrl}`);
          }
          
          console.log(`[Freetext] Placeholder URLs: primary=${!!searchResult.primaryCartUrl}, alt=${!!searchResult.altCartUrl}, altConfig=${!!searchResult.altConfiguratorUrl}`);
        }
        
        // Always add context summary if we have any context
        networkInfoContext += buildContextSummary(context);
      }
    }
    
    let kbContext = buildKBContext(kbArticles);
    const messageLower = message.toLowerCase();
    
    // Detect topic and inject fallback context if KB returned nothing relevant
    const loyaltyKeywords = ['loyalty', 'tier', 'cashback', 'mobile11 money', 'reward', 'points', 'explorer', 'silver', 'gold', 'platinum'];
    const refundKeywords = ['refund', 'money back', 'return', 'cancel', 'cancellation', 'คืนเงิน'];
    const paymentKeywords = ['payment', 'pay', 'credit card', 'promptpay', 'ชำระเงิน', 'จ่าย'];
    const referralKeywords = ['referral', 'refer', 'invite', 'friend', 'แนะนำเพื่อน'];
    
    const isLoyaltyQuestion = loyaltyKeywords.some(k => messageLower.includes(k));
    const isRefundQuestion = refundKeywords.some(k => messageLower.includes(k));
    const isPaymentQuestion = paymentKeywords.some(k => messageLower.includes(k));
    const isReferralQuestion = referralKeywords.some(k => messageLower.includes(k));
    
    // Inject loyalty fallback if no KB articles found
    if (isLoyaltyQuestion && kbArticles.length === 0) {
      console.log('[AI] Injecting loyalty fallback context');
      kbContext += `

### Mobile11 Loyalty Program (Grounding Facts)
- Currency: Mobile11 Money (cashback credits, NOT points/M-Points)
- Explorer: Starting tier, 5% cashback
- Silver Explorer: $50 USD spent (฿1,750), 7% cashback
- Gold Explorer: $100 USD spent (฿3,500), 10% cashback
- Platinum Explorer: $200 USD spent (฿7,000), 15% cashback
- Cashback earned on purchases WITHOUT discount/referral codes
- Mobile11 Money expires after 1 year of inactivity
- Expiration resets with ANY activity: eSIM purchase, top-up, or earning referral rewards
- Stay active = balance never expires!
`;
    }
    
    // Inject refund policy fallback if no KB articles found
    if (isRefundQuestion && kbArticles.length === 0) {
      console.log('[AI] Injecting refund policy fallback context');
      kbContext += `

### Refund Policy (Grounding Facts)
- Full refund: eSIM has NOT been installed yet
- Full refund: Technical issues preventing installation (verified by team)
- Full refund: Order placed in error (within 24 hours of purchase)
- NO refund: eSIM installed/activated or any data consumed
- NO refund: QR code revealed/downloaded
- NO refund: More than 30 days since purchase
- Processing: 5-10 business days to original payment method
`;
    }
    
    // Inject payment methods fallback if no KB articles found
    if (isPaymentQuestion && kbArticles.length === 0) {
      console.log('[AI] Injecting payment methods fallback context');
      kbContext += `

### Payment Methods (Grounding Facts)
- Credit/Debit cards: Visa, Mastercard accepted
- PromptPay: Thai QR code payment (popular in Thailand)
- Mobile11 Money: Use your cashback balance at checkout
- All payments are secure and encrypted
`;
    }
    
    // Inject referral program fallback if no KB articles found
    if (isReferralQuestion && kbArticles.length === 0) {
      console.log('[AI] Injecting referral program fallback context');
      kbContext += `

### Referral Program (Grounding Facts)
- Share your unique referral code with friends
- Friends get a discount on their first purchase
- You earn Mobile11 Money when they complete a purchase
- Referral codes cannot be combined with other promo codes
`;
    }

    // Inject Songkran promotion fallback if asking about promos/discounts
    const promoKeywords = ['promo', 'promotion', 'discount', 'ส่วนลด', 'โปรโมชั่น', 'โปร', 'สงกรานต์', 'songkran', 'code', 'โค้ด', 'coupon', 'sale', 'deal', 'cheap', 'cheaper', 'cheapest', 'budget', 'affordable', 'save', 'saving', 'ถูก', 'ราคา', 'แพง', 'ประหยัด', 'คุ้ม', 'ลดราคา', 'price', 'cost', 'expensive', 'lower price'];
    const isPromoQuestion = promoKeywords.some(k => messageLower.includes(k));
    
    if (isPromoQuestion) {
      console.log('[AI] Injecting Songkran promotion context');
      const now = new Date();
      const promoStart = new Date('2026-03-14T00:00:00+07:00');
      const promoEnd = new Date('2026-04-10T23:59:59+07:00');
      const isPromoActive = now >= promoStart && now <= promoEnd;
      const isBeforePromo = now < promoStart;

      if (isPromoActive) {
        kbContext += `

### Current Promotion (Grounding Facts — OVERRIDE ANY PREVIOUS STATEMENTS)
- TODAY'S DATE: ${now.toISOString()}
- Songkran 2026 Promotion is NOW ACTIVE as of today's date.
- Active Period: March 14 – April 10, 2026
- Promo code: SK2026
- Discount: 40% off any eSIM package
- Buy now, activate within 180 days
- Apply code at checkout
- IMPORTANT: If you previously told this customer the promo hasn't started, CORRECT yourself — the promotion IS now active. Apologize briefly and provide the code.
- The code SK2026 is VALID and working right now.
`;
      } else if (isBeforePromo) {
        const daysUntilPromo = Math.ceil((promoStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        kbContext += `

### Upcoming Promotion (Grounding Facts)
- Songkran 2026 Promotion: March 14 – April 10, 2026 (starts in ${daysUntilPromo} days)
- Promo code: SK2026
- Discount: 40% off any eSIM package
- The promotion has NOT started yet. Tell the customer they can use code SK2026 starting from March 14, 2026 until April 10, 2026.
- IMPORTANT: If the customer is asking about cheaper prices, wanting to save money, or finding prices too expensive, proactively tell them about this upcoming promotion. Suggest they wait a few days to get 40% off with code SK2026.
- Thai: "อีก ${daysUntilPromo} วันจะมีโปรฯ สงกรานต์ลด 40% ค่ะ! ใช้โค้ด SK2026 ได้ตั้งแต่ 14 มีนาคม – 10 เมษายน 2569 ค่ะ 🎉💦"
- English: "Great news! Our Songkran promotion starts in ${daysUntilPromo} days — use code SK2026 from March 14 – April 10 for 40% off any eSIM package! 🎉💦"
`;
      } else {
        kbContext += `

### Expired Promotion (Grounding Facts)
- The Songkran 2026 Promotion (code SK2026) has ended on April 10, 2026.
- Tell the customer the promotion period has passed. Do NOT encourage them to use the code.
`;
      }
    }
    

    const planKeywords = ['limitless', 'unlimited', 'fair usage', 'fup', 'speed reduction', 'throttle', 'slow'];
    const isPlanQuestion = planKeywords.some(k => messageLower.includes(k));
    
    if (isPlanQuestion && kbArticles.length === 0) {
      console.log('[AI] Injecting Limitless/FUP fallback context');
      kbContext += `

### Limitless Plan - Fair Usage Policy (Grounding Facts)
- Limitless plans offer unlimited data at maximum network speeds
- Fair Usage Policy varies by carrier:
  - DOCOMO (Japan): If unusual usage detected, speed reduced to 2 Mbps, resets within 24 hours
  - Other carriers (USIMSA): If unusual usage detected, speed reduced to 5 Mbps, resets within 24 hours
- Normal usage is NOT affected — only unusual/excessive consumption triggers FUP
- Hotspot/tethering is fully supported
- Plan starts when you first connect to data at destination, not when QR is scanned
`;
    }
    
    // Economy vs Priority tier question detection removed
    
    console.log(`Chat mode: ${chatMode || 'flow'}, Found ${kbArticles.length} relevant KB articles, package: ${packageResult.recommendedPackage?.name || 'none'}, country: ${packageResult.country}, days: ${packageResult.days}`);

    // Build enhanced system prompt with device info for installation guidance
    const enhancedSystemPrompt = buildSalesAgentPrompt(config.system_prompt, language, deviceInfo);
    
    // Build messages for AI with KB and package context
    // In freetext mode, include network info context for accurate carrier answers
    // Inject support mode context if intent is 'support'
    const supportModeContext = intent === 'support' 
      ? '\n\n**ACTIVE MODE: SUPPORT** — The customer selected "Support". You MUST end every response with the agent reminder line as specified in the SUPPORT MODE BEHAVIOR section above.\n'
      : '';
    // Channel-specific context for email/form: be more elaborate and gather information
    const emailFormContext = (channel === 'email' || channel === 'form')
      ? `\n\n**CHANNEL: ${channel.toUpperCase()} — ELABORATE RESPONSE MODE**
You are responding via ${channel}. Unlike chat, email/form customers expect detailed, professional responses. Follow these rules:
1. Write LONGER, more elaborate responses with full sentences and proper paragraphs.
2. Be thorough — explain options, benefits, and details comprehensively.
3. PROACTIVELY ASK QUESTIONS to gather as much information as possible before making recommendations:
   - Travel dates / trip duration
   - Number of travelers / team members
   - Data usage habits (streaming, video calls, basic browsing?)
   - Device types (iPhone, Android, specific models?)
   - Whether they've used eSIM before
   - Budget preferences
   - Any specific requirements (hotspot sharing, calls/SMS, etc.)
   - Preferred language for support
4. Try to ask 2-4 relevant questions per response to efficiently gather context.
5. Use a warm, professional tone suitable for business correspondence.
6. Include a proper greeting and sign-off.
7. Structure your response with clear sections when covering multiple topics.
8. Do NOT rush to recommend packages — first understand their needs fully.
9. Do NOT include the "type 'agent'" or "พิมพ์ 'agent'" reminder. Instead, if the customer may need human help, end with:
   - Thai: "หากต้องการพูดคุยกับเจ้าหน้าที่ กรุณาตอบกลับอีเมลนี้พร้อมระบุว่า 'ขอติดต่อเจ้าหน้าที่' แล้วทีมงานจะติดต่อกลับโดยเร็วที่สุดค่ะ"
   - English: "If you'd like to speak with a support agent, simply reply to this email with 'I'd like to speak with an agent' and our team will get back to you shortly."
10. You are having an ongoing email conversation. Continue responding helpfully to follow-up replies — do not repeat the escalation phrase in every email, only mention it when relevant.
`
      : '';
    const systemMessage = enhancedSystemPrompt + memoryContext + collectionPrompt + kbContext + (packageResult.context || '') + networkInfoContext + supportModeContext + emailFormContext;
    
    // Clean history: remove reset markers and only use messages after last reset
    const cleanHistory = getCleanHistoryForAI(history);
    console.log(`[AI] Using ${cleanHistory.length} messages after filtering (original: ${history.length})`);
    
    // Build the user message - multimodal if image attachments present
    let userContent: string | ContentPart[] = message;
    
    if (imageAttachments.length > 0) {
      console.log(`[Vision] Processing ${imageAttachments.length} image attachment(s)`);
      const contentParts: ContentPart[] = [{ type: 'text', text: message }];
      
      for (const attachment of imageAttachments) {
        try {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('ticket-attachments')
            .createSignedUrl(attachment.path, 3600); // 1 hour expiry
          
          if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error(`[Vision] Failed to generate signed URL for ${attachment.name}:`, signedUrlError);
            continue;
          }
          
          console.log(`[Vision] Generated signed URL for ${attachment.name}`);
          contentParts.push({
            type: 'image_url',
            image_url: { url: signedUrlData.signedUrl }
          });
        } catch (err: any) {
          console.error(`[Vision] Error processing attachment ${attachment.name}:`, err);
        }
      }
      
      // Only use multimodal if we successfully got at least one image URL
      if (contentParts.length > 1) {
        userContent = contentParts;
      }
    }

    const aiMessages: Message[] = [
      { role: 'system', content: systemMessage },
      ...cleanHistory,
      { role: 'user', content: userContent }
    ];

    // Call AI with SSE streaming for faster perceived response
    console.log('Calling AI with streaming:', aiMessages.length, 'messages, system prompt length:', systemMessage.length);
    
    // Prepare metadata to send before streaming starts
    const metadata = {
      type: 'metadata',
      shouldRespond: true,
      language,
      kbArticlesUsed: kbArticles.length,
      detectedCountry: packageResult.country,
      detectedDays: packageResult.days,
      recommendedPackageId: packageResult.recommendedPackage?.id || null,
      packages: chatMode !== 'freetext' ? (packageResult.packages || []) : [],
      configuratorUrl: packageResult.configuratorUrl || null
    };
    
    const aiResponse = await callAIStream(aiMessages, config.model);
    const aiBody = aiResponse.body;
    
    if (!aiBody) {
      throw new Error('AI response body is null');
    }
    
    // Create a TransformStream to process the AI response and add metadata
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullContent = '';
    const primaryCartUrl = packageResult.packages?.[0]?.cartUrl || null;
    
    // Build a set of blocked type keywords for streaming-level filtering
    const avTypes = packageResult.availableTypes || null;
    const blockedTypePatterns: RegExp[] = [];
    if (avTypes && !avTypes.limitless) {
      blockedTypePatterns.push(/\bLimitless\b/i, /\bไม่จำกัด\b/);
    }
    if (avTypes && !avTypes.daypass) {
      blockedTypePatterns.push(/\bDay\s*Pass\b/i);
    }
    
    // Streaming line buffer: accumulate delta text, emit only clean complete lines
    let streamLineBuffer = '';
    
    function filterAndEmitDelta(deltaContent: string, controller: ReadableStreamDefaultController) {
      // If no blocked patterns, pass through immediately
      if (blockedTypePatterns.length === 0) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'delta',
          content: deltaContent
        })}\n\n`));
        return;
      }
      
      // Accumulate into line buffer
      streamLineBuffer += deltaContent;
      
      // Process complete lines (keep incomplete last line in buffer)
      const lines = streamLineBuffer.split('\n');
      streamLineBuffer = lines.pop() || ''; // Hold back incomplete line
      
      let cleanOutput = '';
      for (const line of lines) {
        const isBlocked = blockedTypePatterns.some(p => p.test(line));
        if (!isBlocked) {
          cleanOutput += line + '\n';
        } else {
          console.log(`[StreamFilter] Blocked line: ${line.slice(0, 80)}...`);
        }
      }
      
      if (cleanOutput) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'delta',
          content: cleanOutput
        })}\n\n`));
      }
    }
    
    function flushStreamBuffer(controller: ReadableStreamDefaultController) {
      if (streamLineBuffer && blockedTypePatterns.length > 0) {
        const isBlocked = blockedTypePatterns.some(p => p.test(streamLineBuffer));
        if (!isBlocked && streamLineBuffer.trim()) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'delta',
            content: streamLineBuffer
          })}\n\n`));
        }
        streamLineBuffer = '';
      }
    }
    
    const stream = new ReadableStream({
      async start(controller) {
        // Send metadata event first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));
        
        const reader = aiBody.getReader();
        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  // Flush any remaining stream buffer before done
                  flushStreamBuffer(controller);
                  // Stream complete - send final event with sanitized content and confidence
                  const sanitizedContent = sanitizeAIResponse(
                    fullContent,
                    primaryCartUrl,
                    packageResult.configuratorUrl || null,
                    packageResult.fullConfiguratorUrl || null,
                    {
                      primaryCartUrl: packageResult.primaryCartUrl,
                      primaryConfiguratorUrl: packageResult.primaryConfiguratorUrl,
                      altCartUrl: packageResult.altCartUrl,
                      altConfiguratorUrl: packageResult.altConfiguratorUrl,
                      browseAllUrl: packageResult.browseAllUrl,
                    },
                    packageResult.availableTypes || null
                  );
                  // For LINE/Facebook: convert markdown links to plain clickable URLs
                  const finalContent = (channel === 'line' || channel === 'facebook')
                    ? convertLinksForMessaging(sanitizedContent, baseUrl)
                    : sanitizedContent;
                  const confidence = estimateConfidence(finalContent, channel);
                  const shouldEscalate = confidence < config.confidence_threshold;
                  
                  // Detect if conversation reached a natural conclusion
                  // Phase 1: Customer confirmed nothing else needed
                  const nothingElseEN = /\b(no thanks|nope|nothing else|that'?s (all|it)|i'?m (good|done|fine)|all good|no more|not right now|no i'?m good|no that'?s it)\b/i;
                  const nothingElseTH = /(ไม่มี|หมดแล้ว|ไม่ต้อง|พอแล้ว|เท่านี้|โอเค|ไม่มีอะไร|เรียบร้อย|ไม่แล้ว|จะสั่ง|ได้เลย|โอเคค่ะ|โอเคครับ|สั่งเข้าไป|ปิดเลย|ปิดได้เลย|ปิดได้|ปิดเลยครับ|ปิดเลยค่ะ|ปิดครับ|ปิดค่ะ)/i;
                  const customerConfirmedDone = nothingElseEN.test(message) || nothingElseTH.test(message);
                  // Phase 2: AI response contains rating ask phrases
                  const ratingAskPatterns = /(rate this conversation|ให้คะแนนบทสนทนา|feedback|ข้อเสนอแนะ|ให้คะแนน|คะแนนด้านล่าง|please rate|rating)/i;
                  const aiAskedForRating = ratingAskPatterns.test(finalContent);
                  // Trigger rating if AI asked for it (primary signal) OR both conditions met
                  const isResolution = (aiAskedForRating && !shouldEscalate) || (customerConfirmedDone && aiAskedForRating && !shouldEscalate);
                  
                  // Detect device incompatibility in AI response
                  const incompatibleEN = /\b(does not support eSIM|doesn't support eSIM|not compatible with eSIM|not eSIM compatible|incompatible|not support eSIM|cannot use eSIM|can't use eSIM)\b/i;
                  const incompatibleTH = /(ไม่รองรับ.*eSIM|ยังไม่รองรับ.*eSIM|ไม่สามารถใช้.*eSIM|ไม่ซัพพอร์ต.*eSIM|ใช้ eSIM ไม่ได้|รองรับ eSIM ไม่ได้)/i;
                  const deviceIncompatible = incompatibleEN.test(finalContent) || incompatibleTH.test(finalContent);
                  
                  // Create KB suggestion if needed
                  if (kbArticles.length === 0 && confidence >= 0.6) {
                    console.log('Creating KB suggestion for new topic');
                    createKBSuggestion(
                      supabase,
                      conversationId,
                      messageId || null,
                      message,
                      finalContent,
                      confidence,
                      language
                    ).catch(err => console.error('KB suggestion error:', err));
                  }
                  
                  // --- CUSTOMER MEMORY: Extract & save facts (fire-and-forget) ---
                  if (resolvedContactId) {
                    extractAndSaveMemory(supabase, resolvedContactId, conversationId, message, finalContent)
                      .catch(err => console.error('[Memory] Extract error:', err));
                  }
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'done',
                    content: finalContent,
                    confidence,
                    escalate: shouldEscalate,
                    requestRating: isResolution,
                    deviceIncompatible
                  })}\n\n`));
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                } else {
                  try {
                    const parsed = JSON.parse(data);
                    const deltaContent = parsed.choices?.[0]?.delta?.content;
                    if (deltaContent) {
                      fullContent += deltaContent;
                      // Forward the delta to client with streaming filter
                      filterAndEmitDelta(deltaContent, controller);
                    }
                  } catch (e: any) {
                    // Skip malformed JSON
                  }
                }
              }
            }
          }
          
          // Process any remaining buffer
          if (buffer.trim()) {
            const line = buffer.trim();
            if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  fullContent += deltaContent;
                  filterAndEmitDelta(deltaContent, controller);
                  flushStreamBuffer(controller);
                }
              } catch (e: any) {
                // Skip malformed JSON
              }
            }
          }
        } finally {
          controller.close();
        }
      }
    });
    
    console.log('Returning SSE stream response');
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('Error in ai-chat-response:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        shouldRespond: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
