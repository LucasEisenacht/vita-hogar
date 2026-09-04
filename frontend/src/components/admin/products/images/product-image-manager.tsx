import { ProductImageCard } from "@/components/admin/products/images/product-image-card";
import { ProductImageUploader } from "@/components/admin/products/images/product-image-uploader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { uploadProductImages } from "@/lib/admin/catalog/images/actions";
import type { ProductImageWithUrl } from "@/lib/admin/catalog/images/types";
import { MAX_PRODUCT_IMAGE_COUNT } from "@/lib/admin/catalog/images/validation";

type ProductImageManagerProps = {
  images: Array<ProductImageWithUrl>;
  productColors: Array<string>;
  productId: string;
  productName: string;
};

export function ProductImageManager({
  images,
  productColors,
  productId,
  productName,
}: ProductImageManagerProps) {
  const imageIds = images.map((image) => image.id);
  const uploadAction = uploadProductImages.bind(null, productId);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-7 p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Imagenes del producto
              </h2>
              <Badge variant="neutral">
                {images.length}/{MAX_PRODUCT_IMAGE_COUNT}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground/85">
              Sube fotos nuevas desde esta seccion. Las imagenes guardadas se
              pueden ordenar, marcar como principal, asociar a un color o
              eliminar desde una sola zona.
            </p>
          </div>
        </div>

        <ProductImageUploader
          action={uploadAction}
          currentImageCount={images.length}
          maxImageCount={MAX_PRODUCT_IMAGE_COUNT}
        />

        {images.length === 0 ? (
          <div className="rounded-[28px] border border-border bg-surface-soft px-5 py-8 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] bg-secondary text-primary-hover">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect
                  height="14"
                  rx="3"
                  strokeWidth="1.7"
                  width="16"
                  x="4"
                  y="5"
                />
                <path
                  d="m7 15 3-3 2.2 2.2 1.8-1.8 3 3M8 9.2h.01"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </div>
            <p className="mt-4 font-display text-xl font-semibold text-foreground">
              Este producto todavia no tiene imagenes.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cargalas desde esta seccion cuando ya tengas las fotos listas.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {images.map((image, index) => (
              <ProductImageCard
                image={image}
                imageIds={imageIds}
                index={index}
                key={image.id}
                productColors={productColors}
                productId={productId}
                productName={productName}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
