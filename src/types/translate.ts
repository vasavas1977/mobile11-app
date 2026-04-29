export interface TranslateLanguage {
  code: string;
  name: string;
  nativeName: string;
  countryCode: string; // for flag icon
  speechCode: string; // for STT/TTS
}

export type TranslateMode = 'voice' | 'text';
export type TranslateStatus = 'streaming' | 'translating' | 'done' | 'error';

export interface TranslateMessage {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  speaker: 'user' | 'other';
  timestamp: Date;
  /** Which pipeline produced this message (defaults to 'voice' for backward compat) */
  mode?: TranslateMode;
  /** Message lifecycle status (defaults to 'done' for backward compat) */
  status?: TranslateStatus;
}

export type LayoutMode = 'single' | 'face-to-face' | 'side-by-side';
export type InputMode = 'realtime' | 'hold-to-talk';
export type FontSizeLevel = 'small' | 'default' | 'large';
export type OutputMode = 'voice' | 'text-only';
/** Top-level translation experience: Phase-1 push-to-talk vs Phase-2 hands-free */
export type ConversationMode = 'practical' | 'natural';

export interface TranslateSessionState {
  myLanguage: TranslateLanguage;
  theirLanguage: TranslateLanguage;
  messages: TranslateMessage[];
  layoutMode: LayoutMode;
  inputMode: InputMode;
  fontSize: FontSizeLevel;
  isRecording: boolean;
  isTranslating: boolean;
}

export const SUPPORTED_LANGUAGES: TranslateLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', countryCode: 'us', speechCode: 'en-US' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', countryCode: 'th', speechCode: 'th-TH' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', countryCode: 'cn', speechCode: 'zh-CN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', countryCode: 'jp', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', countryCode: 'kr', speechCode: 'ko-KR' },
  { code: 'fr', name: 'French', nativeName: 'Français', countryCode: 'fr', speechCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', countryCode: 'de', speechCode: 'de-DE' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', countryCode: 'sa', speechCode: 'ar-SA' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', countryCode: 'id', speechCode: 'id-ID' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', countryCode: 'my', speechCode: 'ms-MY' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', countryCode: 'ru', speechCode: 'ru-RU' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', countryCode: 'pt', speechCode: 'pt-BR' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', countryCode: 'it', speechCode: 'it-IT' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', countryCode: 'es', speechCode: 'es-ES' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', countryCode: 'nl', speechCode: 'nl-NL' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', countryCode: 'il', speechCode: 'he-IL' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', countryCode: 'pl', speechCode: 'pl-PL' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', countryCode: 'vn', speechCode: 'vi-VN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', countryCode: 'in', speechCode: 'hi-IN' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', countryCode: 'tr', speechCode: 'tr-TR' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', countryCode: 'se', speechCode: 'sv-SE' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', countryCode: 'dk', speechCode: 'da-DK' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', countryCode: 'fi', speechCode: 'fi-FI' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', countryCode: 'no', speechCode: 'nb-NO' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', countryCode: 'cz', speechCode: 'cs-CZ' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', countryCode: 'gr', speechCode: 'el-GR' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', countryCode: 'hu', speechCode: 'hu-HU' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', countryCode: 'ro', speechCode: 'ro-RO' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', countryCode: 'ua', speechCode: 'uk-UA' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', countryCode: 'ph', speechCode: 'fil-PH' },
];

export const POPULAR_LANGUAGE_CODES = ['en', 'th', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'vi', 'hi'];

export interface PhraseCategory {
  id: string;
  name: string;
  icon: string;
  color: string; // tailwind bg class
}

export interface QuickPhrase {
  id: string;
  categoryId: string;
  category: string;
  categoryIcon: string;
  text: string;
}

export const PHRASE_CATEGORIES: PhraseCategory[] = [
  { id: 'emergency',    name: 'Emergency',    icon: '🆘',  color: 'bg-red-50' },
  { id: 'medical',      name: 'Medical',      icon: '🏥',  color: 'bg-rose-50' },
  { id: 'taxi',         name: 'Taxi',         icon: '🚕',  color: 'bg-yellow-50' },
  { id: 'food',         name: 'Food',         icon: '🍽️',  color: 'bg-orange-50' },
  { id: 'hotel',        name: 'Hotel',        icon: '🏨',  color: 'bg-purple-50' },
  { id: 'directions',   name: 'Directions',   icon: '🗺️',  color: 'bg-green-50' },
  { id: 'airport',      name: 'Airport',      icon: '✈️',  color: 'bg-blue-50' },
  { id: 'immigration',  name: 'Immigration',  icon: '🛂',  color: 'bg-indigo-50' },
  { id: 'shopping',     name: 'Shopping',     icon: '🛍️',  color: 'bg-pink-50' },
  { id: 'payment',      name: 'Payment',      icon: '💳',  color: 'bg-emerald-50' },
];

