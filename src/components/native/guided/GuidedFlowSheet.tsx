import { useState, useEffect } from "react";
import { X, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Step1Destination } from "./Step1Destination";
import { Step2Duration } from "./Step2Duration";
import { Step3DataNeed } from "./Step3DataNeed";
import { Step4Summary } from "./Step4Summary";
import { recommendPackage, type Duration, type DataTier, type EsimPackageRow } from "./recommendPackage";

interface GuidedFlowSheetProps {
  onClose: () => void;
}

export function GuidedFlowSheet({ onClose }: GuidedFlowSheetProps) {
  const [step, setStep] = useState(1);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [countryName, setCountryName] = useState("");
  const [duration, setDuration] = useState<Duration | null>(null);
  const [dataTier, setDataTier] = useState<DataTier | null>(null);
  const [recommended, setRecommended] = useState<EsimPackageRow | null>(null);

  // Fetch all active packages for recommendation
  const { data: allPackages = [] } = useQuery({
    queryKey: ["guided-all-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esim_packages")
        .select(
          "id, name, country_code, country_name, price, validity_days, data_amount, package_type, qos_speed, carrier, network_type, sim_type, daily_reset_amount, support_data, support_sms, support_voice, hot_spot, speed_after_limit"
        )
        .eq("is_active", true);

      if (error) throw error;
      return (data || []) as EsimPackageRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Compute recommendation when all selections are made
  useEffect(() => {
    if (countryCode && duration && dataTier && allPackages.length > 0) {
      const result = recommendPackage(allPackages, countryCode, duration, dataTier);
      setRecommended(result);
    }
  }, [countryCode, duration, dataTier, allPackages]);

  const handleNext = () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    if (step === 1) {
      onClose();
    } else {
      setStep((s) => s - 1);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 1:
        return !!countryCode;
      case 2:
        return !!duration;
      case 3:
        return !!dataTier;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative mt-auto bg-[#FAF7F2] rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm"
          >
            {step === 1 ? (
              <X className="w-4 h-4 text-[#6B6B6B]" />
            ) : (
              <ArrowLeft className="w-4 h-4 text-[#6B6B6B]" />
            )}
          </button>

          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? "w-6 bg-[#F97316]"
                    : s < step
                    ? "w-1.5 bg-[#F97316]"
                    : "w-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm"
          >
            <X className="w-4 h-4 text-[#6B6B6B]" />
          </button>
        </div>

        {/* Step chip */}
        <div className="px-5 mb-3">
          <span className="inline-flex items-center px-3 py-1 bg-[#F97316] text-white text-xs font-medium rounded-full">
            Step {step} of 4
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {step === 1 && (
            <Step1Destination
              selected={countryCode}
              onSelect={(code, name) => {
                setCountryCode(code);
                setCountryName(name);
              }}
            />
          )}
          {step === 2 && (
            <Step2Duration
              selected={duration}
              onSelect={(d) => setDuration(d)}
            />
          )}
          {step === 3 && (
            <Step3DataNeed
              selected={dataTier}
              onSelect={(t) => setDataTier(t)}
            />
          )}
          {step === 4 && (
            <Step4Summary
              package_={recommended}
              countryName={countryName}
              onClose={onClose}
            />
          )}
        </div>

        {/* Next button (steps 1-3) */}
        {step < 4 && (
          <div className="px-5 pb-4">
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className={`w-full h-12 rounded-full text-[15px] font-semibold transition-all active:scale-95 ${
                canAdvance()
                  ? "bg-[#F97316] text-white shadow-lg shadow-orange-200"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
