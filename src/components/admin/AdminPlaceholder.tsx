import { Construction } from "lucide-react";

interface AdminPlaceholderProps {
  title: string;
  description?: string;
}

export function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-5 max-w-md p-8">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
          <Construction className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">{title}</h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            {description || "This feature is coming soon. We're building something great."}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          In Development
        </div>
      </div>
    </div>
  );
}
