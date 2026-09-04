"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPublicProductsByIds } from "@/lib/catalog/queries";
import { checkSensitiveActionRateLimit } from "@/lib/security/sensitive-action-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { isValidProductId } from "@/lib/favorites/queries";
import type { FavoriteActionResult } from "@/lib/favorites/types";

const authMessage = "Iniciá sesión para guardar favoritos.";
const defaultErrorMessage =
  "No pudimos actualizar tus favoritos. Intentá nuevamente.";

function revalidateFavoritePaths() {
  revalidatePath("/mi-cuenta");
  revalidatePath("/mi-cuenta/favoritos");
}

function getResult({
  isFavorite,
  message,
  requiresAuth,
  success,
}: FavoriteActionResult): FavoriteActionResult {
  return {
    isFavorite,
    message,
    requiresAuth,
    success,
  };
}

export async function addFavorite(
  productId: string,
): Promise<FavoriteActionResult> {
  if (!isValidProductId(productId)) {
    return getResult({
      isFavorite: false,
      message: defaultErrorMessage,
      success: false,
    });
  }

  const user = await getCurrentUser();

  if (!user) {
    return getResult({
      isFavorite: false,
      message: authMessage,
      requiresAuth: true,
      success: false,
    });
  }

  let productExists = false;

  try {
    const [product] = await getPublicProductsByIds([productId]);
    productExists = Boolean(product);
  } catch {
    productExists = false;
  }

  if (!productExists) {
    return getResult({
      isFavorite: false,
      message: defaultErrorMessage,
      success: false,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("favorites").insert({
    product_id: productId,
    user_id: user.id,
  });

  if (error && error.code !== "23505") {
    return getResult({
      isFavorite: false,
      message: defaultErrorMessage,
      success: false,
    });
  }

  revalidateFavoritePaths();

  return getResult({
    isFavorite: true,
    message: "Producto guardado en favoritos.",
    success: true,
  });
}

export async function removeFavorite(
  productId: string,
): Promise<FavoriteActionResult> {
  if (!isValidProductId(productId)) {
    return getResult({
      isFavorite: false,
      message: defaultErrorMessage,
      success: false,
    });
  }

  const user = await getCurrentUser();

  if (!user) {
    return getResult({
      isFavorite: false,
      message: authMessage,
      requiresAuth: true,
      success: false,
    });
  }

  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user.id,
    keyPrefix: "favorite-toggle",
    limit: 60,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    return getResult({
      isFavorite: false,
      message: "Hay demasiados cambios recientes. Espera unos minutos.",
      success: false,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) {
    return getResult({
      isFavorite: true,
      message: defaultErrorMessage,
      success: false,
    });
  }

  revalidateFavoritePaths();

  return getResult({
    isFavorite: false,
    message: "Producto eliminado de favoritos.",
    success: true,
  });
}

export async function toggleFavorite(
  productId: string,
): Promise<FavoriteActionResult> {
  if (!isValidProductId(productId)) {
    return getResult({
      isFavorite: false,
      message: defaultErrorMessage,
      success: false,
    });
  }

  const user = await getCurrentUser();

  if (!user) {
    return getResult({
      isFavorite: false,
      message: authMessage,
      requiresAuth: true,
      success: false,
    });
  }

  const supabase = await createClient();
  const { data: favorite, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    return getResult({
      isFavorite: false,
      message: defaultErrorMessage,
      success: false,
    });
  }

  return favorite ? removeFavorite(productId) : addFavorite(productId);
}
