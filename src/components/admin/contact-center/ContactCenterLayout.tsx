import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, MessageSquare, Users, Share2,
  BarChart3, Star, FileText,
  Brain, AlertTriangle, Layers, Target, Route,
  BookOpen, HelpCircle, ScrollText, Beaker,
  Cog, Zap, ShieldCheck, KeyRound,
  ChevronDown, PanelLeftClose, PanelLeft, Menu, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PartnerDataModeToggle } from "@/components/admin/partners/PartnerDataModeToggle";

interface NavItem {
  titleKey: string;
  url: string;
  icon: any;
  exact?: boolean;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: "operations",
    items: [
      { titleKey: "dashboard", url: "/admin/contact-center", icon: LayoutDashboard, exact: true },
      { titleKey: "conversations", url: "/admin/contact-center/conversations", icon: MessageSquare },
      { titleKey: "escalations", url: "/admin/contact-center/escalations", icon: AlertTriangle },
      { titleKey: "agents", url: "/admin/contact-center/agents", icon: Users },
      { titleKey: "channels", url: "/admin/contact-center/channels", icon: Share2 },
    ],
  },
  {
    labelKey: "quality",
    items: [
      { titleKey: "analytics", url: "/admin/contact-center/analytics", icon: BarChart3 },
      { titleKey: "ratingsQuality", url: "/admin/contact-center/ratings", icon: Star },
      { titleKey: "dailyReports", url: "/admin/contact-center/daily-reports", icon: FileText },
    ],
  },
  {
    labelKey: "aiIntelligence",
    items: [
      { titleKey: "controlTower", url: "/admin/contact-center/control-tower", icon: Brain },
      { titleKey: "failuresClusters", url: "/admin/contact-center/ai-failures", icon: AlertTriangle },
      { titleKey: "intentLibrary", url: "/admin/contact-center/intent-library", icon: Target },
      { titleKey: "journeys", url: "/admin/contact-center/journeys", icon: Route },
      { titleKey: "clusters", url: "/admin/contact-center/clusters", icon: Layers },
    ],
  },
  {
    labelKey: "optimization",
    items: [
      { titleKey: "kbCandidates", url: "/admin/contact-center/kb-candidates", icon: BookOpen },
      { titleKey: "faqCandidates", url: "/admin/contact-center/faq-candidates", icon: HelpCircle },
      { titleKey: "promptVersions", url: "/admin/contact-center/prompt-versions", icon: ScrollText },
      { titleKey: "experiments", url: "/admin/contact-center/experiments", icon: Beaker },
    ],
  },
  {
    labelKey: "governance",
    items: [
      { titleKey: "aiActions", url: "/admin/contact-center/actions", icon: Cog },
      { titleKey: "missingActions", url: "/admin/contact-center/missing-actions", icon: Zap },
      { titleKey: "guardrails", url: "/admin/contact-center/guardrails", icon: ShieldCheck },
      { titleKey: "approvalPolicies", url: "/admin/contact-center/approval-policies", icon: KeyRound },
    ],
  },
  {
    labelKey: "outbound",
    items: [
      { titleKey: "customers", url: "/admin/contact-center/outbound-customers", icon: Users },
      { titleKey: "campaigns", url: "/admin/contact-center/outbound-campaigns", icon: Target },
      { titleKey: "journeys", url: "/admin/contact-center/outbound-journeys", icon: Route },
      { titleKey: "templates", url: "/admin/contact-center/outbound-templates", icon: FileText },
      { titleKey: "aiMessages", url: "/admin/contact-center/ai-messages", icon: Brain },
      { titleKey: "sendLogs", url: "/admin/contact-center/outbound-send-logs", icon: ClipboardList },
      { titleKey: "consent", url: "/admin/contact-center/suppression-consent", icon: ShieldCheck },
      { titleKey: "outboundAnalytics", url: "/admin/contact-center/outbound-analytics", icon: BarChart3 },
      { titleKey: "experiments", url: "/admin/contact-center/outbound-experiments", icon: Beaker },
      { titleKey: "optimization", url: "/admin/contact-center/outbound-optimization", icon: Zap },
      { titleKey: "nextBestAction", url: "/admin/contact-center/next-best-action", icon: Target },
      { titleKey: "autonomy", url: "/admin/contact-center/outbound-autonomy", icon: ShieldCheck },
    ],
  },
];

const SIDEBAR_STORAGE_KEY = "cc_sidebar_collapsed";

export function ContactCenterLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const currentPath = location.pathname;
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      const hasActive = group.items.some(item =>
        item.exact ? currentPath === item.url : currentPath.startsWith(item.url)
      );
      initial[group.labelKey] = hasActive;
    }
    initial["operations"] = true;
    return initial;
  });

  // Close mobile sheet on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch {}
  };

  const toggleGroup = (labelKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [labelKey]: !prev[labelKey] }));
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return currentPath === path;
    return currentPath.startsWith(path);
  };

  const renderNavContent = (isMobile = false) => (
    <nav className="flex-1 overflow-y-auto px-1.5 pb-4 space-y-1">
      {navGroups.map((group) => {
        const isGroupExpanded = expandedGroups[group.labelKey] ?? false;
        const hasActiveItem = group.items.some(item => isActive(item.url, item.exact));
        const groupLabel = t(`adminCC.groups.${group.labelKey}`);
        const showLabels = isMobile || !collapsed;

        return (
          <div key={group.labelKey}>
            {showLabels && (
              <button
                onClick={() => toggleGroup(group.labelKey)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors",
                  hasActiveItem
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{groupLabel}</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    isGroupExpanded ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>
            )}

            {((!showLabels) || isGroupExpanded) && (
              <div className={cn("space-y-0.5", showLabels && "mt-0.5 mb-2")}>
                {group.items.map((item) => {
                  const active = isActive(item.url, item.exact);
                  const itemTitle = t(`adminCC.nav.${item.titleKey}`);
                  return (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.exact}
                      title={!showLabels ? itemTitle : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all",
                        !showLabels
                          ? "justify-center px-0 py-2 mx-0.5"
                          : "px-2.5 py-[7px]",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("flex-shrink-0", !showLabels ? "h-[18px] w-[18px]" : "h-4 w-4")} />
                      {showLabels && <span className="truncate">{itemTitle}</span>}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-muted-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('adminCC.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('adminCC.subtitle')}
            </p>
          </div>
        </div>
        <PartnerDataModeToggle />
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 pt-4">
          <SheetHeader className="px-4 pb-2">
            <SheetTitle className="text-sm">{t('adminCC.title')}</SheetTitle>
          </SheetHeader>
          {renderNavContent(true)}
        </SheetContent>
      </Sheet>

      <div className="flex gap-0 min-h-[calc(100vh-220px)]">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-shrink-0 border-r border-border bg-muted/50 rounded-l-xl transition-all duration-200 overflow-hidden",
            collapsed ? "w-[52px]" : "w-[220px]"
          )}
        >
          <div className="flex flex-col h-full w-full">
            <div className={cn("flex items-center px-2 py-2", collapsed ? "justify-center" : "justify-end")}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={toggleCollapsed}
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
            {renderNavContent(false)}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 pl-0 md:pl-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}