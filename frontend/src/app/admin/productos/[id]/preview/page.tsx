import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCommercialBadges } from "@/components/shop/product-commercial-badges";
import { ProductGallery } from "@/components/shop/product-gallery";
import {
  ProductTechnicalDetails,
  hasProductTechnicalDetails,
} from "@/components/shop/product-technical-details";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  getAvailabilityLabel,
  getConditionLabel,
} from "@/lib/catalog/commerce";
import { formatCurrency } from "@/lib/format-currency";
import { normalizeProduct } from "@/lib/catalog/normalize";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Vista previa de producto | W.todocell Admin",
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

  const [{ data: category }, { data: images, error: imagesError }] =
    await Promise.all([
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
    ]);

  if (!category || imagesError) {
    return null;
  }

  return {
    isActive: product.is_active,
    product: normalizeProduct({
      category,
      images: images ?? [],
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

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:items-start">
          <ProductGallery product={product} />
          <Card>
            <CardContent className="space-y-7 p-6 sm:p-8">
              <ProductCommercialBadges product={product} />
              <div className="space-y-3">
                <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                  {product.name}
                </h1>
                <p className="text-base leading-8 text-muted-foreground">
                  {product.shortDescription}
                </p>
              </div>
              <p className="font-display text-3xl font-semibold text-foreground">
                {formatCurrency(product.price)}
              </p>
              <div className="grid gap-3 rounded-[24px] border border-border bg-surface-soft p-5 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Condicion</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {getConditionLabel(product.condition)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Disponibilidad</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {getAvailabilityLabel(product.availabilityType)}
                  </p>
                </div>
              </div>
              <div className="rounded-[24px] border border-border bg-surface px-4 py-3 text-sm font-semibold text-muted-foreground">
                CTA deshabilitado en vista previa administrativa.
              </div>
            </CardContent>
          </Card>
        </section>

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
