import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RoadTripIllustration } from './illustrations/RoadTripIllustration';
import { MountainHikersIllustration } from './illustrations/MountainHikersIllustration';
import { DogWalkerIllustration } from './illustrations/DogWalkerIllustration';
import { useLanguage } from '@/contexts/LanguageContext';

export const LoyaltyHelpArticles = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const articles = [
    {
      titleKey: 'loyaltyProgram.helpArticles.articles.whatIsProgram',
      linkTextKey: 'loyaltyProgram.helpArticles.readArticle',
      slug: 'what-is-loyalty-program',
      Illustration: RoadTripIllustration,
    },
    {
      titleKey: 'loyaltyProgram.helpArticles.articles.rewardsWithPurchase',
      linkTextKey: 'loyaltyProgram.helpArticles.viewPost',
      slug: 'rewards-with-every-purchase',
      Illustration: MountainHikersIllustration,
    },
    {
      titleKey: 'loyaltyProgram.helpArticles.articles.whatIsMobile11Money',
      linkTextKey: 'loyaltyProgram.helpArticles.readArticle',
      slug: 'what-is-mobile11-money',
      Illustration: DogWalkerIllustration,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FAF7F2]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            {t('loyaltyProgram.helpArticles.title')}
          </h2>
          <button 
            onClick={() => navigate('/support')}
            className="px-6 py-3 border border-gray-300 rounded-full text-gray-900 font-medium hover:bg-gray-50 transition-colors whitespace-nowrap self-start md:self-auto"
          >
            {t('loyaltyProgram.helpArticles.goToHelpCenter')}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {articles.map((article, index) => {
            const Illustration = article.Illustration;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/support/account/${article.slug}`)}
              >
                {/* Illustration Area */}
                <div className="h-56 md:h-64 bg-gradient-to-b from-[#FDF8F3] to-[#FEF3C7]/30 p-4 relative overflow-hidden">
                  <Illustration />
                </div>
                
                {/* Content Area */}
                <div className="p-6">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 group-hover:text-orange-500 transition-colors line-clamp-2">
                    {t(article.titleKey)}
                  </h3>
                  
                  <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium">
                    {t(article.linkTextKey)}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
