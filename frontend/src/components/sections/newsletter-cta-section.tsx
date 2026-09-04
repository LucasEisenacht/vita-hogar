import Link from "next/link";
import { HeartDivider } from "@/components/brand/brand-marks";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function NewsletterCtaSection() {
  return (
    <section className="relative bg-transparent pb-12 pt-4 sm:pb-14 lg:pb-16">
      <Container className="max-w-[1320px]">
        <div className="border-t border-primary/10 pt-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="max-w-2xl space-y-3">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-hover">
                Novedades
              </p>
              <h2 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-[2rem]">
                Enterate de ingresos y promos por nuestros canales reales.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Todavia no hay un formulario de newsletter conectado. Para no
                simular un guardado de emails, te llevamos a Instagram o
                WhatsApp, donde W.todocell ya atiende y publica novedades.
              </p>
              <HeartDivider className="max-w-[150px] opacity-70" />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:min-w-[300px] lg:grid-cols-1">
              <Link
                className={buttonStyles({ className: "w-full", size: "md" })}
                href={siteConfig.instagram.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                Ver novedades en Instagram
              </Link>
              <Link
                className={buttonStyles({
                  className: "w-full",
                  size: "md",
                  variant: "secondary",
                })}
                href={siteConfig.whatsapp.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                Consultar por WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
