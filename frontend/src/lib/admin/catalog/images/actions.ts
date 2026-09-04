"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidateCatalogPathsForProduct } from "@/lib/admin/catalog/revalidation";
import { createClient } from "@/lib/supabase/server";
import type { ProductImageInsert } from "@/types/database";
import type { ProductImageActionState } from "@/lib/admin/catalog/images/types";
import {
  MAX_PRODUCT_IMAGE_COUNT,
  PRODUCT_IMAGES_BUCKET,
  getSafeImageExtension,
  normalizeImageFileName,
  validateImageBatchPayloadSize,
  validateImageFile,
  validateImageFileSignature,
} from "@/lib/admin/catalog/images/validation";
import { normalizeProductColorName } from "@/lib/catalog/product-colors";

type ProductRecord = {
  id: string;
  name: string;
};

function getActionState(
  status: ProductImageActionState["status"],
  message: string,
): ProductImageActionState {
  return {
    message,
    status,
  };
}

function getEditProductPath(productId: string) {
  return `/admin/productos/${productId}/editar`;
}

async function getAdminProduct(productId: string): Promise<ProductRecord | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

async function getExistingImageCount(productId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (error) {
    return null;
  }

  return count ?? 0;
}

async function getNextSortOrder(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return typeof data?.sort_order === "number" ? data.sort_order + 10 : 10;
}

function getFilesFromFormData(formData: FormData) {
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const primaryImageKeyEntry = formData.get("primaryImageKey");
  const primaryImageKey =
    typeof primaryImageKeyEntry === "string" ? primaryImageKeyEntry : "";

  if (!primaryImageKey) {
    return files;
  }

  return [...files].sort((firstFile, secondFile) => {
    if (getFileClientKey(firstFile) === primaryImageKey) {
      return -1;
    }

    if (getFileClientKey(secondFile) === primaryImageKey) {
      return 1;
    }

    return 0;
  });
}

function createStoragePath(productId: string, file: File) {
  const extension = getSafeImageExtension(file);

  if (!extension) {
    return null;
  }

  return `products/${productId}/${randomUUID()}-${normalizeImageFileName(
    file.name,
  )}.${extension}`;
}

function getFallbackAltText(productName: string, index: number) {
  return `${productName} - imagen ${index}`;
}

