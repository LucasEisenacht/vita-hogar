import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCurrentUserFavorites } from "@/lib/favorites/queries";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductGrid } from "@/components/shop/product-grid";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  description:
    "Productos guardados por la clienta en su cuenta de W.todocell.",
  title: "Mis favoritos | W.todocell",
};

export default async function AccountFavoritesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/ingresar?next=/mi-cuenta/favoritos");
  }

  const products = await getCurrentUserFavorites();
  const favoriteProductIds = products.map((product) => product.id);

  return (
    <section className="bg-transparent py-10 text-foreground sm:py-14 lg:py-20">
      <Container className="space-y-8">
        <div className="max-w-3xl space-y-4">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
            Mi cuenta
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Mis favoritos
          </h1>
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            Guard&aacute; los accesorios que te gustan para volver a encontrarlos
            con calma.
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {products.length} productos guardados
          </p>
        </div>

        <AccountNav active="favorites" />

        {products.length > 0 ? (
          <ProductGrid
            favoriteProductIds={favoriteProductIds}
            products={products}
            refreshOnFavoriteChange
          />
        ) : (
          <EmptyState
            actionHref="/tienda"
            actionLabel="Explorar productos"
            message="Cuando encuentres algo que te guste, toca el corazon para guardarlo aca."
            title="Todavia no guardaste favoritos"
          />
        )}
      </Container>
    </section>
  );
}
