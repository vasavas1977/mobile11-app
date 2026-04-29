import { useEffect, useState, useLayoutEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { AdminSidebar, AdminMobileMenuTrigger } from '@/components/admin/AdminSidebar';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminPackages } from '@/components/admin/AdminPackages';
import { AdminCatalog } from '@/components/admin/AdminCatalog';
import { AdminProvisioning } from '@/components/admin/AdminProvisioning';
import { AdminPackageDisplay } from '@/components/admin/AdminPackageDisplay';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminCustomerDetail } from '@/components/admin/AdminCustomerDetail';
import { AdminTickets } from '@/components/admin/AdminTickets';
import { AdminTicketDetail } from '@/components/admin/AdminTicketDetail';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminAffiliates } from '@/components/admin/AdminAffiliates';
import { AdminTerritories } from '@/components/admin/AdminTerritories';
import { TerritoriesPage } from '@/components/admin/partners/TerritoriesPage';
import { Button } from '@/components/ui/button';
import { LogOut, Globe, Bell, User } from 'lucide-react';
import { useLanguage, LANGUAGE_OPTIONS } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import logo from '@/assets/logo.png';

import { AdminDeveloper } from '@/components/admin/AdminDeveloper';
import AdminSettings from '@/components/admin/AdminSettings';
import { AdminPromoCodes } from '@/components/admin/AdminPromoCodes';
import { AdminCampaigns } from '@/components/admin/AdminCampaigns';
import KnowledgeBase from '@/pages/admin/KnowledgeBase';
import { AdminEsimPreview } from '@/components/admin/AdminEsimPreview';
import { AdminEsimDetailPreview } from '@/components/admin/AdminEsimDetailPreview';
import { AdminProfilePreview } from '@/components/admin/AdminProfilePreview';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';
import { PartnerOverviewPage } from '@/components/admin/partners/PartnerOverviewPage';
import { DistributorsPage } from '@/components/admin/partners/DistributorsPage';
import { ResellersPage } from '@/components/admin/partners/ResellersPage';
import { APIPartnersPage } from '@/components/admin/partners/APIPartnersPage';
import { CorporateAccountsPage } from '@/components/admin/partners/CorporateAccountsPage';
import { WalletsPage } from '@/components/admin/partners/WalletsPage';
import { PricingPlansPage } from '@/components/admin/partners/PricingPlansPage';
import { ContractsPage } from '@/components/admin/partners/ContractsPage';
import { PartnerDataModeProvider } from '@/contexts/PartnerDataModeContext';
import { AdminRolesPermissions } from '@/components/admin/AdminRolesPermissions';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';
import { GeminiBridgeDeploy } from '@/components/admin/GeminiBridgeDeploy';
import {
  ContactCenterLayout,
  ContactCenterDashboard,
  ContactCenterConversations,
  ContactCenterAgents,
  ContactCenterAnalytics,
  ContactCenterConversationDetail,
  ContactCenterChannels,
  ContactCenterRatingReport,
  ContactCenterAIFailures,
  ContactCenterClusters,
  ContactCenterDailyReports,
  ContactCenterKBCandidates,
  ContactCenterFAQCandidates,
  ContactCenterPromptVersions,
  ContactCenterExperiments,
  ContactCenterActionAudit,
  ContactCenterMissingActions,
  ContactCenterGuardrails,
  ContactCenterApprovalPolicies,
  ContactCenterControlTower,
  ContactCenterIntentLibrary,
  ContactCenterJourneys,
  ContactCenterEscalations,
  ContactCenterOutboundCampaigns,
  ContactCenterOutboundJourneys,
  ContactCenterTriggerEngine,
  ContactCenterMessageTemplates,
  ContactCenterOutboundScheduler,
  ContactCenterSendLogs,
  ContactCenterLearningEvents,
  ContactCenterOutboundExperiments,
  ContactCenterOutboundOptimization,
  ContactCenterNextBestAction,
  ContactCenterOutboundGuardrails,
  ContactCenterOutboundCustomers,
  ContactCenterCustomerProfile,
  ContactCenterAIMessages,
  ContactCenterSuppressionConsent,
  ContactCenterOutboundAnalytics,
} from '@/components/admin/contact-center';
import { VoiceBotTester } from '@/components/admin/contact-center/VoiceBotTester';
import { BridgeLogsPage } from '@/components/admin/contact-center/BridgeLogsPage';
import { BridgeMonitorPage } from '@/components/admin/contact-center/BridgeMonitorPage';
import VoiceBridgeHealthPage from '@/pages/admin/VoiceBridgeHealthPage';
import VoiceBridgeSettingsPage from '@/pages/admin/VoiceBridgeSettingsPage';
import { AdminTelecom } from '@/components/admin/telecom/AdminTelecom';

