/**
 * Script-detection heuristic to identify echoed source text
 * that Gemini outputs without a [SRC] marker.
 */

const SCRIPT_RANGES: Record<string, RegExp> = {
  thai: /[\u0E00-\u0E7F]/g,
  cjk: /[\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF]/g,
  korean: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g,
  arabic: /[\u0600-\u06FF\u0750-\u077F]/g,
  hebrew: /[\u0590-\u05FF]/g,
  devanagari: /[\u0900-\u097F]/g,
  bengali: /[\u0980-\u09FF]/g,
  cyrillic: /[\u0400-\u04FF]/g,
  latin: /[a-zA-ZÀ-ÖØ-öø-ÿĀ-žḀ-ỿ]/g,
};

// Map BCP-47 speech codes (prefix) to their expected script
const CODE_TO_SCRIPT: Record<string, string> = {
  th: 'thai',
  ja: 'cjk',
  zh: 'cjk',
  ko: 'korean',
  ar: 'arabic',
  he: 'hebrew',
  hi: 'devanagari',
  bn: 'bengali',
  ru: 'cyrillic',
  uk: 'cyrillic',
  en: 'latin',
  es: 'latin',
  fr: 'latin',
  de: 'latin',
  it: 'latin',
  pt: 'latin',
  nl: 'latin',
  sv: 'latin',
  da: 'latin',
  no: 'latin',
  fi: 'latin',
  pl: 'latin',
  cs: 'latin',
  tr: 'latin',
  vi: 'latin',
  id: 'latin',
  ms: 'latin',
  tl: 'latin',
  ro: 'latin',
  hu: 'latin',
  el: 'latin', // Greek uses its own script but we keep it simple
};

function getScript(langCode: string): string | null {
  const prefix = langCode.split('-')[0].toLowerCase();
  return CODE_TO_SCRIPT[prefix] ?? null;
}

function countMatches(text: string, regex: RegExp): number {
  regex.lastIndex = 0;
  return (text.match(regex) || []).length;
}

/**
 * Returns true if `text` appears to be in the SOURCE language's script
 * rather than the target language's script â€” i.e. it's an echo.
 *
 * Only works when source and target use different scripts.
 * Returns false (safe default) when scripts are the same or unknown.
 */
export function isLikelySourceScript(
  text: string,
  sourceCode: string,
  targetCode: string,
): boolean {
  const srcScript = getScript(sourceCode);
  const tgtScript = getScript(targetCode);

  // Can't distinguish same-script pairs (e.g. enâ†’fr)
  if (!srcScript || !tgtScript || srcScript === tgtScript) return false;

  const srcRegex = SCRIPT_RANGES[srcScript];
  const tgtRegex = SCRIPT_RANGES[tgtScript];
  if (!srcRegex || !tgtRegex) return false;

  const srcCount = countMatches(text, srcRegex);
  const tgtCount = countMatches(text, tgtRegex);

  // If text has source-script chars and no/few target-script chars, it's an echo
  return srcCount > 2 && tgtCount === 0;
}

/**
 * Conservatively strip short isolated runs of target-script characters
 * from source-language transcript. If the text is mostly target-script,
 * returns unchanged (likely a legitimate transcription).
 */
/**
 * Given text and two language codes, determine which of the two
 * languages the text is written in based on script analysis.
 *
 * Returns 'langA', 'langB', or 'unknown' (for same-script pairs).
 */
export function detectSpokenLanguage(
  text: string,
  langACode: string,
  langBCode: string,
): 'langA' | 'langB' | 'unknown' {
  const scriptA = getScript(langACode);
  const scriptB = getScript(langBCode);

  if (!scriptA || !scriptB || scriptA === scriptB) return 'unknown';

  const regexA = SCRIPT_RANGES[scriptA];
  const regexB = SCRIPT_RANGES[scriptB];
  if (!regexA || !regexB) return 'unknown';

  const countA = countMatches(text, regexA);
  const countB = countMatches(text, regexB);

  if (countA === 0 && countB === 0) return 'unknown';
  if (countA > countB) return 'langA';
  if (countB > countA) return 'langB';
  return 'unknown';
}

/**
 * Returns true if the text contains characters from a script that is
 * NOT one of the allowed languages. Used to detect Gemini language drift
 * (e.g. unexpected Korean/Japanese text in an ENâ†”TH session).
 *
 * Latin punctuation, digits, whitespace and emoji are always allowed.
 */
export function containsForeignScript(
  text: string,
  allowedCodes: string[],
): boolean {
  const allowedScripts = new Set(
    allowedCodes.map(getScript).filter((s): s is string => !!s),
  );
  if (allowedScripts.size === 0) return false;

  // Check each non-allowed script: if any of its chars appear in text, it's foreign.
  // Exception: Latin characters are universal loanwords (brand names like "7-Eleven",
  // "iPhone", "Wi-Fi", numbers, acronyms) and appear in nearly every language's
  // spoken transcripts. Skipping Latin here prevents false-positive drops in
  // non-Latin sessions (e.g. THâ†”JA). Real foreign-Latin-language drift
  // (e.g. a German sentence in a THâ†”JA session) is still caught downstream by
  // the stopword-frequency check in `isDisallowedLanguage`.
  for (const [scriptName, regex] of Object.entries(SCRIPT_RANGES)) {
    if (allowedScripts.has(scriptName)) continue;
    if (scriptName === 'latin') continue;
    if (countMatches(text, regex) > 0) return true;
  }
  return false;
}

