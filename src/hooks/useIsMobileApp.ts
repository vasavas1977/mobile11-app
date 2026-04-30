import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export function useIsMobileApp() {
  const [isMobile, setIsMobile] = useState(() =>
    Capacitor.isNativePlatform() || (typeof window !== "undefined" && window.innerWidth < 768)
  );

  useEffect(() => {
    const onResize = () =>
      setIsMobile(Capacitor.isNativePlatform() || window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}
