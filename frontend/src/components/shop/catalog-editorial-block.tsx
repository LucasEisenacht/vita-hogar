import Link from "next/link";
import Image from "next/image";
import { SparkleMark } from "@/components/brand/brand-marks";
import { buttonStyles } from "@/components/ui/button";
import type { CatalogEditorialExperience } from "@/config/catalog-editorial";

type CatalogEditorialBlockProps = {
  block: NonNullable<CatalogEditorialExperience["editorialBlock"]>;
};

export function CatalogEditorialBlock({ block }: CatalogEditorialBlockProps) {
  return (
    <aside className="relative overflow-hidden rounded-[30px] border border-white/58 bg-[rgba(255,250,248,0.58)] p-3 shadow-[0_22px_62px_rgba(74,55,47,0.075)] backdrop-blur-[16px] md:col-span-2 lg:col-span-3 xl:col-span-4">
      <SparkleMark className="pointer-events-none absolute right-7 top-7 z-10 h-6 w-6 text-primary-hover opacity-24" />
      <div className="grid overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,rgba(255,246,249,0.9),rgba(255,253,251,0.72))] lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="relative z-10 flex min-h-[220px] flex-col justify-center gap-5 px-5 py-7 sm:px-7 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-primary-hover">
              Selección VITA HOGAR
            </p>
            <div className="space-y-2.5">
              <h2 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                {block.title}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {block.description}
              </p>
            </div>
          </div>
          <Link
            className={buttonStyles({
              className: "w-full sm:w-fit",
              size: "sm",
              variant: "secondary",
            })}
            href={block.ctaHref}
          >
            {block.ctaLabel}
          </Link>
        </div>

        {block.image ? (
          <div className="relative min-h-[220px] overflow-hidden lg:min-h-full">
            <Image
              alt={block.image.alt}
              className="object-cover"
              fill
              quality={92}
              sizes="(min-width: 1024px) 330px, 100vw"
              src={block.image.src}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,248,0.02),rgba(255,237,244,0.22))] lg:bg-[linear-gradient(90deg,rgba(255,250,248,0.42),rgba(255,250,248,0.02))]" />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
