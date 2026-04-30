/**
 * Domain-specific corrections and cleaning for voice transcription.
 * Handles Gemini STT artifacts, filler words, wrong-script pollution,
 * and domain term normalization.
 */

// ─── Domain term corrections ───
const CORRECTIONS: [RegExp, string][] = [
  [/\be[-\s]?10\b/gi, 'eSIM'],
  [/\be[-\s]?sim\b/gi, 'eSIM'],
  [/\bee[-\s]?sim\b/gi, 'eSIM'],
  [/\bmobile\s*11\b/gi, 'Mobile11'],
];

export function correctTranscription(text: string): string {
  let result = text;
  for (const [pattern, replacement] of CORRECTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ─── Spurious space merging ───
/**
 * Merge spurious single-character fragments that Gemini's raw
 * inputAudioTranscription produces (e.g. "w eather" → "weather").
 *
 * IMPORTANT: This must NOT merge legitimate adjacent words.
 * Previous over-greedy regex collapsed "No problem" → "Noproblem",
 * "be fine" → "befine", "a few" → "afew", "of your" → "ofyour".
 *
 * We only merge when the LEFT side is a single letter (clearly a
 * stranded artifact) AND the right side starts lowercase (continuation
 * of the same word). Two-letter prefixes are too ambiguous in English
 * ("No problem", "be fine", "of your", "as well", "is fine"...).
 */
export function cleanSpuriousSpaces(text: string): string {
  // Only merge: single stranded letter + lowercase continuation.
  // e.g. "w eather" → "weather", but NOT "No problem" → "Noproblem".
  return text.replace(/\b([a-zA-Z]) ([a-z]{2,})/g, (m, a, b) => {
    // Skip common English single-letter words ("a", "I").
    if (a === 'a' || a === 'A' || a === 'I') return m;
    return a + b;
  });
}

// ─── Filler / noise removal ───
// Common speech fillers across languages that add no meaning
const FILLER_EN = /\b(uh+|um+|hmm+|er+|ah+|oh+|like,?\s|you know,?\s|i mean,?\s|so,?\s(?=so)|well,?\s(?=well))\b/gi;
const FILLER_TH = /(?:เอ่อ|อืม|อ้า|เอ้อ|แบบว่า|คือว่า|ก็คือ|อะ(?:\s|$)){1,}/g;

/**
 * Remove common speech fillers. Only removes isolated fillers,
 * not words that happen to contain these sequences.
 */
export function removeFiller(text: string): string {
  return text
    .replace(FILLER_EN, ' ')
    .replace(FILLER_TH, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Wrong-script fragment removal ───
const THAI_RANGE = /[\u0E00-\u0E7F]/;
const LATIN_RANGE = /[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/;
const CJK_RANGE = /[\u4E00-\u9FFF\u3040-\u30FF]/;
const KOREAN_RANGE = /[\uAC00-\uD7AF]/;
const ARABIC_RANGE = /[\u0600-\u06FF]/;
const CYRILLIC_RANGE = /[\u0400-\u04FF]/;

interface ScriptProfile {
  primary: RegExp;
  allowed: RegExp[];
}

const SCRIPT_PROFILES: Record<string, ScriptProfile> = {
  th: { primary: THAI_RANGE, allowed: [LATIN_RANGE] }, // Thai + English loanwords OK
  en: { primary: LATIN_RANGE, allowed: [] },
  ja: { primary: CJK_RANGE, allowed: [LATIN_RANGE] },
  ko: { primary: KOREAN_RANGE, allowed: [LATIN_RANGE] },
  zh: { primary: CJK_RANGE, allowed: [LATIN_RANGE] },
  ar: { primary: ARABIC_RANGE, allowed: [LATIN_RANGE] },
  ru: { primary: CYRILLIC_RANGE, allowed: [LATIN_RANGE] },
};

/**
 * Remove fragments in unexpected scripts when the source language is known.
 * For Thai source: keep Thai + Latin (English loanwords common in Thai speech).
 * For English source: strip stray Thai/CJK/Arabic characters.
 * 
 * Returns cleaned text. If most of the text would be stripped, returns original
 * (safety: don't destroy a valid but unexpected transcript).
 */
export function removeWrongScriptFragments(text: string, sourceLangCode: string): string {
  const code = sourceLangCode.split('-')[0].toLowerCase();
  const profile = SCRIPT_PROFILES[code];
  if (!profile) return text; // Unknown language, don't filter

  const allowedScripts = [profile.primary, ...profile.allowed];
  
  // Count characters belonging to allowed vs disallowed scripts
  let allowedCount = 0;
  let disallowedCount = 0;
  
  for (const char of text) {
    if (/[\s\d\p{P}\p{S}]/u.test(char)) continue; // Skip whitespace, digits, punctuation
    const isAllowed = allowedScripts.some(r => r.test(char));
    if (isAllowed) allowedCount++;
    else disallowedCount++;
  }

  // If disallowed chars are < 20% of meaningful chars, strip them
  // If more, the transcript might genuinely be in another language — keep it
  if (disallowedCount === 0) return text;
  if (allowedCount === 0) return text; // All "wrong" script — don't destroy
  if (disallowedCount / (allowedCount + disallowedCount) > 0.3) return text;

  // Strip isolated wrong-script fragments (1-15 chars surrounded by spaces/boundaries)
  // Build a regex that matches any char NOT in allowed scripts
  const cleaned = text.replace(/\S+/g, (word) => {
    // Check if the word contains any allowed-script characters
    const hasAllowed = allowedScripts.some(r => {
      for (const ch of word) {
        if (r.test(ch)) return true;
      }
      return false;
    });
    // If word has no allowed chars and is short, it's noise
    if (!hasAllowed && word.length <= 15) return '';
    return word;
  });

  return cleaned.replace(/\s{2,}/g, ' ').trim() || text;
}

// ─── Thai-English normalization ───
/**
 * Normalize common Thai-English transcription artifacts:
 * - Stray tone marks without base consonants
 * - Repeated Thai characters (stuttering artifacts)
 * - Mixed Thai-Latin within single tokens that are clearly broken
 */
export function normalizeThaiEnglish(text: string): string {
  let result = text;
  // Remove orphan Thai tone marks (should always follow a consonant)
  result = result.replace(/(?<![ก-ฮ])[่้๊๋]/g, '');
  // Remove triple+ repeated Thai chars (stutter artifacts)
  result = result.replace(/([\u0E01-\u0E3A\u0E40-\u0E4E])\1{2,}/g, '$1$1');
  // Collapse repeated spaces
  result = result.replace(/\s{2,}/g, ' ');
  return result.trim();
}

// ─── Unified cleaning pipeline ───
/**
 * Full transcript cleaning pipeline. Apply to user-facing text.
 * Keeps raw text internally (caller should store raw before calling this).
 * 
 * @param text - Raw transcript text
 * @param sourceLangCode - BCP-47 source language code (e.g. 'th', 'en-US')
 * @param options - Optional flags to control pipeline stages
 */
export function cleanTranscript(
  text: string,
  sourceLangCode: string,
  options: {
    removeFiller?: boolean;
    removeWrongScript?: boolean;
    normalizeThaiEn?: boolean;
  } = {},
): string {
  const {
    removeFiller: doRemoveFiller = true,
    removeWrongScript: doRemoveWrongScript = true,
    normalizeThaiEn: doNormalizeThaiEn = true,
  } = options;

  let result = text;

  // 1. Merge spurious spaces (Gemini artifact)
  result = cleanSpuriousSpaces(result);

  // 2. Domain corrections (eSIM, Mobile11, etc.)
  result = correctTranscription(result);

  // 3. Thai-English specific normalization
  const code = sourceLangCode.split('-')[0].toLowerCase();
  if (doNormalizeThaiEn && (code === 'th' || code === 'en')) {
    result = normalizeThaiEnglish(result);
  }

  // 4. Remove wrong-script fragments
  if (doRemoveWrongScript) {
    result = removeWrongScriptFragments(result, sourceLangCode);
  }

  // 5. Remove filler words
  if (doRemoveFiller) {
    result = removeFiller(result);
  }

  // 6. Final whitespace cleanup
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result || text; // Never return empty — fall back to original
}

// ─── [SRC] marker parsing ───
/**
 * Parse [SRC] marker from output transcript text.
 * Returns { srcText, remainingOutput } if found, or null.
 */
export function parseSrcMarker(text: string): { srcText: string; remainingOutput: string } | null {
  const match = text.match(/\[SRC\]\s*(.+?)(?:\n|$)([\s\S]*)/);
  if (!match) return null;
  return {
    srcText: match[1].trim(),
    remainingOutput: match[2]?.trim() || '',
  };
}

// ─── Assistant-side cleaner (lighter, separate noise profile) ───
/**
 * Clean Gemini's outputAudioTranscription text.
 *
 * This is a transcription of the bot's own TTS output, not user STT — the
 * noise profile is different. Main artifact: spurious whitespace inside Thai
 * runs ("น้อง มีนา" → "น้องมีนา", "สนใจ ซื้อ" → "สนใจซื้อ").
 *
 * Deliberately does NOT run the user-STT pipeline (corrections, filler
 * removal, wrong-script stripping) because the bot's output is already
 * clean text we don't want mutated — especially brand tokens (Mobile11,
 * eSIM, package names) and URLs.
 *
 * Operations:
 *  1. Collapse whitespace between two adjacent Thai characters.
 *  2. Collapse runs of 2+ spaces to one (preserves Thai↔Latin boundaries).
 *  3. Trim.
 */
export function cleanAssistantTranscript(text: string): string {
  if (!text) return text;
  let result = text;
  // Repeat the Thai-merge until stable — handles "น้อง  มี นา" type runs
  // where multiple gaps need collapsing in sequence.
  for (let i = 0; i < 3; i++) {
    const next = result.replace(/(\p{Script=Thai})\s+(\p{Script=Thai})/gu, '$1$2');
    if (next === result) break;
    result = next;
  }
  // Normalize multi-space runs but preserve single spaces between scripts.
  result = result.replace(/[ \t]{2,}/g, ' ');
  return result.trim() || text;
}
