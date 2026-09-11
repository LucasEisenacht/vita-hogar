import type { ReactNode } from "react";

type StorefrontPageShellProps = { children: ReactNode; intensity?: "low" | "medium" };

export function StorefrontPageShell({ children }: StorefrontPageShellProps) {
  return <div className="vita-storefront-shell">{children}</div>;
}