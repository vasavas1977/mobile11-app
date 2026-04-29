import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Sparkles } from 'lucide-react';

interface PackageBadgesProps {
  isPopular?: boolean;
  isBestValue?: boolean;
  isFeatured?: boolean;
}

export function PackageBadges({ isPopular, isBestValue, isFeatured }: PackageBadgesProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {isFeatured && (
        <Badge className="bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0 rounded-full text-[10px] md:text-xs px-1.5 py-0.5">
          <Sparkles className="h-3 w-3 mr-1" />
          Featured
        </Badge>
      )}
      {isPopular && (
        <Badge className="bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0 rounded-full text-[10px] md:text-xs px-1.5 py-0.5">
          <Zap className="h-3 w-3 mr-1" />
          Popular
        </Badge>
      )}
      {isBestValue && (
        <Badge className="bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0 rounded-full text-[10px] md:text-xs px-1.5 py-0.5">
          <TrendingUp className="h-3 w-3 mr-1" />
          Best Value
        </Badge>
      )}
    </div>
  );
}
