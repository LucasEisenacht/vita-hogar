"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type {
  ProductDeleteState,
  ProductFormValues,
  ProductFormState,
  ProductQuickEditState,
} from "@/lib/admin/catalog/types";
import { validateProductForm } from "@/lib/admin/catalog/validation";
import { revalidateCatalogPathsForProduct } from "@/lib/admin/catalog/revalidation";
import {
  deleteProductImage,
  uploadProductImages,
} from "@/lib/admin/catalog/images/actions";
import { initialProductImageActionState } from "@/lib/admin/catalog/images/types";
import {
  PRODUCT_IMAGES_BUCKET,
  validateImageBatchPayloadSize,
} from "@/lib/admin/catalog/images/validation";
import type {
  Json,
  ProductAvailabilityType,
  ProductImageInsert,
  ProductInsert,
  ProductUpdate,
} from "@/types/database";

const isDevelopment = process.env.NODE_ENV !== "production";

type CatalogDatabaseError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

type ProductCategoryRecord = {
  id: string;
  slug: string;
};

function logCreateProductDebug(
  label: string,
  data: Record<string, unknown>,
) {
  if (!isDevelopment) {
    return;
  }

  console.info("[createProduct]", label, data);
}

function logCreateProductError(error: CatalogDatabaseError) {
  if (!isDevelopment) {
    return;
  }

  console.error("[createProduct]", error);
}

function getSafeFormDataKeys(formData: FormData) {
  return Array.from(new Set(Array.from(formData.keys()))).sort();
}

function getImageFilesFromFormData(formData: FormData) {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function getProductCategory(
  categoryId: string,
): Promise<ProductCategoryRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug")
    .eq("id", categoryId)
    .maybeSingle();

  return error ? null : data;
}

async function slugExists(slug: string, currentProductId?: string) {
  const supabase = await createClient();
  let query = supabase.from("products").select("id").eq("slug", slug);

  if (currentProductId) {
    query = query.neq("id", currentProductId);
  }

  const { data, error } = await query.maybeSingle();

  return !error && Boolean(data);
}

function getProductErrorState(message: string): ProductFormState {
  return {
    fieldErrors: {
      form: message,
    },
    status: "error",
  };
}

function getProductFieldErrorState(
  field: keyof NonNullable<ProductFormState["fieldErrors"]>,
  message: string,
): ProductFormState {
  return {
    fieldErrors: {
      [field]: message,
    },
    status: "error",
  };
}

function getCreateProductDatabaseErrorState(
  error: CatalogDatabaseError,
): ProductFormState {
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

  if (message.includes("product_model_variants")) {
    return getCaseModelVariantErrorState(error);
  }

  if (error.code === "23505" || message.includes("duplicate")) {
    return getProductFieldErrorState("slug", "El slug ya esta siendo utilizado.");
  }

  if (message.includes("active_case_requires_model_variants")) {
    return getProductFieldErrorState(
      "modelVariants",
      "Agrega al menos un modelo disponible para una funda activa.",
    );
  }

  if (
    error.code === "23503" ||
    message.includes("products_category_id_fkey")
  ) {
    return getProductFieldErrorState(
      "categoryId",
      "Selecciona una categoria valida.",
    );
  }

  if (error.code === "23514") {
    if (message.includes("products_price_non_negative")) {
      return getProductFieldErrorState("price", "El precio debe ser mayor a 0.");
    }

    if (message.includes("products_stock_non_negative")) {
      return getProductFieldErrorState(
        "stock",
        "El stock debe ser un entero mayor o igual a 0.",
      );
    }

    if (message.includes("products_previous_price_greater_than_price")) {
      return getProductFieldErrorState(
        "previousPrice",
        "El precio anterior debe ser mayor que el precio actual.",
      );
    }
  }

  if (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return getProductErrorState(
      "No tenes permisos de base de datos para crear productos.",
    );
  }

  if (
    error.code === "PGRST204" ||
    error.code === "PGRST202" ||
    message.includes("create_product_with_model_variants") ||
    message.includes("update_product_with_model_variants") ||
    message.includes("could not find") ||
    message.includes("schema cache")
  ) {
    return getProductErrorState(
      "La base de datos no tiene una RPC o columna esperada. Revisa las migraciones.",
    );
  }

  if (message.includes("fetch failed") || message.includes("network")) {
    return getProductErrorState("No se pudo conectar con la base de datos.");
  }

  return getProductErrorState(
    "No pudimos crear el producto. Revisa los datos e intenta nuevamente.",
  );
}

