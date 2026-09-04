import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { ProductImage } from "@/types/database";
import {
  PRODUCT_IMAGES_BUCKET,
} from "@/lib/admin/catalog/images/validation";
import type { ProductImageWithUrl } from "@/lib/admin/catalog/images/types";

function withPublicUrl(image: ProductImage): ProductImageWithUrl {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${image.storage_path}`
    : "";

  return {
    ...image,
    publicUrl,
  };
}

export async function getProductImages(
  productId: string,
): Promise<Array<ProductImageWithUrl>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    throw new Error("No pudimos cargar el producto.");
  }

  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("No pudimos cargar las imagenes.");
  }

  return (data ?? []).map(withPublicUrl);
}
