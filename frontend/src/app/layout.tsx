import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Providers } from "@/components/providers/providers";
import { PageTransition } from "@/components/experience/page-transition";
import { siteConfig } from "@/config/site";
import { createPublicMetadata, getMetadataBase } from "@/lib/seo/metadata";
import {
  createJsonLdScript,
  createOrganizationJsonLd,
  createWebSiteJsonLd,
} from "@/lib/seo/structured-data";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const metadataTitle = `${siteConfig.name} | Accesorios que combinan con tu estilo`;
const metadataDescription = `Accesorios para celulares y tecnologia elegidos con una mirada suave, moderna y personal. ${siteConfig.coverage} desde ${siteConfig.location.city}.`;

export const metadata: Metadata = {
  ...createPublicMetadata({
    description: metadataDescription,
    path: "/",
    title: metadataTitle,
  }),
  metadataBase: getMetadataBase(),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  return (
    <html
      lang="es"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <script
            dangerouslySetInnerHTML={createJsonLdScript(
              createOrganizationJsonLd(),
            )}
            type="application/ld+json"
          />
          <script
            dangerouslySetInnerHTML={createJsonLdScript(createWebSiteJsonLd())}
            type="application/ld+json"
          />
          <AnnouncementBar />
          <Navbar isAuthenticated={isAuthenticated} />
          <main className="flex min-h-0 flex-1 flex-col">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
