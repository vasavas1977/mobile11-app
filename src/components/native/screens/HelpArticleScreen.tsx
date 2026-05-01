import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHelpArticle, incrementArticleViewCount } from "@/hooks/useHelpArticles";
import { getHelpCategoryBySlug } from "@/lib/helpCategoryConfig";

export function HelpArticleScreen() {
  const navigate = useNavigate();
  const { categorySlug, articleSlug } = useParams<{
    categorySlug: string;
    articleSlug: string;
  }>();
  const { language } = useLanguage();

  const { data: article, isLoading } = useHelpArticle(
    categorySlug || "",
    articleSlug || "",
    language
  );

  const category = categorySlug ? getHelpCategoryBySlug(categorySlug) : null;
  const categoryName = category
    ? (category as any)[`name_${language}`] || category.name_en
    : categorySlug || "Category";

  // Increment view count
  useEffect(() => {
    if (article?.id) {
      incrementArticleViewCount(article.id);
    }
  }, [article?.id]);

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

      {/* Article Content */}
      <div className="px-4 pt-1 pb-8">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-8 bg-white rounded-xl animate-pulse w-3/4" />
            <div className="h-4 bg-white rounded-lg animate-pulse w-1/2" />
            <div className="h-40 bg-white rounded-2xl animate-pulse mt-4" />
          </div>
        ) : !article ? (
          <div className="text-center py-12">
            <p className="text-[#6B6B6B] text-sm">Article not found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-2">
              {article.title}
            </h2>
            {article.description && (
              <p className="text-[14px] text-[#6B6B6B] mb-5">
                {article.description}
              </p>
            )}
            <div className="prose prose-sm max-w-none prose-headings:text-[#1A1A1A] prose-p:text-[#374151] prose-a:text-[#F97316] prose-strong:text-[#1A1A1A] prose-li:text-[#374151]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content || ""}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
