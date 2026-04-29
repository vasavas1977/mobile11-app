import { Skeleton } from '@/components/ui/skeleton';

export function HelpCategorySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 md:p-8 text-center">
          <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function HelpArticleListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl">
          <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function HelpArticleContentSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-48 mt-6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function HelpPopularQuestionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 md:p-5 flex items-center justify-between">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
