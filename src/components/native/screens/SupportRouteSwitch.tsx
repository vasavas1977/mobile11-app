import { lazy, Suspense } from "react";
import { useIsMobileApp } from "@/hooks/useIsMobileApp";
import { Loader2 } from "lucide-react";

const HelpCenterHome = lazy(() =>
  import("./HelpCenterHome").then((m) => ({ default: m.HelpCenterHome }))
);
const HelpCategoryScreen = lazy(() =>
  import("./HelpCategoryScreen").then((m) => ({ default: m.HelpCategoryScreen }))
);
const HelpArticleScreen = lazy(() =>
  import("./HelpArticleScreen").then((m) => ({ default: m.HelpArticleScreen }))
);

// Desktop versions
const HelpCenterAiralo = lazy(() =>
  import("@/pages/HelpCenterAiralo").then((m) => ({ default: m.HelpCenterAiralo }))
);
const HelpCategoryPage = lazy(() => import("@/pages/HelpCategoryPage"));
const HelpArticlePage = lazy(() => import("@/pages/HelpArticlePage"));

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
  </div>
);

export function SupportHomeSwitch() {
  const isMobile = useIsMobileApp();
  return (
    <Suspense fallback={<Fallback />}>
      {isMobile ? <HelpCenterHome /> : <HelpCenterAiralo />}
    </Suspense>
  );
}

export function SupportCategorySwitch() {
  const isMobile = useIsMobileApp();
  return (
    <Suspense fallback={<Fallback />}>
      {isMobile ? <HelpCategoryScreen /> : <HelpCategoryPage />}
    </Suspense>
  );
}

export function SupportArticleSwitch() {
  const isMobile = useIsMobileApp();
  return (
    <Suspense fallback={<Fallback />}>
      {isMobile ? <HelpArticleScreen /> : <HelpArticlePage />}
    </Suspense>
  );
}
