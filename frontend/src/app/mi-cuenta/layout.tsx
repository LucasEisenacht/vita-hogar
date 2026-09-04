import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  description: "Area privada de clientas de W.todocell.",
  title: "Mi cuenta | W.todocell",
});

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <StorefrontPageShell intensity="low">{children}</StorefrontPageShell>;
}
