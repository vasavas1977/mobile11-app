import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { FooterAiralo } from '@/components/landing/FooterAiralo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCircle, Smartphone, Globe, CreditCard, Settings, Download, CheckCircle, ArrowRight, Search, X, Loader2, MessageCircle, Mail, Phone, ChevronDown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LottieAnimation } from '@/components/landing-v2/LottieAnimation';

export function SupportPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | undefined>();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY * 0.3);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  });

  // Click outside handler for search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle deep linking to Device & Compatibility section
  useEffect(() => {
    if (window.location.hash === '#device-compatibility') {
      // Wait for DOM to render
      setTimeout(() => {
        const element = document.getElementById('faq-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Auto-expand FAQ item-14 (Device & Compatibility)
          setExpandedFaq('item-14');
        }
      }, 100);
    }
  }, []);

  // Structured FAQ data for search functionality - All 26 items matching accordion
  const faqData = [
    // Installation & Activation (7 items)
    { id: 'item-1', category: t('support.faq.categories.installation'), question: t('support.faq.installation.q1.question'), answer: t('support.faq.installation.q1.answer') },
    { id: 'item-2', category: t('support.faq.categories.installation'), question: t('support.faq.installation.q2.question'), answer: t('support.faq.installation.q2.answer') },
    { id: 'item-3', category: t('support.faq.categories.installation'), question: t('support.faq.installation.q3.question'), answer: t('support.faq.installation.q3.answer') },
    { id: 'item-4', category: t('support.faq.categories.installation'), question: t('support.faq.installation.q4.question'), answer: t('support.faq.installation.q4.answer') },
    { id: 'item-5', category: t('support.faq.categories.installation'), question: t('support.faq.installation.q5.question'), answer: t('support.faq.installation.q5.answer') },
    { id: 'item-6', category: t('support.faq.categories.installation'), question: t('support.faq.installation.q6.question'), answer: t('support.faq.installation.q6.answer') },
    { id: 'item-7', category: t('support.faq.categories.installation'), question: t('support.faq.installation.q7.question'), answer: t('support.faq.installation.q7.answer') },
    
    // Usage & Data (6 items)
    { id: 'item-8', category: t('support.faq.categories.usage'), question: t('support.faq.usage.q1.question'), answer: t('support.faq.usage.q1.answer') },
    { id: 'item-9', category: t('support.faq.categories.usage'), question: t('support.faq.usage.q2.question'), answer: t('support.faq.usage.q2.answer') },
    { id: 'item-10', category: t('support.faq.categories.usage'), question: t('support.faq.usage.q3.question'), answer: t('support.faq.usage.q3.answer') },
    { id: 'item-11', category: t('support.faq.categories.usage'), question: t('support.faq.usage.q4.question'), answer: t('support.faq.usage.q4.answer') },
    { id: 'item-12', category: t('support.faq.categories.usage'), question: t('support.faq.usage.q5.question'), answer: t('support.faq.usage.q5.answer') },
    { id: 'item-13', category: t('support.faq.categories.usage'), question: t('support.faq.usage.q6.question'), answer: t('support.faq.usage.q6.answer') },
    
    // Device & Compatibility (3 items)
    { id: 'item-14', category: t('support.faq.categories.device'), question: t('support.faq.device.q1.question'), answer: t('support.faq.device.q1.answer') },
    { id: 'item-15', category: t('support.faq.categories.device'), question: t('support.faq.device.q2.question'), answer: t('support.faq.device.q2.answer') },
    { id: 'item-16', category: t('support.faq.categories.device'), question: t('support.faq.device.q3.question'), answer: t('support.faq.device.q3.answer') },
    
    // Troubleshooting (3 items)
    { id: 'item-17', category: t('support.faq.categories.troubleshooting'), question: t('support.faq.troubleshooting.q1.question'), answer: t('support.faq.troubleshooting.q1.answer') },
    { id: 'item-18', category: t('support.faq.categories.troubleshooting'), question: t('support.faq.troubleshooting.q2.question'), answer: t('support.faq.troubleshooting.q2.answer') },
    { id: 'item-19', category: t('support.faq.categories.troubleshooting'), question: t('support.faq.troubleshooting.q3.question'), answer: t('support.faq.troubleshooting.q3.answer') },
    
    // eSIM Management (4 items)
    { id: 'item-20', category: t('support.faq.categories.management'), question: t('support.faq.management.q1.question'), answer: t('support.faq.management.q1.answer') },
    { id: 'item-21', category: t('support.faq.categories.management'), question: t('support.faq.management.q2.question'), answer: t('support.faq.management.q2.answer') },
    { id: 'item-22', category: t('support.faq.categories.management'), question: t('support.faq.management.q3.question'), answer: t('support.faq.management.q3.answer') },
    { id: 'item-23', category: t('support.faq.categories.management'), question: t('support.faq.management.q4.question'), answer: t('support.faq.management.q4.answer') },
    
    // Support & Billing (3 items)
    { id: 'item-24', category: t('support.faq.categories.billing'), question: t('support.faq.billing.q1.question'), answer: t('support.faq.billing.q1.answer') },
    { id: 'item-25', category: t('support.faq.categories.billing'), question: t('support.faq.billing.q2.question'), answer: t('support.faq.billing.q2.answer') },
    { id: 'item-26', category: t('support.faq.categories.billing'), question: t('support.faq.billing.q3.question'), answer: t('support.faq.billing.q3.answer') },
    
    // Affiliate & Partner Program (6 items)
    { id: 'item-27', category: t('support.faq.categories.affiliate'), question: t('support.faq.affiliate.q1.question'), answer: t('support.faq.affiliate.q1.answer') },
    { id: 'item-28', category: t('support.faq.categories.affiliate'), question: t('support.faq.affiliate.q2.question'), answer: t('support.faq.affiliate.q2.answer') },
    { id: 'item-29', category: t('support.faq.categories.affiliate'), question: t('support.faq.affiliate.q3.question'), answer: t('support.faq.affiliate.q3.answer') },
    { id: 'item-30', category: t('support.faq.categories.affiliate'), question: t('support.faq.affiliate.q4.question'), answer: t('support.faq.affiliate.q4.answer') },
    { id: 'item-31', category: t('support.faq.categories.affiliate'), question: t('support.faq.affiliate.q5.question'), answer: t('support.faq.affiliate.q5.answer') },
    { id: 'item-32', category: t('support.faq.categories.affiliate'), question: t('support.faq.affiliate.q6.question'), answer: t('support.faq.affiliate.q6.answer') },
    
    // Account & Login (4 items)
    { id: 'item-33', category: t('support.faq.categories.account'), question: t('support.faq.account.q1.question'), answer: t('support.faq.account.q1.answer') },
    { id: 'item-34', category: t('support.faq.categories.account'), question: t('support.faq.account.q2.question'), answer: t('support.faq.account.q2.answer') },
    { id: 'item-35', category: t('support.faq.categories.account'), question: t('support.faq.account.q3.question'), answer: t('support.faq.account.q3.answer') },
    { id: 'item-36', category: t('support.faq.categories.account'), question: t('support.faq.account.q4.question'), answer: t('support.faq.account.q4.answer') },
  ];

  const filteredFaqs = searchQuery 
    ? faqData.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqData;

  // Highlight matching text in search results
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark> : part
    );
  };

  // Keyboard navigation for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchResults || filteredFaqs.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, Math.min(filteredFaqs.length - 1, 7)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const faq = filteredFaqs[selectedIndex];
      scrollToFaq(faq.id);
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSelectedIndex(-1);
    }
  };

  // Scroll to FAQ and expand
  const scrollToFaq = (faqId: string) => {
    const element = document.getElementById(faqId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setExpandedFaq(faqId);
    }
    setShowSearchResults(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  // Scroll to category
  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-ticket', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: t('support.toast.ticketCreated'),
        description: t('support.toast.ticketCreatedDesc'),
      });
      
      setFormData({ name: "", email: "", subject: "", message: "", priority: "medium", category: "general" });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: t('support.toast.error'),
        description: t('support.toast.errorDesc'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[60vh] flex items-center bg-[#FAF7F2]">
        {/* Floating Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full opacity-60 animate-pulse" />
          <div className="absolute top-40 right-20 w-6 h-6 bg-amber-300 rotate-45 opacity-50" />
          <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-orange-300 rounded-full opacity-40" />
          <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-yellow-400 rotate-45 opacity-30" />
          <div className="absolute bottom-20 right-10 w-4 h-4 bg-orange-500 rounded-full opacity-50 animate-pulse" />
        </div>
        
        <div className="container relative py-20 z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <div className="text-center md:text-left space-y-6">
              <Badge className="bg-orange-100 text-orange-600 border-orange-200 rounded-full px-4 py-2">
                {t('support.badge')}
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl font-black leading-tight">
                <span className="text-gray-900">{t('support.hero.title')} </span>
                <span className="text-orange-500">{t('support.hero.titleHighlight')}</span>
              </h1>
              
              <p className="text-lg text-gray-600 max-w-xl">
                {t('support.hero.description')}
              </p>

              {/* Quick Contact Options */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Button 
                  variant="outline" 
                  className="gap-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => window.location.href = 'mailto:support@mobile11.com'}
                >
                  <Mail className="h-4 w-4" />
                  {t('support.hero.email')}
                </Button>
                <Button 
                  className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => scrollToCategory('faq-section')}
                >
                  <HelpCircle className="h-4 w-4" />
                  {t('support.hero.browseFaq')}
                </Button>
              </div>
            </div>

            {/* Lottie Animation */}
            <div className="flex justify-center">
              <div className="w-full max-w-md lg:max-w-lg">
                <LottieAnimation
                  src="/assets/lottie/team.lottie"
                  className="w-full h-auto"
                  devicePixelRatio={2}
                  speed={0.85}
                />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mt-12" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder={t('support.hero.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                  setSelectedIndex(-1);
                }}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                onKeyDown={handleKeyDown}
                className="pl-14 pr-12 py-6 text-lg rounded-full border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus-visible:ring-orange-200 shadow-sm" 
              />
              {searchQuery && (
                <button 
                  onClick={() => { 
                    setSearchQuery(''); 
                    setShowSearchResults(false);
                    setSelectedIndex(-1);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && filteredFaqs.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[400px] overflow-y-auto z-50">
                {filteredFaqs.slice(0, 8).map((faq, index) => (
                  <button
                    key={faq.id}
                    onClick={() => scrollToFaq(faq.id)}
                    className={`w-full text-left p-4 border-b border-gray-100 last:border-0 transition-colors ${
                      selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs text-orange-500 font-medium block mb-1">{faq.category}</span>
                    <p className="text-gray-900 font-medium mb-1">{highlightMatch(faq.question, searchQuery)}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{highlightMatch(faq.answer, searchQuery)}</p>
                  </button>
                ))}
              </div>
            )}

            {/* No Results State */}
            {showSearchResults && searchQuery && filteredFaqs.length === 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-6 text-center z-50">
                <HelpCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-900 font-medium">{t('support.hero.noResults')} "{searchQuery}"</p>
                <p className="text-sm text-gray-500 mt-1">{t('support.hero.noResultsDescription')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Help Cards */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">{t('support.quickHelp.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('support.quickHelp.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="border-border/50 hover:shadow-card transition-shadow cursor-pointer"
              onClick={() => scrollToCategory('category-installation')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('support.quickHelp.esimSetup.title')}</CardTitle>
                <CardDescription>{t('support.quickHelp.esimSetup.description')}</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="border-border/50 hover:shadow-card transition-shadow cursor-pointer"
              onClick={() => scrollToCategory('category-usage')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('support.quickHelp.usageData.title')}</CardTitle>
                <CardDescription>{t('support.quickHelp.usageData.description')}</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="border-border/50 hover:shadow-card transition-shadow cursor-pointer"
              onClick={() => scrollToCategory('category-billing')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('support.quickHelp.supportBilling.title')}</CardTitle>
                <CardDescription>{t('support.quickHelp.supportBilling.description')}</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="border-border/50 hover:shadow-card transition-shadow cursor-pointer"
              onClick={() => scrollToCategory('category-troubleshooting')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t('support.quickHelp.troubleshooting.title')}</CardTitle>
                <CardDescription>{t('support.quickHelp.troubleshooting.description')}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Options & FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>{t('support.contactForm.title')}</CardTitle>
                  <CardDescription>
                    {t('support.contactForm.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Input name="name" placeholder={t('support.contactForm.namePlaceholder')} value={formData.name} onChange={handleInputChange} required />
                      </div>
                      <div>
                        <Input name="email" type="email" placeholder={t('support.contactForm.emailPlaceholder')} value={formData.email} onChange={handleInputChange} required />
                      </div>
                    </div>
                    
                    <Input name="subject" placeholder={t('support.contactForm.subjectPlaceholder')} value={formData.subject} onChange={handleInputChange} required />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">{t('support.contactForm.categoryLabel')}</Label>
                        <Select name="category" value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('support.contactForm.categoryPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">{t('support.contactForm.categories.general')}</SelectItem>
                            <SelectItem value="esim_activation">{t('support.contactForm.categories.activation')}</SelectItem>
                            <SelectItem value="technical">{t('support.contactForm.categories.technical')}</SelectItem>
                            <SelectItem value="billing">{t('support.contactForm.categories.billing')}</SelectItem>
                            <SelectItem value="refund">{t('support.contactForm.categories.refund')}</SelectItem>
                            <SelectItem value="coverage">{t('support.contactForm.categories.coverage')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="priority">{t('support.contactForm.priorityLabel')}</Label>
                        <Select name="priority" value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('support.contactForm.priorityPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t('support.contactForm.priorities.low')}</SelectItem>
                            <SelectItem value="medium">{t('support.contactForm.priorities.medium')}</SelectItem>
                            <SelectItem value="high">{t('support.contactForm.priorities.high')}</SelectItem>
                            <SelectItem value="urgent">{t('support.contactForm.priorities.urgent')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{t('support.contactForm.priorityHint')}</p>
                      </div>
                    </div>
                    
                    <Textarea name="message" placeholder={t('support.contactForm.messagePlaceholder')} rows={4} value={formData.message} onChange={handleInputChange} required />
                    <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('support.contactForm.submitting')}
                        </>
                      ) : (
                        <>
                          {t('support.contactForm.submit')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div id="faq-section">
              <h2 className="text-3xl font-bold text-foreground mb-8">{t('support.faq.title')}</h2>
              
              <Accordion 
                type="single" 
                collapsible 
                className="space-y-2"
                value={expandedFaq}
                onValueChange={setExpandedFaq}
              >
                {/* Installation & Activation */}
                <div id="category-installation" className="text-sm font-semibold text-primary mb-2 mt-6 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  {t('support.faq.categories.installation')}
                </div>
                
                <AccordionItem value="item-1" id="item-1" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.installation.q1.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.installation.q1.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" id="item-2" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.installation.q2.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.installation.q2.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" id="item-3" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.installation.q3.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.installation.q3.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" id="item-4" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.installation.q4.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.installation.q4.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" id="item-5" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.installation.q5.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.installation.q5.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" id="item-6" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.installation.q6.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.installation.q6.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" id="item-7" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.installation.q7.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.installation.q7.answer')}
                  </AccordionContent>
                </AccordionItem>

                {/* Usage & Data */}
                <div id="category-usage" className="text-sm font-semibold text-primary mb-2 mt-6 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('support.faq.categories.usage')}
                </div>

                <AccordionItem value="item-8" id="item-8" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.usage.q1.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.usage.q1.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9" id="item-9" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.usage.q2.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.usage.q2.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10" id="item-10" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.usage.q3.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.usage.q3.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11" id="item-11" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.usage.q4.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.usage.q4.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12" id="item-12" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.usage.q5.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.usage.q5.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-13" id="item-13" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.usage.q6.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.usage.q6.answer')}
                  </AccordionContent>
                </AccordionItem>

                {/* Device & Compatibility */}
                <div id="category-compatibility" className="text-sm font-semibold text-primary mb-2 mt-6 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  {t('support.faq.categories.device')}
                </div>

                <AccordionItem value="item-14" id="item-14" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.device.q1.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    <div className="space-y-4">
                      <p>{t('support.deviceCompatibility.intro')}</p>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-xs">{t('support.deviceCompatibility.warningTitle')}</p>
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">{t('support.deviceCompatibility.warningText')}</p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded">
                        <p className="font-semibold text-blue-800 dark:text-blue-200 text-xs">{t('support.deviceCompatibility.howToCheckTitle')}</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-blue-700 dark:text-blue-300 text-xs mt-1">
                          <li>{t('support.deviceCompatibility.howToCheckStep1')}</li>
                          <li>{t('support.deviceCompatibility.howToCheckStep2')}</li>
                        </ol>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t('support.deviceCompatibility.ipadNote')}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground text-xs">{t('support.deviceCompatibility.appleTitle')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                          <div><strong>iPhone 16 Series:</strong> 16, 16e, 16 Plus, 16 Pro, 16 Pro Max</div>
                          <div><strong>iPhone 15 Series:</strong> 15, 15 Plus, 15 Pro, 15 Pro Max</div>
                          <div><strong>iPhone 14 Series:</strong> 14, 14 Plus, 14 Pro, 14 Pro Max</div>
                          <div><strong>iPhone 13 Series:</strong> 13, 13 Mini, 13 Pro, 13 Pro Max</div>
                          <div><strong>iPhone 12 Series:</strong> 12, 12 Mini, 12 Pro, 12 Pro Max</div>
                          <div><strong>iPhone 11 Series:</strong> 11, 11 Pro, 11 Pro Max</div>
                          <div><strong>iPhone X Series:</strong> XR, XS, XS Max</div>
                          <div><strong>iPhone SE:</strong> 2020 & 2022</div>
                          <div className="col-span-1 md:col-span-2"><strong>iPads:</strong> iPad 7-10 • Mini 5-6 • Air 3-5 • Pro 11" (1st-2nd gen) • Pro 12.9" (A2069)</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground text-xs">{t('support.deviceCompatibility.samsungTitle')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                          <div><strong>Galaxy S25:</strong> S25, S25+, S25 Ultra, S25 Edge</div>
                          <div><strong>Galaxy S24:</strong> S24, S24+, S24 Ultra, S24 FE</div>
                          <div><strong>Galaxy S23:</strong> S23, S23+, S23 Ultra, S23 FE</div>
                          <div><strong>Galaxy S22:</strong> S22, S22+, S22 Ultra</div>
                          <div><strong>Galaxy S21:</strong> S21, S21+, S21 Ultra</div>
                          <div><strong>Galaxy S20:</strong> S20, S20+, S20 Ultra (5G)</div>
                          <div><strong>Galaxy A Series:</strong> A54, A55, A56, A35, A36</div>
                          <div><strong>Galaxy Note:</strong> Note 20, Note 20 Ultra</div>
                          <div><strong>Galaxy Z Flip:</strong> Flip, 3, 4, 5, 6, 7</div>
                          <div><strong>Galaxy Z Fold:</strong> Fold, 2, 3, 4, 5, 6, 7</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground text-xs">{t('support.deviceCompatibility.googleTitle')}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 text-xs">
                          <div>Pixel 9, 9 Pro, 9 Pro XL, 9 Fold</div>
                          <div>Pixel 8, 8a, 8 Pro</div>
                          <div>Pixel 7, 7a, 7 Pro</div>
                          <div>Pixel 6, 6a, 6 Pro</div>
                          <div>Pixel 5, 5a</div>
                          <div>Pixel 4, 4a, 4 XL</div>
                          <div>Pixel 3, 3a, 3a XL, 3 XL</div>
                          <div>Pixel 2, 2 XL</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground text-xs">{t('support.deviceCompatibility.otherTitle')}</h4>
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80">
                            <span>{t('support.deviceCompatibility.viewAllBrands')}</span>
                            <ChevronDown className="h-3 w-3" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div><strong>Huawei:</strong> P40, P40 Pro, Mate P40 Pro, Pura 70 Pro</div>
                              <div><strong>Oppo:</strong> Find N2 Flip, N3, N3 Flip, X3, X3 Pro, X5, X5 Pro, X8, X8 Pro, Reno 5A, 6 Pro 5G, 7A, 9A, 10 Pro, A55s 5G</div>
                              <div><strong>Motorola:</strong> Razr (2019, 5G, 40, 40 Ultra, +, 2022, 2024, + 2024), Edge (30 Pro, 40, 40 Pro, 40 Neo, 50 Pro, 50 Ultra, 50 Fusion, 60 series, +, 2022), Moto G (Power 5G, 52J, 53J, 54, 84, 34, 53, 35, Stylus 5G 2024)</div>
                              <div><strong>Sony Xperia:</strong> 10 III Lite, 10 IV, 10V, 1 IV, 1 V, 1 VI, 5 IV, 5 V, Ace III</div>
                              <div><strong>Xiaomi:</strong> 12T Pro, 13, 13 Lite, 13 Pro, 13T, 13T Pro, 14, 14 Pro, 14T, 14T Pro, 15, 15 Ultra, Redmi Note 13 Pro+, 14 Pro, 14 Pro+, Poco X7</div>
                              <div><strong>Sharp AQUOS:</strong> sense4 lite, Sense6s, sense 7, sense 7plus, sense8, Wish, wish 2, wish3, zero 6, R7, R8, R8 Pro, Simple Sumaho6</div>
                              <div><strong>Honor:</strong> Magic 4 Pro, Magic 5 Pro, Magic 6 Pro, Magic V2, Magic V3, 90, X8, 200 Pro, 400 Lite</div>
                              <div><strong>Vivo:</strong> X80 Pro, X90 Pro, X100 Pro, X200, X200s, X200 Pro, V29, V29 Lite, V29 Lite 5G, V40, V40 lite, V40 SE</div>
                              <div><strong>Rakuten:</strong> Mini, Big-S, Big, Hand, Hand 5G</div>
                              <div><strong>OnePlus:</strong> Open, 11, 12, 13, 13R, 13T</div>
                              <div><strong>Nokia:</strong> XR21, X30, G60 5G</div>
                              <div><strong>Asus:</strong> ROG Phone 9, ROG Phone 9 Pro, Zenfone 12 Ultra</div>
                              <div><strong>Other Brands:</strong> Fairphone 4, 5 • Gemini PDA • DOOGEE V30 • HAMMER Blade 3, Blade 5G, Explorer PRO • myPhone NOW eSIM • OUKITEL WP30 Pro, WP33 Pro • Nuu X5 • ZTE Nubia Flip • TCL 50 5G • Realme 14 Pro+, GT 7 • Nothing Phone 3a Pro</div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      <p className="text-xs italic opacity-75">{t('support.deviceCompatibility.disclaimer')}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-15" id="item-15" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.device.q2.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.device.q2.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-16" id="item-16" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.device.q3.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.device.q3.answer')}
                  </AccordionContent>
                </AccordionItem>

                {/* Troubleshooting */}
                <div id="category-troubleshooting" className="text-sm font-semibold text-primary mb-2 mt-6 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('support.faq.categories.troubleshooting')}
                </div>

                <AccordionItem value="item-17" id="item-17" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.troubleshooting.q1.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.troubleshooting.q1.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-18" id="item-18" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.troubleshooting.q2.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.troubleshooting.q2.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-19" id="item-19" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.troubleshooting.q3.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.troubleshooting.q3.answer')}
                  </AccordionContent>
                </AccordionItem>

                {/* eSIM Management */}
                <div id="category-management" className="text-sm font-semibold text-primary mb-2 mt-6 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('support.faq.categories.management')}
                </div>

                <AccordionItem value="item-20" id="item-20" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.management.q1.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.management.q1.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-21" id="item-21" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.management.q2.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.management.q2.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-22" id="item-22" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.management.q3.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.management.q3.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-23" id="item-23" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.management.q4.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.management.q4.answer')}
                  </AccordionContent>
                </AccordionItem>

                {/* Support & Billing */}
                <div id="category-billing" className="text-sm font-semibold text-primary mb-2 mt-6 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('support.faq.categories.billing')}
                </div>

                <AccordionItem value="item-24" id="item-24" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.billing.q1.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.billing.q1.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-25" id="item-25" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.billing.q2.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.billing.q2.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-26" id="item-26" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.billing.q3.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.billing.q3.answer')}
                  </AccordionContent>
                </AccordionItem>

                {/* Account & Login */}
                <div id="category-account" className="text-sm font-semibold text-primary mb-2 mt-6 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('support.faq.categories.account')}
                </div>

                <AccordionItem value="item-33" id="item-33" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.account.q1.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.account.q1.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-34" id="item-34" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.account.q2.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.account.q2.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-35" id="item-35" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.account.q3.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.account.q3.answer')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-36" id="item-36" className="border border-border/50 rounded-lg px-4">
                  <AccordionTrigger className="text-left py-3 text-sm">
                    {t('support.faq.account.q4.question')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {t('support.faq.account.q4.answer')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Download Links */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">{t('support.resources.title')}</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start rounded-full hover:bg-accent transition-colors"
                    asChild
                  >
                    <a href="/installation-guide" target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      {t('support.resources.setupGuide')}
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-full hover:bg-accent transition-colors" onClick={() => {
                  // Generate and download Device Compatibility List
                  const content = `MOBILE11 eSIM COMPATIBLE DEVICES

Last Updated: ${new Date().toLocaleDateString()}

Mobile11 eSIMs are compatible with a wide range of newer smartphones and tablets, including models from Apple, Samsung, Huawei, and Oppo. To ensure compatibility, check with your device manufacturer.

⚠️ IMPORTANT NOTICE: Devices manufactured in China/Hong Kong do not have eSIM functionality.

HOW TO CHECK YOUR DEVICE:
1. Go to Settings
2. Check for the "Add eSIM" button on the Cellular screen
Note: iPads can only use this feature if they are models with cellular capabilities.

=================================================
SUPPORTED APPLE DEVICES
=================================================

IPHONE MODELS:
• iPhone 16e
• iPhone 16 Pro & Pro Max
• iPhone 16 Plus
• iPhone 16
• iPhone 15 Pro & Pro Max
• iPhone 15 Plus
• iPhone 15
• iPhone 14 Pro & Pro Max
• iPhone 14 Plus
• iPhone 14
• iPhone 13 Pro & Pro Max
• iPhone 13 Mini
• iPhone 13
• iPhone 12 Pro & Pro Max
• iPhone 12 Mini
• iPhone 12
• iPhone 11 Pro & Pro Max
• iPhone 11
• iPhone XS & XS Max
• iPhone XR
• iPhone SE (2020 & 2022)

iPAD MODELS:
• iPad 7
• iPad Mini 5
• iPad Pro (11")
• iPad Pro 2 (11")
• iPad Air 3
• iPad Air 4
• iPad Mini 6th generation
• iPad Air 5th generation
• iPad 8th generation
• iPad 9th generation
• iPad 10th generation
• iPad Pro 12.9 (Model A2069)

=================================================
SUPPORTED SAMSUNG DEVICES
=================================================

GALAXY S SERIES:
• Galaxy S25 Ultra
• Galaxy S25+
• Galaxy S25
• Galaxy S25 Edge
• Galaxy S24 FE
• Galaxy S24 Ultra
• Galaxy S24+
• Galaxy S24
• Galaxy S23 Ultra 5G
• Galaxy S23+ 5G
• Galaxy S23 5G
• Galaxy S23 FE
• Galaxy S22 Ultra 5G
• Galaxy S22+ 5G
• Galaxy S22 5G
• Galaxy S21 Ultra 5G
• Galaxy S21+ 5G
• Galaxy S21 5G
• Galaxy S20 Ultra
• Galaxy S20 Ultra 5G
• Galaxy S20+
• Galaxy S20+ 5G
• Galaxy S20

GALAXY A SERIES:
• Galaxy A54 (SCG21, SC-53D, SM-A546B/DS, SM-A546S, SM-A546U1)
• Galaxy A55 5G
• Galaxy A35
• Galaxy A56
• Galaxy A36

GALAXY NOTE SERIES:
• Galaxy Note 20
• Galaxy Note 20 Ultra 5G

GALAXY Z FLIP SERIES:
• Galaxy Z Flip
• Galaxy Z Flip 3 5G
• Galaxy Z Flip 4
• Galaxy Z Flip 4 5G
• Galaxy Z Flip 5 5G
• Galaxy Z Flip 6 series
• Galaxy Z Flip 7

GALAXY Z FOLD SERIES:
• Galaxy Z Fold
• Galaxy Z Fold 2 5G
• Galaxy Z Fold 3 5G
• Galaxy Z Fold 4 5G
• Galaxy Z Fold 5 5G
• Galaxy Z Fold 6 5G
• Galaxy Z Fold 7

=================================================
SUPPORTED GOOGLE PIXEL DEVICES
=================================================

• Pixel 9 Fold
• Pixel 9 Pro XL
• Pixel 9 Pro
• Pixel 9
• Pixel Fold
• Pixel 8 Pro
• Pixel 8a
• Pixel 8
• Pixel 7 Pro
• Pixel 7a
• Pixel 7
• Pixel 6 Pro
• Pixel 6a
• Pixel 6
• Pixel 5
• Pixel 5a
• Pixel 4a
• Pixel 4
• Pixel 4 XL
• Pixel 3a
• Pixel 3a XL
• Pixel 3
• Pixel 3 XL
• Pixel 2
• Pixel 2 XL

=================================================
SUPPORTED HUAWEI DEVICES
=================================================

• Huawei P40
• Huawei P40 Pro
• Huawei Mate P40 Pro
• Huawei Pura 70 Pro

=================================================
SUPPORTED OPPO DEVICES
=================================================

• Oppo Find N2 Flip
• Oppo Find N3
• Oppo Find N3 Flip
• Oppo Find X3
• Oppo Find X3 Pro
• Oppo Find X8
• Oppo Find X8 Pro
• Oppo Reno 5A
• Oppo Find X5
• Oppo Find X5 Pro
• Oppo A55s 5G
• Oppo Reno 6 Pro 5G
• Oppo Reno 7A
• Oppo Reno 9A
• Oppo Reno 10 Pro

=================================================
SUPPORTED MOTOROLA DEVICES
=================================================

RAZR SERIES:
• Motorola Razr 2019
• Motorola Razr 5G
• Motorola Razr 40
• Motorola Razr 40 Ultra
• Motorola Razr+
• Motorola Razr 2022
• Motorola Razr 2024
• Motorola Razr+ 2024

EDGE SERIES:
• Motorola Edge+
• Motorola Edge 30 Pro
• Motorola Edge 40
• Motorola Edge 40 Pro
• Motorola Edge 40 Neo
• Motorola Edge 2022
• Motorola Edge 50 Pro
• Motorola Edge 50 Ultra
• Motorola Edge 50 Fusion
• Motorola Edge 60
• Motorola Edge 60 Pro
• Motorola Edge 60 Stylus
• Motorola Edge 60 Fusion

MOTO G SERIES:
• G52J 5G
• G52J 5G II
• G53J 5G
• Motorola Moto G Power 5G
• Moto G54 5G
• Motorola G84
• Motorola G34
• Motorola Moto G53
• Motorola Moto G54
• Motorola Moto G Stylus 5G 2024
• Motorola Moto G35

=================================================
SUPPORTED RAKUTEN DEVICES
=================================================

• Rakuten Mini
• Rakuten Big-S
• Rakuten Big
• Rakuten Hand
• Rakuten Hand 5G

=================================================
SUPPORTED SONY XPERIA DEVICES
=================================================

• Sony Xperia 10 III Lite
• Sony Xperia 10 IV
• Sony Xperia 10V
• Xperia 1 IV
• Sony Xperia 5 IV
• Sony Xperia 1 V
• Sony Xperia 5 V
• Sony Xperia Ace III
• Sony Xperia 1 VI

=================================================
SUPPORTED XIAOMI DEVICES
=================================================

• Xiaomi 12 T Pro
• Xiaomi 13
• Xiaomi 13 Lite
• Xiaomi 13 Pro
• Xiaomi 13T
• Xiaomi 13T Pro
• Xiaomi 14
• Xiaomi 14 Pro
• Xiaomi 14T
• Xiaomi 14T Pro
• Xiaomi Redmi Note 13 Pro+
• Xiaomi Redmi Note 14 Pro
• Xiaomi Redmi Note 14 Pro+
• Xiaomi Poco X7
• Xiaomi 15
• Xiaomi 15 Ultra

=================================================
SUPPORTED SHARP AQUOS DEVICES
=================================================

• Sharp AQUOS sense4 lite
• Sharp AQUOS Sense6s
• AQUOS sense 7
• AQUOS sense 7plus
• Sharp AQUOS Wish
• AQUOS wish 2 SHG08
• AQUOS wish3
• AQUOS zero 6
• Simple Sumaho6
• Sharp AQUOS R7
• Sharp AQUOS R8
• Sharp AQUOS R8 Pro
• Sharp Aquos sense8

=================================================
SUPPORTED HONOR DEVICES
=================================================

• Honor Magic 4 Pro
• Honor Magic 5 Pro
• Honor Magic 6 Pro
• Honor 90
• Honor X8
• Honor 200 Pro
• Honor Magic V2
• Honor Magic V3
• Honor 400 Lite

=================================================
SUPPORTED VIVO DEVICES
=================================================

• Vivo X80 Pro
• Vivo X90 Pro
• Vivo X100 Pro
• Vivo V29
• Vivo V29 Lite
• Vivo V29 Lite 5G (eSIM supported only in Europe)
• Vivo V40
• Vivo V40 lite
• Vivo V40 SE
• Vivo X200
• Vivo X200s
• Vivo X200 Pro

=================================================
SUPPORTED ONEPLUS DEVICES
=================================================

• OnePlus Open
• OnePlus 11
• OnePlus 12
• OnePlus 13
• OnePlus 13R
• OnePlus 13T

=================================================
SUPPORTED NOKIA DEVICES
=================================================

• Nokia XR21
• Nokia X30
• Nokia G60 5G

=================================================
SUPPORTED ASUS DEVICES
=================================================

• Asus ROG Phone 9
• Asus ROG Phone 9 Pro
• Asus Zenfone 12 Ultra

=================================================
SUPPORTED REALME DEVICES
=================================================

• Realme 14 Pro+
• Realme GT 7

=================================================
OTHER SUPPORTED DEVICES
=================================================

• Gemini PDA
• Fairphone 4
• Fairphone 5
• DOOGEE V30
• HAMMER Blade 3
• HAMMER Explorer PRO
• HAMMER Blade 5G
• myPhone NOW eSIM
• OUKITEL WP30 Pro
• OUKITEL WP33 Pro
• Nuu X5
• ZTE Nubia Flip
• TCL 50 5G
• Nothing Phone 3a Pro

=================================================

For the most up-to-date compatibility information, please visit our website or contact support.
                      `.trim();
                  const blob = new Blob([content], {
                    type: 'text/plain'
                  });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Device-Compatibility-List.txt';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast({
                    title: t('support.toast.downloadStarted'),
                    description: t('support.toast.deviceListDownloading')
                  });
                }}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('support.resources.deviceList')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-full hover:bg-accent transition-colors" onClick={() => {
                  // Generate and download Coverage Map - 151 Countries
                  const content = `
MOBILE11 eSIM COVERAGE MAP - 151 COUNTRIES

Last Updated: ${new Date().toLocaleDateString()}

Mobile11 provides eSIM coverage across 151 countries and territories worldwide with partnerships with leading mobile carriers in each region.

═══════════════════════════════════════════════════════════════

AFRICA (25 Countries):

• Algeria - Djezzy / Mobilis / Ooredoo (3G, 4G)
• Cameroon - MTN / Orange (3G, 4G)
• Centrafrique - Telecel / Azur (3G, 4G)
• Democratic Republic of Congo - Vodacom / Airtel / Orange (3G, 4G)
• Egypt - Vodafone / Orange / Etisalat (3G, 4G)
• Ghana - MTN / Vodafone / AirtelTigo (3G, 4G)
• Ivory Coast - MTN / Orange / Moov (3G, 4G)
• Kenya - Safaricom / Airtel (3G, 4G)
• Liberia - Lonestar / MTN (3G, 4G)
• Madagascar - Telma / Airtel / Orange (3G, 4G)
• Malawi - TNM / Airtel (3G, 4G)
• Mauritius - Emtel / MTML (3G, 4G)
• Morocco - Maroc Telecom / Orange / Inwi (3G, 4G)
• Mozambique - Vodacom / Movitel (3G, 4G)
• Rwanda - MTN / Airtel (3G, 4G)
• Seychelles - Cable & Wireless / Airtel (3G, 4G)
• Sierra Leone - Africell / Airtel (3G, 4G)
• South Africa - Vodacom / MTN / Cell C (3G, 4G, 5G)
• Sudan - Zain / MTN / Sudani (3G, 4G)
• Swaziland - MTN / Swazi Mobile (3G, 4G)
• Tanzania - Vodacom / Airtel / Tigo (3G, 4G)
• Tunisia - Ooredoo / Orange / Tunisie Telecom (3G, 4G)
• Uganda - MTN / Airtel (3G, 4G)
• Yemen - Yemen Mobile / MTN (3G, 4G)
• Zambia - MTN / Airtel / Zamtel (3G, 4G)

═══════════════════════════════════════════════════════════════

AMERICAS (20 Countries):

• Argentina - Movistar / Claro / Personal (3G, 4G)
• Brazil - Claro / Vivo / TIM / Oi (3G, 4G)
• Canada - Rogers / Bell / Telus (3G, 4G, 5G)
• Chile - Entel / Movistar / Claro (3G, 4G)
• Colombia - Claro / Movistar / Tigo (3G, 4G)
• Costa Rica - ICE / Movistar / Claro (3G, 4G)
• Dominican Republic - Claro / Altice / Viva (3G, 4G)
• Ecuador - Claro / Movistar / CNT (3G, 4G)
• El Salvador - Tigo / Claro / Movistar (3G, 4G)
• Guatemala - Tigo / Claro / Movistar (3G, 4G)
• Guyana - Digicel / GTT (3G, 4G)
• Haiti - Digicel / Natcom (3G, 4G)
• Honduras - Tigo / Claro / Hondutel (3G, 4G)
• Mexico - Telcel / AT&T / Movistar (3G, 4G)
• Nicaragua - Claro / Movistar (3G, 4G)
• Panama - Cable & Wireless / Claro / Movistar (3G, 4G)
• Paraguay - Tigo / Claro / Personal (3G, 4G)
• Peru - Movistar / Claro / Entel (3G, 4G)
• USA - AT&T / T-Mobile / Verizon (3G, 4G, 5G)
• Uruguay - Antel / Movistar / Claro (3G, 4G)

═══════════════════════════════════════════════════════════════

ASIA-PACIFIC (28 Countries):

• Armenia - Beeline / Vivacell / Ucom (3G, 4G)
• Azerbaijan - Azercell / Bakcell / Azerfon (3G, 4G)
• Bangladesh - Grameenphone / Banglalink / Robi (3G, 4G)
• Brunei - DST / Progresif (3G, 4G)
• Cambodia - Cellcard / Smart / Metfone (3G, 4G)
• China - China Mobile / China Unicom / China Telecom (3G, 4G)
• Georgia - Magticom / Geocell / Beeline (3G, 4G)
• Hong Kong - CSL / 3HK / SmarTone / China Mobile (3G, 4G, 5G)
• India - Airtel / Vodafone / Jio / BSNL (3G, 4G)
• Indonesia - Telkomsel / XL / Indosat / 3 (3G, 4G)
• Iran - MCI / Irancell / RighTel (3G, 4G)
• Japan - KDDI / Softbank / NTT Docomo (3G, 4G, 5G)
• Kazakhstan - Kcell / Beeline / Tele2 (3G, 4G)
• Kyrgyzstan - Beeline / Megacom / O! (3G, 4G)
• Laos - Unitel / ETL / Beeline (3G, 4G)
• Macau - CTM / 3 Macau / SmarTone (3G, 4G)
• Malaysia - Maxis / Celcom / Digi / U Mobile (3G, 4G)
• Mongolia - Mobicom / Unitel / Skytel (3G, 4G)
• Nepal - Ncell / Nepal Telecom (3G, 4G)
• Pakistan - Jazz / Telenor / Zong / Ufone (3G, 4G)
• Philippines - Globe / Smart / DITO (3G, 4G)
• Singapore - Singtel / Starhub / M1 (3G, 4G, 5G)
• South Korea - SKT / KT / LG U+ (3G, 4G, 5G)
• Sri Lanka - Dialog / Mobitel / Airtel (3G, 4G)
• Taiwan - CHT / FET / TWM (3G, 4G, 5G)
• Tajikistan - Tcell / Megafon / Beeline (3G, 4G)
• Thailand - Truemove / DTAC / AIS (3G, 4G)
• Uzbekistan - Beeline / Ucell / UMS (3G, 4G)
• Vietnam - Viettel / Vinaphone / Mobifone (3G, 4G)

═══════════════════════════════════════════════════════════════

CARIBBEAN (18 Territories):

• Anguilla - Digicel / Flow (3G, 4G)
• Antigua and Barbuda - Digicel / Flow (3G, 4G)
• Aruba - Digicel / Setar (3G, 4G)
• Barbados - Digicel / Flow (3G, 4G)
• Bermuda - One Communications / Digicel (3G, 4G)
• British Virgin Islands - Digicel / Flow (3G, 4G)
• Cayman Islands - Digicel / Flow (3G, 4G)
• Curacao - Digicel / Flow (3G, 4G)
• Dominica - Digicel / Flow (3G, 4G)
• French Guiana - Digicel / Orange (3G, 4G)
• Grenada - Digicel / Flow (3G, 4G)
• Guadeloupe - Orange / Digicel (3G, 4G)
• Jamaica - Digicel / Flow (3G, 4G)
• Martinique - Orange / Digicel (3G, 4G)
• St. Kitts/Nevis - Digicel / Flow (3G, 4G)
• St. Lucia - Digicel / Flow (3G, 4G)
• St. Vincent - Digicel / Flow (3G, 4G)
• Trinidad and Tobago - Digicel / bmobile (3G, 4G)
• Turks and Caicos - Digicel / Flow (3G, 4G)

═══════════════════════════════════════════════════════════════

EUROPE (42 Countries):

• Albania - Vodafone / Telekom / One (3G, 4G)
• Austria - A1 / Magenta / 3 (3G, 4G, 5G)
• Belarus - A1 / MTS / Life (3G, 4G)
• Belgium - Proximus / Orange / Base (3G, 4G, 5G)
• Bosnia and Herzegovina - BH Telecom / M:tel (3G, 4G)
• Bulgaria - Vivacom / A1 / Telenor (3G, 4G)
• Croatia - Hrvatski Telekom / A1 / Telemach (3G, 4G)
• Cyprus - Cyta / MTN / PrimeTel (3G, 4G)
• Czech Republic - O2 / T-Mobile / Vodafone (3G, 4G, 5G)
• Denmark - TDC / Telenor / 3 (3G, 4G, 5G)
• Estonia - Telia / Elisa / Tele2 (3G, 4G, 5G)
• Faroe Islands - Faroese Telecom / Vodafone (3G, 4G)
• Finland - Elisa / Telia / DNA (3G, 4G, 5G)
• France - Orange / SFR / Bouygues / Free (3G, 4G, 5G)
• Germany - Telekom / Vodafone / O2 (3G, 4G, 5G)
• Gibraltar - Gibtelecom / Gibfibre (3G, 4G)
• Greece - Cosmote / Vodafone / Wind (3G, 4G, 5G)
• Hungary - Telekom / Telenor / Vodafone (3G, 4G)
• Iceland - Siminn / Vodafone / Nova (3G, 4G, 5G)
• Ireland - Three / Vodafone / Eir (3G, 4G, 5G)
• Italy - TIM / Vodafone / Wind / Iliad (3G, 4G, 5G)
• Latvia - LMT / Tele2 / Bite (3G, 4G, 5G)
• Lithuania - Telia / Tele2 / Bite (3G, 4G, 5G)
• Luxembourg - POST / Orange / Tango (3G, 4G, 5G)
• Malta - GO / Vodafone / Melita (3G, 4G)
• Moldova - Orange / Moldcell / Moldtelecom (3G, 4G)
• Montenegro - Telenor / T-Mobile / M:tel (3G, 4G)
• Netherlands - KPN / Vodafone / T-Mobile (3G, 4G, 5G)
• Norway - Telenor / Telia / Ice (3G, 4G, 5G)
• Poland - Orange / T-Mobile / Plus / Play (3G, 4G, 5G)
• Portugal - MEO / Vodafone / NOS (3G, 4G, 5G)
• Romania - Orange / Vodafone / Telekom (3G, 4G, 5G)
• Russia - MTS / MegaFon / Beeline / Tele2 (3G, 4G)
• San Marino - TIM / Vodafone (3G, 4G)
• Serbia - Telekom / Telenor / A1 (3G, 4G)
• Slovakia - Orange / Telekom / O2 (3G, 4G)
• Slovenia - Telekom / A1 / Telemach (3G, 4G)
• Spain - Movistar / Vodafone / Orange / Yoigo (3G, 4G, 5G)
• Sweden - Telia / Tele2 / Telenor / 3 (3G, 4G, 5G)
• Switzerland - Swisscom / Sunrise / Salt (3G, 4G, 5G)
• Ukraine - Kyivstar / Vodafone / lifecell (3G, 4G)
• United Kingdom - EE / Vodafone / O2 / Three (3G, 4G, 5G)
• Vatican City - TIM / Vodafone (3G, 4G)

═══════════════════════════════════════════════════════════════

MIDDLE EAST (10 Countries):

• Israel - Cellcom / Pelephone / Partner (3G, 4G, 5G)
• Jordan - Zain / Orange / Umniah (3G, 4G)
• Kuwait - Zain / Ooredoo / Viva (3G, 4G, 5G)
• Oman - Omantel / Ooredoo (3G, 4G)
• Qatar - Ooredoo / Vodafone (3G, 4G, 5G)
• Saudi Arabia - STC / Mobily / Zain (3G, 4G, 5G)
• Turkey - Turkcell / Vodafone / Turk Telekom (3G, 4G, 5G)
• UAE - Etisalat / du (3G, 4G, 5G)

═══════════════════════════════════════════════════════════════

OCEANIA (8 Countries):

• Australia - Telstra / Optus / Vodafone (3G, 4G, 5G)
• Fiji - Vodafone / Digicel (3G, 4G)
• Guam - Docomo / GTA (3G, 4G)
• New Zealand - Spark / Vodafone / 2degrees (3G, 4G, 5G)
• Papua New Guinea - Bmobile / Digicel (3G, 4G)
• Tonga - Digicel / Tonga Communications (3G, 4G)
• Vanuatu - Digicel / Vodafone (3G, 4G)

═══════════════════════════════════════════════════════════════

NETWORK TYPES:

• 5G: Ultra-fast speeds up to 1+ Gbps (where available)
• 4G/LTE: High-speed data 10-100 Mbps
• 3G: Standard data speeds 1-10 Mbps

IMPORTANT NOTES:

• Network availability varies by location and carrier
• 5G coverage is expanding but may be limited to major cities
• Some countries may have restrictions on certain services (VoIP, etc.)
• Data speeds may vary based on network congestion and device compatibility

For detailed coverage inquiries or specific carrier information, please contact our support team.

Mobile11 eSIM Service
Website: mobile11.app
Email: support@mobile11.app

═══════════════════════════════════════════════════════════════
                      `.trim();
                  const blob = new Blob([content], {
                    type: 'text/plain'
                  });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'mobile11-coverage-map-151-countries.txt';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast({
                    title: t('support.toast.downloadStarted'),
                    description: t('support.toast.coverageMapDownloading')
                  });
                }}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('support.resources.coverageMap')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Contact */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6 break-words">{t('about.location.title')}</h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto break-words">
              {t('about.location.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <Card className="border-border/50">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2 break-words">{t('about.location.headquartersTitle')}</h3>
                  <p className="text-xl font-semibold text-foreground mb-4 break-words">{t('about.location.companyName')}</p>
                  <p className="text-muted-foreground leading-relaxed break-words">
                    {t('about.location.address')}
                  </p>
                </div>

                <div className="grid gap-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground break-words">{t('about.location.callCenter')}</div>
                      <div className="font-semibold text-foreground">1605</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t('about.location.service')}</div>
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full rounded-full"
                  asChild
                >
                  <a href="https://maps.app.goo.gl/fVDUWX72JywLqnF59" target="_blank" rel="noopener noreferrer">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    {t('about.location.getDirections')}
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Map */}
            <div className="overflow-hidden rounded-2xl shadow-xl border border-border">
              <div className="relative" style={{ paddingBottom: '75%' }}>
                <iframe
                  src="https://www.google.com/maps?q=13.7726414,100.5789425&z=17&output=embed"
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="1-TO-ALL Headquarters Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status Banner */}
      <section className="py-8 bg-green-50 border-t border-green-200">
        <div className="container">
          <div className="flex items-center justify-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800">{t('support.status.operational')}</span>
          <span className="text-green-600">•</span>
          <span className="text-green-700">{t('support.status.networkUptime')}</span>
          </div>
        </div>
      </section>
      
      <FooterAiralo />
    </div>;
}