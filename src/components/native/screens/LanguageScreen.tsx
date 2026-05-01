import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FlagCircle } from "../flags";

// Language → ISO country mapping for circle flags
const LANGUAGE_FLAG_MAP: Record<string, string> = {
  en: "us",
  th: "th",
  ja: "jp",
  ko: "kr",
  fr: "fr",
  de: "de",
  zh: "cn",
  es: "es",
  pt: "br",
  ar: "sa",
};

const LANGUAGES = [
  { code: "en", nativeName: "English", iso: "us" },
  { code: "th", nativeName: "ไทย", iso: "th" },
  { code: "ja", nativeName: "日本語", iso: "jp" },
  { code: "ko", nativeName: "한국어", iso: "kr" },
  { code: "fr", nativeName: "Français", iso: "fr" },
  { code: "de", nativeName: "Deutsch", iso: "de" },
  { code: "zh", nativeName: "中文", iso: "cn" },
  { code: "es", nativeName: "Español", iso: "es" },
  { code: "pt", nativeName: "Português", iso: "br" },
  { code: "ar", nativeName: "العربية", iso: "sa" },
];

export function LanguageScreen() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return LANGUAGES;
    const q = searchQuery.toLowerCase();
    return LANGUAGES.filter(
      (l) =>
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (code: string) => {
    setLanguage(code as any);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FAF7F2] px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </button>
          <h1 className="text-lg font-bold text-[#1A1A1A]">Language</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white rounded-xl border-0 shadow-sm text-[14px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
          />
        </div>
      </div>

      {/* Language List */}
      <div className="px-4 pt-3 pb-8 space-y-2">
        {filtered.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] ${
                isSelected
                  ? "bg-white ring-1 ring-[#F97316] shadow-sm"
                  : "bg-white shadow-sm"
              }`}
            >
              <FlagCircle iso={lang.iso} size="md" />
              <span className="flex-1 text-left text-[15px] font-medium text-[#1A1A1A]">
                {lang.nativeName}
              </span>
              {isSelected && (
                <Check className="w-5 h-5 text-[#F97316]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
