import { useLanguage } from '@/contexts/LanguageContext';

interface FlowProgressProps {
  currentStep: number;
  totalSteps: number;
  flowName: string;
}

export function FlowProgress({ currentStep, totalSteps, flowName }: FlowProgressProps) {
  const { t } = useLanguage();
  
  const stepText = (t('flowProgress.step') as string)
    .replace('{current}', String(currentStep))
    .replace('{total}', String(totalSteps));

  return (
    <div className="px-4 py-2 bg-background/50 border-b border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{stepText}</span>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
