import { CheckCircle2 } from "lucide-react";
import type { Duration } from "./recommendPackage";
import { DurationIllustration } from "../illustrations/DurationIllustration";

interface Step2Props {
  onSelect: (duration: Duration) => void;
  selected: Duration | null;
}

const OPTIONS: { value: Duration; label: string; desc: string }[] = [
  { value: "few-days", label: "A few days", desc: "1–3 days" },
  { value: "week", label: "About a week", desc: "5–8 days" },
  { value: "couple-weeks", label: "A couple weeks", desc: "12–16 days" },
  { value: "month", label: "A month or more", desc: "28+ days" },
];

export function Step2Duration({ onSelect, selected }: Step2Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Illustration */}
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28">
          <DurationIllustration />
        </div>
      </div>

      <h3 className="text-lg font-bold text-[#1A1A1A] text-center mb-1">
        How long is your trip?
      </h3>
      <p className="text-[13px] text-[#6B6B6B] text-center mb-5">
        Choose the duration that fits best
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
