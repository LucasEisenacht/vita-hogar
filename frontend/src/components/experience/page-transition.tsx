"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="flex min-h-0 flex-1 flex-col animate-[wtodocell-page-enter_250ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none"
      key={pathname}
    >
      {children}
    </div>
  );
}
