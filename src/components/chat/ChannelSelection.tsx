import { MessageCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { type ChatChannel, CHAT_CHANNELS } from '@/lib/chatChannels';

// LINE icon component
const LineIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

// Facebook icon component
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface ChannelSelectionProps {
  onSelectChannel: (channel: ChatChannel) => void;
  intent?: 'sales' | 'support' | null;
  onSignInClick?: () => void;
  isLoggedIn?: boolean;
}

interface ChannelOption {
  id: ChatChannel;
  icon: React.ReactNode;
  labelKey: string;
  descriptionKey: string;
  color: string;
  enabled: boolean;
}

export function ChannelSelection({ onSelectChannel, intent, onSignInClick, isLoggedIn }: ChannelSelectionProps) {
  const { t } = useLanguage();

  const getTitle = () => {
    if (intent === 'support') return t('chatWidget.channelSelection.supportTitle');
    if (intent === 'sales') return t('chatWidget.channelSelection.salesTitle');
    return t('chatWidget.channelSelection.title');
  };

  const channels: ChannelOption[] = [
    {
      id: 'web',
      icon: <MessageCircle className="h-6 w-6" />,
      labelKey: 'chatWidget.channels.web.label',
      descriptionKey: 'chatWidget.channels.web.description',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      enabled: CHAT_CHANNELS.web.enabled
    },
    {
      id: 'line',
      icon: <LineIcon className="h-6 w-6" />,
      labelKey: 'chatWidget.channels.line.label',
      descriptionKey: 'chatWidget.channels.line.description',
      color: 'bg-[#00B900]/10 text-[#00B900] border-[#00B900]/30',
      enabled: CHAT_CHANNELS.line.enabled
    },
    {
      id: 'facebook',
      icon: <FacebookIcon className="h-6 w-6" />,
      labelKey: 'chatWidget.channels.facebook.label',
      descriptionKey: 'chatWidget.channels.facebook.description',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      enabled: CHAT_CHANNELS.facebook.enabled
    },
    {
      id: 'whatsapp',
      icon: <WhatsAppIcon className="h-6 w-6" />,
      labelKey: 'chatWidget.channels.whatsapp.label',
      descriptionKey: 'chatWidget.channels.whatsapp.description',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      enabled: CHAT_CHANNELS.whatsapp.enabled
    }
  ];

  return (
    <div className="flex-1 p-4 flex flex-col bg-[#FAF7F2]">
      <h3 className="font-semibold text-center mb-4 text-gray-900">
        {getTitle()}
      </h3>
      
      <div className="space-y-3">
        {channels.map((channel) => {
          const isWhatsAppLink = channel.id === 'whatsapp' && channel.enabled && !!CHAT_CHANNELS.whatsapp.url;
          const content = (
            <>
              <div className={cn(
                "p-2 rounded-lg",
                channel.enabled ? channel.color : "bg-gray-200"
              )}>
                {channel.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t(channel.labelKey)}</span>
                  {!channel.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                      {t('chatWidget.channelSelection.comingSoon')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {t(channel.descriptionKey)}
                </p>
              </div>
            </>
          );

          if (isWhatsAppLink) {
            return (
              <a
                key={channel.id}
                href={CHAT_CHANNELS.whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-full p-3 rounded-lg border transition-all flex items-center gap-3 text-left",
                  `${channel.color} hover:scale-[1.02] hover:shadow-md cursor-pointer`
                )}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={channel.id}
              onClick={() => channel.enabled && onSelectChannel(channel.id)}
              disabled={!channel.enabled}
              className={cn(
                "w-full p-3 rounded-lg border transition-all flex items-center gap-3 text-left",
                channel.enabled
                  ? `${channel.color} hover:scale-[1.02] hover:shadow-md cursor-pointer`
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
              )}
            >
              {content}
            </button>
          );
        })}
      </div>

      {/* Optional sign-in link */}
      {!isLoggedIn && onSignInClick && (
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{t('chatWidget.channelSelection.or')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            onClick={onSignInClick}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors py-1"
          >
            <LogIn className="h-3.5 w-3.5" />
            {t('chatWidget.channelSelection.signInForHistory')}
          </button>
        </div>
      )}
    </div>
  );
}
