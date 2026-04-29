import { Globe, Plane, HelpCircle, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { navigateWithChatPersistence, isInternalUrl } from './utils/chatNavigation';

interface QuickReply {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  message: string;
  action?: 'message' | 'url';
  url?: string;
}

const quickReplies: QuickReply[] = [
  { id: 'browse', labelKey: 'chatbot.quickReplies.browseAll', icon: Globe, message: '', action: 'url', url: '/packages' },
  { id: 'japan', labelKey: 'chatbot.quickReplies.japan', icon: Plane, message: 'I need an eSIM for Japan' },
  { id: 'thailand', labelKey: 'chatbot.quickReplies.thailand', icon: Plane, message: 'I need an eSIM for Thailand' },
  { id: 'korea', labelKey: 'chatbot.quickReplies.korea', icon: Plane, message: 'I need an eSIM for South Korea' },
  { id: 'install', labelKey: 'chatbot.quickReplies.installHelp', icon: Smartphone, message: 'How do I install the eSIM?' },
  { id: 'help', labelKey: 'chatbot.quickReplies.otherHelp', icon: HelpCircle, message: 'I need help with something else' },
];

interface QuickRepliesProps {
  onQuickReply: (message: string) => void;
  disabled?: boolean;
}

export function QuickReplies({ onQuickReply, disabled = false }: QuickRepliesProps) {
  const { t } = useLanguage();

  const handleClick = (reply: QuickReply) => {
    if (reply.action === 'url' && reply.url) {
      if (isInternalUrl(reply.url)) {
        navigateWithChatPersistence(reply.url);
      } else {
        window.open(reply.url, '_blank');
      }
    } else {
      onQuickReply(reply.message);
    }
  };

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-muted-foreground mb-2 text-center">
        {t('chatbot.quickReplies.prompt')}
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {quickReplies.map((reply) => (
          <button
            key={reply.id}
            onClick={() => handleClick(reply)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full 
                       bg-orange-50 text-orange-600 border border-orange-200
                       hover:bg-orange-100 hover:border-orange-300 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150"
          >
            {reply.id === 'browse' || reply.id === 'install' || reply.id === 'help' ? (
              <reply.icon className="h-3 w-3" />
            ) : null}
            <span>{t(reply.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}