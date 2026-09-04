import type {
  Category,
  Json,
  Product,
  ProductImage,
  ProductModelVariant,
} from "@/types/database";
import type {
  PublicCategory,
  PublicProduct,
  PublicProductColor,
  PublicProductImage,
  PublicProductModelVariant,
  PublicProductSpecification,
} from "@/lib/catalog/types";
import {
  getProductColorHex,
  isKnownProductColor,
  normalizeProductColorName,
} from "@/lib/catalog/product-colors";

const PRODUCT_IMAGES_BUCKET = "product-images";

function getStoragePublicUrl(storagePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return "";
  }

  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
}

function normalizeColor(value: string): PublicProductColor {
  return {
    hex: getProductColorHex(value),
    name: value,
  };
}

function getImageColorName(
  image: ProductImage,
  colors: Array<PublicProductColor>,
) {
  const explicitColor = colors.find(
    (color) => normalizeProductColorName(color.name) === image.color_key,
  );

  if (explicitColor) {
    return explicitColor.name;
  }

  const searchableText = normalizeProductColorName(
    `${image.alt_text ?? ""} ${image.storage_path}`,
  );
  const legacyColor = colors.find((color) =>
    searchableText.includes(normalizeProductColorName(color.name)),
  );

  if (legacyColor) {
    return legacyColor.name;
  }

  return colors.find((color) =>
    searchableText
      .split(/[^a-z0-9]+/)
      .some((part) => part && isKnownProductColor(part) && color.hex === getProductColorHex(part)),
  )?.name;
}

function normalizeModelVariant(
  variant: ProductModelVariant,
): PublicProductModelVariant {
  return {
    brand: variant.brand,
    colorKey: variant.color_key ?? undefined,
    colorName: variant.color_name ?? undefined,
    id: variant.id,
    isActive: variant.is_active,
    model: variant.model,
    stock: variant.stock,
  };
}

function normalizeSpecifications(
  specifications: Json,
): Array<PublicProductSpecification> {
  if (
    !specifications ||
    Array.isArray(specifications) ||
    typeof specifications !== "object"
  ) {
    return [];
  }

  return Object.entries(specifications)
    .filter((entry): entry is [string, string] => {
      const [, value] = entry;

      return typeof value === "string" && value.trim().length > 0;
    })
    .map(([label, value]) => ({
      label,
      value,
    }));
}

function normalizeStringRecord(value: Json): Record<string, string> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => {
        const [key, entryValue] = entry;

        return (
          key.trim().length > 0 &&
          typeof entryValue === "string" &&
          entryValue.trim().length > 0
        );
      })
      .map(([key, entryValue]) => [key.trim(), entryValue.trim()]),
  );
}

function normalizeImages(
  productName: string,
  images: Array<ProductImage>,
  colors: Array<PublicProductColor>,
): Array<PublicProductImage> {
  return [...images]
    .sort((firstImage, secondImage) => {
      if (firstImage.is_primary !== secondImage.is_primary) {
        return firstImage.is_primary ? -1 : 1;
      }

      return firstImage.sort_order - secondImage.sort_order;
    })
    .map((image, index) => {
      const colorName = getImageColorName(image, colors);

      return {
        alt: image.alt_text || `${productName} - imagen ${index + 1}`,
        colorName,
        height: image.height,
        id: image.id,
        isPrimary: image.is_primary,
        sortOrder: image.sort_order,
        url: getStoragePublicUrl(image.storage_path),
        width: image.width,
      };
    });
}

export function normalizeCategory(category: Category): PublicCategory {
  return {
    description: category.description ?? "",
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

export function normalizeProduct({
  category,
  images,
  product,
  modelVariants = [],
}: {
  category: Category;
  images: Array<ProductImage>;
  modelVariants?: Array<ProductModelVariant>;
  product: Product;
}): PublicProduct {
  const normalizedColors = product.colors.map(normalizeColor);
  const normalizedImages = normalizeImages(
    product.name,
    images,
    normalizedColors,
  );

  return {
    availabilityType: product.availability_type,
    badge: product.badge ?? undefined,
    batteryHealth: product.battery_health ?? undefined,
    brand: product.brand ?? undefined,
    category: category.slug,
    categoryLabel: category.name,
    colors: normalizedColors,
    compatibility:
      product.compatibility.length > 0 ? product.compatibility : undefined,
    condition: product.condition,
    cosmeticCondition: product.cosmetic_condition ?? undefined,
    description: product.description ?? product.short_description ?? "",
    estimatedDeliveryText: product.estimated_delivery_text ?? undefined,
    featured: product.is_featured,
    id: product.id,
    images: normalizedImages,
    includedAccessories: product.included_accessories,
    model: product.model ?? undefined,
    modelVariants: modelVariants.map(normalizeModelVariant),
    name: product.name,
    previousPrice: product.previous_price ?? undefined,
    price: product.price,
    primaryImage:
      normalizedImages.find((image) => image.isPrimary) ?? normalizedImages[0],
    shortDescription: product.short_description ?? "",
    slug: product.slug,
    specifications: normalizeSpecifications(product.specifications),
    stock: product.stock,
    storageCapacity: product.storage_capacity ?? undefined,
    technicalDetails: normalizeStringRecord(product.technical_details),
    updatedAt: product.updated_at,
  };
}
