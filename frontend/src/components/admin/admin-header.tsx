import { SparkleMark } from "@/components/brand/brand-marks";

type AdminHeaderProps = {
  eyebrow?: string;
  roleLabel: string;
  subtitle: string;
  title: string;
  userName: string;
};

export function AdminHeader({
  eyebrow = "W.todocell Admin",
  roleLabel,
  subtitle,
  title,
  userName,
}: AdminHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[34px] border border-border bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-soft)_58%,rgba(255,255,255,0.94)_100%)] px-6 py-7 shadow-[0_26px_70px_rgba(74,55,47,0.08)] sm:px-8 sm:py-8">
      <SparkleMark className="pointer-events-none absolute right-7 top-7 h-9 w-9 opacity-25" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl space-y-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            {eyebrow}
          </p>
          <div className="space-y-3">
            <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(74,55,47,0.05)]">
          <p className="text-muted-foreground">Hola,</p>
          <p className="font-display text-base font-semibold text-foreground">
            {userName}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
            {roleLabel}
          </p>
        </div>
      </div>
    </header>
  );
}
