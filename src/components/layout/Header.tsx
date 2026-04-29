import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAffiliateCheck } from '@/hooks/useAffiliateCheck';
import { useAgentCheck } from '@/hooks/useAgentCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_OPTIONS, CURRENCY_OPTIONS } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ShoppingBag, Globe, Shield, ShoppingCart, Menu, Ticket, Users, Headphones, LayoutGrid } from 'lucide-react';
import { useState, useEffect } from 'react';
import { HeaderSearchAutocomplete } from './HeaderSearchAutocomplete';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { convertThbToUsd } from '@/lib/currencyUtils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AuthModal } from '@/components/auth/AuthModal';

interface HeaderProps {
  variant?: 'light' | 'dark';
}

export function Header({ variant = 'light' }: HeaderProps) {
  const _ = variant; // kept for API compat
  const {
    user,
    signOut
  } = useAuth();
  const {
    isAdmin
  } = useAdminCheck();
  const {
    isAffiliate,
    status: affiliateStatus
  } = useAffiliateCheck();
  const {
    isAgent
  } = useAgentCheck();
  const {
    language,
    currency,
    setLanguage,
    setCurrency,
    t
  } = useLanguage();
  const {
    totalItems
  } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  // Fetch user's Mobile11 Money balance
  const { data: loyalty } = useQuery({
    queryKey: ['header-loyalty', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_loyalty')
        .select('mobile11_money_balance')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const mobile11Balance = loyalty?.mobile11_money_balance ?? 0;

  // Listen for external auth modal open requests (e.g., from CartPage checkout)
  useEffect(() => {
    const handleOpenAuthModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: 'signin' | 'signup' }>;
      setAuthModalTab(customEvent.detail?.tab || 'signin');
      setAuthModalOpen(true);
    };
    
    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return <>
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#FAF7F2] border-b border-[#E8E0D8]/60 shadow-sm">
      {/* Row 1: Account Bar */}
      <div>
        <div className="container flex h-14 items-center justify-between px-4">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src={logo} alt="mobile11" className="h-[58px] sm:h-[70px]" />
          </Link>
          
          {/* Center: User Nav (only when logged in - desktop) */}
          {user && (
            <nav className="hidden md:flex items-center">
              <Link 
                to="/my-esims" 
                className="text-sm font-medium px-3 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
              >
                {t('header.myEsims')}
              </Link>
              <Link 
                to="/profile" 
                className="text-sm font-medium px-3 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
              >
                {t('header.profile')}
              </Link>
              <Link 
                to="/profile?section=loyalty" 
                className="text-sm font-medium px-3 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
              >
                {t('header.mobile11Money')}
              </Link>
              <Link 
                to="/profile?section=loyalty" 
                className="bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-1 text-sm font-semibold hover:bg-emerald-200 transition-colors"
              >
                {currency === 'THB' 
                  ? `฿${Math.round(mobile11Balance)}` 
                  : `$${convertThbToUsd(mobile11Balance).toFixed(2)}`}
              </Link>
              
              {/* Workspace Dropdown - Admin/Agent/Affiliate links */}
              {(isAdmin || isAgent || (isAffiliate && affiliateStatus === 'active')) && (
                <>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 px-3 text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                        <LayoutGrid className="h-4 w-4" />
                        <span className="text-sm font-medium">Workspace</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-background z-50">
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2.5 cursor-pointer">
                          <Shield className="h-4 w-4 text-orange-500" />
                          {t('header.adminConsole')}
                        </DropdownMenuItem>
                      )}
                      {isAgent && (
                        <DropdownMenuItem onClick={() => navigate('/agent')} className="gap-2.5 cursor-pointer">
                          <Headphones className="h-4 w-4 text-blue-500" />
                          {t('header.agentPortal')}
                        </DropdownMenuItem>
                      )}
                      {isAffiliate && affiliateStatus === 'active' && (
                        <DropdownMenuItem onClick={() => navigate('/affiliate/dashboard')} className="gap-2.5 cursor-pointer">
                          <Users className="h-4 w-4 text-emerald-500" />
                          {t('header.partnerDashboard')}
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('/admin/contact-center')} className="gap-2.5 cursor-pointer">
                            <Headphones className="h-4 w-4 text-violet-500" />
                            Contact Center
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </nav>
          )}
          
          {/* Right: Globe, Login/Logout, Cart, Mobile Menu */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Cart Button - Show for logged in users */}
            {user && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/cart')} className="relative text-[#1A1A1A] hover:bg-[#1A1A1A]/5">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {totalItems}
                  </Badge>}
              </Button>
            )}

            {/* Combined Language & Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-1 sm:px-2 text-[#1A1A1A] hover:bg-[#1A1A1A]/5">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">
                    {LANGUAGE_OPTIONS.find(l => l.code === language)?.label ?? 'EN'} / {CURRENCY_OPTIONS.find(c => c.code === currency)?.symbol ?? '$'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-background z-50">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Language</DropdownMenuLabel>
                {LANGUAGE_OPTIONS.map(opt => (
                  <DropdownMenuItem key={opt.code} onClick={() => setLanguage(opt.code)} className="gap-2">
                    {language === opt.code ? '✓' : <span className="w-3" />} {opt.flag} {opt.nativeName}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Currency</DropdownMenuLabel>
                {CURRENCY_OPTIONS.map(opt => (
                  <DropdownMenuItem key={opt.code} onClick={() => setCurrency(opt.code)} className="gap-2">
                    {currency === opt.code ? '✓' : <span className="w-3" />} {opt.symbol} {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop: Login/Logout */}
            {user ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut} 
                className="hidden md:flex text-sm border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
              >
                {t('header.signOut')}
              </Button>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={() => { setAuthModalTab('signin'); setAuthModalOpen(true); }}
                  className="text-sm font-medium px-3 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
                >
                  {t('header.signIn')}
                </button>
                <Button 
                  onClick={() => { setAuthModalTab('signup'); setAuthModalOpen(true); }}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4"
                  size="sm"
                >
                  {t('header.signUp')}
                </Button>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="min-w-10 min-h-10 text-[#1A1A1A] hover:bg-[#1A1A1A]/5">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white flex flex-col overflow-hidden border-l border-gray-200">
                <SheetHeader>
                  <SheetTitle className="text-left text-gray-900 font-semibold">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6 flex-1 min-h-0 overflow-y-auto pb-8 px-2">
                  {/* Main Navigation Links */}
                  <Button variant="ghost" onClick={() => { navigate('/what-is-esim'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                    {t('header.whatIsEsim')}
                  </Button>
                  <Button variant="ghost" onClick={() => { navigate('/packages'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                    {t('header.esimStore')}
                  </Button>
                  <Button variant="ghost" onClick={() => { navigate('/how-it-works'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                    {t('header.howItWorks')}
                  </Button>
                  <Button variant="ghost" onClick={() => { navigate('/about'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                    {t('header.aboutMobile11')}
                  </Button>
                  <Button variant="ghost" onClick={() => { navigate('/support'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                    {t('header.help')}
                  </Button>
                  
                  <div className="border-t border-gray-200 pt-4 mt-2" />
                  
                  <Button variant="ghost" onClick={() => { navigate('/business'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                    {t('header.forBusiness')}
                  </Button>
                  <Button variant="ghost" onClick={() => { navigate('/affiliate'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                    <Users className="mr-3 h-5 w-5 text-gray-600" />
                    {t('header.partnerProgram')}
                  </Button>
                  <Button variant="ghost" onClick={() => { navigate('/blog'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                    {t('header.blog')}
                  </Button>
                  
                  {user ? <>
                    {/* Mobile11 Money Badge for Mobile */}
                    <div className="border-t border-gray-200 pt-4 mt-2" />
                    <div 
                      onClick={() => { navigate('/profile?section=loyalty'); closeMobileMenu(); }}
                      className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{t('header.mobile11Money')}</span>
                      <span className="bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-1 text-sm font-semibold">
                        {currency === 'THB' 
                          ? `฿${Math.round(mobile11Balance)}` 
                          : `$${convertThbToUsd(mobile11Balance).toFixed(2)}`}
                      </span>
                    </div>
                    
                    <Button variant="ghost" onClick={() => { navigate('/my-esims'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                      <ShoppingBag className="mr-3 h-5 w-5 text-gray-600" />
                      {t('header.myEsims')}
                    </Button>
                    <Button variant="ghost" onClick={() => { navigate('/tickets'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                      <Ticket className="mr-3 h-5 w-5 text-gray-600" />
                      {t('header.myTickets')}
                    </Button>
                    <Button variant="ghost" onClick={() => { navigate('/profile'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                      <User className="mr-3 h-5 w-5 text-gray-600" />
                      {t('header.profile')}
                    </Button>
                    <Button variant="ghost" onClick={() => { navigate('/settings'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                      <Settings className="mr-3 h-5 w-5 text-gray-600" />
                      {t('header.settings')}
                    </Button>
                    {isAffiliate && affiliateStatus === 'active' && (
                      <Button variant="ghost" onClick={() => { navigate('/affiliate/dashboard'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                        <Users className="mr-3 h-5 w-5 text-gray-600" />
                        {t('header.partnerDashboard')}
                      </Button>
                    )}
                    {isAgent && (
                      <Button variant="ghost" onClick={() => { navigate('/agent'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                        <Headphones className="mr-3 h-5 w-5 text-gray-600" />
                        {t('header.agentPortal')}
                      </Button>
                    )}
                    {isAdmin && <Button variant="ghost" onClick={() => { navigate('/admin'); closeMobileMenu(); }} className="justify-start text-base text-gray-900 hover:bg-gray-100 hover:text-gray-900 h-12">
                      <Shield className="mr-3 h-5 w-5 text-gray-600" />
                      {t('header.adminConsole')}
                    </Button>}
                    <div className="border-t border-gray-200 pt-4 mt-2" />
                    <Button variant="ghost" onClick={() => { handleSignOut(); closeMobileMenu(); }} className="justify-start text-base text-orange-500 hover:text-orange-600 hover:bg-orange-50 h-12">
                      <LogOut className="mr-3 h-5 w-5" />
                      {t('header.signOut')}
                    </Button>
                  </> : <>
                    <div className="border-t border-gray-200 pt-4 mt-2" />
                    <Button 
                      onClick={() => { setAuthModalTab('signup'); setAuthModalOpen(true); closeMobileMenu(); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white w-full h-12 rounded-full font-medium"
                    >
                      {t('header.signUp')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setAuthModalTab('signin'); setAuthModalOpen(true); closeMobileMenu(); }}
                      className="w-full h-12 rounded-full font-medium border-gray-300 text-gray-900 hover:bg-gray-100 bg-white"
                    >
                      {t('header.signIn')}
                    </Button>
                  </>}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Row 2: Main Navigation (Desktop only) */}
      <div className="hidden md:block">
        <div className="container flex h-12 items-center justify-center px-4">
          <nav className="flex items-center gap-1">
            <Link 
              to="/what-is-esim" 
              className="text-sm font-medium px-4 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
            >
              {t('header.whatIsEsim')}
            </Link>
            <Link 
              to="/packages" 
              className="text-sm font-medium px-4 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
            >
              {t('header.esimStore')}
            </Link>
            <Link 
              to="/how-it-works" 
              className="text-sm font-medium px-4 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
            >
              {t('header.howItWorks')}
            </Link>
            <Link 
              to="/about" 
              className="text-sm font-medium px-4 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
            >
              {t('header.aboutMobile11')}
            </Link>
            <Link 
              to="/support" 
              className="text-sm font-medium px-4 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
            >
              {t('header.help')}
            </Link>
            <Link 
              to="/business" 
              className="text-sm font-medium px-4 py-2 transition-colors text-[#1A1A1A]/80 hover:text-orange-500"
            >
              {t('header.forBusiness')}
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Row 3: Search Bar - Persistent on all views */}
      <div className="py-3 lg:py-4 bg-[#F5F0EA]/50">
        <div className="container px-4">
          <HeaderSearchAutocomplete className="max-w-3xl mx-auto" />
        </div>
      </div>
    </header>
    {/* Spacer to account for fixed header height - search bar now visible on all views */}
    <div className="h-[110px] md:h-[168px]" />
    
    {/* Auth Modal */}
    <AuthModal 
      open={authModalOpen} 
      onOpenChange={setAuthModalOpen}
      defaultTab={authModalTab}
    />
  </>;
}
