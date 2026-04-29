import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, XCircle, Clock, Mail, Phone, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export default function RefundPolicyPage() {
  const { t } = useLanguage();

  const section1UnactivatedItems = t('refundPolicy.section1.subsection1.items') as unknown as string[];
  const section2Items = t('refundPolicy.section2.items') as unknown as string[];
  const section3Items = t('refundPolicy.section3.items') as unknown as string[];
  const section6ProcessingItems = t('refundPolicy.section6.subsection1.items') as unknown as string[];
  const section7Items = t('refundPolicy.section7.items') as unknown as string[];

  return (
    <div className="min-h-screen bg-background">
      {/* Back to Home Button */}
      <div className="container pt-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('refundPolicy.backToHome')}
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('refundPolicy.badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              {t('refundPolicy.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('refundPolicy.lastUpdated')}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Introduction */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg text-muted-foreground">
                {t('refundPolicy.intro')}
              </p>
            </div>

            {/* 1. General Refund Eligibility */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section1.title')}</h2>
                  <p className="text-muted-foreground mb-4">
                    {t('refundPolicy.section1.p1')}
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {t('refundPolicy.section1.subsection1.title')}
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                    {Array.isArray(section1UnactivatedItems) && section1UnactivatedItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    {t('refundPolicy.section1.subsection2.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('refundPolicy.section1.subsection2.content')}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Non-Refundable Situations */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section2.title')}</h2>
                  <p className="text-muted-foreground mb-4">
                    {t('refundPolicy.section2.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    {Array.isArray(section2Items) && section2Items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. Technical Issue Refunds */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section3.title')}</h2>
                  <p className="text-muted-foreground mb-4">
                    {t('refundPolicy.section3.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                    {Array.isArray(section3Items) && section3Items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {t('refundPolicy.section3.p2')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Promotional Purchases */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section4.title')}</h2>
                  <p className="text-muted-foreground">
                    {t('refundPolicy.section4.content')}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. How to Request a Refund */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section5.title')}</h2>
                  <p className="text-muted-foreground mb-4">
                    {t('refundPolicy.section5.intro')}
                  </p>
                  <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
                    <li>{t('refundPolicy.section5.step1')}</li>
                    <li>{t('refundPolicy.section5.step2')}</li>
                    <li>{t('refundPolicy.section5.step3')}</li>
                    <li>{t('refundPolicy.section5.step4')}</li>
                  </ol>
                  <p className="text-muted-foreground mt-4">
                    {t('refundPolicy.section5.p2')}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Refund Processing */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section6.title')}</h2>
                  
                  <h3 className="text-lg font-semibold mb-2">{t('refundPolicy.section6.subsection1.title')}</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                    {Array.isArray(section6ProcessingItems) && section6ProcessingItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  
                  <h3 className="text-lg font-semibold mb-2">{t('refundPolicy.section6.subsection2.title')}</h3>
                  <p className="text-muted-foreground">
                    {t('refundPolicy.section6.subsection2.content')}
                  </p>
                </div>
              </div>
            </div>

            {/* 7. Partial Refunds */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section7.title')}</h2>
                  <p className="text-muted-foreground mb-4">
                    {t('refundPolicy.section7.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    {Array.isArray(section7Items) && section7Items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 8. Chargebacks */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section8.title')}</h2>
                  <p className="text-muted-foreground mb-4">
                    {t('refundPolicy.section8.p1')}
                  </p>
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {t('refundPolicy.section8.p2')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 9. Contact Us */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">{t('refundPolicy.section9.title')}</h2>
                  <p className="text-muted-foreground mb-4">
                    {t('refundPolicy.section9.intro')}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{t('refundPolicy.section9.email')}</p>
                        <a href="mailto:support@mobile11.com" className="text-primary hover:underline">
                          support@mobile11.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{t('refundPolicy.section9.phone')}</p>
                        <a href="tel:1605" className="text-primary hover:underline">
                          1605
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('refundPolicy.section9.responseTime')}</strong> {t('refundPolicy.section9.responseTimeValue')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border/50 text-center">
              <p className="text-muted-foreground">
                {t('refundPolicy.footer')}
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-border/50">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">{t('common.needHelp')}</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {t('support.contactDescription')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Link to="/support">
                    <Button size="lg">
                      {t('common.contactSupport')}
                    </Button>
                  </Link>
                  <Link to="/terms-of-service">
                    <Button variant="outline" size="lg">
                      {t('footer.legal.termsOfService')}
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