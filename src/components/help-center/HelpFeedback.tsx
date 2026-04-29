import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HelpFeedbackProps {
  articleId: string;
}

export function HelpFeedback({ articleId }: HelpFeedbackProps) {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    console.log(`Feedback for article ${articleId}: ${type}`);
  };

  if (feedback) {
    return (
      <div className="mt-12 pt-8 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Check className="h-5 w-5 text-green-500" />
          <span>{t('helpFeedback.thankYou')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="text-center">
        <p className="text-foreground font-medium mb-4">
          {t('helpFeedback.didThisAnswer')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleFeedback('positive')}
            className="flex items-center gap-2 px-6 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full transition-colors"
          >
            <ThumbsUp className="h-5 w-5" />
            <span>{t('helpFeedback.yes')}</span>
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full transition-colors"
          >
            <ThumbsDown className="h-5 w-5" />
            <span>{t('helpFeedback.no')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
