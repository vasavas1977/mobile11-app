import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-[#6B7280] mt-0.5">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