function getProductDatabaseErrorState(
  error: CatalogDatabaseError,
  fallbackMessage: string,
): ProductFormState {
  const createState = getCreateProductDatabaseErrorState(error);

  if (
    createState.fieldErrors?.form ===
    "No pudimos crear el producto. Revisa los datos e intenta nuevamente."
  ) {
    return getProductErrorState(fallbackMessage);
  }

  return createState;
}

function getValidatedProductPayload(data: ProductFormValues): ProductInsert {
  return {
    availability_type: data.availability_type,
    badge: data.badge,
    battery_health: data.battery_health,
    brand: data.brand,
    category_id: data.category_id,
    colors: data.colors,
    compatibility: data.compatibility,
    condition: data.condition,
    cosmetic_condition: data.cosmetic_condition,
    description: data.description,
    estimated_delivery_text: data.estimated_delivery_text,
    included_accessories: data.included_accessories,
    is_active: data.is_active,
    is_featured: data.is_featured,
    model: data.model,
    name: data.name,
    previous_price: data.previous_price,
    price: data.price,
    short_description: data.short_description,
    slug: data.slug,
    specifications: data.specifications,
    stock: data.stock,
    storage_capacity: data.storage_capacity,
    technical_details: data.technical_details,
  };
}

function getJsonProductPayload(payload: ProductInsert | ProductUpdate): Json {
  return {
    availability_type: payload.availability_type ?? "in_stock",
    badge: payload.badge ?? null,
    battery_health: payload.battery_health ?? null,
    brand: payload.brand ?? null,
    category_id: payload.category_id ?? null,
    colors: payload.colors ?? [],
    compatibility: payload.compatibility ?? [],
    condition: payload.condition ?? "new",
    cosmetic_condition: payload.cosmetic_condition ?? null,
    description: payload.description ?? null,
    estimated_delivery_text: payload.estimated_delivery_text ?? null,
    included_accessories: payload.included_accessories ?? [],
    is_active: payload.is_active ?? false,
    is_featured: payload.is_featured ?? false,
    model: payload.model ?? null,
    name: payload.name ?? "",
    previous_price: payload.previous_price ?? null,
    price: payload.price ?? 0,
    short_description: payload.short_description ?? null,
    slug: payload.slug ?? "",
    specifications: payload.specifications ?? {},
    stock: payload.stock ?? 0,
    storage_capacity: payload.storage_capacity ?? null,
    technical_details: payload.technical_details ?? {},
  };
}

function getJsonModelVariants(
  modelVariants: ProductFormValues["modelVariants"],
): Json {
  return modelVariants.map((variant) => ({
    brand: variant.brand,
    color_key: variant.color_key,
    color_name: variant.color_name,
    is_active: variant.is_active,
    model: variant.model,
    stock: variant.stock,
  }));
}

function getCaseModelVariantErrorState(error: CatalogDatabaseError) {
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

  if (error.code === "23505" || message.includes("duplicate")) {
    return getProductFieldErrorState(
      "modelVariants",
      "No repitas la misma combinacion de marca y modelo.",
    );
  }

  if (error.code === "23514") {
    return getProductFieldErrorState(
      "modelVariants",
      "Revisa marca, modelo y stock de los modelos disponibles.",
    );
  }

  if (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return getProductErrorState(
      "No tenes permisos de base de datos para guardar modelos disponibles.",
    );
  }

  return getProductErrorState(
    "No pudimos guardar los modelos disponibles. Revisa los datos e intenta nuevamente.",
  );
}