// Stopword sets for Latin-script language detection. Small, high-frequency words.
const LATIN_STOPWORDS: Record<string, Set<string>> = {
  en: new Set(['the','is','are','you','we','can','could','move','sure','hello','good','morning','afternoon','evening','to','and','it','i','a','of','in','on','for','do','does','have','has','what','when','where','why','how','please','thanks','thank','yes','no','ok','okay','at','this','that','with','my','your','they','them']),
  de: new Set(['ist','mir','sieh','super','fein','ich','bin','ja','nein','das','der','die','und','nicht','sie','wir','aber','mit','auf','wie','was','wo','wann','warum','bitte','danke','noch','schon','ein','eine','einen','dass','sich','von','zu','im','am']),
  fr: new Set(['vous','je','suis','avec','bien','oui','non','le','la','les','est','et','ne','pas','un','une','des','du','au','aux','que','qui','quoi','quand','comment','pourquoi','merci','bonjour','bonsoir','de','dans','sur','pour','mais','ou','si','ce','cette','ces','mon','ma','mes','votre','nous']),
  es: new Set(['el','la','los','las','es','son','soy','y','no','si','sĂ­','que','quĂ©','cĂ³mo','cuĂ¡ndo','dĂ³nde','por','para','con','sin','de','en','un','una','unos','unas','hola','gracias','buenos','dĂ­as','tardes','noches','muy','bien','mal','pero','tambiĂ©n','cuando','donde']),
  it: new Set(['il','la','i','le','Ă¨','sono','sei','e','non','sĂ¬','che','cosa','come','quando','dove','perchĂ©','grazie','prego','ciao','buongiorno','buonasera','molto','bene','male','ma','anche','con','per','di','in','un','una','uno']),
  pt: new Set(['o','a','os','as','Ă©','sĂ£o','sou','e','nĂ£o','sim','que','o','quĂª','como','quando','onde','por','para','com','sem','de','em','um','uma','uns','umas','olĂ¡','obrigado','obrigada','bom','dia','tarde','noite','muito','bem','mas','tambĂ©m']),
  nl: new Set(['de','het','een','is','zijn','ben','en','niet','ja','nee','dat','die','wat','hoe','wanneer','waar','waarom','dank','hallo','goede','morgen','middag','avond','met','voor','van','op','in','aan','maar','ook']),
};

/**
 * Detect which Latin-script language a piece of text is most likely written in,
 * using small stopword frequency hits. Returns 'unknown' when no clear winner.
 *
 * `bias` (e.g. ['en']) breaks ties / boosts ambiguous short utterances toward
 * languages that are expected in the current session.
 */
export function detectLatinLanguage(
  text: string,
  bias: string[] = [],
): string {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return 'unknown';

  const scores: Record<string, number> = {};
  for (const [lang, set] of Object.entries(LATIN_STOPWORDS)) {
    let hits = 0;
    for (const t of tokens) if (set.has(t)) hits++;
    scores[lang] = hits;
  }

  // Apply bias: small bonus so ambiguous text leans toward expected langs
  for (const b of bias) {
    const prefix = b.split('-')[0].toLowerCase();
    if (scores[prefix] !== undefined) scores[prefix] += 0.5;
  }

  let best = 'unknown';
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = lang; }
  }
  // Need at least one real hit to commit (bias alone isn't enough)
  // For very short utterances (< 3 tokens) require a stronger signal
  const minScore = tokens.length < 3 ? 1 : 1;
  if (bestScore < minScore) return 'unknown';
  return best;
}

/**
 * Given text and a set of allowed BCP-47 codes, returns true if the text
 * appears to be in a language NOT in the allowed set. Catches BOTH foreign
 * scripts (Korean in ENâ†”TH session) AND foreign Latin languages (German in
 * ENâ†”TH session).
 *
 * Returns false when the language can't be confidently determined.
 */
export function isDisallowedLanguage(
  text: string,
  allowedCodes: string[],
): { disallowed: boolean; detected: string } {
  // First check: foreign script (non-Latin)
  if (containsForeignScript(text, allowedCodes)) {
    return { disallowed: true, detected: 'foreign-script' };
  }

  // Determine if any allowed code is Latin-script
  const allowedPrefixes = allowedCodes.map(c => c.split('-')[0].toLowerCase());
  const allowedScripts = new Set(
    allowedCodes.map(getScript).filter((s): s is string => !!s),
  );

  // If the text has Latin chars and at least one allowed lang is Latin, run stopword detection
  if (allowedScripts.has('latin')) {
    const latinChars = countMatches(text, SCRIPT_RANGES.latin);
    if (latinChars >= 6) {
      const detected = detectLatinLanguage(text, allowedPrefixes);
      if (detected !== 'unknown' && !allowedPrefixes.includes(detected)) {
        return { disallowed: true, detected };
      }
    }
  }

  return { disallowed: false, detected: 'allowed' };
}

export function filterToSourceScript(
  text: string,
  sourceCode: string,
  targetCode: string,
): string {
  const srcScript = getScript(sourceCode);
  const tgtScript = getScript(targetCode);

  if (!srcScript || !tgtScript || srcScript === tgtScript) return text;

  const srcRegex = SCRIPT_RANGES[srcScript];
  const tgtRegex = SCRIPT_RANGES[tgtScript];
  if (!srcRegex || !tgtRegex) return text;

  const srcMatches = text.match(new RegExp(srcRegex.source, 'gu')) || [];
  const tgtMatches = text.match(new RegExp(tgtRegex.source, 'gu')) || [];

  // If mostly target-script, return unchanged â€” likely legitimate
  if (tgtMatches.length > srcMatches.length) return text;

  // Strip short isolated runs of target-script chars (noise from auto-detect)
  const cleaned = text
    .replace(new RegExp(`(?<!\\p{L})${tgtRegex.source}{1,12}(?!\\p{L})`, 'gu'), ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}
