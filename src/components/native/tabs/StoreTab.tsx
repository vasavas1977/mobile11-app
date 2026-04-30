import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCountryFlag } from "@/lib/countryFlags";
import { GuidedFlowSheet } from "../guided/GuidedFlowSheet";

interface CountryWithPrice {
  country_code: string;
  country_name: string;
  cheapest_price: number;
}

export function StoreTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuided, setShowGuided] = useState(false);
  const navigate = useNavigate();
  const { formatPrice } = useLanguage();

  // Fetch distinct countries with cheapest price
  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["native-popular-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esim_packages")
        .select("country_code, country_name, price")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;

      // Aggregate: distinct countries with cheapest price
      const map = new Map<string, CountryWithPrice>();
      for (const row of data || []) {
        if (!map.has(row.country_code)) {
          map.set(row.country_code, {
            country_code: row.country_code,
            country_name: row.country_name,
            cheapest_price: row.price,
          });
        }
      }

      // Sort by popular destinations first, then alphabetically
      const popularCodes = ["TH", "JP", "KR", "CN", "HK", "SG", "VN", "TW", "MY", "US", "AU", "GB", "FR", "DE", "IT"];
      const all = Array.from(map.values());
      const popular = popularCodes
        .map((code) => all.find((c) => c.country_code === code))
        .filter(Boolean) as CountryWithPrice[];
      const rest = all
        .filter((c) => !popularCodes.includes(c.country_code))
        .sort((a, b) => a.country_name.localeCompare(b.country_name));

      return [...popular, ...rest];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return countries.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.country_name.toLowerCase().includes(q) ||
        c.country_code.toLowerCase().includes(q)
    );
  }, [countries, searchQuery]);

  const handleCountryTap = (country: CountryWithPrice) => {
    const slug = country.country_name.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");
    navigate(`/esim/${slug}`);
  };

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
          Mobile11
        </h1>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Where do you need an eSIM?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white rounded-2xl border-0 shadow-sm text-[15px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
        />
      </div>

      {/* Section Title */}
      <h2 className="text-[15px] font-semibold text-[#1A1A1A] mb-3">
        {searchQuery ? "Search Results" : "Popular Destinations"}
      </h2>

      {/* Country List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-white rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#6B6B6B] text-sm">
            No destinations found for "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((country) => (
            <button
              key={country.country_code}
              onClick={() => handleCountryTap(country)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
            >
              <span className="text-[28px] leading-none">
                {getCountryFlag(country.country_code)}
              </span>
              <span className="flex-1 text-left text-[15px] font-medium text-[#1A1A1A]">
                {country.country_name}
              </span>
              <span className="text-[13px] text-[#6B6B6B]">
                from {formatPrice(country.cheapest_price)}
              </span>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            </button>
          ))}
        </div>
      )}

      {/* Floating "Help me choose" CTA */}
      <button
        onClick={() => setShowGuided(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-5 py-3 bg-[#F97316] text-white rounded-full shadow-lg shadow-orange-200 active:scale-95 transition-transform"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-[14px] font-semibold">Help me choose</span>
      </button>

      {/* Guided Flow Sheet */}
      {showGuided && (
        <GuidedFlowSheet onClose={() => setShowGuided(false)} />
      )}
    </div>
  );
}
