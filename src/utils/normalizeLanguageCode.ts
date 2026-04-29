/**
 * Normalize BCP-47 language codes to short form for consistent lookups.
 * Strips region suffixes that are non-semantic (en-US → en, th-TH → th).
 * Preserves region when it carries meaning (zh-Hant, zh-Hans, pt-BR, pt-PT).
 */

const SEMANTIC_REGIONS = new Set(['zh-Hant', 'zh-Hans', 'pt-BR', 'pt-PT']);

export function normalizeLanguageCode(code: string): string {
  if (!code) return code;
  if (SEMANTIC_REGIONS.has(code)) return code;
  return code.split('-')[0].toLowerCase();
}
