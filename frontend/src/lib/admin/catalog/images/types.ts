import type { ProductImage } from "@/types/database";

export type ProductImageWithUrl = ProductImage & {
  publicUrl: string;
};

export type ProductImageActionState = {
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialProductImageActionState: ProductImageActionState = {
  status: "idle",
};
