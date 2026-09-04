import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  deleteProductImage,
  reorderProductImages,
  setPrimaryImage,
  updateImageColor,
  updateImageAltText,
} from "@/lib/admin/catalog/images/actions";
import type { ProductImageWithUrl } from "@/lib/admin/catalog/images/types";
import {
  getProductColorHex,
  normalizeProductColorName,
} from "@/lib/catalog/product-colors";

type ProductImageCardProps = {
  image: ProductImageWithUrl;
  imageIds: Array<string>;
  index: number;
  productColors: Array<string>;
  productId: string;
  productName: string;
};

function getFallbackAltText(productName: string, index: number) {
  return `${productName} - imagen ${index + 1}`;
}

function moveImageId(
  imageIds: Array<string>,
  imageId: string,
  direction: "after" | "before",
) {
  const currentIndex = imageIds.indexOf(imageId);

  if (currentIndex < 0) {
    return imageIds;
  }

  const nextIndex = direction === "before" ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= imageIds.length) {
    return imageIds;
  }

  const nextImageIds = [...imageIds];
  const [currentImageId] = nextImageIds.splice(currentIndex, 1);
  nextImageIds.splice(nextIndex, 0, currentImageId);

  return nextImageIds;
}

export function ProductImageCard({
  image,
  imageIds,
  index,
  productColors,
  productId,
  productName,
}: ProductImageCardProps) {
  const altText = image.alt_text || getFallbackAltText(productName, index);
  const selectedColor =
    productColors.find(
      (color) => normalizeProductColorName(color) === image.color_key,
    ) ?? "";
  const moveBeforeAction = reorderProductImages.bind(
    null,
    productId,
    moveImageId(imageIds, image.id, "before"),
  );
  const moveAfterAction = reorderProductImages.bind(
    null,
    productId,
    moveImageId(imageIds, image.id, "after"),
  );

  return (
    <article
      className={`overflow-hidden rounded-[28px] border bg-surface shadow-[0_18px_46px_rgba(74,55,47,0.07)] ${
        image.is_primary ? "border-primary" : "border-border"
      }`}
    >
      <div className="relative aspect-[4/5] bg-surface-soft">
        {image.publicUrl ? (
          <Image
            alt={altText}
            className="object-cover"
            fill
            sizes="(min-width: 1280px) 260px, (min-width: 768px) 33vw, 50vw"
            src={image.publicUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Vista previa no disponible
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {image.is_primary ? <Badge variant="new">Principal</Badge> : null}
          {selectedColor ? <Badge variant="neutral">{selectedColor}</Badge> : null}
          <Badge variant="neutral">#{index + 1}</Badge>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <form
          action={updateImageAltText.bind(null, productId, image.id)}
          className="space-y-3"
        >
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Texto alternativo
            <input
              className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm font-normal text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35"
              defaultValue={image.alt_text ?? ""}
              name="altText"
              placeholder={getFallbackAltText(productName, index)}
            />
          </label>
          <button
            className="rounded-full px-4 py-2 text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            type="submit"
          >
            Guardar alt
          </button>
        </form>

        <form
          action={updateImageColor.bind(null, productId, image.id)}
          className="space-y-3"
        >
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Color asociado
            <select
              className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm font-normal text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35"
              defaultValue={selectedColor}
              name="colorKey"
            >
              <option value="">Sin color</option>
              {productColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </label>
          {selectedColor ? (
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border border-border shadow-[inset_0_0_0_1px_rgba(74,55,47,0.08)]"
                style={{ backgroundColor: getProductColorHex(selectedColor) }}
              />
              Asociada a {selectedColor}
            </div>
          ) : null}
          <button
            className="rounded-full px-4 py-2 text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            type="submit"
          >
            Guardar color
          </button>
        </form>

        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <form action={moveBeforeAction}>
              <button
                className="h-10 w-full rounded-full border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors duration-[250ms] hover:border-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45"
                disabled={index === 0}
                type="submit"
              >
                Subir
              </button>
            </form>
            <form action={moveAfterAction}>
              <button
                className="h-10 w-full rounded-full border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors duration-[250ms] hover:border-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45"
                disabled={index === imageIds.length - 1}
                type="submit"
              >
                Bajar
              </button>
            </form>
          </div>

          <form action={setPrimaryImage.bind(null, productId, image.id)}>
            <button
              className="h-10 w-full rounded-full bg-secondary px-4 text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55"
              disabled={image.is_primary}
              type="submit"
            >
              Usar como principal
            </button>
          </form>

          <form action={deleteProductImage.bind(null, productId, image.id)}>
            <button
              className="h-10 w-full rounded-full border border-destructive/25 bg-[#fff1f2] px-4 text-sm font-semibold text-destructive transition-colors duration-[250ms] hover:border-destructive/45 hover:bg-[#ffe4e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              type="submit"
            >
              Eliminar imagen
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
