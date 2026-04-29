import { cn } from '@/lib/utils';
import { Star, Info } from 'lucide-react';
import { getCarrierRatingDescription } from '@/lib/carrierRatings';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CarrierStarRatingProps {
  rating: number;  // 1-5
  maxRating?: number;  // Default 5
  size?: 'sm' | 'md';
  showText?: boolean;
  carrierName?: string;
}

export function CarrierStarRating({
  rating,
  maxRating = 5,
  size = 'sm',
  showText = true,
  carrierName,
}: CarrierStarRatingProps) {
  const { language, localizeField } = useLanguage();
  const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  // Clamp rating between 1 and maxRating
  const clampedRating = Math.max(1, Math.min(rating, maxRating));
  
  const description = getCarrierRatingDescription(clampedRating);
  const title = localizeField(description, 'title');
  const langSuffix = language.charAt(0).toUpperCase() + language.slice(1);
  const points: string[] = description[`points${langSuffix}` as keyof typeof description] as string[] || description.pointsEn;
  const icon = description.icon;
  const borderColor = clampedRating >= 5 ? 'border-yellow-500/30' : clampedRating >= 4 ? 'border-blue-500/30' : 'border-gray-400/30';
  const titleColor = clampedRating >= 5 ? 'text-yellow-700' : clampedRating >= 4 ? 'text-blue-700' : 'text-gray-700';
  const checkColor = clampedRating >= 5 ? 'text-yellow-600' : clampedRating >= 4 ? 'text-blue-600' : 'text-gray-600';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex focus:outline-none focus:ring-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 bg-yellow-50/60 hover:bg-yellow-100/80 border border-dashed border-yellow-300/50 rounded-full px-2 py-0.5 transition-colors cursor-help">
            <div className="flex items-center">
              {Array.from({ length: maxRating }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    starSize,
                    i < clampedRating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            {showText && (
              <span className={cn(textSize, 'text-gray-500 font-medium')}>
                {clampedRating}/{maxRating}
              </span>
            )}
            <Info className="h-3 w-3 text-gray-400 ml-0.5" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="center"
        className={`w-72 p-4 bg-white border ${borderColor} shadow-lg text-gray-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center gap-2 font-semibold ${titleColor} mb-3`}>
          <span className="text-base">{icon}</span>
          <span className="text-sm">{title}</span>
        </div>
        <ul className="space-y-2">
          {points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-900">
              <span className={`${checkColor} mt-0.5 flex-shrink-0`}>✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
