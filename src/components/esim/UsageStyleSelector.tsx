import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Infinity, Gauge } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UsageStyleSelectorProps {
  onSelectUnlimited: () => void;
  onSelectPayPerUse: () => void;
  onShowAdvanced: () => void;
  hasLimitless: boolean;
  hasPayPerUse: boolean;
}

export function UsageStyleSelector({
  onSelectUnlimited,
  onSelectPayPerUse,
  onShowAdvanced,
  hasLimitless,
  hasPayPerUse,
}: UsageStyleSelectorProps) {
  const { t } = useLanguage();

  // If only one option available, we shouldn't be showing this selector
  // But handle gracefully anyway
  const showBothOptions = hasLimitless && hasPayPerUse;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {t('usageStyle.title')}
        </h3>
      </div>

      <div className={cn(
        "grid gap-3",
        showBothOptions ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-sm mx-auto"
      )}>
        {/* Unlimited Option - Orange Theme */}
        {hasLimitless && (
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200",
              "bg-white border border-gray-100 rounded-xl shadow-sm",
              "hover:border-orange-400 hover:shadow-lg"
            )}
            onClick={onSelectUnlimited}
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                  <Infinity className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('usageStyle.unlimited.title')}
                  </h4>
                  <p className="text-sm font-medium text-orange-500">
                    {t('usageStyle.unlimited.subtitle')}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  {t('usageStyle.unlimited.description')}
                </p>
                
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pay Per Use Option - Blue Theme */}
        {hasPayPerUse && (
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200",
              "bg-white border border-gray-100 rounded-xl shadow-sm",
              "hover:border-blue-400 hover:shadow-lg"
            )}
            onClick={onSelectPayPerUse}
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                  <Gauge className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('usageStyle.payPerUse.title')}
                  </h4>
                  <p className="text-sm font-medium text-blue-500">
                    {t('usageStyle.payPerUse.subtitle')}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  {t('usageStyle.payPerUse.description')}
                </p>
                
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Show All Options Link */}
      <div className="text-center pt-2">
        <Button
          variant="link"
          onClick={onShowAdvanced}
          className="text-sm text-gray-400 hover:text-orange-500"
        >
          {t('usageStyle.showAdvanced')}
        </Button>
      </div>
    </div>
  );
}