// Error boundary to prevent full-page crashes
class AdminErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin panel error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4 max-w-md p-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Something went wrong</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <Button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminPage() {
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useAdminCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    setTheme('light');
    return () => { setTheme('dark'); };
  }, [setTheme]);

  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('post_auth_next', '/admin');
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'signin' } }));
      navigate('/', { replace: true });
    } else if (!loading && user && !isAdmin) {
      toast({ title: "Access Denied", description: "You don't have permission to access the admin console.", variant: "destructive" });
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate, toast]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2]">
        <div className="text-center">
          <img src={logo} alt="mobile11" className="h-10 w-auto mx-auto mb-3 animate-pulse" />
          <p className="text-[#9CA3AF] font-medium text-sm">Loading admin console...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const userInitial = user.email?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden admin-light-force">
      <AdminSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header — 56px fixed height */}
        <header className="h-14 border-b border-[#F3F0EB] bg-white flex-shrink-0 flex items-center px-4 sm:px-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AdminMobileMenuTrigger onClick={() => setMobileMenuOpen(true)} />
            <h2 className="text-sm font-semibold text-[#1A1A1A] hidden sm:block">
              {t('admin.console')}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notifications (placeholder) */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#FAF7F2] text-[#9CA3AF] relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </Button>

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#FAF7F2] text-[#9CA3AF]">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(language === lang.code && "bg-accent")}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.nativeName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-semibold text-xs">
                  {userInitial}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] bg-white border border-[#F3F0EB] shadow-lg">
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-[#1A1A1A] truncate">{user.email}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Administrator</p>
                </div>
                <DropdownMenuSeparator className="bg-[#F3F0EB]" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600">
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  {t('admin.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 text-[#1A1A1A] [&_table]:text-[#1A1A1A] [&_th]:text-[#6B7280] [&_td]:text-[#1A1A1A] [&_.text-muted-foreground]:text-[#6B7280] [&_.text-foreground]:text-[#1A1A1A]">
          <AdminBreadcrumbs />
          <AdminErrorBoundary>
          <Routes>
            <Route index element={<PartnerDataModeProvider><AdminDashboard /></PartnerDataModeProvider>} />
            <Route path="packages" element={<AdminProvisioning />} />
            <Route path="packages/display" element={<AdminPackageDisplay />} />
            <Route path="provisioning" element={<AdminProvisioning />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminCustomerDetail />} />
            <Route path="users/:userId/preview/esims" element={<AdminEsimPreview />} />
            <Route path="users/:userId/preview/esims/:orderId" element={<AdminEsimDetailPreview />} />
            <Route path="users/:userId/preview/profile" element={<AdminProfilePreview />} />
            <Route path="organizations" element={<AdminUsers />} />
            {/* Legacy redirect - organizations now lives inside accounts */}
            <Route path="affiliates" element={<AdminAffiliates />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="tickets/:ticketId" element={<AdminTicketDetail />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="campaigns" element={<AdminCampaigns />} />
            <Route path="promo-codes" element={<AdminPromoCodes />} />
            <Route path="territories" element={<PartnerDataModeProvider><TerritoriesPage /></PartnerDataModeProvider>} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="partners" element={<PartnerDataModeProvider><PartnerOverviewPage /></PartnerDataModeProvider>} />
            <Route path="partners/distributors" element={<PartnerDataModeProvider><DistributorsPage /></PartnerDataModeProvider>} />
            <Route path="partners/resellers" element={<PartnerDataModeProvider><ResellersPage /></PartnerDataModeProvider>} />
            <Route path="partners/api" element={<PartnerDataModeProvider><APIPartnersPage /></PartnerDataModeProvider>} />
            <Route path="partners/corporate" element={<PartnerDataModeProvider><CorporateAccountsPage /></PartnerDataModeProvider>} />
            <Route path="partners/wallets" element={<PartnerDataModeProvider><WalletsPage /></PartnerDataModeProvider>} />
            <Route path="partners/pricing" element={<PartnerDataModeProvider><PricingPlansPage /></PartnerDataModeProvider>} />
            <Route path="partners/contracts" element={<PartnerDataModeProvider><ContractsPage /></PartnerDataModeProvider>} />
            <Route path="roles" element={<AdminRolesPermissions />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="contact-center" element={<PartnerDataModeProvider><ContactCenterLayout /></PartnerDataModeProvider>}>
              <Route index element={<ContactCenterDashboard />} />
              <Route path="conversations" element={<ContactCenterConversations />} />
              <Route path="conversations/:conversationId" element={<ContactCenterConversationDetail />} />
              <Route path="agents" element={<ContactCenterAgents />} />
              <Route path="analytics" element={<ContactCenterAnalytics />} />
              <Route path="channels" element={<ContactCenterChannels />} />
              <Route path="ratings" element={<ContactCenterRatingReport />} />
              <Route path="ai-failures" element={<ContactCenterAIFailures />} />
              <Route path="clusters" element={<ContactCenterClusters />} />
              <Route path="voice-test" element={<VoiceBotTester />} />
              <Route path="bridge-logs" element={<BridgeLogsPage />} />
              <Route path="bridge-monitor" element={<BridgeMonitorPage />} />
              <Route path="daily-reports" element={<ContactCenterDailyReports />} />
              <Route path="kb-candidates" element={<ContactCenterKBCandidates />} />
              <Route path="faq-candidates" element={<ContactCenterFAQCandidates />} />
              <Route path="prompt-versions" element={<ContactCenterPromptVersions />} />
              <Route path="experiments" element={<ContactCenterExperiments />} />
              <Route path="actions" element={<ContactCenterActionAudit />} />
              <Route path="missing-actions" element={<ContactCenterMissingActions />} />
              <Route path="guardrails" element={<ContactCenterGuardrails />} />
              <Route path="approval-policies" element={<ContactCenterApprovalPolicies />} />
              <Route path="control-tower" element={<ContactCenterControlTower />} />
              <Route path="intent-library" element={<ContactCenterIntentLibrary />} />
              <Route path="journeys" element={<ContactCenterJourneys />} />
              <Route path="escalations" element={<ContactCenterEscalations />} />
              <Route path="outbound-campaigns" element={<ContactCenterOutboundCampaigns />} />
              <Route path="outbound-journeys" element={<ContactCenterOutboundJourneys />} />
              <Route path="trigger-engine" element={<ContactCenterTriggerEngine />} />
              <Route path="outbound-templates" element={<ContactCenterMessageTemplates />} />
              <Route path="outbound-scheduler" element={<ContactCenterOutboundScheduler />} />
              <Route path="outbound-send-logs" element={<ContactCenterSendLogs />} />
              <Route path="learning-events" element={<ContactCenterLearningEvents />} />
              <Route path="outbound-experiments" element={<ContactCenterOutboundExperiments />} />
              <Route path="outbound-optimization" element={<ContactCenterOutboundOptimization />} />
              <Route path="next-best-action" element={<ContactCenterNextBestAction />} />
              <Route path="outbound-autonomy" element={<ContactCenterOutboundGuardrails />} />
              <Route path="outbound-customers" element={<ContactCenterOutboundCustomers />} />
              <Route path="outbound-customers/:customerId" element={<ContactCenterCustomerProfile />} />
              <Route path="ai-messages" element={<ContactCenterAIMessages />} />
              <Route path="suppression-consent" element={<ContactCenterSuppressionConsent />} />
              <Route path="outbound-analytics" element={<ContactCenterOutboundAnalytics />} />
            </Route>
            <Route path="settings" element={<AdminSettings />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="gemini-bridge" element={<GeminiBridgeDeploy />} />
            <Route path="voice-bridge/health" element={<VoiceBridgeHealthPage />} />
            <Route path="voice-bridge/settings" element={<VoiceBridgeSettingsPage />} />
            <Route path="voice-bridge/logs" element={<BridgeLogsPage />} />
            <Route path="telecom" element={<AdminTelecom />} />
          </Routes>
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
}
