import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateBaseCatalogPaths() {
  revalidatePath("/");
  revalidatePath("/tienda");
  revalidatePath("/buscar");
  revalidatePath("/admin/productos");
}

export async function revalidateCatalogPathsForProduct(productId: string) {
  revalidateBaseCatalogPaths();

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("category_id,slug")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return;
  }

  revalidatePath(`/producto/${product.slug}`);
  revalidatePath(`/admin/productos/${productId}/preview`);

  if (!product.category_id) {
    return;
  }

  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", product.category_id)
    .maybeSingle();

  if (category) {
    revalidatePath(`/tienda/${category.slug}`);
  }
}

export function revalidateCatalogBasePaths() {
  revalidateBaseCatalogPaths();
}
