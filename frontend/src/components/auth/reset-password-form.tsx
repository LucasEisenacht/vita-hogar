"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthFormErrors, ResetPasswordFormData } from "@/types/auth";
import { isValidEmail } from "@/components/auth/auth-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildPublicUrl } from "@/lib/site-url";

type ResetPasswordField = Extract<keyof ResetPasswordFormData, string>;
type ResetPasswordErrors = AuthFormErrors<ResetPasswordField>;

const initialFormData: ResetPasswordFormData = {
  email: "",
};

const neutralMessage =
  "Si existe una cuenta asociada a ese correo, recibiras instrucciones para cambiar tu contrasena.";

function validateResetPassword(formData: ResetPasswordFormData) {
  const errors: ResetPasswordErrors = {};

  if (!formData.email.trim()) {
    errors.email = "Ingresa tu email.";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Ingresa un email valido.";
  }

  return errors;
}

export function ResetPasswordForm() {
  const [formData, setFormData] =
    useState<ResetPasswordFormData>(initialFormData);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  function updateEmail(value: string) {
    setFormData({ email: value });
    setErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateResetPassword(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage("Revisa el email para continuar.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const resetRedirectUrl = buildPublicUrl(
      "/auth/callback?next=/actualizar-contrasena",
      {
        fallbackOrigin: window.location.origin,
      },
    );
    await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: resetRedirectUrl,
    });

    setIsSubmitting(false);
    setStatusMessage(neutralMessage);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Input
        autoComplete="email"
        error={errors.email}
        label="Email"
        onChange={(event) => updateEmail(event.target.value)}
        required
        type="email"
        value={formData.email}
      />
      <div className="grid gap-3">
        <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
          {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
        </Button>
        <p
          aria-live="polite"
          className="min-h-6 text-sm font-semibold text-primary-hover"
        >
          {statusMessage}
        </p>
      </div>
    </form>
  );
}
