import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionDecorations } from './FloatingDecorations';
import { useLanguage } from '@/contexts/LanguageContext';

interface Destination {
  name: string;
  nameKey: string;
  flag: string;
  startingPrice: number;
}

const popularDestinations: Destination[] = [
  { name: 'thailand', nameKey: 'popularDestV2.thailand', flag: '🇹🇭', startingPrice: 99 },
  { name: 'japan', nameKey: 'popularDestV2.japan', flag: '🇯🇵', startingPrice: 149 },
  { name: 'south korea', nameKey: 'popularDestV2.southKorea', flag: '🇰🇷', startingPrice: 129 },
  { name: 'singapore', nameKey: 'popularDestV2.singapore', flag: '🇸🇬', startingPrice: 119 },
  { name: 'hong kong', nameKey: 'popularDestV2.hongKong', flag: '🇭🇰', startingPrice: 109 },
  { name: 'taiwan', nameKey: 'popularDestV2.taiwan', flag: '🇹🇼', startingPrice: 119 },
  { name: 'vietnam', nameKey: 'popularDestV2.vietnam', flag: '🇻🇳', startingPrice: 89 },
  { name: 'malaysia', nameKey: 'popularDestV2.malaysia', flag: '🇲🇾', startingPrice: 99 },
];

const localDestinations: Destination[] = [
  { name: 'thailand', nameKey: 'popularDestV2.thailand', flag: '🇹🇭', startingPrice: 99 },
  { name: 'vietnam', nameKey: 'popularDestV2.vietnam', flag: '🇻🇳', startingPrice: 89 },
  { name: 'malaysia', nameKey: 'popularDestV2.malaysia', flag: '🇲🇾', startingPrice: 99 },
  { name: 'indonesia', nameKey: 'popularDestV2.indonesia', flag: '🇮🇩', startingPrice: 109 },
];

const regionalDestinations: Destination[] = [
  { name: 'asia', nameKey: 'popularDestV2.asia', flag: '🌏', startingPrice: 199 },
  { name: 'europe', nameKey: 'popularDestV2.europe', flag: '🇪🇺', startingPrice: 249 },
  { name: 'americas', nameKey: 'popularDestV2.americas', flag: '🌎', startingPrice: 299 },
  { name: 'global', nameKey: 'popularDestV2.global', flag: '🌍', startingPrice: 399 },
];

type TabType = 'popular' | 'local' | 'regional';

export const PopularDestinationsV2: React.FC = () => {
  const { t, formatPrice } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('popular');

  const getDestinations = () => {
    switch (activeTab) {
      case 'local': return localDestinations;
      case 'regional': return regionalDestinations;
      default: return popularDestinations;
    }
  };

  const tabs: { key: TabType; labelKey: string }[] = [
    { key: 'popular', labelKey: 'popularDestV2.tabPopular' },
    { key: 'local', labelKey: 'popularDestV2.tabLocal' },
    { key: 'regional', labelKey: 'popularDestV2.tabRegional' },
  ];

  return (
    <section className="py-16 md:py-24 bg-[hsl(35,33%,96%)]">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-[hsl(142,76%,45%)] p-8 md:p-12">
          <SectionDecorations />
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t('popularDestV2.title')}
              </h2>
              <p className="text-lg text-white/80">
                {t('popularDestV2.subtitle')}
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-[hsl(142,76%,35%)]'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getDestinations().map((destination, index) => (
                <Link
                  key={index}
                  to={`/packages?country=${destination.name.toLowerCase()}`}
                  className="bg-white rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-lg hover:scale-[1.02] group"
                >
                  <span className="text-3xl">{destination.flag}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[hsl(20,14%,10%)] truncate">
                      {t(destination.nameKey)}
                    </h3>
                    <p className="text-sm text-[hsl(20,6%,45%)]">
                      {t('popularDestV2.from')} {formatPrice(destination.startingPrice)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[hsl(20,6%,45%)] group-hover:text-[hsl(25,95%,53%)] transition-colors" />
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 bg-white text-[hsl(142,76%,35%)] px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                {t('popularDestV2.viewAll')}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularDestinationsV2;
