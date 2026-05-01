import { lazy, Suspense, Component, ReactNode, useState, useEffect } from "react";
import { useIsMobileApp } from "@/hooks/useIsMobileApp";
// App entry point
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { PostAuthRedirector } from "@/components/auth/PostAuthRedirector";
import { RecoveryRedirector } from "@/components/auth/RecoveryRedirector";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { BusinessCartProvider } from "@/contexts/BusinessCartContext";
import { AffiliateTracker } from "@/components/AffiliateTracker";
import { JourneyTracker } from "@/hooks/useJourneyTracker";
import { FloatingCartButton } from "@/components/cart/FloatingCartButton";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { GTMPageViewTracker } from "@/components/GTMPageViewTracker";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Loader2, RefreshCw } from "lucide-react";
import { ThemeProvider } from "next-themes";

// Error Boundary to catch lazy loading failures with auto-recovery for chunk errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; isRecovering: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, isRecovering: false };
  }

  componentDidMount() {
    // If we loaded successfully, reset the reload counter
    sessionStorage.removeItem('chunk-error-reload-count');
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, isRecovering: false };
  }

  componentDidCatch(error: Error) {
    // Auto-recover for chunk/module loading errors
    const isChunkError = error.message?.toLowerCase().includes('module') || 
                         error.message?.toLowerCase().includes('chunk') ||
                         error.message?.toLowerCase().includes('loading') ||
                         error.message?.toLowerCase().includes('dynamically imported');
    
    if (isChunkError) {
      this.setState({ isRecovering: true });
      this.autoRecover();
    }
  }

  autoRecover = async () => {
    try {
      // Prevent infinite reload loops — allow at most 1 auto-reload
      const key = 'chunk-error-reload-count';
      const count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count >= 1) {
        sessionStorage.removeItem(key);
        this.setState({ isRecovering: false });
        return;
      }
      sessionStorage.setItem(key, String(count + 1));

      // Unregister all service workers and clear caches
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Brief delay to show updating message
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch {
      // If auto-recovery fails, show manual button
      this.setState({ isRecovering: false });
    }
  };

  handleReload = async () => {
    this.setState({ isRecovering: true });
    await this.autoRecover();
  };

  render() {
    if (this.state.hasError) {
      // Show minimal "updating" message during auto-recovery
      if (this.state.isRecovering) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
              <p className="text-sm text-gray-600">Updating app...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'Failed to load the page'}
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load pages for better performance
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const NativeAppPage = lazy(() => import("./pages/NativeAppPage"));
const LanguageScreen = lazy(() => import("./components/native/screens/LanguageScreen").then(m => ({ default: m.LanguageScreen })));
const CurrencyScreen = lazy(() => import("./components/native/screens/CurrencyScreen").then(m => ({ default: m.CurrencyScreen })));
const { SupportHomeSwitch, SupportCategorySwitch, SupportArticleSwitch } = (() => {
  const mod = import("./components/native/screens/SupportRouteSwitch");
  return {
    SupportHomeSwitch: lazy(() => mod.then(m => ({ default: m.SupportHomeSwitch }))),
    SupportCategorySwitch: lazy(() => mod.then(m => ({ default: m.SupportCategorySwitch }))),
    SupportArticleSwitch: lazy(() => mod.then(m => ({ default: m.SupportArticleSwitch }))),
  };
})();
const LandingPageV2 = lazy(() => import("./pages/LandingPageV2"));
// const ThailandLocalPage = lazy(() => import("./pages/ThailandLocalPage").then(m => ({ default: m.ThailandLocalPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then(m => ({ default: m.AuthPage })));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage").then(m => ({ default: m.AuthCallbackPage })));
const LineAuthCallbackPage = lazy(() => import("./pages/LineAuthCallbackPage").then(m => ({ default: m.default })));
const FacebookOAuthCallback = lazy(() => import("./components/admin/contact-center/FacebookOAuthCallback").then(m => ({ default: m.FacebookOAuthCallback })));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const PackagesPage = lazy(() => import("./pages/PackagesPage").then(m => ({ default: m.PackagesPage })));
const CartPage = lazy(() => import("./pages/CartPage").then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const CreateOrderPage = lazy(() => import("./pages/CreateOrderPage").then(m => ({ default: m.CreateOrderPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then(m => ({ default: m.AboutPage })));
const BusinessPage = lazy(() => import("./pages/BusinessPage").then(m => ({ default: m.BusinessPage })));
const BusinessLoginPage = lazy(() => import("./pages/BusinessLoginPage"));
const BusinessTeamPage = lazy(() => import("./pages/BusinessTeamPage"));
const BusinessEsimsPage = lazy(() => import("./pages/BusinessEsimsPage"));
const BusinessPurchasePage = lazy(() => import("./pages/BusinessPurchasePage"));
const BusinessCartPage = lazy(() => import("./pages/BusinessCartPage"));
const BusinessCheckoutPage = lazy(() => import("./pages/BusinessCheckoutPage"));
const BusinessTransactionsPage = lazy(() => import("./pages/BusinessTransactionsPage"));
const AcceptInvitationPage = lazy(() => import("./pages/AcceptInvitationPage"));
const SupportPage = lazy(() => import("./pages/SupportPage").then(m => ({ default: m.SupportPage })));
const HelpCenterAiralo = lazy(() => import("./pages/HelpCenterAiralo").then(m => ({ default: m.HelpCenterAiralo })));
const ContactPage = lazy(() => import("./pages/ContactPage").then(m => ({ default: m.ContactPage })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const OrdersPage = lazy(() => import("./pages/OrdersPage").then(m => ({ default: m.default })));
const MyEsimsPage = lazy(() => import("./pages/MyEsimsPage"));
const MyEsimDetailPage = lazy(() => import("./pages/MyEsimDetailPage"));
const HowRenewalsWorkPage = lazy(() => import("./pages/HowRenewalsWorkPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoyaltyProgramPage = lazy(() => import("./pages/LoyaltyProgramPage"));
const ReferAndEarnPage = lazy(() => import("./pages/ReferAndEarnPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage").then(m => ({ default: m.OrderDetailPage })));
const ReceiptPage = lazy(() => import("./pages/ReceiptPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage").then(m => ({ default: m.PaymentSuccessPage })));
const PaymentCanceledPage = lazy(() => import("./pages/PaymentCanceledPage").then(m => ({ default: m.PaymentCanceledPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then(m => ({ default: m.default })));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const TicketDetailPage = lazy(() => import("./pages/TicketDetailPage"));
const WhatIsEsimPage = lazy(() => import("./pages/WhatIsEsimPage").then(m => ({ default: m.WhatIsEsimPage })));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage"));
 const DataDeletionPage = lazy(() => import("./pages/DataDeletionPage"));
const InstallationGuidePage = lazy(() => import("./pages/InstallationGuidePage"));
const EsimGuidePage = lazy(() => import("./pages/EsimGuidePage"));
const GenerateEsimImagesPage = lazy(() => import("./pages/GenerateEsimImagesPage").then(m => ({ default: m.GenerateEsimImagesPage })));
const GenerateWhatIsEsimImages = lazy(() => import("./pages/GenerateWhatIsEsimImages"));
const GenerateMarketingBannersPage = lazy(() => import("./pages/GenerateMarketingBannersPage"));
const GenerateDestinationImagesPage = lazy(() => import("./pages/GenerateDestinationImagesPage"));
const GenerateRegionalImagesPage = lazy(() => import("./pages/GenerateRegionalImagesPage"));
const GenerateEnterpriseBrochurePage = lazy(() => import("./pages/GenerateEnterpriseBrochurePage"));
const GenerateThaiBlogImagesPage = lazy(() => import("./pages/GenerateThaiBlogImagesPage"));
// Migration tools - dev only (excluded from production builds to reduce size)
const MigrateAssetsPage = import.meta.env.DEV ? lazy(() => import("./pages/admin/MigrateAssetsPage")) : null;
const MigrateDestinationsPage = import.meta.env.DEV ? lazy(() => import("./pages/admin/MigrateDestinationsPage")) : null;
const MigrateBlogRootPage = import.meta.env.DEV ? lazy(() => import("./pages/admin/MigrateBlogRootPage")) : null;
const MigrateEurope42Page = import.meta.env.DEV ? lazy(() => import("./pages/admin/MigrateEurope42Page")) : null;
const MigrateThaiPage = import.meta.env.DEV ? lazy(() => import("./pages/admin/MigrateThaiPage")) : null;
const ImportUnlimitedPackages = lazy(() => import("./pages/ImportUnlimitedPackages").then(m => ({ default: m.default })));
const ImportMaxSpeedPackages = lazy(() => import("./pages/ImportMaxSpeedPackages").then(m => ({ default: m.default })));
const ImportGlobal151Packages = lazy(() => import("./pages/ImportGlobal151Packages").then(m => ({ default: m.default })));
const AffiliateRegisterPage = lazy(() => import("./pages/AffiliateRegisterPage"));
const AffiliateDashboardPage = lazy(() => import("./pages/AffiliateDashboardPage"));
const AffiliateInfoPage = lazy(() => import("./pages/AffiliateInfoPage").then(m => ({ default: m.AffiliateInfoPage })));
// Blog enabled - images served from Supabase Storage
const BlogPage = lazy(() => import("./pages/BlogPage").then(m => ({ default: m.BlogPage })));
const BlogArticlePage = lazy(() => import("./pages/BlogArticlePage").then(m => ({ default: m.BlogArticlePage })));
const AgentPage = lazy(() => import("./pages/AgentPage"));
const ThaiEsimLandingPage = lazy(() => import("./pages/ThaiEsimLandingPage").then(m => ({ default: m.ThaiEsimLandingPage })));
const ThaiSimRoamingPage = lazy(() => import("./pages/ThaiSimRoamingPage"));
const EmailConversationsPage = lazy(() => import("./pages/EmailConversationsPage"));
const EmailConversationDetailPage = lazy(() => import("./pages/EmailConversationDetailPage"));
const HelpCategoryPage = lazy(() => import("./pages/HelpCategoryPage"));
const HelpArticlePage = lazy(() => import("./pages/HelpArticlePage"));
const HelpCenterRedirect = lazy(() => import("./components/help-center/HelpCenterRedirect").then(m => ({ default: m.HelpCenterRedirect })));
const CountryEsimPage = lazy(() => import("./pages/CountryEsimPage"));
const CountryEsimPageV2 = lazy(() => import("./pages/CountryEsimPageV2"));
const CountryEsimPageV3 = lazy(() => import("./pages/CountryEsimPageV3"));
const CountryEsimPageV4 = lazy(() => import("./pages/CountryEsimPageV4"));
const LimitlessPage = lazy(() => import("./pages/LimitlessPage").then(m => ({ default: m.LimitlessPage })));
const OurValuesPage = lazy(() => import("./pages/OurValuesPage"));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.default })));
const ChatRedirectPage = lazy(() => import("./pages/ChatRedirectPage"));
const InstallEsimPage = lazy(() => import("./pages/InstallEsimPage"));
const QrPaymentPage = lazy(() => import("./pages/QrPaymentPage"));
const TranslatePage = lazy(() => import("./pages/TranslatePage"));
const Translate2Page = lazy(() => import("./pages/Translate2Page"));

// Loading fallback with timeout watchdog
const LoadingFallback = () => {
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRecovery(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleClearAndReload = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
        <p className="text-sm text-gray-600">Loading...</p>
        {showRecovery && (
          <div className="space-y-2 pt-4">
            <p className="text-xs text-gray-500">Still loading? Try clearing cache.</p>
            <button
              onClick={handleClearAndReload}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              <RefreshCw className="h-3 w-3" />
              Clear & Reload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

// RootRouter: redirects mobile users to /app, desktop users see LandingPage
function RootRouter() {
  const isMobileApp = useIsMobileApp();
  if (isMobileApp) {
    return <Navigate to="/app" replace />;
  }
  return <LandingPage />;
}

// Wrapper to conditionally show chat widget
const ChatWidgetWrapper = () => {
  const location = useLocation();
  const hiddenPaths = ['/admin', '/agent'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  return shouldHide ? null : <ChatWidget />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <TooltipProvider>
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <OrganizationProvider>
                <CartProvider>
                <BusinessCartProvider>
                <FloatingCartButton />
                <AffiliateTracker />
                <ScrollToTop />
                <JourneyTracker />
                <GTMPageViewTracker />
                <PostAuthRedirector />
                <RecoveryRedirector />
                <ChatWidgetWrapper />
                <Toaster />
                <Sonner />
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}> 
                    <Routes>
                      <Route path="/" element={<RootRouter />} />
                      <Route path="/app" element={<NativeAppPage tab="store" />} />
                      <Route path="/app/esims" element={<NativeAppPage tab="esims" />} />
                      <Route path="/app/profile" element={<NativeAppPage tab="profile" />} />
                      <Route path="/profile/language" element={<LanguageScreen />} />
                      <Route path="/profile/currency" element={<CurrencyScreen />} />
                      <Route path="/preview" element={<LandingPageV2 />} />
                      {/* <Route path="/thailand-local" element={<ThailandLocalPage />} /> */}
                      {/* <Route path="/th" element={<ThailandLocalPage />} /> */}
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />
                      <Route path="/auth/line/callback" element={<LineAuthCallbackPage />} />
                      <Route path="/auth/facebook/callback" element={<FacebookOAuthCallback />} />
                      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/packages" element={<PackagesPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/create-order" element={<CreateOrderPage />} />
                      <Route path="/create-order/:packageId" element={<CreateOrderPage />} />
                      <Route path="/what-is-esim" element={<WhatIsEsimPage />} />
                      <Route path="/how-it-works" element={<HowItWorksPage />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                      <Route path="/refund-policy" element={<RefundPolicyPage />} />
                       <Route path="/data-deletion" element={<DataDeletionPage />} />
                      <Route path="/installation-guide" element={<InstallationGuidePage />} />
                      <Route path="/guide" element={<EsimGuidePage />} />
                      <Route path="/admin/generate-esim-images" element={<GenerateEsimImagesPage />} />
                      <Route path="/admin/generate-what-is-esim-images" element={<GenerateWhatIsEsimImages />} />
                      <Route path="/admin/generate-marketing-banners" element={<GenerateMarketingBannersPage />} />
                      <Route path="/admin/generate-destination-images" element={<GenerateDestinationImagesPage />} />
                      <Route path="/admin/generate-regional-images" element={<GenerateRegionalImagesPage />} />
                      <Route path="/admin/generate-brochure" element={<GenerateEnterpriseBrochurePage />} />
                      <Route path="/admin/generate-thai-blog-images" element={<GenerateThaiBlogImagesPage />} />
                      {import.meta.env.DEV && MigrateAssetsPage && <Route path="/admin/migrate-assets" element={<MigrateAssetsPage />} />}
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/chat" element={<ChatRedirectPage />} />
                      <Route path="/business" element={<BusinessPage />} />
                      <Route path="/business/login" element={<BusinessLoginPage />} />
                      {/* Accept both /business/team and /business/team/ (some hosts auto-add trailing slash) */}
                      <Route path="/business/team/*" element={<BusinessTeamPage />} />
                      <Route path="/business/esims" element={<BusinessEsimsPage />} />
                      <Route path="/business/purchase" element={<BusinessPurchasePage />} />
                      <Route path="/business/cart" element={<BusinessCartPage />} />
                      <Route path="/business/checkout" element={<BusinessCheckoutPage />} />
                      <Route path="/business/transactions" element={<BusinessTransactionsPage />} />
                      <Route path="/business/invite/:token" element={<AcceptInvitationPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      {/* Support / Help Center - responsive routes (mobile vs desktop) */}
                      <Route path="/support" element={<SupportHomeSwitch />} />
                      <Route path="/support/:categorySlug" element={<SupportCategorySwitch />} />
                      <Route path="/support/:categorySlug/:articleSlug" element={<SupportArticleSwitch />} />
                      {/* Legacy Help Center redirects */}
                      <Route path="/help-center" element={<Navigate to="/support" replace />} />
                      <Route path="/help-center/:categorySlug" element={<HelpCenterRedirect />} />
                      <Route path="/help-center/:categorySlug/:articleSlug" element={<HelpCenterRedirect />} />
                      <Route path="/dashboard" element={<Navigate to="/" replace />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/my-esims" element={<MyEsimsPage />} />
                      <Route path="/my-esims/:orderId" element={<MyEsimDetailPage />} />
                      <Route path="/how-renewals-work" element={<HowRenewalsWorkPage />} />
                      <Route path="/order/:orderId" element={<OrderDetailPage />} />
                      <Route path="/receipt/:orderId" element={<ReceiptPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/loyalty-program/*" element={<LoyaltyProgramPage />} />
                      <Route path="/refer-and-earn" element={<ReferAndEarnPage />} />
                      <Route path="/qr-payment" element={<QrPaymentPage />} />
                      <Route path="/payment-success" element={<PaymentSuccessPage />} />
                      <Route path="/payment-canceled" element={<PaymentCanceledPage />} />
                      <Route path="/admin/*" element={<AdminPage />} />
                      {import.meta.env.DEV && MigrateDestinationsPage && <Route path="/admin/migrate-destinations" element={<MigrateDestinationsPage />} />}
                      {import.meta.env.DEV && MigrateBlogRootPage && <Route path="/admin/migrate-blog-root" element={<MigrateBlogRootPage />} />}
                      {import.meta.env.DEV && MigrateEurope42Page && <Route path="/admin/migrate-europe42" element={<MigrateEurope42Page />} />}
                      {import.meta.env.DEV && MigrateThaiPage && <Route path="/admin/migrate-thai-blog" element={<MigrateThaiPage />} />}
                      <Route path="/import-unlimited" element={<ImportUnlimitedPackages />} />
                      <Route path="/import-max-speed" element={<ImportMaxSpeedPackages />} />
                      <Route path="/import-global-151" element={<ImportGlobal151Packages />} />
                      <Route path="/tickets" element={<TicketsPage />} />
                      <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
                      <Route path="/email-conversations" element={<EmailConversationsPage />} />
                      <Route path="/email-conversations/:conversationId" element={<EmailConversationDetailPage />} />
                      <Route path="/affiliate" element={<AffiliateInfoPage />} />
                      <Route path="/affiliate/register" element={<AffiliateRegisterPage />} />
                      <Route path="/affiliate/dashboard" element={<AffiliateDashboardPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogArticlePage />} />
                      {/* eSIM Store redirect (used by LINE/Facebook "Browse eSIM" buttons) */}
                      <Route path="/esim" element={<Navigate to="/packages" replace />} />
                      {/* Country eSIM Pages */}
                      <Route path="/esim/:countrySlug" element={<CountryEsimPageV4 />} />
                      <Route path="/esim-v2/:countrySlug" element={<CountryEsimPageV2 />} />
                      <Route path="/esim-v3/:countrySlug" element={<CountryEsimPageV3 />} />
                      <Route path="/esim-v4/:countrySlug" element={<CountryEsimPageV4 />} />
                      {/* Limitless Page */}
                      <Route path="/limitless" element={<LimitlessPage />} />
                      {/* Our Values Page */}
                      <Route path="/our-values" element={<OurValuesPage />} />
                      {/* Thai SEO Landing Pages */}
                      <Route path="/th/sim-roaming" element={<ThaiSimRoamingPage />} />
                      <Route path="/th/sim-tangprathet" element={<ThaiSimRoamingPage />} />
                      <Route path="/th/esim-japan" element={<ThaiEsimLandingPage />} />
                      <Route path="/th/esim-korea" element={<ThaiEsimLandingPage />} />
                      <Route path="/th/esim-taiwan" element={<ThaiEsimLandingPage />} />
                      <Route path="/th/esim-hongkong" element={<ThaiEsimLandingPage />} />
                      <Route path="/th/esim-europe" element={<ThaiEsimLandingPage />} />
                      <Route path="/th/esim-:country" element={<ThaiEsimLandingPage />} />
                      {/* Agent Portal */}
                      <Route path="/agent/*" element={<AgentPage />} />
                      {/* Shareable eSIM install page */}
                      <Route path="/install/:shortCode" element={<InstallEsimPage />} />
                      {/* Mobile11 Translate */}
                      <Route path="/translate" element={<TranslatePage />} />
                      <Route path="/translate2/*" element={<Translate2Page />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      {/* Legacy landing for direct access */}
                      <Route path="/landing" element={<LandingPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
                </BusinessCartProvider>
              </CartProvider>
              </OrganizationProvider>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