function getSelectedImageIdsToDelete(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("deleteImageIds")
        .filter((entry): entry is string => typeof entry === "string")
        .map((imageId) => imageId.trim())
        .filter(Boolean),
    ),
  );
}

async function deleteSelectedProductImages(
  productId: string,
  imageIds: Array<string>,
): Promise<ProductFormState | null> {
  for (const imageId of imageIds) {
    try {
      await deleteProductImage(productId, imageId);
    } catch (error) {
      if (isDevelopment) {
        console.error("[updateProduct:deleteImage]", error);
      }

      return getProductFieldErrorState(
        "imageDeletion",
        "El producto fue actualizado, pero no pudimos eliminar una imagen marcada.",
      );
    }
  }

  return null;
}

function getQuickEditErrorState(
  message: string,
  field?: keyof NonNullable<ProductQuickEditState["fieldErrors"]>,
): ProductQuickEditState {
  return {
    fieldErrors: field ? { [field]: message } : { form: message },
    message,
    status: "error",
  };
}

function parseQuickEditAvailability(
  value: FormDataEntryValue | null,
): ProductAvailabilityType | null {
  return value === "in_stock" || value === "made_to_order" ? value : null;
}

function parseQuickEditInteger(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  const parsedValue = Number(text);

  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function getDuplicatedStoragePath(productId: string, storagePath: string) {
  const fileName = storagePath.split("/").pop() ?? "imagen";

  return `products/${productId}/${randomUUID()}-${fileName}`;
}

async function getUniqueDuplicatedSlug(baseSlug: string) {
  const normalizedBaseSlug = `${baseSlug}-copia`;
  let candidateSlug = normalizedBaseSlug;
  let index = 2;

  while (await slugExists(candidateSlug)) {
    candidateSlug = `${normalizedBaseSlug}-${index}`;
    index += 1;
  }

  return candidateSlug;
}

export async function createProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  logCreateProductDebug("formData", {
    isFormData: formData instanceof FormData,
    keys: getSafeFormDataKeys(formData),
  });
  const validation = validateProductForm(formData);
  logCreateProductDebug("validation", {
    fieldErrors: validation.fieldErrors,
    ok: !validation.fieldErrors,
  });

  if (validation.fieldErrors) {
    return {
      fieldErrors: validation.fieldErrors,
      status: "error",
    };
  }

  const imageBatchMessage = validateImageBatchPayloadSize(
    getImageFilesFromFormData(formData),
  );

  if (imageBatchMessage) {
    return {
      fieldErrors: {
        form: imageBatchMessage,
      },
      status: "error",
    };
  }

  const category = validation.data.category_id
    ? await getProductCategory(validation.data.category_id)
    : null;

  if (!category) {
    return {
      fieldErrors: {
        categoryId: "Selecciona una categoria valida.",
      },
      status: "error",
    };
  }

  if (
    category.slug === "fundas" &&
    validation.data.is_active &&
    validation.data.modelVariants.length === 0
  ) {
    return {
      fieldErrors: {
        modelVariants:
          "Agrega al menos un modelo disponible para una funda activa.",
      },
      status: "error",
    };
  }

  if (await slugExists(validation.data.slug)) {
    return {
      fieldErrors: {
        slug: "El slug ya esta siendo utilizado.",
      },
      status: "error",
    };
  }

  const payload: ProductInsert = getValidatedProductPayload(validation.data);
  const supabase = await createClient();
  const { data: productId, error } = await supabase.rpc(
    "create_product_with_model_variants",
    {
      model_variants_payload: getJsonModelVariants(
        validation.data.modelVariants,
      ),
      product_payload: getJsonProductPayload(payload),
    },
  );

  if (error) {
    logCreateProductError(error);
    return getCreateProductDatabaseErrorState(error);
  }

  if (!productId) {
    return getProductErrorState(
      "No pudimos crear el producto. Revisa los datos e intenta nuevamente.",
    );
  }

  await revalidateCatalogPathsForProduct(productId);

  if (getImageFilesFromFormData(formData).length > 0) {
    const imageState = await uploadProductImages(
      productId,
      initialProductImageActionState,
      formData,
    );

    if (imageState.status === "error") {
      redirect(`/admin/productos/${productId}/editar?status=created-image-error`);
    }
  }

  redirect(`/admin/productos/${productId}/editar?status=created`);
}

