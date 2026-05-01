import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Globe,
  DollarSign,
  HelpCircle,
  Share2,
  FileText,
  Shield,
  Info,
  LogOut,
  ChevronRight,
  User,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export function ProfileTab() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { language, currency } = useLanguage();

  const handleTap = (action: () => void) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    action();
  };

  const handleShare = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Share } = await import("@capacitor/share");
        await Share.share({
          title: "Mobile11 eSIM",
          text: "Get unlimited data eSIM for 151+ countries. No roaming fees!",
          url: "https://mobile11.com",
        });
      } catch {
        // User cancelled or share not available
      }
    } else {
      if (navigator.share) {
        navigator.share({
          title: "Mobile11 eSIM",
          text: "Get unlimited data eSIM for 151+ countries.",
          url: "https://mobile11.com",
        });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/app");
  };

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-5">Profile</h1>

      {/* User Card or Auth Buttons */}
      {loading ? (
        <div className="h-20 bg-white rounded-2xl animate-pulse mb-4" />
      ) : user ? (
        <div className="flex items-center gap-3.5 p-4 bg-white rounded-2xl shadow-sm mb-4">
          <div className="w-12 h-12 rounded-full bg-[#F97316]/10 flex items-center justify-center">
            <User className="w-6 h-6 text-[#F97316]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#1A1A1A] truncate">
              {user.user_metadata?.first_name
                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
                : "Mobile11 User"}
            </p>
            <p className="text-[13px] text-[#6B6B6B] truncate">
              {user.email}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => handleTap(() => navigate("/auth"))}
            className="flex-1 h-12 bg-[#F97316] text-white text-[15px] font-semibold rounded-full active:scale-95 transition-transform"
          >
            Log in
          </button>
          <button
            onClick={() => handleTap(() => navigate("/auth"))}
            className="flex-1 h-12 bg-white text-[#1A1A1A] text-[15px] font-semibold rounded-full border border-gray-200 active:scale-95 transition-transform"
          >
            Sign up
          </button>
        </div>
      )}

      {/* Settings Rows */}
      <div className="space-y-2">
        <SettingsCard
          icon={Globe}
          label="Language"
          value={language.toUpperCase()}
          onTap={() => handleTap(() => navigate("/profile/language"))}
        />
        <SettingsCard
          icon={DollarSign}
          label="Currency"
          value={currency}
          onTap={() => handleTap(() => navigate("/profile/currency"))}
        />
        <SettingsCard
          icon={HelpCircle}
          label="Help Center"
          onTap={() => handleTap(() => navigate("/support"))}
        />
        <SettingsCard
          icon={Share2}
          label="Share with Friends"
          onTap={() => handleTap(handleShare)}
        />
        <SettingsCard
          icon={Info}
          label="About"
          onTap={() => handleTap(() => navigate("/about"))}
        />
        <SettingsCard
          icon={FileText}
          label="Terms of Service"
          onTap={() => handleTap(() => navigate("/terms-of-service"))}
        />
        <SettingsCard
          icon={Shield}
          label="Privacy Policy"
          onTap={() => handleTap(() => navigate("/privacy-policy"))}
        />
      </div>

      {/* Version */}
      <p className="text-center text-[12px] text-[#9CA3AF] mt-6 mb-2">
        v{import.meta.env.VITE_APP_VERSION ?? "1.0.0"}
      </p>

      {/* Log out */}
      {user && (
        <button
          onClick={() => handleTap(handleSignOut)}
          className="w-full flex items-center justify-center gap-2 h-12 mt-2 mb-8 bg-white rounded-2xl shadow-sm text-red-500 text-[15px] font-medium active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      )}
    </div>
  );
}

interface SettingsCardProps {
  icon: typeof Globe;
  label: string;
  value?: string;
  onTap: () => void;
}

function SettingsCard({ icon: Icon, label, value, onTap }: SettingsCardProps) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
    >
      <Icon className="w-5 h-5 text-[#6B6B6B]" />
      <span className="flex-1 text-left text-[15px] text-[#1A1A1A]">
        {label}
      </span>
      {value && (
        <span className="text-[13px] text-[#6B6B6B] mr-1">{value}</span>
      )}
      <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
    </button>
  );
}
