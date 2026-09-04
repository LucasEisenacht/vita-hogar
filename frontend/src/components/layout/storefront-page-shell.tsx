import type { ReactNode } from "react";

type StorefrontPageShellProps = {
  children: ReactNode;
  intensity?: "low" | "medium";
};

export function StorefrontPageShell({
  children,
  intensity = "medium",
}: StorefrontPageShellProps) {
  const isLowIntensity = intensity === "low";

  return (
    <div className="storefront-page-shell">
      <span
        aria-hidden="true"
        className="storefront-ambient-orb left-[-9rem] top-10 h-[28rem] w-[28rem]"
      />
      <span
        aria-hidden="true"
        className="storefront-ambient-orb right-[-11rem] top-[34rem] h-[34rem] w-[34rem] [animation-delay:4.5s]"
      />
      <span
        aria-hidden="true"
        className="storefront-ambient-wave left-[-12%] top-[22rem] w-[116%]"
      />
      <span
        aria-hidden="true"
        className="home-micro-glitter right-[8%] top-[14rem] hidden sm:block"
      />
      {!isLowIntensity ? (
        <>
          <span
            aria-hidden="true"
            className="wt-glow-dot left-[12%] top-[28rem] hidden h-3.5 w-3.5 sm:block [animation-delay:2.2s]"
          />
          <span
            aria-hidden="true"
            className="wt-sparkle-cluster bottom-[12rem] right-[10%] hidden lg:block [animation-delay:3.4s]"
          />
        </>
      ) : null}
      {children}
    </div>
  );
}
