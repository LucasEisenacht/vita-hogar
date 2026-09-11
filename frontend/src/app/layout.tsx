import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
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

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const metadataTitle = `${siteConfig.name} | Hogar, blanquería y deco`;
const metadataDescription = `Una selección cálida para habitar, cuidar y disfrutar tu casa. ${siteConfig.coverage} desde ${siteConfig.location.city}.`;

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
      data-scroll-behavior="smooth"
      lang="es"
      className={`${sourceSans.variable} ${newsreader.variable} h-full antialiased`}
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
