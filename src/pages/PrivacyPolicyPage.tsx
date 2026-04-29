// Privacy Policy Page - Airalo-style Beige Theme
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Lock, Eye, FileText, Globe, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Back to Home Navigation */}
      <div className="container py-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            {t('privacyPolicy.backToHome')}
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-orange-50 via-[#FAF7F2] to-amber-50/30">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              {t('privacyPolicy.badge')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              {t('privacyPolicy.title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('privacyPolicy.lastUpdated')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Section 1: Introduction */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section1.title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('privacyPolicy.section1.p1')}</p>
              <p className="text-gray-600 leading-relaxed">{t('privacyPolicy.section1.p2')}</p>
            </div>

            {/* Section 2: Definitions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section2.title')}</h2>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section2.account')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section2.accountDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section2.customer')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section2.customerDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section2.device')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section2.deviceDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section2.esim')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section2.esimDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section2.personalData')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section2.personalDataDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section2.services')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section2.servicesDesc')}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Information We Collect */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Eye className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section3.title')}</h2>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section3.personalInfo')}</h3>
              <p className="text-gray-600">{t('privacyPolicy.section3.personalInfoDesc')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section3.personalInfoItems')) && 
                  (t('privacyPolicy.section3.personalInfoItems') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section3.accountInfo')}</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section3.accountInfoItems')) && 
                  (t('privacyPolicy.section3.accountInfoItems') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section3.deviceInfo')}</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section3.deviceInfoItems')) && 
                  (t('privacyPolicy.section3.deviceInfoItems') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section3.usageInfo')}</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section3.usageInfoItems')) && 
                  (t('privacyPolicy.section3.usageInfoItems') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section3.transactionInfo')}</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section3.transactionInfoItems')) && 
                  (t('privacyPolicy.section3.transactionInfoItems') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section3.communicationData')}</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section3.communicationDataItems')) && 
                  (t('privacyPolicy.section3.communicationDataItems') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
            </div>

            {/* Section 4: How We Use Your Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section4.title')}</h2>
              <p className="text-gray-600">{t('privacyPolicy.section4.intro')}</p>
              
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section4.serviceProvision')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section4.serviceProvisionDesc')}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section4.customerSupport')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section4.customerSupportDesc')}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section4.paymentProcessing')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section4.paymentProcessingDesc')}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section4.personalization')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section4.personalizationDesc')}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section4.communication')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section4.communicationDesc')}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section4.security')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section4.securityDesc')}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section4.legalCompliance')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section4.legalComplianceDesc')}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section4.analytics')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section4.analyticsDesc')}</p>
                </div>
              </div>
            </div>

            {/* Section 5: Legal Basis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section5.title')}</h2>
              </div>
              <p className="text-gray-600">{t('privacyPolicy.section5.intro')}</p>
              
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section5.consent')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section5.consentDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section5.contractPerformance')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section5.contractPerformanceDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section5.legalObligations')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section5.legalObligationsDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section5.legitimateInterests')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section5.legitimateInterestsDesc')}</p>
                </div>
              </div>
            </div>

            {/* Section 6: Information Sharing */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section6.title')}</h2>
              </div>
              <p className="text-gray-600">{t('privacyPolicy.section6.intro')}</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section6.serviceProviders')}</h3>
              <p className="text-gray-600">{t('privacyPolicy.section6.serviceProvidersDesc')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section6.serviceProvidersItems')) && 
                  (t('privacyPolicy.section6.serviceProvidersItems') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section6.businessPartners')}</h3>
              <p className="text-gray-600">{t('privacyPolicy.section6.businessPartnersDesc')}</p>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section6.legalRequirements')}</h3>
              <p className="text-gray-600">{t('privacyPolicy.section6.legalRequirementsDesc')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section6.legalRequirementsItems')) && 
                  (t('privacyPolicy.section6.legalRequirementsItems') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">{t('privacyPolicy.section6.businessTransfers')}</h3>
              <p className="text-gray-600">{t('privacyPolicy.section6.businessTransfersDesc')}</p>

              <div className="mt-6 p-4 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-gray-900 font-semibold">{t('privacyPolicy.section6.noSelling')}</p>
              </div>
            </div>

            {/* Section 7: Data Retention */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section7.title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('privacyPolicy.section7.intro')}</p>
              
              <div className="space-y-3 mt-4">
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section7.accountData')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section7.accountDataDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section7.transactionRecords')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section7.transactionRecordsDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section7.usageData')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section7.usageDataDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section7.supportComms')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section7.supportCommsDesc')}</p>
                </div>
              </div>
              <p className="text-gray-600 mt-4">{t('privacyPolicy.section7.deletion')}</p>
            </div>

            {/* Section 8: Your Rights */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section8.title')}</h2>
              <p className="text-gray-600">{t('privacyPolicy.section8.intro')}</p>
              
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section8.access')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section8.accessDesc')}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section8.correction')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section8.correctionDesc')}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section8.deletion')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section8.deletionDesc')}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section8.portability')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section8.portabilityDesc')}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section8.restrict')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section8.restrictDesc')}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section8.object')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section8.objectDesc')}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacyPolicy.section8.withdraw')}</h3>
                  <p className="text-gray-600">{t('privacyPolicy.section8.withdrawDesc')}</p>
                </div>
              </div>
              <p className="text-gray-600 mt-4">{t('privacyPolicy.section8.exercise')}</p>
            </div>

            {/* Section 9: Data Security */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section9.title')}</h2>
              </div>
              <p className="text-gray-600">{t('privacyPolicy.section9.intro')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section9.items')) && 
                  (t('privacyPolicy.section9.items') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="text-gray-600 mt-4">{t('privacyPolicy.section9.disclaimer')}</p>
            </div>

            {/* Section 10: International Data Transfers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section10.title')}</h2>
              </div>
              <p className="text-gray-600">{t('privacyPolicy.section10.p1')}</p>
              <p className="text-gray-600">{t('privacyPolicy.section10.p2')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section10.items')) && 
                  (t('privacyPolicy.section10.items') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="text-gray-600 mt-4">{t('privacyPolicy.section10.p3')}</p>
            </div>

            {/* Section 11: Cookies */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section11.title')}</h2>
              <p className="text-gray-600">{t('privacyPolicy.section11.intro')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section11.items')) && 
                  (t('privacyPolicy.section11.items') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="text-gray-600 mt-4">{t('privacyPolicy.section11.manage')}</p>
            </div>

            {/* Section 12: Third-Party Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section12.title')}</h2>
              <p className="text-gray-600">{t('privacyPolicy.section12.content')}</p>
            </div>

            {/* Section 13: Children's Privacy */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section13.title')}</h2>
              <p className="text-gray-600">{t('privacyPolicy.section13.content')}</p>
            </div>

            {/* Section 14: Changes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section14.title')}</h2>
              <p className="text-gray-600">{t('privacyPolicy.section14.p1')}</p>
              <p className="text-gray-600">{t('privacyPolicy.section14.p2')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {Array.isArray(t('privacyPolicy.section14.items')) && 
                  (t('privacyPolicy.section14.items') as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="text-gray-600 mt-4">{t('privacyPolicy.section14.p3')}</p>
            </div>

            {/* Section 15: Contact */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('privacyPolicy.section15.title')}</h2>
              <p className="text-gray-600">{t('privacyPolicy.section15.intro')}</p>
              
              <div className="mt-6 p-6 rounded-lg bg-gray-50 space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section15.email')}</p>
                  <a href="mailto:support@mobile11.com" className="text-orange-600 hover:underline">support@mobile11.com</a>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section15.phone')}</p>
                  <a href="tel:1605" className="text-orange-600 hover:underline">1605</a>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('privacyPolicy.section15.responseTime')}</p>
                  <p className="text-gray-600">{t('privacyPolicy.section15.responseTimeDesc')}</p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                {t('privacyPolicy.footer')}
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
