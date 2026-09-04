"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthFormErrors, SignUpFormData } from "@/types/auth";
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
} from "@/components/auth/auth-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SignUpField = Extract<keyof SignUpFormData, string>;
type SignUpErrors = AuthFormErrors<SignUpField>;

const initialFormData: SignUpFormData = {
  confirmPassword: "",
  email: "",
  firstName: "",
  lastName: "",
  newsletterSubscribed: false,
  password: "",
  phone: "",
};

type SignUpFormProps = {
  redirectTo?: string;
};

function validateSignUp(formData: SignUpFormData) {
  const errors: SignUpErrors = {};

  if (!formData.firstName.trim()) {
    errors.firstName = "Ingresa tu nombre.";
  }

  if (!formData.lastName.trim()) {
    errors.lastName = "Ingresa tu apellido.";
  }

  if (!formData.email.trim()) {
    errors.email = "Ingresa tu email.";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Ingresa un email valido.";
  }

  if (!formData.phone.trim()) {
    errors.phone = "Ingresa tu telefono.";
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = "Ingresa un telefono valido.";
  }

  if (!isValidPassword(formData.password)) {
    errors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = "Confirma tu contrasena.";
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  return errors;
}

export function SignUpForm({ redirectTo = "/mi-cuenta" }: SignUpFormProps) {
  const [formData, setFormData] = useState<SignUpFormData>(initialFormData);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  function updateField(field: SignUpField, value: string | boolean) {
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
    const nextErrors = validateSignUp(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage("Revisa los campos marcados para continuar.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Creando tu cuenta...");

    const supabase = createClient();
    const authCallbackUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          newsletter_subscribed: formData.newsletterSubscribed,
          phone: formData.phone.trim(),
        },
        emailRedirectTo: `${authCallbackUrl}?next=${encodeURIComponent(
          redirectTo,
        )}`,
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrors({
        form: "No pudimos crear la cuenta. Revisa los datos e intenta nuevamente.",
      });
      setStatusMessage("");
      return;
    }

    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6 rounded-[28px] border border-border bg-surface-soft p-6">
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Revis&aacute; tu correo
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Te enviamos un enlace para confirmar tu cuenta en W.todocell.
          </p>
        </div>
        <Link
          className="text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:text-primary"
          href={`/ingresar?next=${encodeURIComponent(redirectTo)}`}
        >
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          autoComplete="given-name"
          error={errors.firstName}
          label="Nombre"
          onChange={(event) => updateField("firstName", event.target.value)}
          required
          value={formData.firstName}
        />
        <Input
          autoComplete="family-name"
          error={errors.lastName}
          label="Apellido"
          onChange={(event) => updateField("lastName", event.target.value)}
          required
          value={formData.lastName}
        />
      </div>
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
        autoComplete="tel"
        error={errors.phone}
        label={<>Tel&eacute;fono</>}
        onChange={(event) => updateField("phone", event.target.value)}
        required
        type="tel"
        value={formData.phone}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          autoComplete="new-password"
          error={errors.password}
          label={<>Contrase&ntilde;a</>}
          onChange={(event) => updateField("password", event.target.value)}
          required
          type="password"
          value={formData.password}
        />
        <Input
          autoComplete="new-password"
          error={errors.confirmPassword}
          label={<>Confirmar contrase&ntilde;a</>}
          onChange={(event) =>
            updateField("confirmPassword", event.target.value)
          }
          required
          type="password"
          value={formData.confirmPassword}
        />
      </div>
      <label className="flex gap-3 rounded-[22px] border border-border bg-surface-soft p-4 text-sm leading-6 text-muted-foreground">
        <input
          checked={formData.newsletterSubscribed}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
          onChange={(event) =>
            updateField("newsletterSubscribed", event.target.checked)
          }
          type="checkbox"
        />
        <span>
          Quiero recibir novedades, lanzamientos y promociones de W.todocell.
        </span>
      </label>
      {errors.form ? (
        <p className="text-sm font-medium text-destructive">{errors.form}</p>
      ) : null}
      <div className="grid gap-3">
        <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
        <p
          aria-live="polite"
          className="min-h-6 text-sm font-semibold text-primary-hover"
        >
          {statusMessage}
        </p>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        &iquest;Ya ten&eacute;s cuenta?{" "}
        <Link
          className="font-semibold text-primary-hover"
          href={`/ingresar?next=${encodeURIComponent(redirectTo)}`}
        >
          Ingresar
        </Link>
      </p>
    </form>
  );
}
