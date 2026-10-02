import type { Category } from "@/types/database";

export type AdminCategory = Category & {
  productCount: number;
};

export type CategoryFormField =
  | "description"
  | "form"
  | "name"
  | "slug"
  | "sortOrder";

export type CategoryFormState = {
  fieldErrors?: Partial<Record<CategoryFormField, string>>;
  message?: string;
  status: "error" | "idle";
};

export const initialCategoryFormState: CategoryFormState = {
  status: "idle",
};
