import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getPublicSiteUrl } from "@/lib/site-url";

type PublicMetadataInput = {
  description: string;
  image?: string;
  path: string;
  title: string;
};

const defaultImage = siteConfig.logo.src;

export function getMetadataBase() {
  return new URL(getPublicSiteUrl());
}

export function createPublicMetadata({
  description,
  image = defaultImage,
  path,
  title,
}: PublicMetadataInput): Metadata {
  return {
    alternates: {
      canonical: path,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: siteConfig.logo.alt,
          url: image,
        },
      ],
      siteName: siteConfig.name,
      title,
      type: "website",
      url: path,
    },
    title,
    twitter: {
      card: "summary",
      description,
      images: [image],
      title,
    },
  };
}

export function createNoIndexMetadata({
  description,
  title,
}: {
  description: string;
  title: string;
}): Metadata {
  return {
    description,
    robots: {
      follow: false,
      index: false,
    },
    title,
  };
}
