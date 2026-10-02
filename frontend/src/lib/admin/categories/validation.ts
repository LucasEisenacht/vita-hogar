import { slugifyProductName } from "@/lib/admin/catalog/validation";
import type {
  CategoryFormField,
  CategoryFormState,
} from "@/lib/admin/categories/types";

type CategoryFormValues = {
  description: string | null;
  is_active: boolean;
  name: string;
  slug: string;
  sort_order: number;
};

type CategoryValidationResult =
  | { data: CategoryFormValues; fieldErrors?: never }
  | {
      data?: never;
      fieldErrors: NonNullable<CategoryFormState["fieldErrors"]>;
    };

function getString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function setError(
  errors: Partial<Record<CategoryFormField, string>>,
  field: CategoryFormField,
  message: string,
) {
  errors[field] = message;
}

export function slugifyCategoryName(value: string) {
  return slugifyProductName(value);
}

export function validateCategoryForm(
  formData: FormData,
): CategoryValidationResult {
  const fieldErrors: Partial<Record<CategoryFormField, string>> = {};
  const name = getString(formData, "name");
  const slug = slugifyCategoryName(getString(formData, "slug") || name);
  const descriptionValue = getString(formData, "description");
  const sortOrderValue = getString(formData, "sortOrder");
  const sortOrder = Number(sortOrderValue);

  if (!name) {
    setError(fieldErrors, "name", "El nombre es obligatorio.");
  } else if (name.length > 120) {
    setError(fieldErrors, "name", "El nombre debe tener hasta 120 caracteres.");
  }

  if (!slug) {
    setError(fieldErrors, "slug", "El slug es obligatorio.");
  } else if (slug.length > 120) {
    setError(fieldErrors, "slug", "El slug debe tener hasta 120 caracteres.");
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    setError(
      fieldErrors,
      "slug",
      "Usa letras minusculas, numeros y guiones simples.",
    );
  }

  if (descriptionValue.length > 500) {
    setError(
      fieldErrors,
      "description",
      "La descripcion debe tener hasta 500 caracteres.",
    );
  }

  if (
    !sortOrderValue ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 0 ||
    sortOrder > 9999
  ) {
    setError(
      fieldErrors,
      "sortOrder",
      "El orden debe ser un entero entre 0 y 9999.",
    );
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      description: descriptionValue || null,
      is_active: formData.get("isActive") === "on",
      name,
      slug,
      sort_order: sortOrder,
    },
  };
}
