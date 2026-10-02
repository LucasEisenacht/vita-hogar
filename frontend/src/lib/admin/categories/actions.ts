"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidateCatalogBasePaths } from "@/lib/admin/catalog/revalidation";
import { createClient } from "@/lib/supabase/server";
import type { CategoryFormState } from "@/lib/admin/categories/types";
import { validateCategoryForm } from "@/lib/admin/categories/validation";

type DatabaseError = {
  code?: string;
  message?: string;
};

function getErrorState(
  message: string,
  field: "form" | "slug" = "form",
): CategoryFormState {
  return {
    fieldErrors: { [field]: message },
    message: field === "form" ? message : undefined,
    status: "error",
  };
}

function getDatabaseErrorState(error: DatabaseError): CategoryFormState {
  if (error.code === "23505" || error.message?.toLowerCase().includes("unique")) {
    return getErrorState("El slug ya esta siendo utilizado.", "slug");
  }

  if (
    error.code === "42501" ||
    error.message?.toLowerCase().includes("row-level security")
  ) {
    return getErrorState("No tenes permisos para guardar categorias.");
  }

  return getErrorState("No pudimos guardar la categoria.");
}

async function slugExists(slug: string, currentCategoryId?: string) {
  const supabase = await createClient();
  let query = supabase.from("categories").select("id").eq("slug", slug);

  if (currentCategoryId) {
    query = query.neq("id", currentCategoryId);
  }

  const { data, error } = await query.maybeSingle();

  return !error && Boolean(data);
}

function revalidateCategoryPaths(...slugs: Array<string | null | undefined>) {
  revalidateCatalogBasePaths();
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/productos/nuevo");

  new Set(slugs.filter((slug): slug is string => Boolean(slug))).forEach(
    (slug) => revalidatePath(`/tienda/${slug}`),
  );
}

export async function createCategory(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const validation = validateCategoryForm(formData);

  if (validation.fieldErrors) {
    return {
      fieldErrors: validation.fieldErrors,
      status: "error",
    };
  }

  if (await slugExists(validation.data.slug)) {
    return getErrorState("El slug ya esta siendo utilizado.", "slug");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(validation.data);

  if (error) {
    return getDatabaseErrorState(error);
  }

  revalidateCategoryPaths(validation.data.slug);
  redirect("/admin/categorias?status=created");
}

export async function updateCategory(
  categoryId: string,
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const validation = validateCategoryForm(formData);

  if (validation.fieldErrors) {
    return {
      fieldErrors: validation.fieldErrors,
      status: "error",
    };
  }

  if (await slugExists(validation.data.slug, categoryId)) {
    return getErrorState("El slug ya esta siendo utilizado.", "slug");
  }

  const supabase = await createClient();
  const { data: currentCategory, error: currentCategoryError } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .maybeSingle();

  if (currentCategoryError || !currentCategory) {
    return getErrorState("No pudimos encontrar la categoria.");
  }

  const { error } = await supabase
    .from("categories")
    .update(validation.data)
    .eq("id", categoryId);

  if (error) {
    return getDatabaseErrorState(error);
  }

  revalidateCategoryPaths(currentCategory.slug, validation.data.slug);
  redirect("/admin/categorias?status=updated");
}

export async function toggleCategoryActive(
  categoryId: string,
  formData: FormData,
) {
  await requireAdmin();
  const isActive = formData.get("isActive") === "true";
  const supabase = await createClient();
  const { data: category, error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .select("slug")
    .maybeSingle();

  if (error || !category) {
    redirect("/admin/categorias?status=error");
  }

  revalidateCategoryPaths(category.slug);
  redirect(`/admin/categorias?status=${isActive ? "activated" : "deactivated"}`);
}
