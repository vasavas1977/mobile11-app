// Data Deletion Instructions Page - Required for Meta App Review
import { useLanguage } from '@/contexts/LanguageContext';
import { Trash2, Lock, FileText, Clock, Mail, Shield, ArrowLeft, CheckCircle, BookOpen, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO, getBreadcrumbStructuredData } from '@/components/SEO';
import { RelatedPages } from '@/components/seo/RelatedPages';

 const BASE_URL = 'https://mobile11.com';
 
 export default function DataDeletionPage() {
   const { t } = useLanguage();
 
   return (
      <>
      <SEO
        title="Data Deletion Request"
        description="Learn how to request deletion of your personal data from Mobile11. We respect your privacy and make it easy to manage your data."
        canonical={`${BASE_URL}/data-deletion`}
        keywords={['data deletion', 'privacy', 'gdpr', 'personal data']}
        structuredData={getBreadcrumbStructuredData([
          { name: 'Home', url: BASE_URL },
          { name: 'Data Deletion', url: `${BASE_URL}/data-deletion` },
        ])}
      />
      <div className="min-h-screen bg-[#FAF7F2]">
       {/* Back to Home Navigation */}
       <div className="container py-4">
         <Link to="/">
           <Button variant="ghost" size="sm" className="gap-2 text-gray-700 hover:text-gray-900">
             <ArrowLeft className="h-4 w-4" />
             {t('dataDeletion.backToHome')}
           </Button>
         </Link>
       </div>
 
       {/* Hero Section */}
       <section className="relative py-16 bg-gradient-to-br from-orange-50 via-[#FAF7F2] to-amber-50/30">
         <div className="container">
           <div className="max-w-4xl mx-auto text-center space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-medium mb-4">
               <Trash2 className="h-4 w-4" />
               {t('dataDeletion.badge')}
             </div>
             <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
               {t('dataDeletion.title')}
             </h1>
             <p className="text-lg text-gray-600">
               {t('dataDeletion.lastUpdated')}
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
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 rounded-lg bg-orange-100">
                   <Shield className="h-6 w-6 text-orange-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">{t('dataDeletion.intro.title')}</h2>
               </div>
               <p className="text-gray-600 leading-relaxed">{t('dataDeletion.intro.p1')}</p>
               <p className="text-gray-600 leading-relaxed">{t('dataDeletion.intro.p2')}</p>
             </div>
 
             {/* Section 2: Types of Data */}
             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 rounded-lg bg-orange-100">
                   <FileText className="h-6 w-6 text-orange-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">{t('dataDeletion.dataTypes.title')}</h2>
               </div>
               <p className="text-gray-600">{t('dataDeletion.dataTypes.intro')}</p>
               <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                 {Array.isArray(t('dataDeletion.dataTypes.items')) && 
                   (t('dataDeletion.dataTypes.items') as string[]).map((item, i) => (
                     <li key={i}>{item}</li>
                   ))}
               </ul>
             </div>
 
             {/* Section 3: How to Request Deletion */}
             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 rounded-lg bg-orange-100">
                   <Mail className="h-6 w-6 text-orange-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">{t('dataDeletion.howTo.title')}</h2>
               </div>
               <p className="text-gray-600">{t('dataDeletion.howTo.intro')}</p>
               
               <div className="space-y-4 mt-4">
                 {Array.isArray(t('dataDeletion.howTo.steps')) && 
                   (t('dataDeletion.howTo.steps') as string[]).map((step, i) => (
                     <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                       <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                         {i + 1}
                       </div>
                       <p className="text-gray-700 mt-1">{step}</p>
                     </div>
                   ))}
               </div>
 
               <div className="mt-6 p-4 rounded-lg bg-orange-50 border border-orange-200">
                 <p className="text-gray-900 font-semibold">{t('dataDeletion.howTo.email')}</p>
                 <a href="mailto:support@mobile11.com" className="text-orange-600 hover:underline font-medium">
                   support@mobile11.com
                 </a>
               </div>
             </div>
 
             {/* Section 4: What Happens */}
             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 rounded-lg bg-orange-100">
                   <Clock className="h-6 w-6 text-orange-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">{t('dataDeletion.whatHappens.title')}</h2>
               </div>
               <p className="text-gray-600">{t('dataDeletion.whatHappens.intro')}</p>
               
               <div className="space-y-3 mt-4">
                 <div className="flex items-start gap-3">
                   <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                   <div>
                     <p className="font-semibold text-gray-900">{t('dataDeletion.whatHappens.timeline')}</p>
                     <p className="text-gray-600">{t('dataDeletion.whatHappens.timelineDesc')}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-3">
                   <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                   <div>
                     <p className="font-semibold text-gray-900">{t('dataDeletion.whatHappens.confirmation')}</p>
                     <p className="text-gray-600">{t('dataDeletion.whatHappens.confirmationDesc')}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-3">
                   <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                   <div>
                     <p className="font-semibold text-gray-900">{t('dataDeletion.whatHappens.permanent')}</p>
                     <p className="text-gray-600">{t('dataDeletion.whatHappens.permanentDesc')}</p>
                   </div>
                 </div>
               </div>
             </div>
 
             {/* Section 5: Data Retention */}
             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 rounded-lg bg-orange-100">
                   <Lock className="h-6 w-6 text-orange-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">{t('dataDeletion.retention.title')}</h2>
               </div>
               <p className="text-gray-600">{t('dataDeletion.retention.intro')}</p>
               <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                 {Array.isArray(t('dataDeletion.retention.items')) && 
                   (t('dataDeletion.retention.items') as string[]).map((item, i) => (
                     <li key={i}>{item}</li>
                   ))}
               </ul>
               <p className="text-gray-600 mt-4">{t('dataDeletion.retention.note')}</p>
             </div>
 
             {/* Section 6: FAQ */}
             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
               <h2 className="text-2xl font-bold text-gray-900">{t('dataDeletion.faq.title')}</h2>
               
               <div className="space-y-4 mt-4">
                 <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                   <h3 className="font-semibold text-gray-900 mb-2">{t('dataDeletion.faq.q1')}</h3>
                   <p className="text-gray-600">{t('dataDeletion.faq.a1')}</p>
                 </div>
                 <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                   <h3 className="font-semibold text-gray-900 mb-2">{t('dataDeletion.faq.q2')}</h3>
                   <p className="text-gray-600">{t('dataDeletion.faq.a2')}</p>
                 </div>
                 <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                   <h3 className="font-semibold text-gray-900 mb-2">{t('dataDeletion.faq.q3')}</h3>
                   <p className="text-gray-600">{t('dataDeletion.faq.a3')}</p>
                 </div>
                 <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                   <h3 className="font-semibold text-gray-900 mb-2">{t('dataDeletion.faq.q4')}</h3>
                   <p className="text-gray-600">{t('dataDeletion.faq.a4')}</p>
                 </div>
               </div>
             </div>
 
             {/* Contact CTA */}
             <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 text-center text-white">
               <h2 className="text-2xl font-bold mb-4">{t('dataDeletion.contact.title')}</h2>
               <p className="mb-6 opacity-90">{t('dataDeletion.contact.description')}</p>
               <div className="flex flex-wrap justify-center gap-4">
                 <Link to="/support">
                   <Button variant="secondary" size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                     {t('dataDeletion.contact.support')}
                   </Button>
                 </Link>
                 <Link to="/privacy-policy">
                   <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                     {t('dataDeletion.contact.privacy')}
                   </Button>
                 </Link>
               </div>
             </div>
 
          </div>
        </div>
      </section>

      <RelatedPages
        items={[
          { to: '/privacy-policy', titleEn: 'Privacy Policy', titleTh: 'นโยบายความเป็นส่วนตัว', descriptionEn: 'Read our full privacy policy', descriptionTh: 'อ่านนโยบายความเป็นส่วนตัวฉบับเต็ม', icon: Lock },
          { to: '/contact', titleEn: 'Contact Us', titleTh: 'ติดต่อเรา', descriptionEn: 'Get in touch with our team', descriptionTh: 'ติดต่อทีมงานของเรา', icon: Mail },
          { to: '/support', titleEn: 'Help Center', titleTh: 'ศูนย์ช่วยเหลือ', descriptionEn: 'Find answers to common questions', descriptionTh: 'ค้นหาคำตอบสำหรับคำถามที่พบบ่อย', icon: HelpCircle },
        ]}
      />
     </div>
     </>
  );
}