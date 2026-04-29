import { Search, X } from 'lucide-react';

interface LanguageSearchInputProps {
  value: string;
  onChange: (val: string) => void;
}

export function LanguageSearchInput({ value, onChange }: LanguageSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search languages…"
        autoFocus
        className="w-full pl-10 pr-10 py-3 text-sm rounded-2xl border border-gray-200/80 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-orange-200/60 focus:border-orange-300 placeholder:text-muted-foreground/50 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200/60 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
