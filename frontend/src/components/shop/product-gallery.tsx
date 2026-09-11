"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type {
  PublicProduct,
  PublicProductImage,
} from "@/lib/catalog/types";

type ProductGalleryProps = {
  images?: Array<PublicProductImage>;
  onSelectedImageChange?: (image: PublicProductImage) => void;
  product: PublicProduct;
  selectedImageId?: string;
  variantSlug?: string;
};

function ProductPlaceholder({ name }: { name: string }) {
  return (
    <div
      aria-label={`Placeholder de ${name}`}
      className="relative min-h-[440px] overflow-hidden border border-border bg-background-alt p-5 sm:min-h-[500px]"
      role="img"
    >
      <div className="absolute inset-6 border border-border bg-surface" />
      <div className="absolute left-10 top-10 h-24 w-40 bg-[var(--accent-secondary)]/20" />
      <div className="absolute bottom-8 right-8 h-28 w-28 bg-surface" />
      <div className="relative flex h-full min-h-[400px] items-center justify-center sm:min-h-[460px]">
        <div className="h-2/3 w-1/2 border border-border bg-background p-4">
          <div className="h-full bg-surface" />
        </div>
      </div>
    </div>
  );
}

export function ProductGallery({
  images: variantImages,
  onSelectedImageChange,
  product,
  selectedImageId: controlledSelectedImageId,
  variantSlug,
}: ProductGalleryProps) {
  const images = (variantImages ?? product.images).filter((image) => image.url);
  const primaryImageId = product.primaryImage?.id;
  const initialImageId = primaryImageId && images.some((image) => image.id === primaryImageId)
    ? primaryImageId
    : images[0]?.id;
  const [internalSelectedImageId, setInternalSelectedImageId] =
    useState(initialImageId);
  const selectedImageId = controlledSelectedImageId ?? internalSelectedImageId;
  const selectedImage: PublicProductImage | undefined = useMemo(
    () => images.find((image) => image.id === selectedImageId) ?? images[0],
    [images, selectedImageId],
  );
  const selectedIndex = selectedImage
    ? images.findIndex((image) => image.id === selectedImage.id)
    : 0;

  function selectImageByIndex(index: number) {
    const nextImage = images[index];

    if (nextImage) {
      setInternalSelectedImageId(nextImage.id);
      onSelectedImageChange?.(nextImage);
    }
  }

  function selectImage(image: PublicProductImage) {
    setInternalSelectedImageId(image.id);
    onSelectedImageChange?.(image);
  }

  function focusThumbnail(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    event.currentTarget.parentElement
      ?.querySelectorAll("button")
      .item(index)
      ?.focus();
  }

  function handleThumbnailKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (index + 1) % images.length;
      selectImageByIndex(nextIndex);
      focusThumbnail(event, nextIndex);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = (index - 1 + images.length) % images.length;
      selectImageByIndex(nextIndex);
      focusThumbnail(event, nextIndex);
    }
  }

  if (!selectedImage) {
    return <ProductPlaceholder name={product.name} />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[96px_minmax(0,1fr)] lg:items-start">
      {images.length > 1 ? (
        <div
          aria-label="Imagenes del producto"
          className="order-2 flex gap-3.5 overflow-x-auto pb-1 lg:order-1 lg:grid lg:max-h-[min(620px,calc(100vh-188px))] lg:grid-cols-1 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1.5"
        >
          {images.map((image, index) => {
            const isSelected = image.id === selectedImage.id;

            return (
              <button
                aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                aria-pressed={isSelected}
                className={`relative aspect-[4/5] h-[96px] w-[76px] shrink-0 overflow-hidden border bg-surface transition-colors duration-200 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:h-auto lg:w-full ${
                  isSelected
                    ? "border-[var(--accent-secondary)] ring-1 ring-[var(--accent-secondary)]"
                    : "border-border"
                }`}
                key={image.id}
                onClick={() => selectImage(image)}
                onKeyDown={(event) => handleThumbnailKeyDown(event, index)}
                type="button"
              >
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="(min-width: 1024px) 96px, 88px"
                  src={image.url}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="group order-1 relative aspect-[4/5] min-h-[440px] overflow-hidden bg-background-alt md:cursor-zoom-in sm:min-h-[500px] lg:order-2 lg:min-h-[min(680px,calc(100vh-170px))]">
        <Image
          alt={selectedImage.alt}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          fill
          key={`${variantSlug ?? "default"}-${selectedImage.id}`}
          priority={selectedImage.id === initialImageId}
          quality={95}
          sizes="(min-width: 1280px) 55vw, (min-width: 1024px) 58vw, 100vw"
          src={selectedImage.url}
        />
        <div className="absolute right-4 top-4 flex items-center gap-2 border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground">
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-primary-hover"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="10.75" cy="10.75" r="5.75" />
            <path
              d="m15 15 4.5 4.5M10.75 8.25v5M8.25 10.75h5"
              strokeLinecap="round"
            />
          </svg>
          Zoom
        </div>
        {images.length > 1 ? (
          <p className="absolute bottom-4 left-4 border border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Imagen {selectedIndex + 1} de {images.length}
          </p>
        ) : null}
      </div>
    </div>
  );
}
