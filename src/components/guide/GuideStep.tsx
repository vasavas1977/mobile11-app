import { Smartphone } from 'lucide-react';

interface GuideStepProps {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  imagePlaceholder?: string;
  totalSteps: number;
}

export function GuideStep({
  stepNumber,
  title,
  description,
  imageUrl,
  imagePlaceholder,
  totalSteps,
}: GuideStepProps) {
  return (
    <div className="bg-card rounded-xl p-6 lg:p-8 border border-border">
      {/* Step header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {stepNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            Step {stepNumber} of {totalSteps}
          </span>
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Phone screenshot */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-xs">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Step ${stepNumber}: ${title}`}
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          ) : (
            <div className="aspect-[9/16] bg-muted rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-border">
              <Smartphone className="w-12 h-12 text-muted-foreground mb-3" />
              <span className="text-sm text-muted-foreground text-center px-4">
                {imagePlaceholder || 'Screenshot'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
