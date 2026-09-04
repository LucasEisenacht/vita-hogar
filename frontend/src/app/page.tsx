import type { Metadata } from "next";
import { BenefitsSection } from "@/components/sections/benefits-section";
import { CategoriesSection } from "@/components/sections/categories-section";
import { HeroSection } from "@/components/sections/hero-section";
import { HomeCommercialSections } from "@/components/sections/home-commercial-sections";
import { InstagramEditorialSection } from "@/components/sections/instagram-editorial-section";
import { NewsletterCtaSection } from "@/components/sections/newsletter-cta-section";
import { getHomeContentConfig } from "@/lib/home-content/config";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicMetadata({
  description:
    "Accesorios, celulares y tecnologia elegidos con una mirada suave, moderna y personal.",
  path: "/",
  title: "W.todocell | Accesorios que combinan con tu estilo",
});

export default async function Home() {
  const homeContent = await getHomeContentConfig();

  return (
    <div className="home-page-shell">
      <HeroSection content={homeContent.hero} />
      <CategoriesSection content={homeContent.featuredCategories} />
      <HomeCommercialSections content={homeContent.featuredProducts} />
      <BenefitsSection content={homeContent.benefits} />
      <InstagramEditorialSection />
      <NewsletterCtaSection />
    </div>
  );
}
