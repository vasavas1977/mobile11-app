import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useBestSellerPackages } from "@/hooks/useBestSellerPackages";
import { FlagRect } from "../flags";
import { Bell, Search, Globe, ChevronRight } from "lucide-react";
import { PromoCarousel } from "../store/PromoCarousel";
import { SearchSheet } from "../store/SearchSheet";

type TabId = "popular" | "countries" | "multi-country";

interface DestinationRow {
  id: string;
  name: string;
  country_code: string;
  subtitle?: string;
  price: number;
  isMultiCountry: boolean;
  countryCount?: number;
  packageId?: string;
}

export function StoreTab() {
  const [activeTab, setActiveTab] = useState<TabId>("popular");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { formatPrice, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Fetch user profile for greeting
  const { data: profile } = useQuery({
    queryKey: ["native-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, email")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch loyalty balance
  const { data: loyalty } = useQuery({
    queryKey: ["native-loyalty", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("user_loyalty")
        .select("mobile11_money_balance")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Best sellers
  const { data: bestSellers = [], isLoading: loadingBestSellers } =
    useBestSellerPackages(language);

  // All active packages for Countries + Multi-country tabs
  const { data: allPackages = [], isLoading: loadingAll } = useQuery({
    queryKey: ["native-all-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esim_packages")
        .select(
          "id, country_code, country_name, price, package_type, included_countries, data_amount, validity_days, name"
        )
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Derived: Countries tab (single-country, A-Z, min price)
  const countriesList = useMemo((): DestinationRow[] => {
    const map = new Map<string, { name: string; code: string; minPrice: number }>();
    for (const pkg of allPackages) {
      const isMulti =
        pkg.package_type === "regional" ||
        pkg.package_type === "global" ||
        (Array.isArray(pkg.included_countries) && (pkg.included_countries as string[]).length > 1);
      if (isMulti) continue;
      const key = pkg.country_code;
      const existing = map.get(key);
      if (!existing || pkg.price < existing.minPrice) {
        map.set(key, {
          name: pkg.country_name,
          code: pkg.country_code,
          minPrice: existing ? Math.min(existing.minPrice, pkg.price) : pkg.price,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        id: c.code,
        name: c.name,
        country_code: c.code,
        price: c.minPrice,
        isMultiCountry: false,
      }));
  }, [allPackages]);

  // Derived: Multi-country tab (regional + global, sorted by country count asc)
  const multiCountryList = useMemo((): DestinationRow[] => {
    const map = new Map<
      string,
      { name: string; code: string; minPrice: number; countryCount: number }
    >();
    for (const pkg of allPackages) {
      const included = Array.isArray(pkg.included_countries)
        ? (pkg.included_countries as string[])
        : [];
      const isMulti =
        pkg.package_type === "regional" ||
        pkg.package_type === "global" ||
        included.length > 1;
      if (!isMulti) continue;
      const key = pkg.country_name || pkg.name;
      const existing = map.get(key);
      const count = included.length || 1;
      if (!existing || pkg.price < existing.minPrice) {
        map.set(key, {
          name: key,
          code: pkg.country_code || "MULTI",
          minPrice: existing ? Math.min(existing.minPrice, pkg.price) : pkg.price,
          countryCount: existing ? Math.max(existing.countryCount, count) : count,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.countryCount - b.countryCount || a.name.localeCompare(b.name))
      .map((m) => ({
        id: m.code + "-" + m.name,
        name: m.name,
        country_code: m.code,
        subtitle: `${m.countryCount} countries`,
        price: m.minPrice,
        isMultiCountry: true,
        countryCount: m.countryCount,
      }));
  }, [allPackages]);

  // Derived: Popular tab (best sellers)
  const popularList = useMemo((): DestinationRow[] => {
    return bestSellers.map((pkg) => ({
      id: pkg.id,
      name: pkg.country_name,
      country_code: pkg.country_code,
      subtitle: `${pkg.data_amount} · ${pkg.validity_days} days`,
      price: pkg.price,
      isMultiCountry:
        pkg.package_type === "regional" || pkg.package_type === "global",
      packageId: pkg.id,
    }));
  }, [bestSellers]);

  // Current list based on active tab
  const currentList = useMemo(() => {
    switch (activeTab) {
      case "popular":
        return popularList;
      case "countries":
        return countriesList;
      case "multi-country":
        return multiCountryList;
    }
  }, [activeTab, popularList, countriesList, multiCountryList]);

  const isLoading = activeTab === "popular" ? loadingBestSellers : loadingAll;

  // Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    const scrollTop = scrollRef.current?.scrollTop || 0;
    if (diff > 80 && scrollTop <= 0) {
      setRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: ["native-all-packages"] });
      await queryClient.invalidateQueries({ queryKey: ["best-seller-packages"] });
      await queryClient.invalidateQueries({ queryKey: ["native-loyalty"] });
      setRefreshing(false);
    }
  };

  // Greeting
  const firstName = profile?.first_name || profile?.email?.split("@")[0] || "";
  const balance = loyalty?.mobile11_money_balance || 0;

  // Row tap handler
  const handleRowTap = (row: DestinationRow) => {
    if (row.packageId) {
      navigate(`/create-order/${row.packageId}`);
    } else {
      const slug = row.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/\//g, "-");
      navigate(`/esim/${slug}`);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "popular", label: "Popular" },
    { id: "countries", label: "Countries" },
    { id: "multi-country", label: "Multi-country" },
  ];

  return (
    <div
      ref={scrollRef}
      className="h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="px-4 pt-4">
        {/* Header: Greeting + Balance + Bell (logged in) */}
        {user && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[12px] text-[#6B6B6B]">Welcome back</p>
              <h1 className="text-[20px] font-semibold text-[#1A1A1A] tracking-tight">
                Hi {firstName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Balance pill */}
              <button
                onClick={() => navigate("/app/profile")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-[#F3F3F3]"
              >
                <span className="text-[13px]">💰</span>
                <span className="text-[13px] font-semibold text-[#1A1A1A]">
                  {formatPrice(balance)}
                </span>
              </button>
              {/* Notification bell */}
              <button
                onClick={() => navigate("/app/profile")}
                className="w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-sm border border-[#F3F3F3]"
              >
                <Bell className="w-[18px] h-[18px] text-[#6B6B6B]" />
              </button>
            </div>
          </div>
        )}

        {/* Anonymous header */}
        {!user && (
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[20px] font-bold text-[#1A1A1A] tracking-tight">
              Mobile11
            </h1>
          </div>
        )}

        {/* Search bar (tap to open sheet) */}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 h-12 pl-4 pr-4 bg-white rounded-2xl shadow-sm mb-5"
        >
          <Search className="w-[18px] h-[18px] text-[#9CA3AF]" />
          <span className="text-[15px] text-[#9CA3AF]">
            Where do you need an eSIM?
          </span>
        </button>

        {/* Promo Carousel */}
        <PromoCarousel />

        {/* Tab strip */}
        <div className="flex gap-0 border-b border-[#E5E5E5] mt-5 mb-4 sticky top-0 bg-[#FAF7F2] z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 pb-2.5 text-[14px] font-medium transition-colors relative ${
                activeTab === tab.id ? "text-[#1A1A1A]" : "text-[#6B6B6B]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F97316] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Destination list */}
        {isLoading ? (
          <div className="space-y-2.5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-[56px] bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#6B6B6B] text-sm">No destinations found</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {currentList.map((row) => (
              <button
                key={row.id}
                onClick={() => handleRowTap(row)}
                className="w-full flex items-center gap-3.5 px-4 py-3 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
              >
                {/* Flag or Globe */}
                {row.isMultiCountry ? (
                  <div className="w-[28px] h-[21px] flex items-center justify-center bg-[#F3F3F3] rounded-sm">
                    <Globe className="w-4 h-4 text-[#6B6B6B]" />
                  </div>
                ) : (
                  <FlagRect iso={row.country_code.toLowerCase()} size="md" />
                )}
                {/* Name + subtitle */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[15px] font-medium text-[#1A1A1A] truncate">
                    {row.name}
                  </p>
                  {row.subtitle && (
                    <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                      {row.subtitle}
                    </p>
                  )}
                </div>
                {/* Price */}
                <span className="text-[14px] font-bold text-[#1A1A1A] whitespace-nowrap">
                  {activeTab === "popular"
                    ? formatPrice(row.price)
                    : `from ${formatPrice(row.price)}`}
                </span>
                <ChevronRight className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Sheet */}
      {showSearch && <SearchSheet onClose={() => setShowSearch(false)} />}
    </div>
  );
}
