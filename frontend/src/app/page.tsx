import type { Metadata } from "next";
import { BrandLeafField } from "@/components/decorative/brand-leaf-field";
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
    "Una selección cálida para habitar, cuidar y disfrutar tu casa.",
  path: "/",
  title: "VITA HOGAR | Hogar, blanquería y deco",
});

export default async function Home() {
  const homeContent = await getHomeContentConfig();

  return (
    <div className="home-page-shell">
      <BrandLeafField variant="home" />
      <HeroSection content={homeContent.hero} />
      <CategoriesSection />
      <HomeCommercialSections content={homeContent.featuredProducts} />
      <BenefitsSection content={homeContent.benefits} />
      <InstagramEditorialSection />
      <NewsletterCtaSection />
    </div>
  );
}
