import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface HelpStickySidebarPortalProps {
  children: ReactNode;
  top?: number; // px
  className?: string;
}

type Rect = { left: number; width: number };

export function HelpStickySidebarPortal({
  children,
  top = 96,
  className,
}: HelpStickySidebarPortalProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const updateRect = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ left: r.left, width: r.width });
  };

  useEffect(() => {
    updateRect();

    // Track container changes on resize (container padding/breakpoints).
    const onResize = () => updateRect();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const portalContent = useMemo(() => {
    if (!rect) return null;

    return createPortal(
      <div
        style={{
          position: "fixed",
          top,
          left: rect.left,
          width: rect.width,
          maxHeight: `calc(100vh - ${top}px)`,
        }}
        className={
          "z-50 overflow-auto rounded-lg border border-border bg-background/90 p-4 shadow-elevation backdrop-blur supports-[backdrop-filter]:bg-background/70 " +
          (className ?? "")
        }
      >
        {children}
      </div>,
      document.body,
    );
  }, [children, className, rect, top]);

  return (
    <>
      <div ref={anchorRef} className="w-full" />
      {/* Render inline on first paint; switch to fixed portal once measured */}
      {rect ? null : children}
      {portalContent}
    </>
  );
}
