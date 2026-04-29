import { Destination } from './popularDestinations';

export interface ABTestConfig {
  orderingStrategy?: 'default' | 'popularity' | 'revenue' | 'random';
  layout?: 'grid' | 'list' | 'carousel';
  itemsPerRow?: number;
  showFlags?: boolean;
  [key: string]: any;
}

/**
 * Apply A/B test ordering strategy to destinations
 */
export const applyOrderingStrategy = (
  destinations: Destination[],
  strategy?: 'default' | 'popularity' | 'revenue' | 'random'
): Destination[] => {
  if (!strategy || strategy === 'default') {
    return destinations;
  }

  const sorted = [...destinations];

  switch (strategy) {
    case 'popularity':
      // Assuming destinations are already ordered by popularity from backend
      return sorted;

    case 'revenue':
      // Sort by potential revenue (could be enhanced with actual revenue data)
      return sorted.sort((a, b) => {
        // Prioritize regional over single countries for revenue potential
        const aScore = a.filterType === 'regional' ? 2 : 1;
        const bScore = b.filterType === 'regional' ? 2 : 1;
        return bScore - aScore;
      });

    case 'random':
      // Fisher-Yates shuffle
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;

    default:
      return sorted;
  }
};

/**
 * Get grid class based on layout configuration
 */
export const getLayoutClasses = (config: ABTestConfig | null): string => {
  const itemsPerRow = config?.itemsPerRow || 4;
  
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  }[itemsPerRow] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return `grid ${gridCols} gap-3 md:gap-4 max-w-7xl mx-auto`;
};
