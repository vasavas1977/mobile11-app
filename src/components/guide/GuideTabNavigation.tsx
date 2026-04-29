import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Smartphone, QrCode, Settings, HelpCircle, MessageSquare, BarChart3 } from 'lucide-react';

interface GuideTabNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function GuideTabNavigation({ activeSection, onSectionChange }: GuideTabNavigationProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'whats-esim', label: t('guide.tabs.whatsEsim'), icon: Smartphone },
    { id: 'qr-code-activation', label: t('guide.tabs.qrCode'), icon: QrCode },
    { id: 'manual-activation', label: t('guide.tabs.manual'), icon: Settings },
    { id: 'troubleshooting', label: t('guide.tabs.troubleshooting'), icon: HelpCircle },
    { id: 'faq', label: t('guide.tabs.faq'), icon: MessageSquare },
    { id: 'check-data-usage', label: t('guide.tabs.dataUsage'), icon: BarChart3 },
  ];

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border mb-8">
      <div className="overflow-x-auto scrollbar-hide">
        <nav className="flex items-center gap-1 p-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                activeSection === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
