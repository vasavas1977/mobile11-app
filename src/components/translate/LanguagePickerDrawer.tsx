import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { TranslateLanguage, SUPPORTED_LANGUAGES, POPULAR_LANGUAGE_CODES } from '@/types/translate';
import { FlagIcon } from '@/components/ui/FlagIcon';

interface LanguagePickerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (lang: TranslateLanguage) => void;
  currentCode?: string;
  title?: string;
}

export function LanguagePickerDrawer({ open, onClose, onSelect, currentCode, title = 'Select Language' }: LanguagePickerDrawerProps) {
  const [search, setSearch] = useState('');

  const popular = useMemo(() =>
    SUPPORTED_LANGUAGES.filter(l => POPULAR_LANGUAGE_CODES.includes(l.code)),
  []);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q) || l.code.includes(q)
    );
  }, [search]);

  const handleSelect = (lang: TranslateLanguage) => {
    onSelect(lang);
    onClose();
    setSearch('');
  };

  const renderLang = (lang: TranslateLanguage) => (
    <button
      key={lang.code}
      onClick={() => handleSelect(lang)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        lang.code === currentCode ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'
      }`}
    >
      <FlagIcon countryCode={lang.countryCode} size="md" />
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-foreground">{lang.nativeName}</p>
        <p className="text-xs text-muted-foreground">{lang.name}</p>
      </div>
      {lang.code === currentCode && (
        <span className="text-xs text-orange-600 font-medium">Selected</span>
      )}
    </button>
  );

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle>{title}</DrawerTitle>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search language..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 max-h-[60vh]">
          {filtered ? (
            <div className="space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No languages found</p>
              ) : (
                filtered.map(renderLang)
              )}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Popular</p>
                <div className="space-y-0.5">{popular.map(renderLang)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">All Languages</p>
                <div className="space-y-0.5">{SUPPORTED_LANGUAGES.map(renderLang)}</div>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
