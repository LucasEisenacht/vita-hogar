import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function RecuperarContrasenaPage() {
  return (
    <AuthCard
      description={
        <>
          Te enviamos un enlace para que puedas elegir una nueva
          contrase&ntilde;a de forma segura.
        </>
      }
      title={<>Recuperar contrase&ntilde;a</>}
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