function getFileClientKey(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}`;
}

function getSafeFileMetadata(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

function logImageUploadError(
  label: string,
  error: unknown,
  metadata: Record<string, unknown>,
) {
  console.error("[uploadProductImages]", label, {
    error,
    ...metadata,
  });
}

function normalizeImageColorFormValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return normalizeProductColorName(value);
}

export async function uploadProductImages(
  productId: string,
  _previousState: ProductImageActionState,
  formData: FormData,
): Promise<ProductImageActionState> {
  const product = await getAdminProduct(productId);

  if (!product) {
    return getActionState("error", "No pudimos encontrar el producto.");
  }

  const files = getFilesFromFormData(formData);

  if (files.length === 0) {
    return getActionState("error", "Selecciona al menos una imagen.");
  }

  const currentImageCount = await getExistingImageCount(productId);

  if (currentImageCount === null) {
    return getActionState("error", "No pudimos validar las imagenes actuales.");
  }

  if (currentImageCount + files.length > MAX_PRODUCT_IMAGE_COUNT) {
    return getActionState(
      "error",
      "Podes cargar hasta 8 imagenes por producto.",
    );
  }

  const invalidFileMessage = files
    .map((file) => validateImageFile(file))
    .find((message) => message !== null);

  if (invalidFileMessage) {
    return getActionState("error", invalidFileMessage);
  }

  const invalidBatchMessage = validateImageBatchPayloadSize(files);

  if (invalidBatchMessage) {
    return getActionState("error", invalidBatchMessage);
  }

  for (const file of files) {
    let invalidSignatureMessage: string | null;

    try {
      invalidSignatureMessage = await validateImageFileSignature(file);
    } catch (error) {
      logImageUploadError("signature_validation_failed", error, {
        file: getSafeFileMetadata(file),
        productId,
      });

      return getActionState(
        "error",
        "No pudimos validar la imagen. Intenta nuevamente.",
      );
    }

    if (invalidSignatureMessage) {
      return getActionState("error", invalidSignatureMessage);
    }
  }

  const normalizedFileNames = files.map((file) =>
    file.name.trim().toLowerCase(),
  );
  const hasDuplicatedFileNames =
    new Set(normalizedFileNames).size !== normalizedFileNames.length;

  if (hasDuplicatedFileNames) {
    return getActionState(
      "error",
      "Hay imagenes con el mismo nombre. Revisa la seleccion antes de subirlas.",
    );
  }

  const supabase = await createClient();
  let nextSortOrder = await getNextSortOrder(productId);

  for (const [index, file] of files.entries()) {
    const storagePath = createStoragePath(productId, file);

    if (!storagePath) {
      return getActionState("error", "El formato no esta permitido.");
    }

    let uploadError: unknown = null;

    try {
      const uploadResult = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      uploadError = uploadResult.error;
    } catch (error) {
      uploadError = error;
    }

    if (uploadError) {
      logImageUploadError("storage_upload_failed", uploadError, {
        file: getSafeFileMetadata(file),
        productId,
        storagePath,
      });

      return getActionState(
        "error",
        "No pudimos subir la imagen. Intenta nuevamente.",
      );
    }

    const payload: ProductImageInsert = {
      alt_text: getFallbackAltText(product.name, currentImageCount + index + 1),
      file_size: file.size,
      is_primary: currentImageCount === 0 && index === 0,
      mime_type: file.type,
      product_id: productId,
      sort_order: nextSortOrder,
      storage_path: storagePath,
    };

    let insertError: unknown = null;

    try {
      const insertResult = await supabase.from("product_images").insert(payload);
      insertError = insertResult.error;
    } catch (error) {
      insertError = error;
    }

    if (insertError) {
      logImageUploadError("database_insert_failed", insertError, {
        file: getSafeFileMetadata(file),
        productId,
        storagePath,
      });

      try {
        const { error: removeError } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .remove([storagePath]);

        if (removeError) {
          logImageUploadError("storage_cleanup_failed", removeError, {
            productId,
            storagePath,
          });
        }
      } catch (error) {
        logImageUploadError("storage_cleanup_failed", error, {
          productId,
          storagePath,
        });
      }

      return getActionState(
        "error",
        "No pudimos subir la imagen. Intenta nuevamente.",
      );
    }

    nextSortOrder += 10;
  }

  try {
    await revalidateCatalogPathsForProduct(productId);
    revalidatePath(getEditProductPath(productId));
  } catch (error) {
    logImageUploadError("revalidation_failed", error, {
      productId,
    });
  }

  return getActionState(
    "success",
    files.length === 1
      ? "Imagen subida correctamente."
      : "Imagenes subidas correctamente.",
  );
}

export async function updateImageAltText(
  productId: string,
  imageId: string,
  formData: FormData,
) {
  await requireAdmin();
  const altTextEntry = formData.get("altText");
  const altText =
    typeof altTextEntry === "string" && altTextEntry.trim()
      ? altTextEntry.trim()
      : null;
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_images")
    .update({ alt_text: altText })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    throw new Error("No pudimos actualizar el texto alternativo.");
  }

  await revalidateCatalogPathsForProduct(productId);
  revalidatePath(getEditProductPath(productId));
}

export async function updateImageColor(
  productId: string,
  imageId: string,
  formData: FormData,
) {
  await requireAdmin();
  const colorKey = normalizeImageColorFormValue(formData.get("colorKey"));
  const supabase = await createClient();
  const [{ data: image, error: imageError }, { data: product, error: productError }] =
    await Promise.all([
      supabase
        .from("product_images")
        .select("id")
        .eq("id", imageId)
        .eq("product_id", productId)
        .maybeSingle(),
      supabase
        .from("products")
        .select("id,colors")
        .eq("id", productId)
        .maybeSingle(),
    ]);

  if (imageError || !image || productError || !product) {
    throw new Error("No pudimos validar la imagen.");
  }

  const validColorKeys = new Set(
    product.colors.map((color) => normalizeProductColorName(color)),
  );

  if (colorKey && !validColorKeys.has(colorKey)) {
    throw new Error("No pudimos guardar el color asociado.");
  }

  const { error } = await supabase
    .from("product_images")
    .update({ color_key: colorKey })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    throw new Error("No pudimos guardar el color asociado.");
  }

  await revalidateCatalogPathsForProduct(productId);
  revalidatePath(getEditProductPath(productId));
}

export async function setPrimaryImage(productId: string, imageId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: image, error: imageError } = await supabase
    .from("product_images")
    .select("id")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  if (imageError || !image) {
    throw new Error("No pudimos encontrar la imagen.");
  }

  const { error: resetError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  if (resetError) {
    throw new Error("No pudimos marcar la imagen principal.");
  }

  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    throw new Error("No pudimos marcar la imagen principal.");
  }

  await revalidateCatalogPathsForProduct(productId);
  revalidatePath(getEditProductPath(productId));
}

export async function reorderProductImages(
  productId: string,
  orderedImageIds: Array<string>,
) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId);

  if (imagesError) {
    throw new Error("No pudimos ordenar las imagenes.");
  }

  const existingImageIds = new Set((images ?? []).map((image) => image.id));
  const isValidOrder =
    orderedImageIds.length === existingImageIds.size &&
    orderedImageIds.every((imageId) => existingImageIds.has(imageId));

  if (!isValidOrder) {
    throw new Error("No pudimos ordenar las imagenes.");
  }

  for (const [index, imageId] of orderedImageIds.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({
        is_primary: index === 0,
        sort_order: (index + 1) * 10,
      })
      .eq("id", imageId)
      .eq("product_id", productId);

    if (error) {
      throw new Error("No pudimos ordenar las imagenes.");
    }
  }

  await revalidateCatalogPathsForProduct(productId);
  revalidatePath(getEditProductPath(productId));
}

export async function deleteProductImage(productId: string, imageId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: image, error: imageError } = await supabase
    .from("product_images")
    .select("id,is_primary,storage_path")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  if (imageError || !image) {
    throw new Error("No pudimos encontrar la imagen.");
  }

  if (!image.storage_path.startsWith(`products/${productId}/`)) {
    throw new Error("No pudimos eliminar la imagen.");
  }

  const { error: storageError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([image.storage_path]);

  if (storageError) {
    throw new Error("No pudimos eliminar la imagen.");
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);

  if (deleteError) {
    throw new Error("No pudimos eliminar la imagen.");
  }

  if (image.is_primary) {
    const { data: nextImage, error: nextImageError } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextImageError) {
      throw new Error("No pudimos actualizar la imagen principal.");
    }

    if (nextImage) {
      const { error: primaryError } = await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", nextImage.id)
        .eq("product_id", productId);

      if (primaryError) {
        throw new Error("No pudimos actualizar la imagen principal.");
      }
    }
  }

  await revalidateCatalogPathsForProduct(productId);
  revalidatePath(getEditProductPath(productId));
}