export async function updateProduct(
  productId: string,
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const validation = validateProductForm(formData);

  if (validation.fieldErrors) {
    return {
      fieldErrors: validation.fieldErrors,
      status: "error",
    };
  }

  const category = validation.data.category_id
    ? await getProductCategory(validation.data.category_id)
    : null;

  if (!category) {
    return {
      fieldErrors: {
        categoryId: "Selecciona una categoria valida.",
      },
      status: "error",
    };
  }

  if (
    category.slug === "fundas" &&
    validation.data.is_active &&
    validation.data.modelVariants.length === 0
  ) {
    return {
      fieldErrors: {
        modelVariants:
          "Agrega al menos un modelo disponible para una funda activa.",
      },
      status: "error",
    };
  }

  if (await slugExists(validation.data.slug, productId)) {
    return {
      fieldErrors: {
        slug: "Ya existe otro producto con ese slug.",
      },
      status: "error",
    };
  }

  const payload: ProductUpdate = getValidatedProductPayload(validation.data);
  const imageIdsToDelete = getSelectedImageIdsToDelete(formData);
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_product_with_model_variants", {
    model_variants_payload: getJsonModelVariants(validation.data.modelVariants),
    product_id_value: productId,
    product_payload: getJsonProductPayload(payload),
  });

  if (error) {
    return getProductDatabaseErrorState(
      error,
      "No pudimos actualizar el producto. Revisa los datos e intenta nuevamente.",
    );
  }

  const imageDeletionState = await deleteSelectedProductImages(
    productId,
    imageIdsToDelete,
  );

  if (imageDeletionState) {
    await revalidateCatalogPathsForProduct(productId);
    revalidatePath(`/admin/productos/${productId}/editar`);
    return imageDeletionState;
  }

  await revalidateCatalogPathsForProduct(productId);
  revalidatePath(`/admin/productos/${productId}/editar`);
  redirect("/admin/productos?status=updated");
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);

  if (error) {
    throw new Error("No pudimos actualizar el estado del producto.");
  }

  await revalidateCatalogPathsForProduct(productId);
}

export async function toggleProductFeatured(
  productId: string,
  isFeatured: boolean,
) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_featured: isFeatured })
    .eq("id", productId);

  if (error) {
    throw new Error("No pudimos actualizar el destacado del producto.");
  }

  await revalidateCatalogPathsForProduct(productId);
}

export async function quickUpdateProductCommercial(
  productId: string,
  _previousState: ProductQuickEditState,
  formData: FormData,
): Promise<ProductQuickEditState> {
  await requireAdmin();
  const price = parseQuickEditInteger(formData.get("price"));
  const stock = parseQuickEditInteger(formData.get("stock"));
  const availabilityType = parseQuickEditAvailability(
    formData.get("availabilityType"),
  );

  if (price === null) {
    return getQuickEditErrorState(
      "El precio debe ser un entero mayor o igual a 0.",
      "price",
    );
  }

  if (stock === null) {
    return getQuickEditErrorState(
      "El stock debe ser un entero mayor o igual a 0.",
      "stock",
    );
  }

  if (!availabilityType) {
    return getQuickEditErrorState(
      "Selecciona una disponibilidad valida.",
      "availabilityType",
    );
  }

  const payload: ProductUpdate = {
    availability_type: availabilityType,
    is_active: formData.get("isActive") === "true",
    price,
    stock,
  };
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId);

  if (error) {
    return getQuickEditErrorState(
      "No pudimos actualizar la informacion comercial.",
    );
  }

  await revalidateCatalogPathsForProduct(productId);
  revalidatePath("/admin/productos");

  return {
    message: "Informacion comercial actualizada.",
    status: "success",
  };
}

