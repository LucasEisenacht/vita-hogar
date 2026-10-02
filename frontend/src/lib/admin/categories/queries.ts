import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminCategory } from "@/lib/admin/categories/types";
import type { Category } from "@/types/database";

type CategoryWithProductCount = Category & {
  products: Array<{ count: number }>;
};

export async function getAdminCategories(): Promise<Array<AdminCategory>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*,products(count)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("No pudimos cargar las categorias.");
  }

  return ((data ?? []) as Array<CategoryWithProductCount>).map(
    ({ products, ...category }) => ({
      ...category,
      productCount: products[0]?.count ?? 0,
    }),
  );
}

export async function getAdminCategoryById(
  categoryId: string,
): Promise<AdminCategory | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*,products(count)")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos cargar la categoria.");
  }

  if (!data) {
    return null;
  }

  const { products, ...category } = data as CategoryWithProductCount;

  return {
    ...category,
    productCount: products[0]?.count ?? 0,
  };
}

export async function getProductFormCategories(
  currentCategoryId?: string | null,
): Promise<Array<Category>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("No pudimos cargar las categorias.");
  }

  return (data ?? []).filter(
    (category) => category.is_active || category.id === currentCategoryId,
  );
}
