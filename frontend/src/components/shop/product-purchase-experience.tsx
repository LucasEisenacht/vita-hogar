"use client";

import { useMemo, useState } from "react";
import type { PublicProduct, PublicProductImage } from "@/lib/catalog/types";
import { normalizeProductColorName } from "@/lib/catalog/product-colors";
import {
  createProductExperienceVariants,
  getProductExperienceVariantByColor,
} from "@/lib/catalog/product-variants";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfo } from "@/components/shop/product-info";

type ProductPurchaseExperienceProps = {
  initialIsFavorite?: boolean;
  product: PublicProduct;
};

export function ProductPurchaseExperience({
  initialIsFavorite = false,
  product,
}: ProductPurchaseExperienceProps) {
  const productVariants = useMemo(
    () => createProductExperienceVariants(product),
    [product],
  );
  const initialVariant = productVariants[0];
  const [selectedColor, setSelectedColor] = useState(initialVariant?.color?.name);
  const selectedVariant = getProductExperienceVariantByColor(
    productVariants,
    selectedColor,
  );
  const [selectedImageId, setSelectedImageId] = useState(
    selectedVariant?.images[0]?.id ?? product.primaryImage?.id,
  );

  function handleColorChange(colorName: string) {
    setSelectedColor(colorName);

    const nextVariant = getProductExperienceVariantByColor(
      productVariants,
      colorName,
    );
    const image = nextVariant?.images[0];

    if (image) {
      setSelectedImageId(image.id);
    }
  }

  function handleImageChange(image: PublicProductImage) {
    setSelectedImageId(image.id);

    if (!image.colorName) {
      return;
    }

    const matchingColor = product.colors.find((color) => {
      return (
        normalizeProductColorName(color.name) ===
        normalizeProductColorName(image.colorName ?? "")
      );
    });

    if (matchingColor) {
      setSelectedColor(matchingColor.name);
    }
  }

  return (
    <section className="grid gap-7 lg:grid-cols-[minmax(0,1.18fr)_minmax(390px,0.82fr)] lg:items-start xl:gap-10">
      <ProductGallery
        images={selectedVariant?.images}
        onSelectedImageChange={handleImageChange}
        product={product}
        selectedImageId={selectedImageId}
        variantSlug={selectedVariant?.slug}
      />
      <div id="product-purchase-panel" className="scroll-mt-28">
        <ProductInfo
          initialIsFavorite={initialIsFavorite}
          onSelectedColorChange={handleColorChange}
          product={product}
          selectedColor={selectedColor}
          selectedVariant={selectedVariant}
        />
      </div>
    </section>
  );
}
