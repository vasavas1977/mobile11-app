/**
 * Parse a raw network_type string from the database and return the best clean badge.
 * Examples:
 *   "3G / 4G(LTE)" -> "4G"
 *   "4G/5G"        -> "5G"
 *   "3G / 4G / 5G" -> "5G"
 *   "4G"           -> "4G"
 *   "LTE"          -> "4G"
 */
export function parseBestNetwork(rawNetworkType?: string | null): '4G' | '5G' {
  if (!rawNetworkType) return '4G';
  const upper = rawNetworkType.toUpperCase();
  if (upper.includes('5G')) return '5G';
  return '4G';
}

/**
 * Given an array of packages, derive the best network type from their network_type fields.
 */
export function getBestNetworkFromPackages(
  packages: Array<{ network_type?: string | null }>
): '4G' | '5G' {
  for (const pkg of packages) {
    if (parseBestNetwork(pkg.network_type) === '5G') return '5G';
  }
  return '4G';
}
