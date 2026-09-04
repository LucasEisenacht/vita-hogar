"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { experienceMotion } from "@/lib/experience/system";

type ExperienceToast = {
  id: number;
  message: string;
  tone?: "default" | "success";
};

type ExperienceContextValue = {
  notify: (message: string, tone?: ExperienceToast["tone"]) => void;
  optimisticWishlistCount: number;
  updateWishlistCount: (delta: number) => void;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<ExperienceToast>>([]);
  const [optimisticWishlistCount, setOptimisticWishlistCount] = useState(0);

  const notify = useCallback(
    (message: string, tone: ExperienceToast["tone"] = "default") => {
      const id = Date.now();

      setToasts((currentToasts) => [
        ...currentToasts.slice(-2),
        { id, message, tone },
      ]);

      window.setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toast) => toast.id !== id),
        );
      }, 2600);
    },
    [],
  );

  const updateWishlistCount = useCallback((delta: number) => {
    setOptimisticWishlistCount((count) => Math.max(0, count + delta));
  }, []);

  const value = useMemo(
    () => ({
      notify,
      optimisticWishlistCount,
      updateWishlistCount,
    }),
    [notify, optimisticWishlistCount, updateWishlistCount],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[120] grid w-[min(340px,calc(100vw-2rem))] gap-2"
      >
        {toasts.map((toast) => (
          <div
            className={`${experienceMotion.panelIn} pointer-events-auto rounded-[22px] border border-white/60 bg-[rgba(255,250,248,0.9)] px-4 py-3 text-sm font-semibold text-foreground shadow-[0_18px_48px_rgba(74,55,47,0.12)] backdrop-blur-[18px]`}
            key={toast.id}
          >
            <span className="mr-2 text-primary-hover" aria-hidden="true">
              {toast.tone === "success" ? "♡" : "W."}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const context = useContext(ExperienceContext);

  if (!context) {
    return {
      notify: () => undefined,
      optimisticWishlistCount: 0,
      updateWishlistCount: () => undefined,
    } satisfies ExperienceContextValue;
  }

  return context;
}
