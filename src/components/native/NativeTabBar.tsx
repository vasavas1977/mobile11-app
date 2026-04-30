import { useNavigate, useLocation } from "react-router-dom";
import { Store, Smartphone, User } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

interface TabItem {
  icon: typeof Store;
  label: string;
  route: string;
}

const TABS: TabItem[] = [
  { icon: Store, label: "Store", route: "/app" },
  { icon: Smartphone, label: "My eSIMs", route: "/app/esims" },
  { icon: User, label: "Profile", route: "/app/profile" },
];

export function NativeTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabTap = (route: string) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    navigate(route);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive =
            tab.route === "/app"
              ? location.pathname === "/app"
              : location.pathname.startsWith(tab.route);
          const Icon = tab.icon;

          return (
            <button
              key={tab.route}
              onClick={() => handleTabTap(tab.route)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-[#F97316]" : "text-[#9CA3AF]"
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-[#F97316]" : "text-[#9CA3AF]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
