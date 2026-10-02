import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchaseExperience } from "@/components/shop/product-purchase-experience";
import {
  ProductTechnicalDetails,
  hasProductTechnicalDetails,
} from "@/components/shop/product-technical-details";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { normalizeProduct } from "@/lib/catalog/normalize";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Vista previa de producto | VITA HOGAR Admin",
};

type ProductPreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getPreviewProduct(productId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product?.category_id) {
    return null;
  }

  const [
    { data: category },
    { data: images, error: imagesError },
    { data: modelVariants, error: modelVariantsError },
  ] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("id", product.category_id)
        .maybeSingle(),
      supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true }),
      supabase
        .from("product_model_variants")
        .select("*")
        .eq("product_id", productId)
        .order("brand", { ascending: true })
        .order("model", { ascending: true }),
    ]);

  if (!category || imagesError || modelVariantsError) {
    return null;
  }

  return {
    isActive: product.is_active,
    product: normalizeProduct({
      category,
      images: images ?? [],
      modelVariants: modelVariants ?? [],
      product,
    }),
  };
}

export default async function ProductPreviewPage({
  params,
}: ProductPreviewPageProps) {
  const { id } = await params;
  const preview = await getPreviewProduct(id);

  if (!preview) {
    notFound();
  }

  const { isActive, product } = preview;

  return (
    <div className="bg-background pb-16 pt-8 text-foreground">
      <Container className="space-y-8">
        <div className="rounded-[28px] border border-primary/25 bg-secondary/70 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="new">Vista previa</Badge>
                <Badge variant={isActive ? "stock" : "neutral"}>
                  {isActive ? "Publicado" : "Oculto"}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Esta vista usa el producto guardado. No permite comprar ni
                agregar al carrito.
              </p>
            </div>
            <Link
              className={buttonStyles({ size: "sm", variant: "secondary" })}
              href={`/admin/productos/${id}/editar`}
            >
              Volver a editar
            </Link>
          </div>
        </div>

        <ProductPurchaseExperience previewMode product={product} />

        {product.description || hasProductTechnicalDetails(product) ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)]">
            {product.description ? (
              <Card>
                <CardContent className="space-y-4 p-6 sm:p-8">
                  <h2 className="font-display text-3xl font-semibold text-foreground">
                    Descripcion
                  </h2>
                  <p className="text-base leading-8 text-muted-foreground">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            ) : null}
            <ProductTechnicalDetails product={product} />
          </section>
        ) : null}
      </Container>
    </div>
  );
}
