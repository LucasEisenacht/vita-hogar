"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthFormErrors, SignInFormData } from "@/types/auth";
import { isValidEmail } from "@/components/auth/auth-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type SignInField = Extract<keyof SignInFormData, string>;
type SignInErrors = AuthFormErrors<SignInField>;

const initialFormData: SignInFormData = {
  email: "",
  password: "",
};

function validateSignIn(formData: SignInFormData) {
  const errors: SignInErrors = {};

  if (!formData.email.trim()) {
    errors.email = "Ingresa tu email.";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Ingresa un email valido.";
  }

  if (!formData.password) {
    errors.password = "Ingresa tu contrasena.";
  }

  return errors;
}

type SignInFormProps = {
  initialMessage?: string;
  redirectTo?: string;
};

export function SignInForm({
  initialMessage,
  redirectTo = "/mi-cuenta",
}: SignInFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<SignInFormData>(initialFormData);
  const [errors, setErrors] = useState<SignInErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(initialMessage ?? "");

  function updateField(field: SignInField, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSignIn(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage("Revisa los campos marcados para continuar.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrors({
        form: "Email o contrasena incorrectos.",
      });
      setStatusMessage("");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Input
        autoComplete="email"
        error={errors.email}
        label="Email"
        onChange={(event) => updateField("email", event.target.value)}
        required
        type="email"
        value={formData.email}
      />
      <Input
        autoComplete="current-password"
        error={errors.password}
        label={<>Contrase&ntilde;a</>}
        onChange={(event) => updateField("password", event.target.value)}
        required
        type="password"
        value={formData.password}
      />
      {errors.form ? (
        <p className="text-sm font-medium text-destructive">{errors.form}</p>
      ) : null}
      <div className="grid gap-3">
        <Button
          aria-busy={isSubmitting}
          className="w-full"
          disabled={isSubmitting}
          size="lg"
          type="submit"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              <span>Ingresando</span>
            </>
          ) : (
            "Ingresar"
          )}
        </Button>
        {statusMessage ? (
          <p
            aria-live="polite"
            className="text-sm font-semibold text-primary-hover"
          >
            {statusMessage}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <Link
          className="font-semibold text-primary-hover"
          href={`/registro?next=${encodeURIComponent(redirectTo)}`}
        >
          Crear una cuenta
        </Link>
        <Link
          className="font-semibold text-primary-hover"
          href="/recuperar-contrasena"
        >
          &iquest;Olvidaste tu contrase&ntilde;a?
        </Link>
      </div>
    </form>
  );
}
