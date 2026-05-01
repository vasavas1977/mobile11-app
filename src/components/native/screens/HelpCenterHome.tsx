import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Info, Rocket, Smartphone, User, Wrench, Gift, ChevronRight, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHelpCategoryCounts, useSearchHelpArticles } from "@/hooks/useHelpArticles";
import { useDebounce } from "@/hooks/useDebounce";

const CATEGORIES = [
  { slug: "about-mobile11", icon: "info", name: { en: "About Mobile11", th: "เกี่ยวกับ Mobile11", ja: "Mobile11について" }, description: { en: "Learn about our company and mission", th: "เรียนรู้เกี่ยวกับบริษัทและพันธกิจของเรา" } },
  { slug: "getting-started", icon: "rocket", name: { en: "Getting Started", th: "เริ่มต้นใช้งาน", ja: "はじめに" }, description: { en: "How to purchase, install, and activate your eSIM", th: "วิธีซื้อ ติดตั้ง และเปิดใช้งาน eSIM" } },
  { slug: "using-esim", icon: "smartphone", name: { en: "Using & Managing eSIMs", th: "การใช้งานและจัดการ eSIM", ja: "eSIMの使い方と管理" }, description: { en: "Data usage, hotspot, top-ups, and eSIM management", th: "การใช้ข้อมูล ฮอตสปอต เติมเงิน และการจัดการ eSIM" } },
  { slug: "account", icon: "user", name: { en: "My Account & Mobile11 Money", th: "บัญชีของฉันและ Mobile11 Money" }, description: { en: "Manage your account, orders, payments, and rewards", th: "จัดการบัญชี คำสั่งซื้อ การชำระเงิน และรางวัล" } },
  { slug: "troubleshoot", icon: "wrench", name: { en: "Troubleshooting", th: "การแก้ไขปัญหา" }, description: { en: "Solutions when your eSIM isn't working", th: "วิธีแก้ปัญหาเมื่อ eSIM ไม่ทำงาน" } },
  { slug: "affiliate", icon: "gift", name: { en: "Affiliates & Partnerships", th: "พันธมิตรและพาร์ทเนอร์" }, description: { en: "Join our affiliate and partnership programs", th: "เข้าร่วมโปรแกรมพันธมิตรและพาร์ทเนอร์" } },
];

const ICON_MAP: Record<string, typeof Info> = {
  info: Info,
  rocket: Rocket,
  smartphone: Smartphone,
  user: User,
  wrench: Wrench,
  gift: Gift,
};

export function HelpCenterHome() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: categoryCounts = {} } = useHelpCategoryCounts(language);
  const { data: searchResults = [] } = useSearchHelpArticles(debouncedQuery, language);

  const isSearching = debouncedQuery.trim().length > 0;

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
          <h1 className="text-lg font-bold text-[#1A1A1A]">Help Center</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white rounded-xl border-0 shadow-sm text-[14px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
          />
        </div>
      </div>

      <div className="px-4 pt-3 pb-8">
        {isSearching ? (
          /* Search Results */
          <div className="space-y-2">
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#6B6B6B] text-sm">
                  No results found for "{debouncedQuery}"
                </p>
              </div>
            ) : (
              searchResults.map((article) => (
                <button
                  key={article.id}
                  onClick={() => navigate(`/support/${article.category}/${article.slug}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform text-left"
                >
                  <FileText className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#1A1A1A] truncate">
                      {article.title}
                    </p>
                    {article.description && (
                      <p className="text-[12px] text-[#6B6B6B] truncate mt-0.5">
                        {article.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        ) : (
          /* Category Grid */
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Info;
              const count = categoryCounts[cat.slug] ?? 0;
              const langKey = language as keyof typeof cat.name;
              const name = cat.name[langKey] || cat.name.en;
              const desc = cat.description[langKey as keyof typeof cat.description] || cat.description.en;

              return (
                <button
                  key={cat.slug}
                  onClick={() => navigate(`/support/${cat.slug}`)}
                  className="w-full flex items-center gap-3.5 px-4 py-4 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform text-left"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F97316]/10 flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#F97316]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-[#1A1A1A]">
                      {name}
                    </p>
                    <p className="text-[12px] text-[#6B6B6B] truncate mt-0.5">
                      {desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {count > 0 && (
                      <span className="text-[12px] text-[#9CA3AF]">
                        {count}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
