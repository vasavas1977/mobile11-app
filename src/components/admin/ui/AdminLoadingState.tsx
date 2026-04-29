import { Loader2 } from 'lucide-react';

interface AdminLoadingStateProps {
  message?: string;
  rows?: number;
}

export function AdminLoadingState({ message = 'Loading...' }: AdminLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <Loader2 className="h-6 w-6 animate-spin text-orange-500 mb-3" />
      <p className="text-xs text-[#9CA3AF] font-medium">{message}</p>
    </div>
  );
}

export function AdminLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Skeleton KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[#FAF7F2] animate-pulse" />
        ))}
      </div>
      {/* Skeleton table rows */}
      <div className="rounded-xl border border-[#F3F0EB] overflow-hidden bg-white">
        <div className="h-10 bg-[#FAFAF8] border-b border-[#F3F0EB]" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 border-b border-[#F3F0EB] last:border-0 flex items-center px-4 gap-4">
            <div className="h-3 w-20 rounded bg-[#F3F0EB] animate-pulse" />
            <div className="h-3 w-32 rounded bg-[#F3F0EB] animate-pulse hidden md:block" />
            <div className="h-3 w-16 rounded bg-[#F3F0EB] animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-[#F3F0EB] animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
