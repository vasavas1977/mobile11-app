import { lazy, Suspense } from "react";
import { useIsMobileApp } from "@/hooks/useIsMobileApp";
import { Loader2 } from "lucide-react";

const NativeAuthScreen = lazy(() => import("./NativeAuthScreen"));
const AuthPage = lazy(() =>
  import("@/pages/AuthPage").then((m) => ({ default: m.AuthPage }))
);

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
  </div>
);

export function AuthRouteSwitch() {
  const isMobile = useIsMobileApp();
  return (
    <Suspense fallback={<Fallback />}>
      {isMobile ? <NativeAuthScreen /> : <AuthPage />}
    </Suspense>
  );
}
