import { useLanguage } from '@/contexts/LanguageContext';

interface TocItem {
  id: string;
  title: string;
  titleTh?: string;
  titleJa?: string;
  [key: string]: string | undefined;
}

interface HelpTableOfContentsDesktopProps {
  items: TocItem[];
}

export function HelpTableOfContentsDesktop({ items }: HelpTableOfContentsDesktopProps) {
  const { t, localizeField } = useLanguage();

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="border-l-2 border-border pl-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {t('helpCenterToc.tableOfContents')}
      </h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              onClick={() => handleClick(item.id)}
              className={`text-left w-full text-sm transition-colors hover:text-primary ${
                index === 0 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground'
              }`}
            >
              {localizeField(item, 'title')}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
