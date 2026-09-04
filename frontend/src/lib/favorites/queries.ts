import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPublicProductsByIds } from "@/lib/catalog/queries";
import { createClient } from "@/lib/supabase/server";

function isValidProductId(productId: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    productId,
  );
}

export async function getCurrentUserFavoriteIds() {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((favorite) => favorite.product_id);
}

export async function getCurrentUserFavorites() {
  const favoriteIds = await getCurrentUserFavoriteIds();

  return getPublicProductsByIds(favoriteIds);
}

export async function isProductFavorite(productId: string) {
  if (!isValidProductId(productId)) {
    return false;
  }

  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  return !error && Boolean(data);
}

export { isValidProductId };
