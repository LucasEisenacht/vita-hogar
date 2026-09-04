import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CheckoutEmpty() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-6 p-8 text-center sm:p-12">
        <div className="mx-auto h-28 w-28 rounded-[34px] bg-secondary p-5">
          <div className="h-full rounded-[26px] bg-surface/70" />
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-semibold text-foreground">
            Tu carrito esta vacio
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Suma accesorios a tu carrito para finalizar la compra por WhatsApp.
          </p>
        </div>
        <Link className={buttonStyles({ size: "lg" })} href="/tienda">
          Volver a la tienda
        </Link>
      </CardContent>
    </Card>
  );
}
