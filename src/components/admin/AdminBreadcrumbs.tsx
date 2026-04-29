import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  admin: "Admin",
  orders: "Orders & Fulfillment",
  packages: "Inventory & Packages",
  users: "Customers",
  affiliates: "Partners & Affiliates",
  campaigns: "Campaigns",
  "promo-codes": "Promo & Loyalty Codes",
  "contact-center": "Contact Center",
  "knowledge-base": "Knowledge Base",
  analytics: "Analytics & Insights",
  settings: "Settings",
  tickets: "Tickets",
  territories: "Territories",
  display: "Display Settings",
  conversations: "Conversations",
  agents: "Team",
  channels: "Channels",
  ratings: "Quality & AI",
  partners: "Partners",
  distributors: "Distributors",
  resellers: "Resellers",
  api: "API Partners",
  wallets: "Wallets & Settlements",
  pricing: "Pricing Plans",
  contracts: "Contracts",
  roles: "Roles & Permissions",
  "audit-logs": "Audit Logs",
  "ai-failures": "AI Queue",
  escalations: "Escalations",
  catalog: "Catalog",
};

export function AdminBreadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length <= 1) return null;

  const crumbs = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const isLast = index === pathSegments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-[#D1D5DB] flex-shrink-0" />}
            {crumb.isLast ? (
              <span className="text-[#1A1A1A] font-medium truncate max-w-[200px]">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors truncate max-w-[200px]">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
