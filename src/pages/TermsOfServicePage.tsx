// Terms of Service Page - Airalo-style Beige Theme
import { Link } from 'react-router-dom';
import { Scale, FileText, Shield, CreditCard, Globe, Users, AlertCircle, Lock, Ban, Gavel, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
  const { t } = useLanguage();

  const section2Items = t('termsOfService.section2.items') as unknown as string[];
  const section3Items = t('termsOfService.section3.items') as unknown as string[];
  const section4SecurityItems = t('termsOfService.section4.subsection2.items') as unknown as string[];
  const section6ActivationItems = t('termsOfService.section6.subsection1.items') as unknown as string[];
  const section6UsageItems = t('termsOfService.section6.subsection3.items') as unknown as string[];
  const section8Items = t('termsOfService.section8.items') as unknown as string[];
  const section10Items = t('termsOfService.section10.items') as unknown as string[];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Back to Home Button */}
      <div className="container pt-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            {t('termsOfService.backToHome')}
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-[#FAF7F2] to-amber-50/30" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200">
              <Scale className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">{t('termsOfService.badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              {t('termsOfService.title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('termsOfService.lastUpdated')}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* 1. Acceptance of Terms */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section1.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section1.p1')}
                  </p>
                  <p className="text-gray-600">
                    {t('termsOfService.section1.p2')}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Service Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section2.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section2.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    {Array.isArray(section2Items) && section2Items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-gray-600 mt-4">
                    {t('termsOfService.section2.p2')}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Eligibility */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section3.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section3.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    {Array.isArray(section3Items) && section3Items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Account Registration */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section4.title')}</h2>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section4.subsection1.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section4.subsection1.content')}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section4.subsection2.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section4.subsection2.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    {Array.isArray(section4SecurityItems) && section4SecurityItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 5. Purchases and Payments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section5.title')}</h2>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section5.subsection1.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section5.subsection1.content')}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section5.subsection2.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section5.subsection2.content')}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section5.subsection3.title')}</h3>
                  <p className="text-gray-600">
                    {t('termsOfService.section5.subsection3.content')}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. eSIM Activation and Usage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section6.title')}</h2>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section6.subsection1.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section6.subsection1.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
                    {Array.isArray(section6ActivationItems) && section6ActivationItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section6.subsection2.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section6.subsection2.content')}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section6.subsection3.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section6.subsection3.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    {Array.isArray(section6UsageItems) && section6UsageItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 7. Fair Use Policy */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section7.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section7.p1')}
                  </p>
                  <p className="text-gray-600">
                    {t('termsOfService.section7.p2')}
                  </p>
                </div>
              </div>
            </div>

            {/* 8. Refund Policy */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section8.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section8.p1')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
                    {Array.isArray(section8Items) && section8Items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-gray-600">
                    {t('termsOfService.section8.p2')}
                  </p>
                </div>
              </div>
            </div>

            {/* 9. Intellectual Property */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section9.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section9.p1')}
                  </p>
                  <p className="text-gray-600">
                    {t('termsOfService.section9.p2')}
                  </p>
                </div>
              </div>
            </div>

            {/* 10. Limitation of Liability */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section10.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section10.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    {Array.isArray(section10Items) && section10Items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 11. Disclaimer of Warranties */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section11.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section11.p1')}
                  </p>
                  <p className="text-gray-600">
                    {t('termsOfService.section11.p2')}
                  </p>
                </div>
              </div>
            </div>

            {/* 12. Indemnification */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section12.title')}</h2>
                  <p className="text-gray-600">
                    {t('termsOfService.section12.content')}
                  </p>
                </div>
              </div>
            </div>

            {/* 13. Termination */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Ban className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section13.title')}</h2>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section13.subsection1.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section13.subsection1.content')}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('termsOfService.section13.subsection2.title')}</h3>
                  <p className="text-gray-600">
                    {t('termsOfService.section13.subsection2.content')}
                  </p>
                </div>
              </div>
            </div>

            {/* 14. Governing Law */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Gavel className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section14.title')}</h2>
                  <p className="text-gray-600">
                    {t('termsOfService.section14.content')}
                  </p>
                </div>
              </div>
            </div>

            {/* 15. Changes to Terms */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section15.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section15.p1')}
                  </p>
                  <p className="text-gray-600">
                    {t('termsOfService.section15.p2')}
                  </p>
                </div>
              </div>
            </div>

            {/* 16. Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOfService.section16.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('termsOfService.section16.intro')}
                  </p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong className="text-gray-900">{t('termsOfService.section16.email')}</strong> support@mobile11.com</p>
                    <p><strong className="text-gray-900">{t('termsOfService.section16.phone')}</strong> 1605</p>
                    <p><strong className="text-gray-900">{t('termsOfService.section16.address')}</strong> {t('termsOfService.section16.addressValue')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-gray-600">
                {t('termsOfService.footer')}
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">{t('common.needHelp')}</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {t('support.contactDescription')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Link to="/support">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                      {t('common.contactSupport')}
                    </Button>
                  </Link>
                  <Link to="/packages">
                    <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      {t('common.browsePackages')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}