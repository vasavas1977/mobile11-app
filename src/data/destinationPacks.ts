/**
 * Destination-specific phrase packs for real traveler scenarios.
 * Designed to scale — add new packs by appending to DESTINATION_PACKS.
 */

export interface DestinationPhrase {
  id: string;
  text: string;
  category: string;
  /** Higher = show first within category */
  priority: number;
  /** Recommend saving for offline use */
  offlineRecommended?: boolean;
  /** Extra context for the traveler */
  note?: string;
  tags?: string[];
}

export interface DestinationPhraseCategory {
  id: string;
  name: string;
  icon: string;
}

export interface DestinationPack {
  id: string;
  name: string;
  /** ISO language code(s) this pack targets */
  languageCodes: string[];
  countryCode: string;
  flag: string;
  /** Short tagline for UI */
  tagline: string;
  categories: DestinationPhraseCategory[];
  phrases: DestinationPhrase[];
}

// ─── Helper to get a pack by destination id or language code ────────
export function getDestinationPack(idOrLang: string): DestinationPack | undefined {
  return DESTINATION_PACKS.find(
    p => p.id === idOrLang || p.languageCodes.includes(idOrLang) || p.countryCode.toLowerCase() === idOrLang.toLowerCase(),
  );
}

export function getRecommendedPhrasesForDestination(packId: string, limit = 8): DestinationPhrase[] {
  const pack = getDestinationPack(packId);
  if (!pack) return [];
  return [...pack.phrases]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

export function getEmergencyPhrasesForDestination(packId: string): DestinationPhrase[] {
  const pack = getDestinationPack(packId);
  if (!pack) return [];
  return pack.phrases.filter(p => p.category === 'emergency' || p.category === 'medical');
}

export function getOfflineRecommendedPhrases(packId: string): DestinationPhrase[] {
  const pack = getDestinationPack(packId);
  if (!pack) return [];
  return pack.phrases.filter(p => p.offlineRecommended);
}

// ─── Packs ──────────────────────────────────────────────────────────

const japanCategories: DestinationPhraseCategory[] = [
  { id: 'transport', name: 'Train & Taxi', icon: '🚃' },
  { id: 'hotel', name: 'Hotel', icon: '🏨' },
  { id: 'food', name: 'Restaurant & Cafe', icon: '🍱' },
  { id: 'konbini', name: 'Convenience Store', icon: '🏪' },
  { id: 'payment', name: 'Payment', icon: '💳' },
  { id: 'directions', name: 'Directions', icon: '🗺️' },
  { id: 'polite', name: 'Polite Requests', icon: '🙏' },
  { id: 'allergy', name: 'Allergies & Diet', icon: '⚠️' },
  { id: 'emergency', name: 'Emergency', icon: '🆘' },
];

const chinaCategories: DestinationPhraseCategory[] = [
  { id: 'transport', name: 'Taxi & Transit', icon: '🚕' },
  { id: 'hotel', name: 'Hotel', icon: '🏨' },
  { id: 'food', name: 'Restaurant', icon: '🍜' },
  { id: 'payment', name: 'Payment & Apps', icon: '📱' },
  { id: 'directions', name: 'Directions', icon: '🗺️' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'emergency', name: 'Emergency', icon: '🆘' },
];

const koreaCategories: DestinationPhraseCategory[] = [
  { id: 'transport', name: 'Transport', icon: '🚇' },
  { id: 'hotel', name: 'Hotel', icon: '🏨' },
  { id: 'food', name: 'Restaurant', icon: '🍲' },
  { id: 'shopping', name: 'Shopping & Beauty', icon: '🛍️' },
  { id: 'directions', name: 'Directions', icon: '🗺️' },
  { id: 'polite', name: 'Polite Phrases', icon: '🙏' },
  { id: 'emergency', name: 'Emergency', icon: '🆘' },
];

const franceCategories: DestinationPhraseCategory[] = [
  { id: 'hotel', name: 'Hotel', icon: '🏨' },
  { id: 'food', name: 'Restaurant & Café', icon: '🥐' },
  { id: 'transport', name: 'Train & Metro', icon: '🚆' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'directions', name: 'Directions', icon: '🗺️' },
  { id: 'payment', name: 'Payment', icon: '💳' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊' },
  { id: 'emergency', name: 'Emergency', icon: '🆘' },
];

const arabicCategories: DestinationPhraseCategory[] = [
  { id: 'hotel', name: 'Hotel', icon: '🏨' },
  { id: 'transport', name: 'Taxi & Transport', icon: '🚕' },
  { id: 'food', name: 'Restaurant', icon: '🍽️' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'directions', name: 'Directions', icon: '🗺️' },
  { id: 'polite', name: 'Polite Phrases', icon: '🙏' },
  { id: 'emergency', name: 'Emergency', icon: '🆘' },
  { id: 'medical', name: 'Medical', icon: '🏥' },
];

export const DESTINATION_PACKS: DestinationPack[] = [
  // ─── Japan ────────────────────────────────────────────────
  {
    id: 'japan',
    name: 'Japan',
    languageCodes: ['ja'],
    countryCode: 'JP',
    flag: '🇯🇵',
    tagline: 'Essential phrases for traveling in Japan',
    categories: japanCategories,
    phrases: [
      // Transport
      { id: 'jp-t1', text: 'Please take me to this address', category: 'transport', priority: 10, offlineRecommended: true, tags: ['taxi'] },
      { id: 'jp-t2', text: 'Where is the train station?', category: 'transport', priority: 9, offlineRecommended: true },
      { id: 'jp-t3', text: 'One ticket to this station please', category: 'transport', priority: 8 },
      { id: 'jp-t4', text: 'Which platform for this train?', category: 'transport', priority: 7 },
      { id: 'jp-t5', text: 'Is this the right train for…?', category: 'transport', priority: 7 },
      { id: 'jp-t6', text: 'How do I get to the airport from here?', category: 'transport', priority: 8, offlineRecommended: true },
      { id: 'jp-t7', text: 'Can you help me call a taxi?', category: 'transport', priority: 6 },
      { id: 'jp-t8', text: 'Where is the bus stop?', category: 'transport', priority: 5 },
      // Hotel
      { id: 'jp-h1', text: 'I have a reservation', category: 'hotel', priority: 10, offlineRecommended: true },
      { id: 'jp-h2', text: 'What time is checkout?', category: 'hotel', priority: 8 },
      { id: 'jp-h3', text: 'Can I store my luggage here?', category: 'hotel', priority: 7 },
      { id: 'jp-h4', text: 'Where is the nearest coin laundry?', category: 'hotel', priority: 5, note: 'Coin laundry is common in Japan' },
      { id: 'jp-h5', text: 'How do I use the bath?', category: 'hotel', priority: 5, note: 'Japanese baths have specific etiquette' },
      // Food
      { id: 'jp-f1', text: 'Table for two please', category: 'food', priority: 9 },
      { id: 'jp-f2', text: 'What do you recommend?', category: 'food', priority: 8 },
      { id: 'jp-f3', text: 'The bill please', category: 'food', priority: 9 },
      { id: 'jp-f4', text: 'Is this halal?', category: 'food', priority: 5 },
      { id: 'jp-f5', text: 'Can I see an English menu?', category: 'food', priority: 7 },
      { id: 'jp-f6', text: 'This is delicious, thank you', category: 'food', priority: 4 },
      { id: 'jp-f7', text: 'Not too spicy please', category: 'food', priority: 6 },
      // Convenience store
      { id: 'jp-k1', text: 'Can I use this microwave?', category: 'konbini', priority: 6, note: 'Konbini staff can heat food for you' },
      { id: 'jp-k2', text: 'Where are the onigiri?', category: 'konbini', priority: 5 },
      { id: 'jp-k3', text: 'Can I pay with IC card?', category: 'konbini', priority: 7 },
      { id: 'jp-k4', text: 'I need a bag please', category: 'konbini', priority: 5, note: 'Bags cost extra in Japan' },
      // Payment
      { id: 'jp-p1', text: 'Do you accept credit card?', category: 'payment', priority: 10, offlineRecommended: true },
      { id: 'jp-p2', text: 'Cash only?', category: 'payment', priority: 9, offlineRecommended: true },
      { id: 'jp-p3', text: 'Can I pay with IC card?', category: 'payment', priority: 8, note: 'Suica, Pasmo, ICOCA' },
      { id: 'jp-p4', text: 'Where is the nearest ATM?', category: 'payment', priority: 7 },
      { id: 'jp-p5', text: 'Tax-free purchase please', category: 'payment', priority: 6, note: 'Available for purchases over ¥5,000' },
      // Directions
      { id: 'jp-d1', text: 'Where is the bathroom?', category: 'directions', priority: 10, offlineRecommended: true },
      { id: 'jp-d2', text: 'Where is the exit?', category: 'directions', priority: 9 },
      { id: 'jp-d3', text: 'Can you show me on the map?', category: 'directions', priority: 7 },
      { id: 'jp-d4', text: 'Is it walking distance?', category: 'directions', priority: 6 },
      // Polite
      { id: 'jp-po1', text: 'Excuse me, may I ask a question?', category: 'polite', priority: 9 },
      { id: 'jp-po2', text: 'Please speak slowly', category: 'polite', priority: 10, offlineRecommended: true },
      { id: 'jp-po3', text: 'Thank you very much', category: 'polite', priority: 8 },
      { id: 'jp-po4', text: 'I am sorry, I do not understand', category: 'polite', priority: 9, offlineRecommended: true },
      { id: 'jp-po5', text: 'Can you write it down please?', category: 'polite', priority: 7 },
      // Allergies
      { id: 'jp-a1', text: 'I am allergic to peanuts', category: 'allergy', priority: 10, offlineRecommended: true },
      { id: 'jp-a2', text: 'I am allergic to shellfish', category: 'allergy', priority: 10, offlineRecommended: true },
      { id: 'jp-a3', text: 'No seafood please', category: 'allergy', priority: 9, offlineRecommended: true },
      { id: 'jp-a4', text: 'I am vegetarian', category: 'allergy', priority: 8 },
      { id: 'jp-a5', text: 'Does this contain gluten?', category: 'allergy', priority: 7 },
      { id: 'jp-a6', text: 'I cannot eat pork', category: 'allergy', priority: 7 },
      // Emergency
      { id: 'jp-e1', text: 'I need help', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'jp-e2', text: 'Please call an ambulance', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'jp-e3', text: 'Please call the police', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'jp-e4', text: 'I lost my passport', category: 'emergency', priority: 9, offlineRecommended: true },
      { id: 'jp-e5', text: 'Where is the nearest hospital?', category: 'emergency', priority: 9, offlineRecommended: true },
      { id: 'jp-e6', text: 'I need a doctor', category: 'emergency', priority: 10, offlineRecommended: true },
    ],
  },

  // ─── China ────────────────────────────────────────────────
  {
    id: 'china',
    name: 'China',
    languageCodes: ['zh'],
    countryCode: 'CN',
    flag: '🇨🇳',
    tagline: 'Navigate China with confidence',
    categories: chinaCategories,
    phrases: [
      // Transport
      { id: 'cn-t1', text: 'Please take me here', category: 'transport', priority: 10, offlineRecommended: true },
      { id: 'cn-t2', text: 'How much to get there?', category: 'transport', priority: 9 },
      { id: 'cn-t3', text: 'Please use the meter', category: 'transport', priority: 8 },
      { id: 'cn-t4', text: 'Please stop here', category: 'transport', priority: 8, offlineRecommended: true },
      { id: 'cn-t5', text: 'Where is the subway station?', category: 'transport', priority: 7 },
      { id: 'cn-t6', text: 'How do I get to the airport?', category: 'transport', priority: 8 },
      { id: 'cn-t7', text: 'I need to go to the train station', category: 'transport', priority: 7 },
      // Hotel
      { id: 'cn-h1', text: 'I have a reservation', category: 'hotel', priority: 10, offlineRecommended: true },
      { id: 'cn-h2', text: 'I need Wi-Fi', category: 'hotel', priority: 9, note: 'Many international sites are blocked — ask about VPN' },
      { id: 'cn-h3', text: 'What is the Wi-Fi password?', category: 'hotel', priority: 8 },
      { id: 'cn-h4', text: 'Can I store my luggage?', category: 'hotel', priority: 6 },
      { id: 'cn-h5', text: 'What time is checkout?', category: 'hotel', priority: 7 },
      // Food
      { id: 'cn-f1', text: 'Menu please', category: 'food', priority: 9 },
      { id: 'cn-f2', text: 'Not spicy please', category: 'food', priority: 9, offlineRecommended: true },
      { id: 'cn-f3', text: 'A little spicy please', category: 'food', priority: 7 },
      { id: 'cn-f4', text: 'The bill please', category: 'food', priority: 9 },
      { id: 'cn-f5', text: 'What do you recommend?', category: 'food', priority: 7 },
      { id: 'cn-f6', text: 'Can I have water?', category: 'food', priority: 6, note: 'Hot water is the default in China' },
      { id: 'cn-f7', text: 'I want cold water please', category: 'food', priority: 5 },
      // Payment
      { id: 'cn-p1', text: 'Do you accept cash?', category: 'payment', priority: 10, offlineRecommended: true, note: 'Many places are cashless in China' },
      { id: 'cn-p2', text: 'Do you accept credit card?', category: 'payment', priority: 9, offlineRecommended: true },
      { id: 'cn-p3', text: 'I cannot use WeChat Pay or Alipay', category: 'payment', priority: 10, offlineRecommended: true, note: 'Critical for foreign travelers' },
      { id: 'cn-p4', text: 'Where is the nearest ATM?', category: 'payment', priority: 7 },
      { id: 'cn-p5', text: 'Can I have a receipt?', category: 'payment', priority: 5 },
      // Directions
      { id: 'cn-d1', text: 'Where is the bathroom?', category: 'directions', priority: 10, offlineRecommended: true },
      { id: 'cn-d2', text: 'Where is the exit?', category: 'directions', priority: 9 },
      { id: 'cn-d3', text: 'Can you show me on the map?', category: 'directions', priority: 7 },
      { id: 'cn-d4', text: 'Is it far from here?', category: 'directions', priority: 6 },
      // Communication
      { id: 'cn-c1', text: 'Please type it for me', category: 'communication', priority: 8, note: 'Useful when speech is hard to understand' },
      { id: 'cn-c2', text: 'Can you write it in English?', category: 'communication', priority: 7 },
      { id: 'cn-c3', text: 'Please speak slowly', category: 'communication', priority: 9, offlineRecommended: true },
      { id: 'cn-c4', text: 'I do not understand', category: 'communication', priority: 9, offlineRecommended: true },
      // Emergency
      { id: 'cn-e1', text: 'I need help', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'cn-e2', text: 'Please call an ambulance', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'cn-e3', text: 'Please call the police', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'cn-e4', text: 'I need a doctor', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'cn-e5', text: 'I lost my passport', category: 'emergency', priority: 9, offlineRecommended: true },
      { id: 'cn-e6', text: 'Where is the nearest hospital?', category: 'emergency', priority: 9 },
    ],
  },

  // ─── South Korea ──────────────────────────────────────────
  {
    id: 'korea',
    name: 'South Korea',
    languageCodes: ['ko'],
    countryCode: 'KR',
    flag: '🇰🇷',
    tagline: 'Travel Korea like a local',
    categories: koreaCategories,
    phrases: [
      // Transport
      { id: 'kr-t1', text: 'Please take me to this address', category: 'transport', priority: 10, offlineRecommended: true },
      { id: 'kr-t2', text: 'Where is the subway station?', category: 'transport', priority: 9 },
      { id: 'kr-t3', text: 'How much is the fare?', category: 'transport', priority: 7 },
      { id: 'kr-t4', text: 'Please stop here', category: 'transport', priority: 8, offlineRecommended: true },
      { id: 'kr-t5', text: 'Which exit should I take?', category: 'transport', priority: 7, note: 'Korean subway exits are numbered' },
      { id: 'kr-t6', text: 'Where can I get a T-money card?', category: 'transport', priority: 6, note: 'Korean transit card — works on bus, subway, taxi' },
      // Hotel
      { id: 'kr-h1', text: 'I have a reservation', category: 'hotel', priority: 10, offlineRecommended: true },
      { id: 'kr-h2', text: 'What is the Wi-Fi password?', category: 'hotel', priority: 8 },
      { id: 'kr-h3', text: 'What time is checkout?', category: 'hotel', priority: 7 },
      { id: 'kr-h4', text: 'Can I have extra blankets?', category: 'hotel', priority: 5 },
      // Food
      { id: 'kr-f1', text: 'Table for two please', category: 'food', priority: 9 },
      { id: 'kr-f2', text: 'Not spicy please', category: 'food', priority: 9, offlineRecommended: true },
      { id: 'kr-f3', text: 'What do you recommend?', category: 'food', priority: 7 },
      { id: 'kr-f4', text: 'The bill please', category: 'food', priority: 9 },
      { id: 'kr-f5', text: 'Can I have more side dishes?', category: 'food', priority: 6, note: 'Side dishes (banchan) are free refills in Korea' },
      { id: 'kr-f6', text: 'Is this vegetarian?', category: 'food', priority: 6 },
      { id: 'kr-f7', text: 'One soju and one beer please', category: 'food', priority: 5 },
      // Shopping & Beauty
      { id: 'kr-s1', text: 'How much is this?', category: 'shopping', priority: 9 },
      { id: 'kr-s2', text: 'Can I try this on?', category: 'shopping', priority: 7 },
      { id: 'kr-s3', text: 'Do you have a smaller size?', category: 'shopping', priority: 6 },
      { id: 'kr-s4', text: 'Can I get a tax refund?', category: 'shopping', priority: 7, note: 'Tax-free shopping is common for tourists' },
      { id: 'kr-s5', text: 'I am looking for skincare products', category: 'shopping', priority: 6, note: 'K-beauty is a major tourist attraction' },
      { id: 'kr-s6', text: 'Where is the nearest pharmacy?', category: 'shopping', priority: 7 },
      // Directions
      { id: 'kr-d1', text: 'Where is the bathroom?', category: 'directions', priority: 10, offlineRecommended: true },
      { id: 'kr-d2', text: 'Where is the exit?', category: 'directions', priority: 8 },
      { id: 'kr-d3', text: 'Can you show me on the map?', category: 'directions', priority: 7 },
      // Polite
      { id: 'kr-po1', text: 'Excuse me', category: 'polite', priority: 9 },
      { id: 'kr-po2', text: 'Thank you very much', category: 'polite', priority: 8 },
      { id: 'kr-po3', text: 'Please speak slowly', category: 'polite', priority: 9, offlineRecommended: true },
      { id: 'kr-po4', text: 'I do not understand', category: 'polite', priority: 8, offlineRecommended: true },
      // Emergency
      { id: 'kr-e1', text: 'I need help', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'kr-e2', text: 'Please call an ambulance', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'kr-e3', text: 'Please call the police', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'kr-e4', text: 'I need a doctor', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'kr-e5', text: 'I lost my passport', category: 'emergency', priority: 9, offlineRecommended: true },
    ],
  },

  // ─── France ───────────────────────────────────────────────
  {
    id: 'france',
    name: 'France',
    languageCodes: ['fr'],
    countryCode: 'FR',
    flag: '🇫🇷',
    tagline: 'Navigate France with ease',
    categories: franceCategories,
    phrases: [
      // Hotel
      { id: 'fr-h1', text: 'I have a reservation', category: 'hotel', priority: 10, offlineRecommended: true },
      { id: 'fr-h2', text: 'What time is checkout?', category: 'hotel', priority: 7 },
      { id: 'fr-h3', text: 'Can I store my luggage?', category: 'hotel', priority: 6 },
      { id: 'fr-h4', text: 'What is the Wi-Fi password?', category: 'hotel', priority: 8 },
      // Food
      { id: 'fr-f1', text: 'A table for two please', category: 'food', priority: 9 },
      { id: 'fr-f2', text: 'The menu please', category: 'food', priority: 9 },
      { id: 'fr-f3', text: 'The bill please', category: 'food', priority: 9 },
      { id: 'fr-f4', text: 'A coffee please', category: 'food', priority: 8 },
      { id: 'fr-f5', text: 'A glass of water please', category: 'food', priority: 7 },
      { id: 'fr-f6', text: 'What do you recommend?', category: 'food', priority: 7 },
      { id: 'fr-f7', text: 'I am vegetarian', category: 'food', priority: 6 },
      { id: 'fr-f8', text: 'I am allergic to gluten', category: 'food', priority: 7, offlineRecommended: true },
      { id: 'fr-f9', text: 'No peanuts please', category: 'food', priority: 7, offlineRecommended: true },
      // Transport
      { id: 'fr-t1', text: 'One ticket please', category: 'transport', priority: 9 },
      { id: 'fr-t2', text: 'Which line goes to…?', category: 'transport', priority: 8 },
      { id: 'fr-t3', text: 'Where is the metro station?', category: 'transport', priority: 9 },
      { id: 'fr-t4', text: 'Is this the right platform?', category: 'transport', priority: 7 },
      { id: 'fr-t5', text: 'Please take me to this address', category: 'transport', priority: 10, offlineRecommended: true },
      // Shopping
      { id: 'fr-s1', text: 'How much is this?', category: 'shopping', priority: 9 },
      { id: 'fr-s2', text: 'Do you have this in another size?', category: 'shopping', priority: 6 },
      { id: 'fr-s3', text: 'I am just looking, thank you', category: 'shopping', priority: 7 },
      { id: 'fr-s4', text: 'Where is the fitting room?', category: 'shopping', priority: 5 },
      // Directions
      { id: 'fr-d1', text: 'Where is the bathroom?', category: 'directions', priority: 10, offlineRecommended: true },
      { id: 'fr-d2', text: 'Where is the exit?', category: 'directions', priority: 8 },
      { id: 'fr-d3', text: 'Is it far from here?', category: 'directions', priority: 6 },
      { id: 'fr-d4', text: 'Can you show me on the map?', category: 'directions', priority: 7 },
      // Payment
      { id: 'fr-p1', text: 'Can I pay by card?', category: 'payment', priority: 9, offlineRecommended: true },
      { id: 'fr-p2', text: 'Can I have a receipt?', category: 'payment', priority: 6 },
      { id: 'fr-p3', text: 'Where is the nearest ATM?', category: 'payment', priority: 7 },
      // Pharmacy
      { id: 'fr-ph1', text: 'I need something for a headache', category: 'pharmacy', priority: 8 },
      { id: 'fr-ph2', text: 'I need something for a cold', category: 'pharmacy', priority: 7 },
      { id: 'fr-ph3', text: 'I need sunscreen', category: 'pharmacy', priority: 5 },
      { id: 'fr-ph4', text: 'I have a stomachache', category: 'pharmacy', priority: 7 },
      // Emergency
      { id: 'fr-e1', text: 'I need help', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'fr-e2', text: 'Please call an ambulance', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'fr-e3', text: 'Please call the police', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'fr-e4', text: 'I lost my passport', category: 'emergency', priority: 9, offlineRecommended: true },
      { id: 'fr-e5', text: 'I need a doctor', category: 'emergency', priority: 10, offlineRecommended: true },
    ],
  },

  // ─── Arabic-speaking ──────────────────────────────────────
  {
    id: 'arabic',
    name: 'Arabic Destinations',
    languageCodes: ['ar'],
    countryCode: 'AE',
    flag: '🇦🇪',
    tagline: 'Travel confidently in Arabic-speaking countries',
    categories: arabicCategories,
    phrases: [
      // Hotel
      { id: 'ar-h1', text: 'I have a reservation', category: 'hotel', priority: 10, offlineRecommended: true },
      { id: 'ar-h2', text: 'What time is checkout?', category: 'hotel', priority: 7 },
      { id: 'ar-h3', text: 'What is the Wi-Fi password?', category: 'hotel', priority: 8 },
      { id: 'ar-h4', text: 'Can I have a late checkout?', category: 'hotel', priority: 6 },
      // Transport
      { id: 'ar-t1', text: 'Please take me to this address', category: 'transport', priority: 10, offlineRecommended: true },
      { id: 'ar-t2', text: 'How much to get there?', category: 'transport', priority: 9 },
      { id: 'ar-t3', text: 'Please stop here', category: 'transport', priority: 8, offlineRecommended: true },
      { id: 'ar-t4', text: 'Please wait here for me', category: 'transport', priority: 6 },
      { id: 'ar-t5', text: 'That is too expensive', category: 'transport', priority: 7 },
      // Food
      { id: 'ar-f1', text: 'The menu please', category: 'food', priority: 9 },
      { id: 'ar-f2', text: 'The bill please', category: 'food', priority: 9 },
      { id: 'ar-f3', text: 'What do you recommend?', category: 'food', priority: 7 },
      { id: 'ar-f4', text: 'Water please', category: 'food', priority: 7 },
      { id: 'ar-f5', text: 'I am vegetarian', category: 'food', priority: 6 },
      { id: 'ar-f6', text: 'Is this halal?', category: 'food', priority: 5 },
      // Shopping
      { id: 'ar-s1', text: 'How much is this?', category: 'shopping', priority: 9 },
      { id: 'ar-s2', text: 'Can I get a discount?', category: 'shopping', priority: 7 },
      { id: 'ar-s3', text: 'Do you accept credit card?', category: 'shopping', priority: 8, offlineRecommended: true },
      { id: 'ar-s4', text: 'Where is the nearest ATM?', category: 'shopping', priority: 6 },
      // Directions
      { id: 'ar-d1', text: 'Where is the bathroom?', category: 'directions', priority: 10, offlineRecommended: true },
      { id: 'ar-d2', text: 'Where is the exit?', category: 'directions', priority: 8 },
      { id: 'ar-d3', text: 'Can you show me on the map?', category: 'directions', priority: 7 },
      { id: 'ar-d4', text: 'Is it far from here?', category: 'directions', priority: 6 },
      // Polite
      { id: 'ar-po1', text: 'Thank you very much', category: 'polite', priority: 8 },
      { id: 'ar-po2', text: 'Please speak slowly', category: 'polite', priority: 9, offlineRecommended: true },
      { id: 'ar-po3', text: 'I do not understand', category: 'polite', priority: 9, offlineRecommended: true },
      { id: 'ar-po4', text: 'Excuse me', category: 'polite', priority: 8 },
      // Emergency
      { id: 'ar-e1', text: 'I need help', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'ar-e2', text: 'Please call an ambulance', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'ar-e3', text: 'Please call the police', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'ar-e4', text: 'I need a doctor', category: 'emergency', priority: 10, offlineRecommended: true },
      { id: 'ar-e5', text: 'I lost my passport', category: 'emergency', priority: 9, offlineRecommended: true },
      // Medical
      { id: 'ar-m1', text: 'I am allergic to this', category: 'medical', priority: 10, offlineRecommended: true },
      { id: 'ar-m2', text: 'I have a headache', category: 'medical', priority: 7 },
      { id: 'ar-m3', text: 'I have a stomachache', category: 'medical', priority: 7 },
      { id: 'ar-m4', text: 'Where is the pharmacy?', category: 'medical', priority: 8 },
      { id: 'ar-m5', text: 'I need my medication', category: 'medical', priority: 8, offlineRecommended: true },
    ],
  },
];
