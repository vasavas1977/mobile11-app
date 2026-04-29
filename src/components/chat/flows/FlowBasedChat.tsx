import { useLanguage } from '@/contexts/LanguageContext';
import { ConversationalChat } from './ConversationalChat';

interface FlowBasedChatProps {
  onTalkToSupport: () => void;
}

export function FlowBasedChat({ onTalkToSupport }: FlowBasedChatProps) {
  return (
    <div className="flex flex-col h-full">
      <ConversationalChat onTalkToSupport={onTalkToSupport} />
    </div>
  );
}