export async function deleteProduct(
  productId: string,
  _previousState: ProductDeleteState,
  _formData: FormData,
): Promise<ProductDeleteState> {
  void _previousState;
  void _formData;

  await requireAdmin();
  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,slug")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    return {
      message: "No pudimos encontrar el producto para eliminar.",
      status: "error",
    };
  }

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId);

  if (imagesError) {
    return {
      message: "No pudimos validar las imagenes asociadas al producto.",
      status: "error",
    };
  }

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteError) {
    return {
      message: "No pudimos eliminar el producto. Revisa los permisos de catalogo.",
      status: "error",
    };
  }

  const storagePaths = (images ?? [])
    .map((image) => image.storage_path)
    .filter((path) => path.startsWith(`products/${productId}/`));

  if (storagePaths.length > 0) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(storagePaths);
  }

  revalidatePath("/admin/productos");
  revalidatePath(`/producto/${product.slug}`);
  redirect("/admin/productos?status=deleted");
}

export async function duplicateProduct(productId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: originalProduct, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !originalProduct) {
    throw new Error("No pudimos encontrar el producto para duplicar.");
  }

  const duplicatedSlug = await getUniqueDuplicatedSlug(originalProduct.slug);
  const productPayload: ProductInsert = {
    availability_type: originalProduct.availability_type,
    badge: originalProduct.badge,
    battery_health: originalProduct.battery_health,
    brand: originalProduct.brand,
    category_id: originalProduct.category_id,
    colors: originalProduct.colors,
    compatibility: originalProduct.compatibility,
    condition: originalProduct.condition,
    cosmetic_condition: originalProduct.cosmetic_condition,
    description: originalProduct.description,
    estimated_delivery_text: originalProduct.estimated_delivery_text,
    included_accessories: originalProduct.included_accessories,
    is_active: false,
    is_featured: false,
    model: originalProduct.model,
    name: `${originalProduct.name} copia`,
    previous_price: originalProduct.previous_price,
    price: originalProduct.price,
    short_description: originalProduct.short_description,
    slug: duplicatedSlug,
    specifications: originalProduct.specifications,
    stock: originalProduct.stock,
    storage_capacity: originalProduct.storage_capacity,
    technical_details: originalProduct.technical_details,
  };
  const { data: duplicatedProduct, error: insertError } = await supabase
    .from("products")
    .insert(productPayload)
    .select("id")
    .single();

  if (insertError) {
    throw new Error("No pudimos duplicar el producto.");
  }

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (imagesError) {
    throw new Error("El producto fue duplicado, pero no pudimos leer sus imagenes.");
  }

  for (const [index, image] of (images ?? []).entries()) {
    const duplicatedStoragePath = getDuplicatedStoragePath(
      duplicatedProduct.id,
      image.storage_path,
    );
    const { error: copyError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .copy(image.storage_path, duplicatedStoragePath);

    if (copyError) {
      throw new Error(
        "El producto fue duplicado, pero no pudimos copiar una imagen.",
      );
    }

    const imagePayload: ProductImageInsert = {
      alt_text: image.alt_text,
      color_key: image.color_key,
      file_size: image.file_size,
      height: image.height,
      is_primary: index === 0,
      mime_type: image.mime_type,
      product_id: duplicatedProduct.id,
      sort_order: image.sort_order,
      storage_path: duplicatedStoragePath,
      width: image.width,
    };
    const { error: imageInsertError } = await supabase
      .from("product_images")
      .insert(imagePayload);

    if (imageInsertError) {
      throw new Error(
        "El producto fue duplicado, pero no pudimos registrar una imagen.",
      );
    }
  }

  await revalidateCatalogPathsForProduct(duplicatedProduct.id);
  redirect(`/admin/productos/${duplicatedProduct.id}/editar?status=duplicated`);
}
