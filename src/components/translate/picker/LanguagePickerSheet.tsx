import { useState, useMemo, useCallback } from 'react';
import { Globe, X } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { TranslateLanguage, SUPPORTED_LANGUAGES, POPULAR_LANGUAGE_CODES } from '@/types/translate';
import { LanguageSearchInput } from './LanguageSearchInput';
import { LanguageSection } from './LanguageSection';
import { LanguageListItem } from './LanguageListItem';

interface LanguagePickerSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (lang: TranslateLanguage) => void;
  currentCode?: string;
  title?: string;
  recentLanguages?: TranslateLanguage[];
}

const popularLangs = SUPPORTED_LANGUAGES.filter(l => POPULAR_LANGUAGE_CODES.includes(l.code));

export function LanguagePickerSheet({
  open,
  onClose,
  onSelect,
  currentCode,
  title = 'Select Language',
  recentLanguages = [],
}: LanguagePickerSheetProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase().trim();
    return SUPPORTED_LANGUAGES.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.includes(q)
    );
  }, [search]);

  const handleSelect = useCallback(
    (lang: TranslateLanguage) => {
      onSelect(lang);
      onClose();
      setSearch('');
    },
    [onSelect, onClose]
  );

  const handleOpenChange = useCallback(
    (o: boolean) => {
      if (!o) {
        onClose();
        setSearch('');
      }
    },
    [onClose]
  );

  // Deduplicate recents from popular to avoid showing same language twice
  const dedupedRecents = recentLanguages.filter(
    r => !POPULAR_LANGUAGE_CODES.includes(r.code) || !popularLangs.find(p => p.code === r.code)
  );

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[88vh] rounded-t-3xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <button
              onClick={() => { onClose(); setSearch(''); }}
              className="p-2.5 -mr-1 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <LanguageSearchInput value={search} onChange={setSearch} />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-8 max-h-[65vh] overscroll-contain">
          {filtered ? (
            // Search results
            filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No languages found</p>
                <p className="text-xs text-muted-foreground/60 max-w-[200px]">
                  Try searching by English or native name
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map(lang => (
                  <LanguageListItem
                    key={lang.code}
                    lang={lang}
                    isSelected={lang.code === currentCode}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )
          ) : (
            <>
              {dedupedRecents.length > 0 && (
                <LanguageSection
                  title="Recent"
                  languages={dedupedRecents}
                  selectedCode={currentCode}
                  onSelect={handleSelect}
                />
              )}
              <LanguageSection
                title="Popular"
                languages={popularLangs}
                selectedCode={currentCode}
                onSelect={handleSelect}
              />
              <LanguageSection
                title="All Languages"
                languages={SUPPORTED_LANGUAGES}
                selectedCode={currentCode}
                onSelect={handleSelect}
              />
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
