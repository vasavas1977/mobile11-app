import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { FlagRect } from "../flags";
import { Search, X, Clock, Globe, ChevronRight, Trash2 } from "lucide-react";

const RECENT_SEARCHES_KEY = "mobile11_recent_searches";
const MAX_RECENT = 8;

interface SearchResult {
  id: string;
  name: string;
  country_code: string;
  price: number;
  isMultiCountry: boolean;
  countryCount?: number;
}

interface RecentSearch {
  name: string;
  country_code: string;
  isMultiCountry: boolean;
}

function getRecentSearches(): RecentSearch[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(item: RecentSearch) {
  const current = getRecentSearches();
  const filtered = current.filter((s) => s.name !== item.name);
  const updated = [item, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

interface SearchSheetProps {
  onClose: () => void;
}

export function SearchSheet({ onClose }: SearchSheetProps) {
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<RecentSearch[]>(getRecentSearches());
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { formatPrice } = useLanguage();

  // Autofocus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Fetch all destinations for search
  const { data: allDestinations = [] } = useQuery({
    queryKey: ["search-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esim_packages")
        .select("country_code, country_name, price, package_type, included_countries, name")
        .eq("is_active", true);
      if (error) throw error;

      // Build unique destinations with min price
      const countryMap = new Map<string, SearchResult>();
      const multiMap = new Map<string, SearchResult>();

      for (const pkg of data || []) {
        const included = Array.isArray(pkg.included_countries)
          ? (pkg.included_countries as string[])
          : [];
        const isMulti =
          pkg.package_type === "regional" ||
          pkg.package_type === "global" ||
          included.length > 1;

        if (isMulti) {
          const key = pkg.country_name || pkg.name;
          const existing = multiMap.get(key);
          if (!existing || pkg.price < existing.price) {
            multiMap.set(key, {
              id: key,
              name: key,
              country_code: pkg.country_code || "MULTI",
              price: existing ? Math.min(existing.price, pkg.price) : pkg.price,
              isMultiCountry: true,
              countryCount: included.length || 1,
            });
          }
        } else {
          const key = pkg.country_code;
          const existing = countryMap.get(key);
          if (!existing || pkg.price < existing.price) {
            countryMap.set(key, {
              id: key,
              name: pkg.country_name,
              country_code: pkg.country_code,
              price: existing ? Math.min(existing.price, pkg.price) : pkg.price,
              isMultiCountry: false,
            });
          }
        }
      }

      return [
        ...Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        ...Array.from(multiMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter results
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allDestinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.country_code.toLowerCase().includes(q)
    );
  }, [query, allDestinations]);

  const handleSelect = (item: SearchResult) => {
    addRecentSearch({
      name: item.name,
      country_code: item.country_code,
      isMultiCountry: item.isMultiCountry,
    });
    const slug = item.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/\//g, "-");
    navigate(`/esim/${slug}`);
    onClose();
  };

  const handleRecentTap = (recent: RecentSearch) => {
    const slug = recent.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/\//g, "-");
    navigate(`/esim/${slug}`);
    onClose();
  };

  const handleClearRecents = () => {
    clearRecentSearches();
    setRecents([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Where do you need an eSIM?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white rounded-2xl border-0 shadow-sm text-[15px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
          />
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-[#6B6B6B]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* No query → show recent searches */}
        {!query.trim() && recents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">
                Recent searches
              </h3>
              <button
                onClick={handleClearRecents}
                className="text-[12px] text-[#F97316] font-medium"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1.5">
              {recents.map((recent, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentTap(recent)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl active:bg-white/60 transition-colors"
                >
                  <Clock className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                  {recent.isMultiCountry ? (
                    <div className="w-[22px] h-[16px] flex items-center justify-center bg-[#F3F3F3] rounded-sm">
                      <Globe className="w-3 h-3 text-[#6B6B6B]" />
                    </div>
                  ) : (
                    <FlagRect iso={recent.country_code.toLowerCase()} size="sm" />
                  )}
                  <span className="text-[14px] text-[#1A1A1A]">
                    {recent.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No query, no recents */}
        {!query.trim() && recents.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-[#D4D4D4] mx-auto mb-3" />
            <p className="text-[14px] text-[#6B6B6B]">
              Search for a country or region
            </p>
          </div>
        )}

        {/* Filtered results */}
        {query.trim() && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-[#6B6B6B]">
              No destinations found for "{query}"
            </p>
          </div>
        )}

        {query.trim() && filtered.length > 0 && (
          <div className="space-y-1.5">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-3 py-3 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
              >
                {item.isMultiCountry ? (
                  <div className="w-[28px] h-[21px] flex items-center justify-center bg-[#F3F3F3] rounded-sm">
                    <Globe className="w-4 h-4 text-[#6B6B6B]" />
                  </div>
                ) : (
                  <FlagRect iso={item.country_code.toLowerCase()} size="md" />
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[15px] font-medium text-[#1A1A1A] truncate">
                    {item.name}
                  </p>
                  {item.isMultiCountry && item.countryCount && (
                    <p className="text-[12px] text-[#6B6B6B]">
                      {item.countryCount} countries
                    </p>
                  )}
                </div>
                <span className="text-[13px] font-bold text-[#1A1A1A] whitespace-nowrap">
                  from {formatPrice(item.price)}
                </span>
                <ChevronRight className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
