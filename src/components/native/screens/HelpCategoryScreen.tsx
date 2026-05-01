import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHelpArticles } from "@/hooks/useHelpArticles";
import { getHelpCategoryBySlug } from "@/lib/helpCategoryConfig";

export function HelpCategoryScreen() {
  const navigate = useNavigate();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { language } = useLanguage();

  const category = categorySlug ? getHelpCategoryBySlug(categorySlug) : null;
  const { data: articles = [], isLoading } = useHelpArticles(categorySlug || "", language);

  const categoryName = category
    ? (category as any)[`name_${language}`] || category.name_en
    : categorySlug || "Category";

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FAF7F2] px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </button>
          <h1 className="text-lg font-bold text-[#1A1A1A] truncate">
            {categoryName}
          </h1>
        </div>
      </div>

      {/* Article List */}
      <div className="px-4 pt-1 pb-8 space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#6B6B6B] text-sm">
              No articles found in this category.
            </p>
          </div>
        ) : (
          articles.map((article) => (
            <button
              key={article.id}
              onClick={() => navigate(`/support/${categorySlug}/${article.slug}`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform text-left"
            >
              <FileText className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#1A1A1A]">
                  {article.title}
                </p>
                {article.description && (
                  <p className="text-[12px] text-[#6B6B6B] line-clamp-1 mt-0.5">
                    {article.description}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
