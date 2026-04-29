import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const FooterV2: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[hsl(35,33%,96%)]">
      {/* CTA Banner */}
      <div className="container mx-auto px-4 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-[hsl(199,95%,84%)] p-8 md:p-12">
          <div className="relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(20,14%,10%)] mb-4">
              {t('footerV2.ctaTitle')}
            </h2>
            <p className="text-lg text-[hsl(20,6%,35%)] mb-8 max-w-2xl mx-auto">
              {t('footerV2.ctaDescription')}
            </p>
          </div>
          <div className="absolute -left-10 bottom-0 w-40 h-40 bg-[hsl(156,72%,80%)] rounded-full opacity-30" />
          <div className="absolute -right-10 top-0 w-32 h-32 bg-[hsl(30,100%,72%)] rounded-full opacity-30" />
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[hsl(20,14%,10%)] text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <Link to="/preview" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(21,90%,48%)] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold">Mobile11</span>
              </Link>
              <p className="text-white/70 mb-6 max-w-sm">
                {t('footerV2.aboutDescription')}
              </p>
              <div className="flex flex-col gap-2 text-sm text-white/70">
                <a href="mailto:support@mobile11.co" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  support@mobile11.co
                </a>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('footerV2.location')}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footerV2.quickLinks')}</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/packages" className="hover:text-white transition-colors">{t('footerV2.allDestinations')}</Link></li>
                <li><Link to="/packages?region=asia" className="hover:text-white transition-colors">{t('footerV2.asiaEsims')}</Link></li>
                <li><Link to="/packages?region=europe" className="hover:text-white transition-colors">{t('footerV2.europeEsims')}</Link></li>
                <li><Link to="/packages?type=global" className="hover:text-white transition-colors">{t('footerV2.globalPlans')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footerV2.support')}</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/support" className="hover:text-white transition-colors">{t('footerV2.helpCenter')}</Link></li>
                <li><Link to="/what-is-esim?tab=compatibility" className="hover:text-white transition-colors">{t('footerV2.deviceCompatibility')}</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white transition-colors">{t('footerV2.howItWorks')}</Link></li>
                <li><a href="https://line.me/R/ti/p/@mobile11" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('footerV2.chatOnLine')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footerV2.legal')}</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/privacy" className="hover:text-white transition-colors">{t('footerV2.privacyPolicy')}</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">{t('footerV2.termsOfService')}</Link></li>
                <li><Link to="/refund" className="hover:text-white transition-colors">{t('footerV2.refundPolicy')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} Mobile11. {t('footerV2.allRightsReserved')}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-white/50 text-sm">{t('footerV2.weAccept')}</span>
              <div className="flex items-center gap-2">
                <div className="w-10 h-6 bg-white/20 rounded flex items-center justify-center text-xs">Visa</div>
                <div className="w-10 h-6 bg-white/20 rounded flex items-center justify-center text-xs">MC</div>
                <div className="w-10 h-6 bg-white/20 rounded flex items-center justify-center text-xs">PP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterV2;
