import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FlowNavigationProps {
  canGoBack: boolean;
  onBack: () => void;
  onStartOver: () => void;
  showStartOver?: boolean;
}

export function FlowNavigation({ 
  canGoBack, 
  onBack, 
  onStartOver,
  showStartOver = true 
}: FlowNavigationProps) {
  const { t } = useLanguage();
  
  if (!canGoBack && !showStartOver) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
      {canGoBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 
                     bg-white border border-gray-200 rounded-full hover:bg-gray-50 
                     transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('chatbot.nav.back')}
        </button>
      )}
      {showStartOver && (
        <button
          onClick={onStartOver}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500
                     hover:text-gray-700 transition-colors ml-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('chatbot.nav.startOver')}
        </button>
      )}
    </div>
  );
}