export const QUICK_PHRASES: QuickPhrase[] = [
  // Emergency — critical phrases first
  { id: 'em1', categoryId: 'emergency', category: 'Emergency', categoryIcon: '🆘', text: 'I need help' },
  { id: 'em2', categoryId: 'emergency', category: 'Emergency', categoryIcon: '🆘', text: 'Please call an ambulance' },
  { id: 'em3', categoryId: 'emergency', category: 'Emergency', categoryIcon: '🆘', text: 'Please call the police' },
  { id: 'em4', categoryId: 'emergency', category: 'Emergency', categoryIcon: '🆘', text: 'I lost my passport' },
  { id: 'em5', categoryId: 'emergency', category: 'Emergency', categoryIcon: '🆘', text: 'I lost my wallet' },
  { id: 'em6', categoryId: 'emergency', category: 'Emergency', categoryIcon: '🆘', text: 'Can you speak slowly please?' },
  { id: 'em7', categoryId: 'emergency', category: 'Emergency', categoryIcon: '🆘', text: 'Please repeat that' },
  { id: 'em8', categoryId: 'emergency', category: 'Emergency', categoryIcon: '🆘', text: 'I don\'t understand' },
  // Medical
  { id: 'md1', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'I need a doctor' },
  { id: 'md2', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'Where is the hospital?' },
  { id: 'md3', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'I am allergic to this' },
  { id: 'md4', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'I am allergic to shellfish' },
  { id: 'md5', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'I am allergic to peanuts' },
  { id: 'md6', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'I need my medication' },
  { id: 'md7', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'I have a headache' },
  { id: 'md8', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'I have a stomachache' },
  { id: 'md9', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'I have a fever' },
  { id: 'md10', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'Where is the pharmacy?' },
  { id: 'md11', categoryId: 'medical', category: 'Medical', categoryIcon: '🏥', text: 'How do I take this medicine?' },
  // Taxi
  { id: 'tx1', categoryId: 'taxi', category: 'Taxi', categoryIcon: '🚕', text: 'Please take me to this address' },
  { id: 'tx2', categoryId: 'taxi', category: 'Taxi', categoryIcon: '🚕', text: 'How much to get there?' },
  { id: 'tx3', categoryId: 'taxi', category: 'Taxi', categoryIcon: '🚕', text: 'Please use the meter' },
  { id: 'tx4', categoryId: 'taxi', category: 'Taxi', categoryIcon: '🚕', text: 'Please stop here' },
  { id: 'tx5', categoryId: 'taxi', category: 'Taxi', categoryIcon: '🚕', text: 'Please wait here for me' },
  { id: 'tx6', categoryId: 'taxi', category: 'Taxi', categoryIcon: '🚕', text: 'How long will it take?' },
  { id: 'tx7', categoryId: 'taxi', category: 'Taxi', categoryIcon: '🚕', text: 'That is too expensive' },
  // Food
  { id: 'fd1', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'Menu please' },
  { id: 'fd2', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'The bill please' },
  { id: 'fd3', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'Not spicy please' },
  { id: 'fd4', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'A little spicy please' },
  { id: 'fd5', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'I am allergic to peanuts' },
  { id: 'fd6', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'Can I have water please?' },
  { id: 'fd7', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'What do you recommend?' },
  { id: 'fd8', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'I am vegetarian' },
  { id: 'fd9', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'Can I pay by card?' },
  { id: 'fd10', categoryId: 'food', category: 'Food', categoryIcon: '🍽️', text: 'Table for two please' },
  // Hotel
  { id: 'ht1', categoryId: 'hotel', category: 'Hotel', categoryIcon: '🏨', text: 'I have a reservation' },
  { id: 'ht2', categoryId: 'hotel', category: 'Hotel', categoryIcon: '🏨', text: "I'd like to check in" },
  { id: 'ht3', categoryId: 'hotel', category: 'Hotel', categoryIcon: '🏨', text: 'What time is checkout?' },
  { id: 'ht4', categoryId: 'hotel', category: 'Hotel', categoryIcon: '🏨', text: 'Can I have a late checkout?' },
  { id: 'ht5', categoryId: 'hotel', category: 'Hotel', categoryIcon: '🏨', text: 'What is the Wi-Fi password?' },
  { id: 'ht6', categoryId: 'hotel', category: 'Hotel', categoryIcon: '🏨', text: 'What time is breakfast?' },
  { id: 'ht7', categoryId: 'hotel', category: 'Hotel', categoryIcon: '🏨', text: 'The air conditioning is not working' },
  { id: 'ht8', categoryId: 'hotel', category: 'Hotel', categoryIcon: '🏨', text: 'Can I have extra towels?' },
  // Directions
  { id: 'dr1', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'Where is the bathroom?' },
  { id: 'dr2', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'Where is the nearest train station?' },
  { id: 'dr3', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'How do I get to the airport?' },
  { id: 'dr4', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'Is it far from here?' },
  { id: 'dr5', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'Can you show me on the map?' },
  { id: 'dr6', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'Go straight ahead' },
  { id: 'dr7', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'Turn left' },
  { id: 'dr8', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'Turn right' },
  { id: 'dr9', categoryId: 'directions', category: 'Directions', categoryIcon: '🗺️', text: 'Please say that again slowly' },
  // Airport
  { id: 'ap1', categoryId: 'airport', category: 'Airport', categoryIcon: '✈️', text: 'Where is the check-in counter?' },
  { id: 'ap2', categoryId: 'airport', category: 'Airport', categoryIcon: '✈️', text: 'Where is my gate?' },
  { id: 'ap3', categoryId: 'airport', category: 'Airport', categoryIcon: '✈️', text: 'Is my flight delayed?' },
  { id: 'ap4', categoryId: 'airport', category: 'Airport', categoryIcon: '✈️', text: 'Where can I pick up my luggage?' },
  { id: 'ap5', categoryId: 'airport', category: 'Airport', categoryIcon: '✈️', text: 'I need to find the transit area' },
  { id: 'ap6', categoryId: 'airport', category: 'Airport', categoryIcon: '✈️', text: 'Where is the exit?' },
  // Immigration
  { id: 'im1', categoryId: 'immigration', category: 'Immigration', categoryIcon: '🛂', text: 'I am here on vacation' },
  { id: 'im2', categoryId: 'immigration', category: 'Immigration', categoryIcon: '🛂', text: 'I am staying for one week' },
  { id: 'im3', categoryId: 'immigration', category: 'Immigration', categoryIcon: '🛂', text: 'Here is my passport' },
  { id: 'im4', categoryId: 'immigration', category: 'Immigration', categoryIcon: '🛂', text: 'I am staying at this hotel' },
  { id: 'im5', categoryId: 'immigration', category: 'Immigration', categoryIcon: '🛂', text: 'I am here for business' },
  // Shopping
  { id: 'sh1', categoryId: 'shopping', category: 'Shopping', categoryIcon: '🛍️', text: 'How much is this?' },
  { id: 'sh2', categoryId: 'shopping', category: 'Shopping', categoryIcon: '🛍️', text: 'Do you have a smaller size?' },
  { id: 'sh3', categoryId: 'shopping', category: 'Shopping', categoryIcon: '🛍️', text: 'Do you have a larger size?' },
  { id: 'sh4', categoryId: 'shopping', category: 'Shopping', categoryIcon: '🛍️', text: 'Do you have this in another color?' },
  { id: 'sh5', categoryId: 'shopping', category: 'Shopping', categoryIcon: '🛍️', text: 'Can I get a discount?' },
  { id: 'sh6', categoryId: 'shopping', category: 'Shopping', categoryIcon: '🛍️', text: 'Where is the nearest ATM?' },
  { id: 'sh7', categoryId: 'shopping', category: 'Shopping', categoryIcon: '🛍️', text: 'Where do I pay?' },
  // Payment
  { id: 'py1', categoryId: 'payment', category: 'Payment', categoryIcon: '💳', text: 'Can I pay by card?' },
  { id: 'py2', categoryId: 'payment', category: 'Payment', categoryIcon: '💳', text: 'Cash only?' },
  { id: 'py3', categoryId: 'payment', category: 'Payment', categoryIcon: '💳', text: 'How much does this cost?' },
  { id: 'py4', categoryId: 'payment', category: 'Payment', categoryIcon: '💳', text: 'Can I have a receipt?' },
  { id: 'py5', categoryId: 'payment', category: 'Payment', categoryIcon: '💳', text: 'Where is the nearest ATM?' },
  { id: 'py6', categoryId: 'payment', category: 'Payment', categoryIcon: '💳', text: 'Do you accept foreign currency?' },
];
