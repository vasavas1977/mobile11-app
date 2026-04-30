import { useState, useMemo } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag } from "@/lib/countryFlags";
import { DestinationIllustration } from "../illustrations/DestinationIllustration";

interface Step1Props {
  onSelect: (countryCode: string, countryName: string) => void;
  selected: string | null;
}

export function Step1Destination({ onSelect, selected }: Step1Props) {
  const [query, setQuery] = useState("");

  const { data: countries = [] } = useQuery({
    queryKey: ["guided-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esim_packages")
        .select("country_code, country_name")
        .eq("is_active", true);

      if (error) throw error;

      // Distinct countries
      const map = new Map<string, string>();
      for (const row of data || []) {
        if (!map.has(row.country_code)) {
          map.set(row.country_code, row.country_name);
        }
      }

      return Array.from(map.entries())
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 10 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return countries.slice(0, 15);
    const q = query.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countries, query]);

  return (
    <div className="flex flex-col h-full">
      {/* Illustration */}
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28">
          <DestinationIllustration />
        </div>
      </div>

      <h3 className="text-lg font-bold text-[#1A1A1A] text-center mb-1">
        Where are you going?
      </h3>
      <p className="text-[13px] text-[#6B6B6B] text-center mb-4">
        Select your travel destination
      </p>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Search country..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-gray-50 rounded-xl border-0 text-[14px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
        />
      </div>

      {/* Country List */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1.5">
        {filtered.map((country) => {
          const isSelected = selected === country.code;
          return (
            <button
              key={country.code}
              onClick={() => onSelect(country.code, country.name)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all active:scale-[0.98] ${
                isSelected
                  ? "bg-[#F97316]/5 ring-1 ring-[#F97316]"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <span className="text-[22px] leading-none">
                {getCountryFlag(country.code)}
              </span>
              <span className="flex-1 text-left text-[14px] font-medium text-[#1A1A1A]">
                {country.name}
              </span>
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
