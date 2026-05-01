import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { FlagRect } from "../flags";
import { Smartphone, Wifi, Clock, ChevronRight } from "lucide-react";
import { DestinationIllustration } from "../illustrations/DestinationIllustration";

export function MyEsimsTab() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoggedOutState />;
  }

  return <LoggedInState userId={user.id} />;
}

function LoggedOutState() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-8 flex flex-col items-center">
      {/* Illustration */}
      <div className="w-48 h-48 mb-6">
        <DestinationIllustration />
      </div>

      <h2 className="text-lg font-bold text-[#1A1A1A] mb-2 text-center">
        Your eSIMs will appear here
      </h2>
      <p className="text-[14px] text-[#6B6B6B] text-center mb-6 max-w-[280px]">
        Log in or sign up to view and manage your eSIM plans
      </p>

      <button
        onClick={() => navigate("/auth")}
        className="w-full max-w-[280px] h-12 bg-[#F97316] text-white text-[15px] font-semibold rounded-full active:scale-95 transition-transform"
      >
        Log in or Sign up
      </button>

      {/* How it works section */}
      <div className="w-full mt-10">
        <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-4">
          How Mobile11 works
        </h3>
        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Choose your plan",
              desc: "Pick an unlimited eSIM for your destination",
            },
            {
              step: "2",
              title: "Scan QR code",
              desc: "Receive and scan your eSIM QR instantly",
            },
            {
              step: "3",
              title: "Stay connected",
              desc: "Enjoy unlimited data when you arrive",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-3.5 p-4 bg-white rounded-2xl shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-[#F97316] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1A1A1A]">
                  {item.title}
                </p>
                <p className="text-[13px] text-[#6B6B6B] mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoggedInState({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { formatPrice } = useLanguage();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["native-user-esims", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          created_at,
          total_amount,
          cached_usage,
          esim_packages:package_id (
            name,
            country_name,
            country_code,
            data_amount,
            validity_days,
            carrier,
            package_type
          )
        `)
        .eq("user_id", userId)
        .in("status", ["completed", "processing"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="px-4 pt-6">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="px-4 pt-8 flex flex-col items-center">
        <Smartphone className="w-16 h-16 text-[#9CA3AF] mb-4" />
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">
          No eSIMs yet
        </h2>
        <p className="text-[14px] text-[#6B6B6B] text-center mb-6">
          Purchase your first eSIM to get started
        </p>
        <button
          onClick={() => navigate("/app")}
          className="h-12 px-8 bg-[#F97316] text-white text-[15px] font-semibold rounded-full active:scale-95 transition-transform"
        >
          Browse Plans
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-4">My eSIMs</h1>

      <div className="space-y-3">
        {orders.map((order: any) => {
          const pkg = order.esim_packages;
          const usage = order.cached_usage as any;
          const isActive = order.status === "completed";

          return (
            <button
              key={order.id}
              onClick={() => navigate(`/my-esims/${order.id}`)}
              className="w-full flex items-center gap-3.5 p-4 bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform text-left"
            >
              <FlagRect iso={pkg?.country_code?.toLowerCase()} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1A1A1A] truncate">
                  {pkg?.country_name || "eSIM"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-[12px] text-[#6B6B6B]">
                    <Wifi className="w-3 h-3" />
                    {pkg?.data_amount || "—"}
                  </span>
                  <span className="flex items-center gap-1 text-[12px] text-[#6B6B6B]">
                    <Clock className="w-3 h-3" />
                    {pkg?.validity_days ? `${pkg.validity_days}d` : "—"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-[#6B6B6B]"
                  }`}
                >
                  {isActive ? "Active" : "Processing"}
                </span>
                <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
