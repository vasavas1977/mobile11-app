/**
 * Travel scenario shortcuts — map real traveler intentions to the best mode + phrase category.
 */

export type ScenarioMode = 'phrases' | 'show' | 'type' | 'conversation';

export interface TravelScenario {
  id: string;
  label: string;
  icon: string;
  /** Default mode to open */
  defaultMode: ScenarioMode;
  /** Phrase category IDs to pre-filter (first = primary) */
  categoryIds: string[];
  /** Base priority (lower = first). Destination overrides can adjust. */
  basePriority: number;
  /** If true, render with urgency styling */
  isUrgent?: boolean;
}

export const TRAVEL_SCENARIOS: TravelScenario[] = [
  {
    id: 'address',
    label: 'Show Address',
    icon: '📍',
    defaultMode: 'show',
    categoryIds: ['taxi', 'directions'],
    basePriority: 0,
  },
  {
    id: 'taxi',
    label: 'Taxi',
    icon: '🚕',
    defaultMode: 'phrases',
    categoryIds: ['taxi', 'directions', 'payment'],
    basePriority: 1,
  },
  {
    id: 'hotel',
    label: 'Hotel',
    icon: '🏨',
    defaultMode: 'phrases',
    categoryIds: ['hotel', 'payment'],
    basePriority: 2,
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: '🍽️',
    defaultMode: 'phrases',
    categoryIds: ['food', 'payment'],
    basePriority: 3,
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
    defaultMode: 'phrases',
    categoryIds: ['shopping', 'payment'],
    basePriority: 4,
  },
  {
    id: 'airport',
    label: 'Airport',
    icon: '✈️',
    defaultMode: 'phrases',
    categoryIds: ['airport', 'immigration', 'directions'],
    basePriority: 5,
  },
  {
    id: 'directions',
    label: 'Directions',
    icon: '🗺️',
    defaultMode: 'show',
    categoryIds: ['directions'],
    basePriority: 6,
  },
  {
    id: 'medical',
    label: 'Medical',
    icon: '🏥',
    defaultMode: 'phrases',
    categoryIds: ['medical', 'emergency'],
    basePriority: 7,
    isUrgent: true,
  },
  {
    id: 'emergency',
    label: 'Emergency',
    icon: '🆘',
    defaultMode: 'phrases',
    categoryIds: ['emergency', 'medical'],
    basePriority: 8,
    isUrgent: true,
  },
];

/**
 * Destination-aware scenario ordering overrides.
 * Keys = language code. Values = ordered scenario IDs (first = most important).
 */
const DESTINATION_SCENARIO_ORDER: Record<string, string[]> = {
  ja: ['address', 'taxi', 'restaurant', 'hotel', 'airport', 'shopping', 'directions', 'medical', 'emergency'],
  zh: ['address', 'taxi', 'hotel', 'restaurant', 'shopping', 'airport', 'directions', 'emergency', 'medical'],
  ko: ['restaurant', 'shopping', 'hotel', 'address', 'taxi', 'directions', 'airport', 'medical', 'emergency'],
  fr: ['restaurant', 'hotel', 'directions', 'address', 'shopping', 'taxi', 'airport', 'medical', 'emergency'],
  ar: ['address', 'taxi', 'hotel', 'shopping', 'restaurant', 'directions', 'airport', 'emergency', 'medical'],
  th: ['address', 'taxi', 'restaurant', 'hotel', 'shopping', 'directions', 'airport', 'medical', 'emergency'],
  de: ['directions', 'hotel', 'restaurant', 'address', 'shopping', 'taxi', 'airport', 'medical', 'emergency'],
  it: ['restaurant', 'hotel', 'directions', 'address', 'shopping', 'taxi', 'airport', 'medical', 'emergency'],
  es: ['restaurant', 'taxi', 'address', 'hotel', 'shopping', 'directions', 'airport', 'medical', 'emergency'],
  vi: ['address', 'taxi', 'restaurant', 'shopping', 'hotel', 'directions', 'airport', 'medical', 'emergency'],
  pt: ['restaurant', 'taxi', 'address', 'hotel', 'directions', 'shopping', 'airport', 'medical', 'emergency'],
};

/** Mode override per destination — some scenarios work better in a different mode depending on locale */
const DESTINATION_MODE_OVERRIDES: Record<string, Partial<Record<string, ScenarioMode>>> = {
  zh: { taxi: 'show', directions: 'show' },
  ar: { taxi: 'show', directions: 'show' },
  ja: { directions: 'show' },
};

/**
 * Get scenarios sorted by destination relevance.
 */
export function getSortedScenarios(langCode?: string): TravelScenario[] {
  const order = langCode ? DESTINATION_SCENARIO_ORDER[langCode] : undefined;
  if (!order) {
    return [...TRAVEL_SCENARIOS].sort((a, b) => a.basePriority - b.basePriority);
  }
  return [...TRAVEL_SCENARIOS].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

/**
 * Get the best mode for a scenario, optionally adjusted for destination.
 */
export function getScenarioMode(scenarioId: string, langCode?: string): ScenarioMode {
  const overrides = langCode ? DESTINATION_MODE_OVERRIDES[langCode] : undefined;
  if (overrides?.[scenarioId]) return overrides[scenarioId]!;
  const scenario = TRAVEL_SCENARIOS.find(s => s.id === scenarioId);
  return scenario?.defaultMode || 'phrases';
}

/**
 * Build the navigation route + state for a scenario shortcut tap.
 */
export function getScenarioNavigation(scenarioId: string, langCode?: string): {
  path: string;
  state: Record<string, unknown>;
} {
  const scenario = TRAVEL_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return { path: '/translate2/phrases', state: {} };

  const mode = getScenarioMode(scenarioId, langCode);
  const primaryCategory = scenario.categoryIds[0];

  // Special-case: address handoff has its own dedicated screen
  if (scenarioId === 'address') {
    return { path: '/translate2/address', state: {} };
  }

  switch (mode) {
    case 'show':
      return {
        path: '/translate2/show',
        state: { scenario: scenarioId, category: primaryCategory },
      };
    case 'type':
      return {
        path: '/translate2/type',
        state: { scenario: scenarioId },
      };
    case 'conversation':
      return {
        path: '/translate2/conversation',
        state: { scenario: scenarioId },
      };
    case 'phrases':
    default:
      return {
        path: '/translate2/phrases',
        state: { category: primaryCategory, scenario: scenarioId },
      };
  }
}
