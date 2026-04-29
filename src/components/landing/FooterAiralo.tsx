import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import AnimatedWatermark from './AnimatedWatermark';
import FooterDecorations from './FooterDecorations';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

// LINE icon component
const LineIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const FooterAiralo: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const columns: FooterColumn[] = [
    {
      title: t('footer.airalo.ourEsims') || 'Our eSIMs',
      links: [
        { label: t('footer.airalo.esimStore') || 'eSIM Store', href: '/packages' },
        { label: t('footer.airalo.unlimitedData') || 'Unlimited data', href: '/limitless' },
        { label: t('footer.airalo.regionalEsims') || 'Regional eSIMs', href: '/packages?region=all' },
        { label: t('footer.airalo.localEsims') || 'Local eSIMs', href: '/packages?type=local' },
        { label: t('footer.airalo.referAndEarn') || 'Refer and earn', href: '/refer-and-earn' },
      ],
    },
    {
      title: t('footer.airalo.aboutEsims') || 'About eSIMs',
      links: [
        { label: t('footer.airalo.whatIsEsim') || 'What is an eSIM?', href: '/what-is-esim' },
        { label: t('footer.airalo.howItWorks') || 'How mobile11 works', href: '/how-it-works' },
        { label: t('footer.airalo.compatibility') || 'Device compatibility', href: '/what-is-esim?tab=compatibility' },
      ],
    },
    {
      title: t('footer.airalo.getHelp') || 'Get help',
      links: [
        { label: t('footer.airalo.helpCenter') || 'Help center', href: '/support' },
        { label: t('footer.airalo.contactUs') || 'Contact us', href: '/contact' },
      ],
    },
    {
      title: t('footer.airalo.magazine') || 'Blog',
      links: [
        { label: t('footer.airalo.latestPosts') || 'Latest posts', href: '/blog' },
      ],
    },
    {
      title: 'mobile11',
      links: [
        { label: t('footer.airalo.aboutMobile11') || 'About mobile11', href: '/about' },
        { label: t('footer.airalo.ourValues') || 'Our values', href: '/our-values' },
        { label: t('footer.airalo.partnerProgram') || 'Partner program', href: '/affiliate' },
        { label: t('footer.airalo.forBusiness') || 'For Business', href: '/business' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/mobile11esim', label: 'Facebook' },
    { icon: Instagram, href: 'https://www.instagram.com/mobile11.esim?igsh=MThlaml1ZHZ4OG1ybg==', label: 'Instagram' },
    { icon: Twitter, href: 'https://x.com/mobile11_esim', label: 'X' },
    { icon: TikTokIcon, href: 'https://www.tiktok.com/@mobile11.esim', label: 'TikTok' },
    { icon: LineIcon, href: 'https://page.line.me/uqg9891p', label: 'LINE' },
    { icon: Youtube, href: 'https://www.youtube.com/@eSIM.mobile11', label: 'YouTube' },
  ];

  const bottomLinks = [
    { label: t('footer.legal.privacyPolicy') || 'Privacy policy', href: '/privacy-policy' },
    { label: t('footer.legal.termsOfService') || 'Terms of service', href: '/terms-of-service' },
     { label: t('footer.legal.dataDeletion') || 'Data deletion', href: '/data-deletion' },
    { label: t('footer.airalo.partnerWithUs') || 'Partner with us', href: '/affiliate' },
  ];

  return (
    <footer className="relative bg-[#FAF7F2] overflow-hidden">
      {/* Decorative diamond elements in corners */}
      <FooterDecorations />
      
      {/* Main footer content - links section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Mobile accordion layout */}
        <div className="block md:hidden">
          <Accordion type="single" collapsible className="w-full">
            {columns.map((column, index) => (
              <AccordionItem 
                key={column.title} 
                value={`item-${index}`}
                className="border-b border-gray-200"
              >
                <AccordionTrigger className="py-4 text-base font-semibold text-gray-900 hover:no-underline">
                  {column.title}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-500 transition-colors text-sm"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            to={link.href}
                            className="text-gray-600 hover:text-orange-500 transition-colors text-sm"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
            
            {/* Follow us accordion item */}
            <AccordionItem 
              value="follow-us"
              className="border-b border-gray-200"
            >
              <AccordionTrigger className="py-4 text-base font-semibold text-gray-900 hover:no-underline">
                {t('footer.airalo.followUs') || 'Follow us'}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ul className="space-y-3">
                  {socialLinks.map((social) => (
                    <li key={social.label}>
                      {social.href ? (
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors text-sm"
                        >
                          <social.icon className="w-4 h-4" />
                          {social.label}
                        </a>
                      ) : (
                        <span className="flex items-center gap-2 text-gray-400 text-sm cursor-default">
                          <social.icon className="w-4 h-4" />
                          {social.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Desktop grid layout */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide border-b border-gray-300 pb-2">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-orange-500 transition-colors text-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-gray-600 hover:text-orange-500 transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Social links column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide border-b border-gray-300 pb-2">
              {t('footer.airalo.followUs') || 'Follow us'}
            </h3>
            <ul className="space-y-2">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  {social.href ? (
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors text-sm group"
                    >
                      <social.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      {social.label}
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-gray-400 text-sm cursor-default">
                      <social.icon className="w-4 h-4" />
                      {social.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Big "mobile11" illustration scene */}
      <AnimatedWatermark />
      
      {/* Bottom bar with copyright and legal links - BELOW the illustration */}
      <div className="relative z-10 bg-[#FAF7F2] border-t border-gray-300/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-sm text-gray-500">
            <span>© {currentYear} MOBILE11</span>
            {bottomLinks.map((link) => (
              <React.Fragment key={link.label}>
                <Link
                  to={link.href}
                  className="hover:text-orange-500 transition-colors"
                >
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterAiralo;
