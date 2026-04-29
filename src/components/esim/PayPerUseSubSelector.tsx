import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Zap, RefreshCw, ArrowLeft, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PayPerUseSubSelectorProps {
  onSelectFixedData: () => void;
  onSelectBestValue: () => void;
  onBack: () => void;
  hasMaxSpeed: boolean;
  hasDayPass: boolean;
}

export function PayPerUseSubSelector({
  onSelectFixedData,
  onSelectBestValue,
  onBack,
  hasMaxSpeed,
  hasDayPass,
}: PayPerUseSubSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('payPerUseType.back')}
      </Button>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {t('payPerUseType.title')}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Fixed Data Option (Max Speed) */}
        {hasMaxSpeed && (
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200 border-2 hover:border-orange-500 hover:shadow-lg",
              "bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100"
            )}
            onClick={onSelectFixedData}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('payPerUseType.fixedData.title')}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {t('payPerUseType.fixedData.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Best Value Option (Day Pass) */}
        {hasDayPass && (
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200 border-2 hover:border-blue-500 hover:shadow-lg relative",
              "bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100"
            )}
            onClick={onSelectBestValue}
          >
            {/* Recommended Badge */}
            <Badge 
              className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white border-0 flex items-center gap-1"
            >
              <Star className="h-3 w-3 fill-current" />
              {t('payPerUseType.bestValue.badge')}
            </Badge>
            
            <CardContent className="p-4 sm:p-6 pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
                  <RefreshCw className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('payPerUseType.bestValue.title')}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {t('payPerUseType.bestValue.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
