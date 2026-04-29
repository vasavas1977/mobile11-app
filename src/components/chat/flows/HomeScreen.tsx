import { useLanguage } from '@/contexts/LanguageContext';
import { FlowType } from './types';

interface HomeScreenProps {
  onSelectFlow: (flow: FlowType, data?: Record<string, any>) => void;
}

// HomeScreen is now just the entry point - it immediately renders the conversational chat
export function HomeScreen({ onSelectFlow }: HomeScreenProps) {
  // The conversational flow is handled by ConversationalSalesFlow
  // HomeScreen just shows the initial welcome and routes
  return null;
}
