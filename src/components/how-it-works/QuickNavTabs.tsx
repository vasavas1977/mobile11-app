import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickNavTabsProps {
  onNavigate: (section: string) => void;
}

export const QuickNavTabs = ({ onNavigate }: QuickNavTabsProps) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'getting-started', label: t('howItWorksPage.nav.gettingStarted') || 'Getting started with Mobile11' },
    { id: 'whats-esim', label: t('howItWorksPage.nav.whatsEsim') || "What's an eSIM?" },
    { id: 'why-use', label: t('howItWorksPage.nav.whyUse') || 'Why use Mobile11?' },
    { id: 'how-to-use', label: t('howItWorksPage.nav.howToUse') || 'How to use Mobile11' },
  ];

  return (
    <section className="py-8 md:py-12 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white rounded-full border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-sm md:text-base font-medium text-gray-700 hover:text-orange-600 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.label}
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
