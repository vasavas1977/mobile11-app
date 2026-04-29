import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, X, Globe, ChevronDown, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthModal } from '@/components/auth/AuthModal';
import { useLanguage, LANGUAGE_OPTIONS } from '@/contexts/LanguageContext';

export const HeaderV2: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const openAuthModal = (tab: 'signin' | 'signup') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === language);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[hsl(30,20%,90%)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/preview" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(21,90%,48%)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-[hsl(20,14%,10%)]">Mobile11</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(20,6%,45%)]" />
                <input
                  type="text"
                  placeholder={t('headerV2.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-full border border-[hsl(30,20%,90%)] bg-[hsl(35,33%,96%)] text-sm focus:outline-none focus:border-[hsl(25,95%,53%)] focus:ring-2 focus:ring-[hsl(25,95%,53%)]/20 transition-all"
                />
              </div>

              <button className="flex items-center gap-1 text-[hsl(20,14%,10%)] hover:text-[hsl(25,95%,53%)] transition-colors font-medium">
                <Globe className="w-4 h-4" />
                <span>{t('headerV2.locations')}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <Link 
                to="/help" 
                className="text-[hsl(20,14%,10%)] hover:text-[hsl(25,95%,53%)] transition-colors font-medium"
              >
                {t('headerV2.help')}
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative hidden md:block" ref={langRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full hover:bg-[hsl(35,33%,96%)] transition-colors"
                >
                  <span className="text-sm">{currentLang?.flag}</span>
                  <span className="text-sm font-medium">{currentLang?.label ?? 'EN'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[hsl(30,20%,90%)] py-1 min-w-[160px] z-50 animate-v2-fade-up">
                    {LANGUAGE_OPTIONS.map(opt => (
                      <button
                        key={opt.code}
                        onClick={() => { setLanguage(opt.code); setLangDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[hsl(35,33%,96%)] transition-colors ${
                          language === opt.code ? 'text-[hsl(25,95%,53%)] font-semibold' : 'text-[hsl(20,14%,10%)]'
                        }`}
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.nativeName}</span>
                        {language === opt.code && <span className="ml-auto">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => openAuthModal('signin')}
                className="hidden md:flex items-center gap-2 text-[hsl(20,14%,10%)] hover:text-[hsl(25,95%,53%)] transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                <span>{t('headerV2.logIn')}</span>
              </button>

              <button 
                onClick={() => openAuthModal('signup')}
                className="hidden md:block btn-v2-primary text-sm px-5 py-2"
              >
                {t('headerV2.signUp')}
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-[hsl(35,33%,96%)] transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-[hsl(20,14%,10%)]" />
                ) : (
                  <Menu className="w-6 h-6 text-[hsl(20,14%,10%)]" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-[hsl(30,20%,90%)] animate-v2-fade-up">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(20,6%,45%)]" />
                <input
                  type="text"
                  placeholder={t('headerV2.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[hsl(30,20%,90%)] bg-[hsl(35,33%,96%)] text-sm focus:outline-none focus:border-[hsl(25,95%,53%)]"
                />
              </div>

              {/* Mobile Language Selector */}
              <div className="flex flex-wrap gap-2 mb-4 px-4">
                {LANGUAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => setLanguage(opt.code)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      language === opt.code
                        ? 'bg-[hsl(25,95%,53%)] text-white font-semibold'
                        : 'bg-[hsl(35,33%,96%)] text-[hsl(20,14%,10%)]'
                    }`}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              <nav className="flex flex-col gap-2">
                <Link 
                  to="/packages" 
                  className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-[hsl(35,33%,96%)] text-[hsl(20,14%,10%)] font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Globe className="w-5 h-5" />
                  {t('headerV2.allLocations')}
                </Link>
                <Link 
                  to="/help" 
                  className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-[hsl(35,33%,96%)] text-[hsl(20,14%,10%)] font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('headerV2.helpCenter')}
                </Link>
                <hr className="my-2 border-[hsl(30,20%,90%)]" />
                <button 
                  onClick={() => openAuthModal('signin')}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-[hsl(35,33%,96%)] text-[hsl(20,14%,10%)] font-medium text-left"
                >
                  <User className="w-5 h-5" />
                  {t('headerV2.logIn')}
                </button>
                <button 
                  onClick={() => openAuthModal('signup')}
                  className="btn-v2-primary text-center py-3"
                >
                  {t('headerV2.signUp')}
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
        defaultTab={authModalTab}
      />
    </>
  );
};

export default HeaderV2;
