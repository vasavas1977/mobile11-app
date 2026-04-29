import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const PROMO_CODE = 'SK2026';
const START = new Date('2026-03-14T00:00:00');
const END = new Date('2026-04-11T00:00:00');
const STORAGE_KEY = 'songkran-2026-dismissed';

export function SongkranPromoBanner() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  const [copied, setCopied] = useState(false);

  const now = new Date();
  if (now < START || now >= END || dismissed) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    toast({ title: t('landing.songkranPromo.copied'), description: t('landing.songkranPromo.copiedDesc') });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="w-full py-3 pb-4 px-4 relative z-10">
      <div className="max-w-3xl mx-auto bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-sm border border-orange-200/60 rounded-2xl md:rounded-full py-2 px-4 md:px-6 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 md:gap-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <span className="text-base flex-shrink-0">💦</span>
          <span className="text-sm font-medium text-gray-800">
            <span
              dangerouslySetInnerHTML={{
                __html: (t('landing.songkranPromo.title') as string)
                  .replace('<bold>', '<span class="font-bold">')
                  .replace('</bold>', '</span>')
              }}
            />
            <span className="block md:inline text-gray-500 font-normal md:ml-1">· {t('landing.songkranPromo.validity')}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-white/70 border border-orange-200/80 rounded-full px-2.5 py-1 text-xs font-mono font-bold text-orange-600 hover:bg-white transition-colors"
          >
            {PROMO_CODE}
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>

          <button
            onClick={() => navigate('/packages')}
            className="hidden sm:inline-flex bg-orange-500 text-white text-xs font-semibold rounded-full px-3 py-1 hover:bg-orange-600 transition-colors"
          >
            {t('landing.songkranPromo.shopNow')}
          </button>

          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SongkranPromoBanner;
