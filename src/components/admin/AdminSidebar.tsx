import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Menu,
  X,
  UserPlus,
  Headphones,
  BookOpen,
  Megaphone,
  Ticket,
  ChevronDown,
  Globe,
  Building2,
  MessageSquare,
  Brain,
  UserCog,
  Share2,
  Star,
  Heart,
  Handshake,
  Truck,
  Store,
  Code,
  Smartphone,
  Briefcase,
  Wallet,
  Tags,
  TrendingUp,
  PieChart,
  Plug,
  ShieldCheck,
  ScrollText,
  Code2,
  BookMarked,
  AlertTriangle,
  Radio,
  CreditCard,
  Activity,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  titleKey: string;
  url: string;
  icon: any;
  exact?: boolean;
  badge?: string;
  disabled?: boolean;
  roles?: string[];
  placeholder?: boolean;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const adminGroups: NavGroup[] = [
  {
    labelKey: "coreOperations",
    items: [
      { titleKey: "commandCenter", url: "/admin", icon: LayoutDashboard, exact: true },
      { titleKey: "orders", url: "/admin/orders", icon: ShoppingCart },
      { titleKey: "provisioning", url: "/admin/provisioning", icon: Package },
      { titleKey: "customers", url: "/admin/users", icon: Users },
      { titleKey: "catalog", url: "/admin/catalog", icon: BookMarked },
    ],
  },
  {
    labelKey: "telecomOperations",
    items: [
      { titleKey: "simInventory", url: "/admin/telecom", icon: Smartphone, exact: true },
      { titleKey: "subscriptions", url: "/admin/telecom?tab=subscriptions", icon: CreditCard },
      { titleKey: "telecomPlans", url: "/admin/telecom?tab=plans", icon: Tags },
      { titleKey: "providerJobs", url: "/admin/telecom?tab=jobs", icon: Activity },
      { titleKey: "usageMonitor", url: "/admin/telecom?tab=usage", icon: TrendingUp },
      { titleKey: "telecomTransactions", url: "/admin/telecom?tab=transactions", icon: ScrollText },
      { titleKey: "telecomEventLog", url: "/admin/telecom?tab=events", icon: ClipboardList },
    ],
  },
  {
    labelKey: "customerOperations",
    items: [
      { titleKey: "inbox", url: "/admin/contact-center/conversations", icon: MessageSquare },
      { titleKey: "aiQueue", url: "/admin/contact-center/ai-failures", icon: Brain },
      { titleKey: "escalations", url: "/admin/contact-center/escalations", icon: AlertTriangle },
      { titleKey: "agents", url: "/admin/contact-center/agents", icon: UserCog },
      { titleKey: "channels", url: "/admin/contact-center/channels", icon: Share2 },
      { titleKey: "qualityDeadAir", url: "/admin/contact-center/ratings", icon: Star },
      { titleKey: "bridgeMonitor", url: "/admin/contact-center/bridge-monitor", icon: Activity },
      { titleKey: "knowledgeBase", url: "/admin/knowledge-base", icon: BookOpen },
    ],
  },
  {
    labelKey: "growth",
    items: [
      { titleKey: "campaigns", url: "/admin/campaigns", icon: Megaphone },
      { titleKey: "promoCodes", url: "/admin/promo-codes", icon: Ticket },
      { titleKey: "loyalty", url: "/admin/promo-codes?tab=loyalty", icon: Heart },
      { titleKey: "affiliates", url: "/admin/affiliates", icon: UserPlus },
    ],
  },
  {
    labelKey: "partners",
    items: [
      { titleKey: "partnerOverview", url: "/admin/partners", icon: Handshake },
      { titleKey: "distributors", url: "/admin/partners/distributors", icon: Truck },
      { titleKey: "resellers", url: "/admin/partners/resellers", icon: Store },
      { titleKey: "apiPartners", url: "/admin/partners/api", icon: Code },
      { titleKey: "corporateAccounts", url: "/admin/partners/corporate", icon: Briefcase },
      { titleKey: "territories", url: "/admin/territories", icon: Globe },
      { titleKey: "walletsSettlements", url: "/admin/partners/wallets", icon: Wallet },
      { titleKey: "pricingPlans", url: "/admin/partners/pricing", icon: Tags },
      { titleKey: "contracts", url: "/admin/partners/contracts", icon: ScrollText },
    ],
  },
  {
    labelKey: "insights",
    items: [
      { titleKey: "salesAnalytics", url: "/admin/analytics", icon: TrendingUp, exact: true },
      { titleKey: "serviceAnalytics", url: "/admin/analytics?tab=service", icon: Headphones },
      { titleKey: "marginAnalytics", url: "/admin/analytics?tab=margin", icon: PieChart, badge: "Soon" },
      { titleKey: "partnerAnalytics", url: "/admin/analytics?tab=affiliates", icon: BarChart3 },
    ],
  },
  {
    labelKey: "platform",
    items: [
      { titleKey: "settings", url: "/admin/settings", icon: Settings },
      { titleKey: "integrations", url: "/admin/settings?tab=integrations", icon: Plug },
      { titleKey: "rolesPermissions", url: "/admin/roles", icon: ShieldCheck },
      { titleKey: "auditLogs", url: "/admin/audit-logs", icon: ScrollText },
      { titleKey: "developerTools", url: "/admin/settings?tab=developer", icon: Code2 },
      { titleKey: "geminiBridge", url: "/admin/gemini-bridge", icon: Radio },
      { titleKey: "voiceBridgeHealth", url: "/admin/voice-bridge/health", icon: Activity },
      { titleKey: "voiceBridgeSettings", url: "/admin/voice-bridge/settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const currentPath = location.pathname + location.search;
  const pathOnly = location.pathname;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of adminGroups) {
      const hasActive = group.items.some(item =>
        item.exact ? pathOnly === item.url : pathOnly.startsWith(item.url.split("?")[0])
      );
      initial[group.labelKey] = hasActive;
    }
    initial["coreOperations"] = true;
    return initial;
  });

  useEffect(() => {
    if (onMobileClose) onMobileClose();
  }, [pathOnly]);

  const isActive = (url: string, exact?: boolean) => {
    const [path, query] = url.split("?");
    if (exact) return pathOnly === path && (!query || currentPath.includes(query));
    if (query) return pathOnly.startsWith(path) && currentPath.includes(query);
    return pathOnly.startsWith(path);
  };

  const toggleGroup = (labelKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [labelKey]: !prev[labelKey] }));
  };

  const getNavClasses = (url: string, exact?: boolean, disabled?: boolean) => {
    const active = isActive(url, exact);
    return cn(
      "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative",
      "text-[13px] font-medium",
      disabled && "opacity-50 cursor-not-allowed",
      active
        ? "bg-orange-500/8 text-orange-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[2px] before:bg-orange-500 before:rounded-full"
        : "text-[#4B5563] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]"
    );
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn(
      "flex flex-col bg-white h-full",
      isMobile ? "w-full" : cn(
        "border-r border-[#F3F0EB] transition-all duration-300",
        collapsed ? "w-[56px]" : "w-[248px]"
      )
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#F3F0EB]">
        {(isMobile || !collapsed) && (
          <div className="flex items-center gap-2">
            <img src={logo} alt="mobile11" className="h-7 w-auto" />
            <span className="font-bold text-[#1A1A1A] text-sm">Admin</span>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 p-0 rounded-lg hover:bg-[#FAF7F2] text-[#9CA3AF]"
          >
            {collapsed ? <Menu className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          </Button>
        )}
        {isMobile && onMobileClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileClose}
            className="h-7 w-7 p-0 rounded-lg hover:bg-[#FAF7F2] text-[#9CA3AF]"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {collapsed && !isMobile && (
        <div className="flex justify-center py-3">
          <img src={logo} alt="mobile11" className="h-5 w-auto" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {adminGroups.map((group, groupIndex) => {
          const isGroupExpanded = expandedGroups[group.labelKey] ?? false;
          const hasActiveItem = group.items.some(item => isActive(item.url, item.exact));
          const groupLabel = t(`admin.groups.${group.labelKey}`);

          return (
            <div key={group.labelKey}>
              {groupIndex > 0 && !collapsed && (
                <div className="mx-3 my-2 border-t border-[#F3F0EB]" />
              )}

              {(!collapsed || isMobile) && (
                <button
                  onClick={() => toggleGroup(group.labelKey)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase rounded-md transition-colors",
                    "tracking-[0.08em]",
                    hasActiveItem ? "text-orange-500" : "text-[#6B7280] hover:text-[#1A1A1A]"
                  )}
                >
                  <span>{groupLabel}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isGroupExpanded ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
              )}

              {(collapsed || isGroupExpanded) && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const title = t(`admin.nav.${item.titleKey}`);
                    return (
                      <NavLink
                        key={item.titleKey}
                        to={item.disabled ? "#" : item.url}
                        className={getNavClasses(item.url, item.exact, item.disabled)}
                        title={(!isMobile && collapsed) ? title : undefined}
                        onClick={(e) => {
                          if (item.disabled) { e.preventDefault(); return; }
                          if (isMobile) onMobileClose?.();
                        }}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {(isMobile || !collapsed) && (
                          <span className="flex-1 truncate">{title}</span>
                        )}
                        {item.badge && (isMobile || !collapsed) && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-orange-50 text-orange-500 border-orange-200 font-semibold">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {(isMobile || !collapsed) && (
        <div className="p-3 border-t border-[#F3F0EB]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-[#9CA3AF] font-medium tracking-wide uppercase">Production</span>
          </div>
          <div className="text-[10px] text-[#9CA3AF]/60 mt-1">
            {t('admin.version')}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block h-full">
        <SidebarContent />
      </div>
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="p-0 w-72 bg-white border-r border-[#F3F0EB]">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function AdminMobileMenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="lg:hidden h-9 w-9 p-0 rounded-xl hover:bg-[#FAF7F2] text-[#1A1A1A]"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  );
}
