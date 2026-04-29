import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
}

interface VerticalStepNavProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  title: string;
}

export function VerticalStepNav({ steps, currentStep, onStepClick, title }: VerticalStepNavProps) {
  return (
    <div className="bg-card rounded-xl p-4 lg:p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">{title}</h3>
      
      <div className="flex flex-col">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-stretch">
              {/* Vertical line and dot */}
              <div className="flex flex-col items-center mr-3 w-4">
                {/* Top line */}
                <div 
                  className={cn(
                    "w-0.5 flex-1 min-h-2",
                    isFirst ? "bg-transparent" : isCompleted || isActive ? "bg-primary" : "bg-border"
                  )} 
                />
                {/* Dot */}
                <div 
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0 transition-colors",
                    isActive 
                      ? "bg-primary ring-4 ring-primary/20" 
                      : isCompleted 
                        ? "bg-primary" 
                        : "bg-border"
                  )} 
                />
                {/* Bottom line */}
                <div 
                  className={cn(
                    "w-0.5 flex-1 min-h-2",
                    isLast ? "bg-transparent" : isCompleted ? "bg-primary" : "bg-border"
                  )} 
                />
              </div>

              {/* Step label button */}
              <button
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex-1 text-left py-2 px-3 rounded-lg text-sm transition-all",
                  "hover:bg-muted/50",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : isCompleted 
                      ? "text-foreground" 
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
