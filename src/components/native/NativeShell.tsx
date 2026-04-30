import { ReactNode } from "react";
import { NativeTabBar } from "./NativeTabBar";

interface NativeShellProps {
  children: ReactNode;
}

export function NativeShell({ children }: NativeShellProps) {
  return (
    <div
      className="min-h-screen bg-[#FAF7F2] flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <NativeTabBar />
    </div>
  );
}
