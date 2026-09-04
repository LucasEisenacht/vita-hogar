import type {
  PublicProduct,
  PublicProductColor,
  PublicProductImage,
} from "@/lib/catalog/types";
import { normalizeProductColorName } from "@/lib/catalog/product-colors";

export type ProductExperienceVariant = {
  color?: PublicProductColor;
  colorKey?: string;
  compatibilities: Array<string>;
  hasOwnImages: boolean;
  images: Array<PublicProductImage>;
  name: string;
  price?: number;
  sku: string;
  slug: string;
  stock: number;
};

function slugifyVariantPart(value: string) {
  return normalizeProductColorName(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSortedImages(images: Array<PublicProductImage>) {
  return [...images]
    .filter((image) => image.url)
    .sort((firstImage, secondImage) => firstImage.sortOrder - secondImage.sortOrder);
}

function getVariantCompatibilities(
  product: PublicProduct,
  colorKey?: string,
) {
  const activeVariants = product.modelVariants.filter((variant) => {
    if (!variant.isActive) {
      return false;
    }

    return colorKey
      ? normalizeProductColorName(variant.colorKey ?? "") === colorKey
      : true;
  });

  const modelCompatibilities = activeVariants.map(
    (variant) => `${variant.brand} ${variant.model}`,
  );
  const legacyCompatibilities = product.compatibility ?? [];

  return Array.from(new Set([...modelCompatibilities, ...legacyCompatibilities]));
}

function getVariantStock(product: PublicProduct, colorKey?: string) {
  if (!colorKey) {
    return product.stock;
  }

  const variantsWithColor = product.modelVariants.filter(
    (variant) =>
      variant.isActive &&
      normalizeProductColorName(variant.colorKey ?? "") === colorKey,
  );

  if (variantsWithColor.length === 0) {
    return product.stock;
  }

  return variantsWithColor.reduce((total, variant) => total + variant.stock, 0);
}

export function createProductExperienceVariants(
  product: PublicProduct,
): Array<ProductExperienceVariant> {
  const generalImages = getSortedImages(product.images);

  if (product.colors.length === 0) {
    return [
      {
        compatibilities: getVariantCompatibilities(product),
        hasOwnImages: generalImages.length > 0,
        images: generalImages,
        name: product.name,
        sku: product.slug.toUpperCase(),
        slug: product.slug,
        stock: product.stock,
      },
    ];
  }

  return product.colors.map((color) => {
    const colorKey = normalizeProductColorName(color.name);
    const variantImages = generalImages.filter((image) => {
      return image.colorName
        ? normalizeProductColorName(image.colorName) === colorKey
        : false;
    });
    const images = variantImages.length > 0 ? variantImages : generalImages;
    const variantSlugPart = slugifyVariantPart(color.name);

    return {
      color,
      colorKey,
      compatibilities: getVariantCompatibilities(product, colorKey),
      hasOwnImages: variantImages.length > 0,
      images,
      name: color.name,
      sku: `${product.slug}-${variantSlugPart}`.toUpperCase(),
      slug: `${product.slug}-${variantSlugPart}`,
      stock: getVariantStock(product, colorKey),
    };
  });
}

export function getProductExperienceVariantByColor(
  variants: Array<ProductExperienceVariant>,
  colorName?: string,
) {
  if (!colorName) {
    return variants[0];
  }

  const colorKey = normalizeProductColorName(colorName);

  return (
    variants.find((variant) => variant.colorKey === colorKey) ?? variants[0]
  );
}
