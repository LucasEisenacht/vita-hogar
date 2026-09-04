import { AuthCard } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function ActualizarContrasenaPage() {
  return (
    <AuthCard
      description={
        <>
          Eleg&iacute; una nueva contrase&ntilde;a para seguir usando tu cuenta de
          W.todocell.
        </>
      }
      title={<>Actualizar contrase&ntilde;a</>}
    >
      <UpdatePasswordForm />
    </AuthCard>
  );
}
