import { ReactNode } from 'react';

interface InstallationStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon?: ReactNode;
}

export function InstallationStep({ stepNumber, title, description, icon }: InstallationStepProps) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
        {stepNumber}
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2 mb-1">
          {icon && <span className="text-primary">{icon}</span>}
          <p className="font-semibold text-foreground">{title}</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
