import { Container } from "@/components/ui/container";

const blocks = [
  "row-span-2 bg-secondary",
  "bg-muted",
  "row-span-2 bg-surface-soft",
  "bg-[#f1e6e9]",
  "bg-[#f5ece5]",
  "bg-primary/35",
];

export function InspirationGallery() {
  return (
    <section className="bg-background py-14 sm:py-18 lg:py-20">
      <Container className="space-y-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Inspiraci&oacute;n para todos los d&iacute;as
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Detalles, combinaciones y accesorios que forman parte de tu estilo.
          </p>
        </div>

        <div className="grid auto-rows-[160px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {blocks.map((block, index) => (
            <div
              className={`${block} relative overflow-hidden rounded-[32px] border border-border p-5 shadow-[0_18px_45px_rgba(74,55,47,0.06)]`}
              key={`${block}-${index}`}
            >
              <div className="absolute bottom-5 right-5 h-16 w-16 rounded-[22px] bg-surface/65" />
              <div className="h-10 w-24 rounded-full bg-surface/60" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
