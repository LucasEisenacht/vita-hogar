import { Container } from "@/components/ui/container";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`wt-catalog-skeleton rounded-full bg-white/45 ${className}`}
    />
  );
}

export function CatalogPageSkeleton() {
  return (
    <StorefrontPageShell>
      <section className="bg-transparent pb-0 pt-5 sm:pt-7 lg:pt-8">
        <Container className="max-w-[1320px] space-y-4 sm:space-y-5">
          <SkeletonBlock className="h-5 w-48" />
          <div className="relative min-h-[292px] overflow-hidden rounded-[30px] border border-white/54 bg-[linear-gradient(135deg,rgba(255,250,248,0.82),rgba(250,225,234,0.52))] px-5 py-6 shadow-[0_24px_72px_rgba(74,55,47,0.08)] sm:min-h-[360px] sm:rounded-[34px] sm:px-7 sm:py-8 lg:min-h-[480px] lg:px-10 lg:py-10">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,248,0.88),rgba(255,244,240,0.64),rgba(251,225,235,0.2))]" />
            <div className="relative flex min-h-[240px] max-w-[680px] flex-col justify-center gap-5 sm:min-h-[296px] lg:min-h-[398px]">
              <div className="space-y-4">
                <SkeletonBlock className="h-4 w-36" />
                <div className="space-y-3">
                  <SkeletonBlock className="h-12 w-full max-w-xl rounded-[20px] sm:h-14" />
                  <SkeletonBlock className="h-12 w-4/5 rounded-[20px] sm:h-14" />
                </div>
                <SkeletonBlock className="h-6 w-full max-w-2xl rounded-[18px]" />
                <div className="flex gap-3">
                  <SkeletonBlock className="h-11 w-32" />
                  <SkeletonBlock className="h-11 w-40" />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <SkeletonBlock className="h-10 rounded-full" />
                <SkeletonBlock className="h-10 rounded-full" />
                <SkeletonBlock className="h-10 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock
                className="h-9 w-24 shrink-0"
                key={`catalog-chip-skeleton-${index}`}
              />
            ))}
          </div>
        </Container>
      </section>

      <Container className="relative -mt-4 max-w-[1320px] space-y-9 pb-14 sm:-mt-6 sm:space-y-10 sm:pb-16">
        <div className="rounded-[28px] border border-white/58 bg-[rgba(255,250,248,0.52)] p-4 shadow-[0_18px_52px_rgba(74,55,47,0.06)] backdrop-blur-[18px]">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-3 md:grid-cols-3">
              <SkeletonBlock className="h-11 rounded-[18px]" />
              <SkeletonBlock className="h-11 rounded-[18px]" />
              <SkeletonBlock className="h-11 rounded-[18px]" />
            </div>
            <SkeletonBlock className="h-10 w-36" />
          </div>
        </div>

        <div className="grid gap-5 min-[430px]:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              className="rounded-[24px] border border-white/56 bg-surface/75 p-2 sm:p-2.5"
              key={`catalog-card-skeleton-${index}`}
            >
              <div className="aspect-[4/5] rounded-[20px] bg-secondary/65" />
              <div className="space-y-3 px-1 pb-1 pt-4 sm:px-1.5">
                <div className="flex gap-1">
                  <SkeletonBlock className="h-5 w-16" />
                  <SkeletonBlock className="h-5 w-20" />
                </div>
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-6 w-full rounded-[16px]" />
                <SkeletonBlock className="h-6 w-4/5 rounded-[16px]" />
                <div className="space-y-2 rounded-[18px] border border-white/58 bg-white/36 px-3 py-3">
                  <SkeletonBlock className="h-5 w-20 rounded-[16px]" />
                  <SkeletonBlock className="h-6 w-24 rounded-[16px]" />
                </div>
                <SkeletonBlock className="h-10 w-full rounded-[18px]" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </StorefrontPageShell>
  );
}
