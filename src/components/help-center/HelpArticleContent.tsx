import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '@/contexts/LanguageContext';
import { KBArticle } from '@/types/helpCenter';
import { HelpTableOfContents } from './HelpTableOfContents';
import { HelpTableOfContentsDesktop } from './HelpTableOfContentsDesktop';
import { HelpFeedback } from './HelpFeedback';
import { HelpStickySidebarPortal } from './HelpStickySidebarPortal';

interface HelpArticleContentProps {
  article: KBArticle;
}

export function HelpArticleContent({ article }: HelpArticleContentProps) {
  const { language, t } = useLanguage();
  
  const title = article.title;
  const description = article.description || '';
  const content = article.content;
  const tableOfContents = article.table_of_contents || [];

  // Calculate time ago from updated_at
  const updatedDate = new Date(article.updated_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let timeAgo: string;
  if (diffDays === 0) {
    timeAgo = t('helpArticle.today');
  } else if (diffDays === 1) {
    timeAgo = t('helpArticle.yesterday');
  } else if (diffDays < 7) {
    timeAgo = (t('helpArticle.daysAgo') as string).replace('{n}', String(diffDays));
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    timeAgo = (t('helpArticle.weeksAgo') as string).replace('{n}', String(weeks));
  } else {
    const months = Math.floor(diffDays / 30);
    timeAgo = (t('helpArticle.monthsAgo') as string).replace('{n}', String(months));
  }

  // Transform TOC to the format expected by components
  const tocItems = tableOfContents.map(item => ({
    id: item.id,
    title: item.title,
    titleTh: item.title // Use same title since DB already has correct language
  }));

  return (
    <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-12 lg:items-start">
      {/* Main Content */}
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 mb-2">
              {description}
            </p>
          )}
          <p className="text-sm text-gray-500">
            {t('helpArticle.updated')} {timeAgo}
          </p>
        </div>

        {/* Mobile/Tablet: Collapsible ToC */}
        {tocItems.length > 0 && (
          <div className="lg:hidden">
            <HelpTableOfContents items={tocItems} />
          </div>
        )}

        <div className="prose prose-slate max-w-none">
          <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children, ...props }) => {
              // Extract id from heading text (format: "Title {#id}")
              const text = String(children);
              const match = text.match(/^(.+?)\s*\{#(.+?)\}$/);
              const id = match ? match[2] : text.toLowerCase().replace(/\s+/g, '-');
              const displayText = match ? match[1] : text;
              
              return (
                <h2 id={id} className="text-xl font-semibold text-gray-900 mt-8 mb-4 scroll-mt-20" {...props}>
                  {displayText}
                </h2>
              );
            },
            h3: ({ children, ...props }) => (
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3" {...props}>
                {children}
              </h3>
            ),
            p: ({ children, ...props }) => (
              <p className="text-gray-700 mb-4 leading-relaxed" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700" {...props}>
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li className="text-gray-700" {...props}>
                {children}
              </li>
            ),
            strong: ({ children, ...props }) => (
              <strong className="font-semibold text-gray-900" {...props}>
                {children}
              </strong>
            ),
            a: ({ children, href, ...props }) => (
              <a 
                href={href} 
                className="text-cyan-600 hover:underline" 
                {...props}
              >
                {children}
              </a>
            ),
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden" {...props}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ children, ...props }) => (
              <thead className="bg-gray-50" {...props}>
                {children}
              </thead>
            ),
            th: ({ children, ...props }) => (
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b border-gray-200" {...props}>
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200" {...props}>
                {children}
              </td>
            ),
            code: ({ children, ...props }) => (
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
                {children}
              </code>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-gray-600 my-4" {...props}>
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
        </div>

        <HelpFeedback articleId={article.id} />
      </div>

      {/* Desktop: Fixed Right Sidebar ToC */}
      {tocItems.length > 0 && (
        <aside
          className="hidden lg:block"
          aria-label={t('helpArticle.onThisPage')}
        >
          <HelpStickySidebarPortal top={96}>
            <HelpTableOfContentsDesktop items={tocItems} />
          </HelpStickySidebarPortal>
        </aside>
      )}
    </div>
  );
}
