import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const comboItems = ["Funda", "Vidrio", "Cable"];

export function ComboSection() {
  return (
    <section className="bg-background py-14 sm:py-18 lg:py-20">
      <Container>
        <Card className="overflow-hidden bg-surface p-6 sm:p-8 lg:p-10">
          <CardContent className="grid gap-10 p-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="max-w-xl space-y-5">
              <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
                Arm&aacute; tu combo
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                Combin&aacute; tus accesorios favoritos y llev&aacute; todo lo
                que necesit&aacute;s.
              </p>
              <Link
                className={buttonStyles({ className: "w-full sm:w-auto", size: "lg" })}
                href="/tienda/combos"
              >
                Ver combos
              </Link>
            </div>

            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              {comboItems.map((item, index) => (
                <div className="contents" key={item}>
                  <div className="flex min-h-36 flex-1 items-center justify-center rounded-[30px] border border-border bg-surface-soft p-6 text-center font-display text-xl font-semibold shadow-[0_16px_40px_rgba(74,55,47,0.06)]">
                    {item}
                  </div>
                  {index < comboItems.length - 1 ? (
                    <span className="text-center font-display text-3xl font-semibold text-primary-hover">
                      +
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
