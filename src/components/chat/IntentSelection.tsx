import { ShoppingBag, Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntentSelectionProps {
  onSelectIntent: (intent: 'sales' | 'support') => void;
}

export function IntentSelection({ onSelectIntent }: IntentSelectionProps) {
  const { t } = useLanguage();

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#FAF7F2]">
      <h3 className="font-semibold text-center mb-6 text-gray-900 text-lg">
        {t('chatbot.intent.title')}
      </h3>
      
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => onSelectIntent('sales')}
          className="w-full p-4 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300 hover:scale-[1.02] hover:shadow-md transition-all flex items-center gap-3 text-left cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <span className="font-medium block">{t('chatbot.intent.buyEsim')}</span>
            <span className="text-xs text-orange-500">{t('chatbot.intent.buyEsimEmoji')}</span>
          </div>
        </button>

        <button
          onClick={() => onSelectIntent('support')}
          className="w-full p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:scale-[1.02] hover:shadow-md transition-all flex items-center gap-3 text-left cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Headphones className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <span className="font-medium block">{t('chatbot.intent.support')}</span>
            <span className="text-xs text-blue-500">{t('chatbot.intent.supportEmoji')}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
