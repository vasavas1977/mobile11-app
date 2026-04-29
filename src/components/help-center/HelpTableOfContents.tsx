import { useState } from 'react';
import { ChevronDown, ChevronUp, List } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TocItem {
  id: string;
  title: string;
  titleTh?: string;
  titleJa?: string;
  [key: string]: string | undefined;
}

interface HelpTableOfContentsProps {
  items: TocItem[];
}

export function HelpTableOfContents({ items }: HelpTableOfContentsProps) {
  const { t, localizeField } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) return null;

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">
            {t('helpCenterToc.tableOfContents')}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className="w-full text-left py-2 px-3 text-sm text-gray-700 hover:text-cyan-600 hover:bg-gray-200 rounded-md transition-colors"
            >
              {index + 1}. {localizeField(item, 'title')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
