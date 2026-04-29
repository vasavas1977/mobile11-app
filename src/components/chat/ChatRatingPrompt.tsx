import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ChatRatingPromptProps {
  conversationId: string;
  channel: 'web' | 'voice' | 'line' | 'facebook' | 'whatsapp';
  onComplete: () => void;
  onRatingSubmitted?: (rating: number) => void;
}

const TEXTS = {
  en: {
    title: 'How was your experience?',
    subtitle: 'Your feedback helps us improve',
    placeholder: 'Any additional feedback? (optional)',
    submit: 'Submit',
    skip: 'Skip',
    thanks: 'Thank you for your feedback! 🙏',
    closing: 'Thank you for your rating! 🙏 This conversation will be closed now. Have a great day!',
  },
  th: {
    title: 'ประสบการณ์ของคุณเป็นอย่างไร?',
    subtitle: 'ความคิดเห็นของคุณช่วยให้เราพัฒนาได้ดีขึ้น',
    placeholder: 'ความคิดเห็นเพิ่มเติม (ไม่บังคับ)',
    submit: 'ส่ง',
    skip: 'ข้าม',
    thanks: 'ขอบคุณสำหรับความคิดเห็น! 🙏',
    closing: 'ขอบคุณสำหรับการให้คะแนนค่ะ! 🙏 บทสนทนานี้จะถูกปิดแล้วนะคะ ขอให้มีวันที่ดีค่ะ!',
  },
};

export function ChatRatingPrompt({ conversationId, channel, onComplete, onRatingSubmitted }: ChatRatingPromptProps) {
  const { language } = useLanguage();
  const t = TEXTS[language as keyof typeof TEXTS] || TEXTS.en;
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await supabase.from('conversation_ratings' as any).insert({
        conversation_id: conversationId,
        rating,
        feedback_text: feedback.trim() || null,
        channel,
        language: language || 'en',
      } as any);
      setSubmitted(true);
      onRatingSubmitted?.(rating);
      setTimeout(onComplete, 2500);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto my-3 p-4 bg-white border border-gray-200 rounded-xl text-center max-w-[300px]">
        <p className="text-sm text-gray-700 font-medium">{t.closing}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto my-3 p-4 bg-white border border-gray-200 rounded-xl max-w-[280px] space-y-3">
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">{t.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t.subtitle}</p>
      </div>

      {/* Stars */}
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                (hoveredStar || rating) >= star
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>

      {/* Feedback textarea - show when rating selected */}
      {rating > 0 && (
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t.placeholder}
          className="text-xs min-h-[60px] resize-none border-gray-200 bg-gray-50"
          maxLength={500}
        />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onComplete}
          className="flex-1 text-xs text-gray-500 hover:text-gray-700"
        >
          {t.skip}
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="flex-1 text-xs bg-orange-500 hover:bg-orange-600 text-white"
        >
          {submitting ? '...' : t.submit}
        </Button>
      </div>
    </div>
  );
}
