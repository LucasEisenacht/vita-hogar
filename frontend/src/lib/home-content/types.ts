import type { ProductSort } from "@/lib/catalog/types";

export type HomeContentHero = {
  badge: string;
  desktopImageUrl: string;
  isActive: boolean;
  mobileImageUrl: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  subtitle: string;
  title: string;
};

export type HomeContentFeaturedProducts = {
  ctaHref: string;
  ctaLabel: string;
  isActive: boolean;
  limit: number;
  sort: ProductSort;
  subtitle: string;
  title: string;
};

export type HomeContentBenefitIcon =
  | "care"
  | "heart"
  | "send"
  | "shield"
  | "sparkle";

export type HomeContentBenefit = {
  description: string;
  icon: HomeContentBenefitIcon;
  isActive: boolean;
  order: number;
  title: string;
};

export type HomeContentFeaturedCategory = {
  description: string;
  isActive: boolean;
  name: string;
  order: number;
  slug: string;
};

export type HomeContentBenefits = {
  items: Array<HomeContentBenefit>;
  title: string;
};

export type HomeContentFeaturedCategories = {
  items: Array<HomeContentFeaturedCategory>;
  subtitle: string;
  title: string;
};

export type HomeContentInstagram = {
  buttonHref: string;
  buttonLabel: string;
  isActive: boolean;
  text: string;
  title: string;
  username: string;
};

export type HomeContentConfig = {
  benefits: HomeContentBenefits;
  featuredCategories: HomeContentFeaturedCategories;
  featuredProducts: HomeContentFeaturedProducts;
  hero: HomeContentHero;
  instagram: HomeContentInstagram;
};
