import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Printer, Smartphone, QrCode, Settings, BookOpen, Globe, HelpCircle } from "lucide-react";
import { SEO, getFAQStructuredData, getBreadcrumbStructuredData } from "@/components/SEO";
import { RelatedPages } from '@/components/seo/RelatedPages';

const BASE_URL = 'https://mobile11.com';

const InstallationGuidePage = () => {
  const { t, language } = useLanguage();

  const faqData = [
    { question: t('installationGuide.troubleshooting.issue1.title'), answer: t('installationGuide.troubleshooting.issue1.solution') },
    { question: t('installationGuide.troubleshooting.issue2.title'), answer: t('installationGuide.troubleshooting.issue2.solution') },
    { question: t('installationGuide.troubleshooting.issue3.title'), answer: t('installationGuide.troubleshooting.issue3.solution') },
  ].filter(f => typeof f.question === 'string' && typeof f.answer === 'string');

  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Installation Guide', url: `${BASE_URL}/installation-guide` },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <SEO
        title={t('installGuide.seoTitle')}
        description={t('installGuide.seoDescription')}
        canonical={`${BASE_URL}/installation-guide`}
        keywords={['esim installation', 'install esim', 'esim setup', 'qr code esim', 'esim iphone', 'esim android']}
        structuredData={[
          ...(faqData.length > 0 ? [getFAQStructuredData(faqData)] : []),
          getBreadcrumbStructuredData(breadcrumbs),
        ]}
      />
    <div className="min-h-screen bg-background">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          {t('installationGuide.printButton')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12 px-6 print:py-8">
        {/* Header */}
        <div className="text-center mb-12 print:mb-8">
          <h1 className="text-4xl font-bold mb-4 print:text-3xl">
            {t('installationGuide.title')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('installationGuide.subtitle')}
          </p>
        </div>

        {/* iOS Installation */}
        <section className="mb-12 print:mb-8 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold print:text-xl">
              {t('installationGuide.ios.title')}
            </h2>
          </div>

          <div className="space-y-6">
            <div className="pl-6 border-l-2 border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                {t('installationGuide.ios.step1.title')}
              </h3>
              <p className="text-muted-foreground">{t('installationGuide.ios.step1.description')}</p>
            </div>

            <div className="pl-6 border-l-2 border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                {t('installationGuide.ios.step2.title')}
              </h3>
              <p className="text-muted-foreground">{t('installationGuide.ios.step2.description')}</p>
            </div>

            <div className="pl-6 border-l-2 border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                {t('installationGuide.ios.step3.title')}
              </h3>
              <p className="text-muted-foreground">{t('installationGuide.ios.step3.description')}</p>
            </div>

            <div className="pl-6 border-l-2 border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">4</span>
                {t('installationGuide.ios.step4.title')}
              </h3>
              <p className="text-muted-foreground">{t('installationGuide.ios.step4.description')}</p>
            </div>
          </div>
        </section>

        {/* Android Installation */}
        <section className="mb-12 print:mb-8 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold print:text-xl">
              {t('installationGuide.android.title')}
            </h2>
          </div>

          <div className="space-y-6">
            <div className="pl-6 border-l-2 border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                {t('installationGuide.android.step1.title')}
              </h3>
              <p className="text-muted-foreground">{t('installationGuide.android.step1.description')}</p>
            </div>

            <div className="pl-6 border-l-2 border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                {t('installationGuide.android.step2.title')}
              </h3>
              <p className="text-muted-foreground">{t('installationGuide.android.step2.description')}</p>
            </div>

            <div className="pl-6 border-l-2 border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                {t('installationGuide.android.step3.title')}
              </h3>
              <p className="text-muted-foreground">{t('installationGuide.android.step3.description')}</p>
            </div>

            <div className="pl-6 border-l-2 border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">4</span>
                {t('installationGuide.android.step4.title')}
              </h3>
              <p className="text-muted-foreground">{t('installationGuide.android.step4.description')}</p>
            </div>
          </div>
        </section>

        {/* Activation */}
        <section className="mb-12 print:mb-8 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold print:text-xl">
              {t('installationGuide.activation.title')}
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">{t('installationGuide.activation.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li>{t('installationGuide.activation.tip1')}</li>
              <li>{t('installationGuide.activation.tip2')}</li>
              <li>{t('installationGuide.activation.tip3')}</li>
            </ul>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="print:break-inside-avoid">
          <h2 className="text-2xl font-bold mb-6 print:text-xl">
            {t('installationGuide.troubleshooting.title')}
          </h2>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('installationGuide.troubleshooting.issue1.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('installationGuide.troubleshooting.issue1.solution')}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('installationGuide.troubleshooting.issue2.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('installationGuide.troubleshooting.issue2.solution')}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('installationGuide.troubleshooting.issue3.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('installationGuide.troubleshooting.issue3.solution')}</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground print:mt-8">
          <p>{t('installationGuide.footer.support')}</p>
          <p className="mt-2">{t('installationGuide.footer.contact')}</p>
        </div>
      </div>

      <RelatedPages
        items={[
          { to: '/how-it-works', titleEn: 'How It Works', titleTh: 'วิธีการทำงาน', descriptionEn: 'Learn how Mobile11 works in 3 easy steps', descriptionTh: 'เรียนรู้วิธีการทำงานของ Mobile11 ใน 3 ขั้นตอน', icon: HelpCircle },
          { to: '/what-is-esim', titleEn: 'What is an eSIM?', titleTh: 'eSIM คืออะไร?', descriptionEn: 'Learn the basics of eSIM technology', descriptionTh: 'เรียนรู้พื้นฐานเทคโนโลยี eSIM', icon: Smartphone },
          { to: '/packages', titleEn: 'Browse Packages', titleTh: 'ดูแพ็คเกจทั้งหมด', descriptionEn: 'Find the perfect eSIM plan for your trip', descriptionTh: 'ค้นหาแพ็คเกจ eSIM ที่เหมาะกับทริปของคุณ', icon: Globe },
        ]}
      />
    </div>
    </>
  );
};

export default InstallationGuidePage;
