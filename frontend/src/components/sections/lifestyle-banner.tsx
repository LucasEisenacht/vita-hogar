import Image from "next/image";
import {
  HeartDivider,
  HeartMark,
  SparkleMark,
} from "@/components/brand/brand-marks";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function LifestyleBanner() {
  return (
    <section className="bg-background py-14 sm:py-18 lg:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[38px] border border-border bg-surface-soft p-8 shadow-[0_24px_70px_rgba(74,55,47,0.08)] sm:p-12 lg:p-16">
          <div className="absolute right-8 top-8 h-28 w-44 rounded-full bg-primary/30" />
          <div className="absolute bottom-10 left-10 h-36 w-24 rounded-[34px] bg-surface/70" />
          <SparkleMark className="pointer-events-none absolute right-10 top-10 h-8 w-8 opacity-30 sm:right-14 sm:top-12 sm:h-10 sm:w-10" />
          <HeartMark className="pointer-events-none absolute bottom-12 right-20 hidden h-6 w-6 opacity-25 sm:block" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1fr)] lg:items-center">
            <div className="max-w-2xl space-y-5">
              <Badge>Mirada W.todocell</Badge>
              <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
                Elegimos productos que tambi&eacute;n nos gustar&iacute;a usar.
              </h2>
              <HeartDivider className="max-w-[200px]" />
              <p className="text-base leading-8 text-muted-foreground sm:text-lg">
                Dise&ntilde;o, practicidad y detalles que hacen la diferencia.
              </p>
            </div>
            <div className="grid min-h-[300px] grid-cols-2 gap-4">
              <div className="self-end rounded-[34px] bg-surface p-5 shadow-[0_20px_50px_rgba(74,55,47,0.08)]">
                <div className="relative flex h-44 items-center justify-center rounded-[28px] bg-muted p-6">
                  <Image
                    alt={siteConfig.logo.alt}
                    className="h-28 w-28 object-contain"
                    height={112}
                    src={siteConfig.logo.src}
                    width={112}
                  />
                </div>
              </div>
              <div className="rounded-[34px] bg-background p-5 shadow-[0_20px_50px_rgba(74,55,47,0.08)]">
                <div className="h-56 rounded-[28px] bg-secondary" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
