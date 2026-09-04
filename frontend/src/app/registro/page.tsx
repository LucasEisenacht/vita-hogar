import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getSafeAuthRedirect } from "@/lib/auth/redirects";

type RegistroPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function RegistroPage({ searchParams }: RegistroPageProps) {
  const params = await searchParams;
  const nextPath = typeof params?.next === "string" ? params.next : undefined;
  const redirectTo = getSafeAuthRedirect(nextPath);

  return (
    <AuthCard
      description="Crea tu cuenta para guardar tus datos y preparar tus proximas compras con mas calma."
      title="Crear cuenta"
    >
      <SignUpForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
