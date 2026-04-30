import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { getCountryFlag } from "@/lib/countryFlags";
import { Wifi, Clock, Zap, ShoppingBag } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import type { EsimPackageRow } from "./recommendPackage";
import { ReadyIllustration } from "../illustrations/ReadyIllustration";

interface Step4Props {
  package_: EsimPackageRow | null;
  countryName: string;
  onClose: () => void;
}

export function Step4Summary({ package_, countryName, onClose }: Step4Props) {
  const { formatPrice } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleBuy = () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }

    if (!package_) return;

    addToCart({
      packageId: package_.id,
      name: package_.name,
      price: package_.price,
      country: package_.country_name,
      data_amount: package_.data_amount,
      validity: `${package_.validity_days} days`,
      package_type: package_.package_type || undefined,
      speed_after_limit: package_.speed_after_limit || undefined,
      qos_speed: package_.qos_speed || undefined,
      carrier: package_.carrier || undefined,
      network_type: package_.network_type || undefined,
      sim_type: package_.sim_type || undefined,
      daily_reset_amount: package_.daily_reset_amount || undefined,
      hot_spot: package_.hot_spot || undefined,
      support_sms: package_.support_sms || undefined,
      support_voice: package_.support_voice || undefined,
      support_data: package_.support_data || undefined,
    });

    onClose();
    navigate("/cart");
  };

  if (!package_) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <p className="text-[15px] text-[#6B6B6B] text-center">
          No matching package found for your criteria.
          <br />
          Try adjusting your preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Illustration */}
      <div className="flex justify-center mb-4">
        <div className="w-24 h-24">
          <ReadyIllustration />
        </div>
      </div>

      <h3 className="text-lg font-bold text-[#1A1A1A] text-center mb-1">
        We found your perfect plan
      </h3>
      <p className="text-[13px] text-[#6B6B6B] text-center mb-5">
        Based on your preferences
      </p>

      {/* Package Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[28px] leading-none">
            {getCountryFlag(package_.country_code)}
          </span>
          <div>
            <p className="text-[15px] font-bold text-[#1A1A1A]">
              {package_.country_name}
            </p>
            <p className="text-[13px] text-[#6B6B6B]">{package_.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center p-2.5 bg-gray-50 rounded-xl">
            <Wifi className="w-4 h-4 text-[#F97316] mb-1" />
            <span className="text-[12px] font-medium text-[#1A1A1A]">
              {package_.data_amount}
            </span>
          </div>
          <div className="flex flex-col items-center p-2.5 bg-gray-50 rounded-xl">
            <Clock className="w-4 h-4 text-[#F97316] mb-1" />
            <span className="text-[12px] font-medium text-[#1A1A1A]">
              {package_.validity_days} days
            </span>
          </div>
          <div className="flex flex-col items-center p-2.5 bg-gray-50 rounded-xl">
            <Zap className="w-4 h-4 text-[#F97316] mb-1" />
            <span className="text-[12px] font-medium text-[#1A1A1A]">
              {package_.qos_speed || "4G/5G"}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-[13px] text-[#6B6B6B]">Total price</span>
          <span className="text-xl font-bold text-[#1A1A1A]">
            {formatPrice(package_.price)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleBuy}
        className="w-full h-12 bg-[#F97316] text-white text-[15px] font-semibold rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-orange-200"
      >
        <ShoppingBag className="w-4 h-4" />
        Sign up and buy
      </button>
    </div>
  );
}
