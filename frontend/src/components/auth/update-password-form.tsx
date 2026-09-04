"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthFormErrors, UpdatePasswordFormData } from "@/types/auth";
import { isValidPassword } from "@/components/auth/auth-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UpdatePasswordField = Extract<keyof UpdatePasswordFormData, string>;
type UpdatePasswordErrors = AuthFormErrors<UpdatePasswordField>;

const initialFormData: UpdatePasswordFormData = {
  confirmPassword: "",
  password: "",
};

function validateUpdatePassword(formData: UpdatePasswordFormData) {
  const errors: UpdatePasswordErrors = {};

  if (!isValidPassword(formData.password)) {
    errors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = "Confirma tu nueva contrasena.";
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  return errors;
}

export function UpdatePasswordForm() {
  const [formData, setFormData] =
    useState<UpdatePasswordFormData>(initialFormData);
  const [errors, setErrors] = useState<UpdatePasswordErrors>({});
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isActive) {
        return;
      }

      setHasSession(Boolean(user));
      setIsCheckingSession(false);
    }

    void checkSession();

    return () => {
      isActive = false;
    };
  }, []);

  function updateField(field: UpdatePasswordField, value: string) {
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
    const nextErrors = validateUpdatePassword(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage("Revisa los campos marcados para continuar.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Actualizando contrasena...");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrors({
        form: "No pudimos actualizar la contrasena. Solicita un nuevo enlace e intenta nuevamente.",
      });
      setStatusMessage("");
      return;
    }

    setIsUpdated(true);
  }

  if (isCheckingSession) {
    return (
      <p aria-live="polite" className="text-sm font-semibold text-primary-hover">
        Validando enlace...
      </p>
    );
  }

  if (!hasSession) {
    return (
      <div className="space-y-5 rounded-[28px] border border-border bg-surface-soft p-6">
        <p className="text-sm leading-6 text-muted-foreground">
          El enlace no tiene una sesi&oacute;n v&aacute;lida o ya expir&oacute;.
          Pod&eacute;s solicitar uno nuevo para cambiar tu contrase&ntilde;a.
        </p>
        <Link
          className="text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:text-primary"
          href="/recuperar-contrasena"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (isUpdated) {
    return (
      <div className="space-y-5 rounded-[28px] border border-border bg-surface-soft p-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Contrase&ntilde;a actualizada
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Ya pod&eacute;s entrar a tu cuenta con tu nueva contrase&ntilde;a.
        </p>
        <Link
          className="text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:text-primary"
          href="/mi-cuenta"
        >
          Ir a mi cuenta
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Input
        autoComplete="new-password"
        error={errors.password}
        label={<>Nueva contrase&ntilde;a</>}
        onChange={(event) => updateField("password", event.target.value)}
        required
        type="password"
        value={formData.password}
      />
      <Input
        autoComplete="new-password"
        error={errors.confirmPassword}
        label={<>Confirmar nueva contrase&ntilde;a</>}
        onChange={(event) =>
          updateField("confirmPassword", event.target.value)
        }
        required
        type="password"
        value={formData.confirmPassword}
      />
      {errors.form ? (
        <p className="text-sm font-medium text-destructive">{errors.form}</p>
      ) : null}
      <div className="grid gap-3">
        <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
          {isSubmitting ? "Actualizando..." : "Actualizar contrasena"}
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
