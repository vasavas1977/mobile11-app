export type Duration = "few-days" | "week" | "couple-weeks" | "month";
export type DataTier = "light" | "moderate" | "heavy" | "unlimited";

export const DURATION_DAYS: Record<Duration, [number, number]> = {
  "few-days": [1, 3],
  "week": [5, 8],
  "couple-weeks": [12, 16],
  "month": [28, 365],
};

export const DATA_GB: Record<DataTier, [number, number] | "unlimited"> = {
  light: [0.5, 1.5],
  moderate: [3, 5],
  heavy: [10, 20],
  unlimited: "unlimited",
};

export interface EsimPackageRow {
  id: string;
  name: string;
  country_code: string;
  country_name: string;
  price: number;
  validity_days: number;
  data_amount: string;
  package_type: string | null;
  qos_speed: string | null;
  carrier: string | null;
  network_type: string | null;
  sim_type: string | null;
  daily_reset_amount: string | null;
  support_data: boolean | null;
  support_sms: boolean | null;
  support_voice: boolean | null;
  hot_spot: boolean | null;
  speed_after_limit: string | null;
}

function parseDataGb(dataAmount: string): number | "unlimited" {
  const lower = dataAmount.toLowerCase();
  if (lower.includes("unlimited") || lower.includes("unlimit")) {
    return "unlimited";
  }
  // Try to extract numeric GB value
  const match = lower.match(/([\d.]+)\s*(gb|g)/i);
  if (match) return parseFloat(match[1]);
  // Try MB
  const mbMatch = lower.match(/([\d.]+)\s*(mb|m)/i);
  if (mbMatch) return parseFloat(mbMatch[1]) / 1024;
  return 0;
}

export function recommendPackage(
  packages: EsimPackageRow[],
  countryCode: string,
  duration: Duration,
  dataTier: DataTier
): EsimPackageRow | null {
  // Filter by country
  const countryPackages = packages.filter(
    (p) => p.country_code.toUpperCase() === countryCode.toUpperCase()
  );

  if (countryPackages.length === 0) return null;

  const [minDays, maxDays] = DURATION_DAYS[duration];
  const dataRange = DATA_GB[dataTier];

  // Filter by validity days
  let candidates = countryPackages.filter(
    (p) => p.validity_days >= minDays && p.validity_days <= maxDays
  );

  // Filter by data amount
  if (dataRange === "unlimited") {
    candidates = candidates.filter(
      (p) => parseDataGb(p.data_amount) === "unlimited"
    );
  } else {
    const [minGb, maxGb] = dataRange;
    candidates = candidates.filter((p) => {
      const gb = parseDataGb(p.data_amount);
      if (gb === "unlimited") return true; // Unlimited always qualifies
      return gb >= minGb && gb <= maxGb;
    });
  }

  // Pick cheapest from candidates
  if (candidates.length > 0) {
    return candidates.sort((a, b) => a.price - b.price)[0];
  }

  // Widen by ±2 days
  const widenedCandidates = countryPackages.filter(
    (p) =>
      p.validity_days >= minDays - 2 && p.validity_days <= maxDays + 2
  );

  if (dataRange === "unlimited") {
    const unlimitedWidened = widenedCandidates.filter(
      (p) => parseDataGb(p.data_amount) === "unlimited"
    );
    if (unlimitedWidened.length > 0) {
      return unlimitedWidened.sort((a, b) => a.price - b.price)[0];
    }
  } else {
    const [minGb, maxGb] = dataRange;
    const dataWidened = widenedCandidates.filter((p) => {
      const gb = parseDataGb(p.data_amount);
      if (gb === "unlimited") return true;
      return gb >= minGb - 1 && gb <= maxGb + 2;
    });
    if (dataWidened.length > 0) {
      return dataWidened.sort((a, b) => a.price - b.price)[0];
    }
  }

  // Final fallback: cheapest package for the country
  return countryPackages.sort((a, b) => a.price - b.price)[0];
}
