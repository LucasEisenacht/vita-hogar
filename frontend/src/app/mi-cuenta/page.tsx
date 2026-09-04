import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode, SVGProps } from "react";
import { signOut } from "@/app/auth/actions";
import { AuthStatusNotice } from "@/components/auth/auth-status-notice";
import { AccountNav } from "@/components/account/account-nav";
import {
  HeartDivider,
  HeartMark,
  SparkleMark,
} from "@/components/brand/brand-marks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import {
  getCurrentRole,
  getRoleLabel,
  isAdminRole,
} from "@/lib/auth/get-current-role";
import { getAddressCountsForCurrentUser } from "@/lib/account/addresses";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  description?: ReactNode;
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
};

type AccessCard = {
  description: ReactNode;
  href?: string;
  icon: ReactNode;
  title: ReactNode;
};

type MiCuentaPageProps = {
  searchParams?: Promise<{
    "email-confirmado"?: string | string[];
  }>;
};

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="14" rx="3.5" width="17" x="3.5" y="5" />
      <path d="m5.5 8 6.5 5 6.5-5" />
    </svg>
  );
}

function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M8.2 5.4 10 9.2l-1.5 1.3c.9 1.9 2.4 3.4 4.4 4.4l1.3-1.5 3.8 1.8-.3 2.6c-.1.8-.8 1.4-1.6 1.4-6.1 0-11.1-5-11.1-11.1 0-.8.6-1.5 1.4-1.6l1.8-.1Z" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="8.5" r="3.3" />
      <path d="M5.8 19.2a6.2 6.2 0 0 1 12.4 0" />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M18 10.8a6 6 0 0 0-12 0c0 3.1-1.3 4.4-2 5.2h16c-.7-.8-2-2.1-2-5.2Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="15" rx="3" width="16" x="4" y="5.5" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" />
    </svg>
  );
}

function PackageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m12 3.8 7 3.8v8.8l-7 3.8-7-3.8V7.6l7-3.8Z" />
      <path d="m5.4 7.8 6.6 3.6 6.6-3.6M12 11.4v8.3" />
    </svg>
  );
}

function LocationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 21s6-5.1 6-11a6 6 0 0 0-12 0c0 5.9 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function formatProfileDate(value?: string | null) {
  if (!value) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name" | "phone",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

function ProfileDetailRow({
  description,
  icon,
  label,
  value,
}: ProfileRow) {
  return (
    <div className="grid gap-4 border-b border-border/70 py-5 last:border-b-0 sm:grid-cols-[44px_minmax(0,1fr)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary-hover">
        {icon}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <div className="break-words font-display text-lg font-semibold text-foreground">
          {value}
        </div>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground/85">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AccountAccessCard({ description, href, icon, title }: AccessCard) {
  const content = (
    <Card
      className={`group overflow-hidden bg-surface/95 ${href ? "" : "cursor-default"}`}
      interactive
    >
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-secondary text-primary-hover transition-colors duration-[250ms] group-hover:bg-primary group-hover:text-primary-foreground motion-reduce:transition-none">
            {icon}
          </div>
          {href ? null : <Badge variant="neutral">Pr&oacute;ximamente</Badge>}
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground/85">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link className="block" href={href}>
        {content}
      </Link>
    );
  }

  return content;
}

function getSearchParamValue(value?: string | string[]) {
  return typeof value === "string" ? value : undefined;
}

export default async function MiCuentaPage({
  searchParams,
}: MiCuentaPageProps) {
  const params = await searchParams;
  const showEmailConfirmedNotice =
    getSearchParamValue(params?.["email-confirmado"]) === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ingresar?next=/mi-cuenta");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name,phone,newsletter_subscribed,created_at")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    profile?.first_name || getMetadataText(user.user_metadata, "first_name");
  const lastName =
    profile?.last_name || getMetadataText(user.user_metadata, "last_name");
  const phone = profile?.phone || getMetadataText(user.user_metadata, "phone");
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const greetingName = firstName || "tu cuenta";
  const isNewsletterSubscribed = Boolean(profile?.newsletter_subscribed);
  const createdAt = profile?.created_at ?? user.created_at;
  const currentRole = await getCurrentRole(user);
  const canAccessAdmin = isAdminRole(currentRole);
  const counts = await getAddressCountsForCurrentUser();

  const profileRows: Array<ProfileRow> = [
    {
      icon: <UserIcon className="h-5 w-5" />,
      label: "Nombre completo",
      value: fullName || "No informado",
    },
    {
      icon: <MailIcon className="h-5 w-5" />,
      label: "Email",
      value: user.email ?? "No disponible",
    },
    {
      icon: <PhoneIcon className="h-5 w-5" />,
      label: <>Tel&eacute;fono</>,
      value: phone || "No informado",
    },
    {
      description: isNewsletterSubscribed ? (
        <>Recib&iacute;s novedades y promociones de W.todocell.</>
      ) : (
        <>Podr&aacute;s activar las novedades m&aacute;s adelante.</>
      ),
      icon: <BellIcon className="h-5 w-5" />,
      label: "Newsletter",
      value: (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className={
              isNewsletterSubscribed
                ? "h-2.5 w-2.5 rounded-full bg-success"
                : "h-2.5 w-2.5 rounded-full bg-muted-foreground/35"
            }
          />
          {isNewsletterSubscribed ? "Suscripta" : "No suscripta"}
        </span>
      ),
    },
    {
      icon: <CalendarIcon className="h-5 w-5" />,
      label: "Cuenta creada",
      value: formatProfileDate(createdAt),
    },
  ];

  const accessCards: Array<AccessCard> = [
    {
      description: "Edita tu nombre, telefono y fecha de nacimiento opcional.",
      href: "/mi-cuenta/perfil",
      icon: <UserIcon className="h-5 w-5" />,
      title: "Editar perfil",
    },
    {
      description: `Consulta el historial y el estado de tus compras. ${counts.orders} pedidos registrados.`,
      href: "/mi-cuenta/pedidos",
      icon: <PackageIcon className="h-5 w-5" />,
      title: "Mis pedidos",
    },
    {
      description: `Guarda tus datos de envio para comprar con mas calma. ${counts.addresses} direcciones guardadas.`,
      href: "/mi-cuenta/direcciones",
      icon: <LocationIcon className="h-5 w-5" />,
      title: "Mis direcciones",
    },
    {
      description: `Reuni tus accesorios favoritos para volver a encontrarlos facil. ${counts.favorites} favoritos guardados.`,
      href: "/mi-cuenta/favoritos",
      icon: <HeartMark className="h-5 w-5" />,
      title: "Favoritos",
    },
  ];

  return (
    <section className="overflow-hidden bg-transparent py-10 text-foreground sm:py-14 lg:py-20">
      <Container className="space-y-8 lg:space-y-10">
        <div className="relative overflow-hidden rounded-[34px] border border-border bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-soft)_58%,rgba(255,255,255,0.94)_100%)] px-6 py-8 shadow-[0_28px_80px_rgba(74,55,47,0.09)] sm:px-8 sm:py-10 lg:px-10">
          <SparkleMark className="pointer-events-none absolute right-8 top-8 h-8 w-8 opacity-25 sm:h-10 sm:w-10" />
          <HeartMark className="pointer-events-none absolute bottom-8 right-24 hidden h-5 w-5 opacity-20 sm:block" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl space-y-5">
              <div className="flex items-center gap-3">
                <Image
                  alt={siteConfig.logo.alt}
                  className="h-12 w-12 object-contain"
                  height={48}
                  priority
                  src={siteConfig.logo.src}
                  width={48}
                />
                <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-primary-hover">
                  MI CUENTA
                </p>
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
                  Hola, {greetingName}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                  Tu espacio para guardar tus datos, seguir tus pedidos y
                  preparar futuras compras.
                </p>
              </div>
              <HeartDivider className="max-w-[190px]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-1">
              {canAccessAdmin ? (
                <Link
                  className={buttonStyles({
                    className: "w-full",
                    size: "lg",
                    variant: "primary",
                  })}
                  href="/admin"
                >
                  Ir al panel de administraci&oacute;n
                </Link>
              ) : null}
              <form action={signOut} className="w-full">
                <Button
                  className="w-full"
                  size="lg"
                  type="submit"
                  variant="secondary"
                >
                  Cerrar sesi&oacute;n
                </Button>
              </form>
            </div>
          </div>
        </div>

        {showEmailConfirmedNotice ? (
          <AuthStatusNotice
            text="Tu cuenta ya está lista para usar."
            title="¡Tu correo fue confirmado!"
          />
        ) : null}

        <AccountNav active="profile" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <Card className="relative overflow-hidden">
            <SparkleMark className="pointer-events-none absolute -right-3 top-12 h-16 w-16 opacity-10" />
            <CardContent className="p-6 sm:p-8 lg:p-9">
              <div className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <Badge variant="new">Cliente W.todocell</Badge>
                  {canAccessAdmin ? (
                    <Badge variant="neutral">{getRoleLabel(currentRole)}</Badge>
                  ) : null}
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                      {fullName || "Perfil de cliente"}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground/85">
                      Tus datos principales quedan listos para que tus proximas
                      compras se sientan mas simples y personales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y-0">
                {profileRows.map((row) => (
                  <ProfileDetailRow
                    description={row.description}
                    icon={row.icon}
                    key={String(row.label)}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <aside className="grid gap-5" aria-label="Accesos de mi cuenta">
            {accessCards.map((card) => (
              <AccountAccessCard
                description={card.description}
                href={card.href}
                icon={card.icon}
                key={String(card.title)}
                title={card.title}
              />
            ))}
          </aside>
        </div>
      </Container>
    </section>
  );
}
