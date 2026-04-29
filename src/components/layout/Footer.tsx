import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img src={logo} alt="mobile11" className="h-12 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.brand.description')}
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t('footer.products.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/packages" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.products.esimPackages')}
                </Link>
              </li>
              <li>
                <Link to="/what-is-esim" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.products.whatIsEsim')}
                </Link>
              </li>
              <li>
                <Link to="/business" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.products.forBusiness')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t('footer.company.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.company.aboutUs')}
                </Link>
              </li>
              <li>
                <Link to="/affiliate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.company.partnerProgram')}
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.company.support')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t('footer.legal.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.refundPolicy')}
                </Link>
              </li>
               <li>
                 <Link to="/data-deletion" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                   {t('footer.legal.dataDeletion')}
                 </Link>
               </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            {t('footer.copyright').replace('{year}', new Date().getFullYear().toString())}
          </p>
        </div>
      </div>
    </footer>
  );
}
