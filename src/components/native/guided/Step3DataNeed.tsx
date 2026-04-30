import { CheckCircle2 } from "lucide-react";
import type { DataTier } from "./recommendPackage";
import { DataIllustration } from "../illustrations/DataIllustration";

interface Step3Props {
  onSelect: (tier: DataTier) => void;
  selected: DataTier | null;
}

const OPTIONS: { value: DataTier; label: string; desc: string }[] = [
  { value: "light", label: "Light", desc: "Maps & messaging" },
  { value: "moderate", label: "Moderate", desc: "Social media & browsing" },
  { value: "heavy", label: "Heavy", desc: "Streaming & video calls" },
  { value: "unlimited", label: "Unlimited", desc: "No limits, worry-free" },
];

export function Step3DataNeed({ onSelect, selected }: Step3Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Illustration */}
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28">
          <DataIllustration />
        </div>
      </div>

      <h3 className="text-lg font-bold text-[#1A1A1A] text-center mb-1">
        How much data do you need?
      </h3>
      <p className="text-[13px] text-[#6B6B6B] text-center mb-5">
        Select your typical usage level
      </p>

      <div className="space-y-2.5">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl transition-all active:scale-[0.98] ${
                isSelected
                  ? "bg-[#F97316]/5 ring-1 ring-[#F97316]"
                  : "bg-white shadow-sm"
              }`}
            >
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-[#1A1A1A]">
                  {opt.label}
                </p>
                <p className="text-[13px] text-[#6B6B6B] mt-0.5">
                  {opt.desc}
                </p>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
