import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'how-it-works' | 'learn';
type LangKey = 'en' | 'th' | 'ja';

// Video data with language-specific YouTube IDs
const howItWorksVideo: Record<LangKey, { youtubeId: string; title: string }> = {
  en: { youtubeId: 'hJCkDXbgUlc', title: 'What is E-SIM' },
  th: { youtubeId: '4ArNed3XOX8', title: 'E-SIM คืออะไร' },
  ja: { youtubeId: 'hJCkDXbgUlc', title: 'eSIMとは？仕組みを解説' }
};

const learnVideos: Record<LangKey, { youtubeId: string; title: string }[]> = {
  en: [
    { youtubeId: 'VM7vJVbZ6A8', title: 'Mobile11 Learn & Go | Local vs Regional vs Global eSIMs' },
    { youtubeId: 'CKuTvtgDV5w', title: 'Seamless connectivity with Mobile11 eSIM' },
    { youtubeId: 'iujQJBGkcc4', title: "A great journey shouldn't start with searching for a signal" },
    { youtubeId: 'Dd8uL3ydRDc', title: 'End runaway overseas data costs' },
    { youtubeId: 'zL-9Somw-k8', title: 'Mobile11 Learn & Go | What Is Mobile11?' }
  ],
  th: [
    { youtubeId: 'iWa71zvg9mY', title: 'Mobile11 Learn & Go | eSIM แบบไหนเหมาะกับคุณ?' },
    { youtubeId: 'Tb7xMhpz0WY', title: 'เชื่อมต่อไร้ขีดจำกัด ด้วย eSIM จาก Mobile11' },
    { youtubeId: 'KXhF7ZM2K3g', title: "การเดินทางที่ดี ไม่ควรเริ่มจาก 'หาสัญญาณ" },
    { youtubeId: 'Ixm907pOtBI', title: "จบค่าใช้จ่าย 'ค่าเน็ตต่างประเทศ' ที่บานปลาย" },
    { youtubeId: 'Z-kYeQF6WJk', title: 'Mobile11 Learn & Go | ทำความรู้จักกับ Mobile11' }
  ],
  ja: [
    { youtubeId: 'VM7vJVbZ6A8', title: 'Mobile11 Learn & Go | ローカル・リージョナル・グローバルeSIMの違い' },
    { youtubeId: 'CKuTvtgDV5w', title: 'Mobile11 eSIMでシームレスな接続を' },
    { youtubeId: 'iujQJBGkcc4', title: '素晴らしい旅は電波探しから始めるべきではない' },
    { youtubeId: 'Dd8uL3ydRDc', title: '海外データ通信費の高騰にストップを' },
    { youtubeId: 'zL-9Somw-k8', title: 'Mobile11 Learn & Go | Mobile11とは？' }
  ]
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "relative px-6 md:px-8 py-4 text-lg md:text-xl font-medium transition-colors",
      active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700"
    )}
  >
    {children}
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
  </button>
);

interface VideoCardProps {
  youtubeId: string;
  title: string;
  large?: boolean;
}

const VideoCard = ({ youtubeId, title, large = false }: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  
  return (
    <div className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-video">
          {isPlaying ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={title}
              className="w-full h-full absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button 
              onClick={() => setIsPlaying(true)}
              className="w-full h-full group cursor-pointer"
              aria-label={`Play video: ${title}`}
            >
              <img 
                src={thumbnailUrl} 
                alt={title} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-white ml-1" />
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 md:mt-4 text-base md:text-lg font-semibold text-gray-900 line-clamp-2">{title}</p>
    </div>
  );
};

const HowItWorksContent = () => {
  const { language } = useLanguage();
  const langKey = (language === 'th' || language === 'ja' ? language : 'en') as LangKey;
  const video = howItWorksVideo[langKey];
  
  return (
    <motion.div
      key="how-it-works"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <VideoCard youtubeId={video.youtubeId} title={video.title} large />
    </motion.div>
  );
};

const LearnContent = () => {
  const { language } = useLanguage();
  const langKey = (language === 'th' || language === 'ja' ? language : 'en') as LangKey;
  const videos = learnVideos[langKey];
  
  return (
    <motion.div
      key="learn"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {videos.map((video, index) => (
          <VideoCard 
            key={index} 
            youtubeId={video.youtubeId} 
            title={video.title} 
          />
        ))}
      </div>
    </motion.div>
  );
};

export const HowItWorksTabSection = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('how-it-works');

  return (
    <section className="py-20 md:py-28 bg-[#FAF7F2] relative overflow-hidden content-visibility-auto">
      <div className="container relative">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-12 md:mb-16">
          <div className="flex border-b border-gray-200/80">
            <TabButton 
              active={activeTab === 'how-it-works'} 
              onClick={() => setActiveTab('how-it-works')}
            >
              {t('landing.howItWorksTab.tabHowItWorks')}
            </TabButton>
            <TabButton 
              active={activeTab === 'learn'} 
              onClick={() => setActiveTab('learn')}
            >
              {t('landing.howItWorksTab.tabLearn')}
            </TabButton>
          </div>
        </div>
        
        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'how-it-works' ? <HowItWorksContent /> : <LearnContent />}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HowItWorksTabSection;
