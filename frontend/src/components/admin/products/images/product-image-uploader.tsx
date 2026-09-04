"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  validateImageBatchPayloadSize,
  validateImageFile,
} from "@/lib/admin/catalog/images/validation";
import type { ProductImageActionState } from "@/lib/admin/catalog/images/types";
import { initialProductImageActionState } from "@/lib/admin/catalog/images/types";

type ProductImageUploaderProps = {
  action: (
    state: ProductImageActionState,
    formData: FormData,
  ) => Promise<ProductImageActionState>;
  currentImageCount: number;
  maxImageCount: number;
};

type SelectedImagePreview = {
  file: File;
  id: string;
  name: string;
  url: string;
};

function UploadButton({ selectedCount }: { selectedCount: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_rgba(207,142,168,0.22)] transition-all duration-[250ms] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_18px_38px_rgba(207,142,168,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      disabled={pending || selectedCount === 0}
      type="submit"
    >
      {pending ? <LoadingSpinner /> : null}
      {pending
        ? `Subiendo ${selectedCount} ${
            selectedCount === 1 ? "imagen" : "imagenes"
          }`
        : "Subir imagenes"}
    </button>
  );
}

export function ProductImageUploader({
  action,
  currentImageCount,
  maxImageCount,
}: ProductImageUploaderProps) {
  const [state, formAction] = useActionState(
    action,
    initialProductImageActionState,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedImagesRef = useRef<Array<SelectedImagePreview>>([]);
  const [selectedImages, setSelectedImages] = useState<
    Array<SelectedImagePreview>
  >([]);
  const [localImageError, setLocalImageError] = useState<string | null>(null);
  const remainingCount = Math.max(maxImageCount - currentImageCount, 0);
  const selectedCount = selectedImages.length;
  const availableAfterSelection = Math.max(remainingCount - selectedCount, 0);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((preview) =>
        URL.revokeObjectURL(preview.url),
      );
    };
  }, []);

  function syncInputFiles(nextImages: Array<SelectedImagePreview>) {
    if (!inputRef.current || typeof DataTransfer === "undefined") {
      return;
    }

    const dataTransfer = new DataTransfer();

    nextImages.forEach((preview) => dataTransfer.items.add(preview.file));
    inputRef.current.files = dataTransfer.files;
  }

  function replaceSelectedImages(nextImages: Array<SelectedImagePreview>) {
    selectedImagesRef.current = nextImages;
    setSelectedImages(nextImages);
    syncInputFiles(nextImages);
  }

  function handleImageSelection(files: FileList | null) {
    selectedImagesRef.current.forEach((preview) =>
      URL.revokeObjectURL(preview.url),
    );

    const selectedFiles = Array.from(files ?? []);
    const imageFiles = selectedFiles.slice(0, remainingCount);
    const invalidFileMessage =
      selectedFiles.length !== imageFiles.length
        ? `Podes agregar hasta ${remainingCount} ${
            remainingCount === 1 ? "imagen" : "imagenes"
          } mas.`
        : imageFiles
            .map((file) => validateImageFile(file))
            .find((message) => message !== null) ??
          validateImageBatchPayloadSize(imageFiles);

    if (invalidFileMessage) {
      setLocalImageError(invalidFileMessage);
      replaceSelectedImages([]);
      return;
    }

    const nextImages = imageFiles.map((file, index) => ({
      file,
      id: `${file.name}-${file.lastModified}-${file.size}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setLocalImageError(null);
    replaceSelectedImages(nextImages);
  }

  function removeSelectedImage(imageId: string) {
    const imageToRemove = selectedImagesRef.current.find(
      (preview) => preview.id === imageId,
    );
    const nextImages = selectedImagesRef.current.filter(
      (preview) => preview.id !== imageId,
    );

    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    replaceSelectedImages(nextImages);
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="relative block cursor-pointer rounded-[28px] border border-dashed border-primary/45 bg-secondary/50 px-5 py-7 text-center transition-colors duration-[250ms] hover:border-primary hover:bg-secondary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={remainingCount === 0}
          multiple
          name="images"
          onChange={(event) => handleImageSelection(event.target.files)}
          ref={inputRef}
          type="file"
        />
        <span className="font-display text-lg font-semibold text-foreground">
          Selecciona o arrastra tus imagenes
        </span>
        <span className="mt-2 block text-sm leading-6 text-muted-foreground">
          JPEG, PNG, WebP o AVIF. Maximo 8 MB por imagen.
        </span>
        <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
          {remainingCount > 0
            ? `${availableAfterSelection} espacios disponibles`
            : "Limite de imagenes alcanzado"}
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {selectedCount > 0
            ? `${selectedCount} ${
                selectedCount === 1 ? "imagen seleccionada" : "imagenes seleccionadas"
              }`
            : "Podes cargar hasta 8 imagenes por producto."}
        </p>
        <UploadButton selectedCount={selectedCount} />
      </div>

      {localImageError ? (
        <p
          aria-live="polite"
          className="rounded-[20px] border border-destructive/20 bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-destructive"
        >
          {localImageError}
        </p>
      ) : null}

      {selectedImages.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {selectedImages.map((preview, index) => (
            <div
              className="overflow-hidden rounded-[22px] border border-border bg-surface"
              key={preview.id}
            >
              <div className="relative aspect-square bg-surface-soft">
                <Image
                  alt={`Vista previa ${index + 1}: ${preview.name}`}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 180px, 50vw"
                  src={preview.url}
                  unoptimized
                />
                <button
                  aria-label={`Quitar imagen ${preview.name}`}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface/95 text-sm font-semibold text-foreground shadow-[0_10px_22px_rgba(74,55,47,0.14)] transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-destructive/35 hover:bg-[#fff1f2] hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
                  onClick={() => removeSelectedImage(preview.id)}
                  type="button"
                >
                  X
                </button>
              </div>
              <p className="truncate px-3 py-2 text-xs font-medium text-muted-foreground">
                {preview.name}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "text-sm font-semibold text-destructive"
              : "text-sm font-semibold text-[#4f765a]"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
