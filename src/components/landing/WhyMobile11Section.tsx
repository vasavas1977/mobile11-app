import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, ArrowUpDown, Smartphone, QrCode } from "lucide-react";
import LottieAnimation from "@/components/landing-v2/LottieAnimation";

export default function WhyMobile11Section() {
  const { t } = useLanguage();

  const features = [
    { 
      icon: Globe, 
      description: t('whyMobile11.coverage')
    },
    { 
      icon: ArrowUpDown, 
      description: t('whyMobile11.flexible')
    },
    { 
      icon: Smartphone, 
      description: t('whyMobile11.support')
    },
    { 
      icon: QrCode, 
      description: t('whyMobile11.easy')
    },
  ];

  return (
    <section className="why-mobile11-wrapper">
      <div className="why-mobile11-inner">
        {/* Decorative illustration - left (lazy loaded) */}
        <div className="why-mobile11-illustration why-mobile11-illustration-left" aria-hidden="true">
          <LottieAnimation
            src="/assets/lottie/skate-boy.lottie"
            className="why-mobile11-lottie"
            speed={0.85}
            devicePixelRatio={3}
            useFrameInterpolation={true}
            lazy={true}
            lazyRootMargin="400px"
          />
        </div>

        {/* Main content card */}
        <div className="why-mobile11-card">
          <h2 className="why-mobile11-title">
            {t('whyMobile11.title')} <span>Mobile11</span>?
          </h2>

          <div className="why-mobile11-features">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="why-mobile11-feature">
                  <div className="why-mobile11-icon-wrapper">
                    <Icon className="why-mobile11-icon" strokeWidth={1.5} />
                  </div>
                  <p className="why-mobile11-feature-text">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Decorative illustration - right (lazy loaded) */}
        <div className="why-mobile11-illustration why-mobile11-illustration-right" aria-hidden="true">
          <LottieAnimation
            src="/assets/lottie/man-woman-hi.lottie"
            className="why-mobile11-lottie"
            speed={0.85}
            devicePixelRatio={3}
            useFrameInterpolation={true}
            lazy={true}
            lazyRootMargin="400px"
          />
        </div>
      </div>
    </section>
  );
}
