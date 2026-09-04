import { AuthCard } from "@/components/auth/auth-card";
import { AuthStatusNotice } from "@/components/auth/auth-status-notice";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getSafeAuthRedirect } from "@/lib/auth/redirects";

type SignInPageProps = {
  searchParams?: Promise<{
    "email-confirmado"?: string | string[];
    error?: string | string[];
    next?: string | string[];
  }>;
};

function getSearchParamValue(value?: string | string[]) {
  return typeof value === "string" ? value : undefined;
}

function getCallbackErrorNotice(error?: string) {
  switch (error) {
    case "auth-link-expired":
      return {
        text: "Pedí un nuevo enlace para continuar con tu cuenta.",
        title: "El enlace venció.",
      };
    case "auth-link-invalid":
      return {
        text: "Volvé a abrir el enlace desde el email o pedí uno nuevo.",
        title: "El enlace no es válido.",
      };
    case "auth-link-used":
      return {
        text: "Tu cuenta puede estar confirmada. Iniciá sesión para continuar.",
        title: "Ese enlace ya fue utilizado.",
      };
    case "callback":
      return {
        text: "Intentá ingresar nuevamente o pedí un nuevo enlace.",
        title: "No pudimos confirmar el enlace.",
      };
    default:
      return null;
  }
}

export default async function IngresarPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const emailConfirmed = getSearchParamValue(params?.["email-confirmado"]) === "1";
  const callbackErrorNotice = getCallbackErrorNotice(
    getSearchParamValue(params?.error),
  );
  const nextPath = getSearchParamValue(params?.next);
  const redirectTo = getSafeAuthRedirect(nextPath);

  return (
    <AuthCard
      description={
        <>
          Ingres&aacute; para ver tu cuenta y tener tus datos listos para comprar.
        </>
      }
      title="Ingresar"
    >
      {emailConfirmed ? (
        <AuthStatusNotice
          text="Ya podés iniciar sesión en tu cuenta."
          title="¡Correo confirmado correctamente!"
        />
      ) : null}
      {callbackErrorNotice ? (
        <AuthStatusNotice
          text={callbackErrorNotice.text}
          title={callbackErrorNotice.title}
          variant="error"
        />
      ) : null}
      <SignInForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
