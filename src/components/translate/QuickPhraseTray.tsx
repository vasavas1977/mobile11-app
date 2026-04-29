import { useMemo } from 'react';
import { X } from 'lucide-react';
import { QUICK_PHRASES } from '@/types/translate';

interface QuickPhraseTrayProps {
  open: boolean;
  onClose: () => void;
  onSelect: (text: string) => void;
}

export function QuickPhraseTray({ open, onClose, onSelect }: QuickPhraseTrayProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof QUICK_PHRASES>();
    QUICK_PHRASES.forEach(p => {
      const arr = map.get(p.category) || [];
      arr.push(p);
      map.set(p.category, arr);
    });
    return map;
  }, []);

  if (!open) return null;

  return (
    <div className="absolute bottom-[100px] left-0 right-0 mx-4 bg-white rounded-2xl border border-gray-200 shadow-xl max-h-[50vh] overflow-y-auto z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
        <h3 className="text-sm font-semibold text-foreground">Quick Phrases</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {Array.from(grouped.entries()).map(([category, phrases]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {phrases[0].categoryIcon} {category}
            </p>
            <div className="flex flex-wrap gap-2">
              {phrases.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.text); onClose(); }}
                  className="px-3 py-2 text-xs font-medium rounded-xl bg-gray-50 border border-gray-200 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
