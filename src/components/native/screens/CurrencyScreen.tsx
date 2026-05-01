import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
];

export function CurrencyScreen() {
  const navigate = useNavigate();
  const { currency, setCurrency } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return CURRENCIES;
    const q = searchQuery.toLowerCase();
    return CURRENCIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.symbol.includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (code: string) => {
    setCurrency(code as any);
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
          <h1 className="text-lg font-bold text-[#1A1A1A]">Currency</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search currency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white rounded-xl border-0 shadow-sm text-[14px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
          />
        </div>
      </div>

      {/* Currency List */}
      <div className="px-4 pt-3 pb-8 space-y-2">
        {filtered.map((curr) => {
          const isSelected = currency === curr.code;
          return (
            <button
              key={curr.code}
              onClick={() => handleSelect(curr.code)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] ${
                isSelected
                  ? "bg-white ring-1 ring-[#F97316] shadow-sm"
                  : "bg-white shadow-sm"
              }`}
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
                <span className="text-[14px] font-semibold text-[#1A1A1A]">
                  {curr.symbol}
                </span>
              </div>
              <span className="flex-1 text-left text-[15px] font-medium text-[#1A1A1A]">
                {curr.name} ({curr.code})
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
