import type { TransactionalEmail } from "@/lib/email/types";
import {
  escapeAuthEmailHtml,
  getAuthWhatsAppUrl,
  renderAuthBadge,
  renderAuthEmailButton,
  renderAuthEmailShell,
  renderAuthSecurityNote,
} from "@/lib/email/templates/auth-shared";

export type SupabaseAuthEmailEvent =
  | "change_email"
  | "confirm_signup"
  | "reset_password";

const confirmationUrl = "{{ .ConfirmationURL }}";

function renderAlternativeLink() {
  return `
    <p style="margin:22px 0 0;color:#987582;font-size:13px;line-height:1.65;">
      Si el boton no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${confirmationUrl}" style="color:#9f5e78;text-decoration:underline;word-break:break-all;">${confirmationUrl}</a>
    </p>
  `;
}

function renderSupportLine() {
  const whatsappUrl = getAuthWhatsAppUrl(
    "Hola W.todocell, tengo una consulta sobre mi cuenta.",
  );

  return `
    <p style="margin:22px 0 0;color:#765c66;font-size:14px;line-height:1.7;">
      Si necesitas ayuda, escribinos por WhatsApp:
      <a href="${escapeAuthEmailHtml(whatsappUrl)}" style="color:#9f5e78;font-weight:700;text-decoration:none;">hablar con W.todocell</a>.
    </p>
  `;
}

function renderAuthTemplate({
  badge,
  buttonLabel,
  intro,
  securityText,
  subject,
  title,
}: {
  badge: string;
  buttonLabel: string;
  intro: string;
  securityText: string;
  subject: string;
  title: string;
}): TransactionalEmail {
  const body = `
    ${renderAuthBadge(badge)}
    <h1 style="margin:18px 0 10px;color:#34272d;font-size:31px;line-height:1.12;font-weight:800;">${escapeAuthEmailHtml(title)}</h1>
    <p style="margin:0;color:#765c66;font-size:15px;line-height:1.75;">${escapeAuthEmailHtml(intro)}</p>
    <p style="margin:26px 0 0;">${renderAuthEmailButton({
      href: confirmationUrl,
      label: buttonLabel,
    })}</p>
    ${renderAlternativeLink()}
    ${renderAuthSecurityNote(securityText)}
    ${renderSupportLine()}
  `;

  return {
    html: renderAuthEmailShell({
      body,
      preview: intro,
    }),
    subject,
    text: [
      subject,
      intro,
      `${buttonLabel}: ${confirmationUrl}`,
      securityText,
      "Soporte: escribinos por WhatsApp desde el sitio de W.todocell.",
    ].join("\n\n"),
  };
}

export function renderSupabaseAuthEmail(
  event: SupabaseAuthEmailEvent,
): TransactionalEmail {
  if (event === "reset_password") {
    return renderAuthTemplate({
      badge: "Seguridad de cuenta",
      buttonLabel: "Cambiar mi contraseña",
      intro: "Usá el siguiente botón para crear una nueva contraseña.",
      securityText:
        "Si no solicitaste este cambio, ignorá este correo. Tu contraseña actual seguirá activa.",
      subject: "Restablecé tu contraseña de W.todocell",
      title: "¿Olvidaste tu contraseña?",
    });
  }

  if (event === "change_email") {
    return renderAuthTemplate({
      badge: "Cambio de email",
      buttonLabel: "Confirmar nuevo email",
      intro:
        "Confirmá el nuevo correo para terminar de actualizar tu cuenta.",
      securityText:
        "Si no pediste cambiar tu email, ignorá este correo y revisá la seguridad de tu cuenta.",
      subject: "Confirmá tu nuevo email en W.todocell",
      title: "Confirmemos tu nuevo correo",
    });
  }

  return renderAuthTemplate({
    badge: "Cuenta W.todocell",
    buttonLabel: "Confirmar mi cuenta",
    intro: "Confirmá tu correo para terminar de crear tu cuenta.",
    securityText: "Si no creaste esta cuenta, podés ignorar este correo.",
    subject: "Confirmá tu cuenta en W.todocell",
    title: "¡Ya casi está!",
  });
}
