import { siteConfig } from "@/config/site";
import type {
  AuthWelcomeEmailPayload,
  TransactionalEmail,
} from "@/lib/email/types";
import {
  escapeAuthEmailHtml,
  getAuthAccountUrl,
  getAuthShopUrl,
  getAuthWhatsAppUrl,
  renderAuthBadge,
  renderAuthEmailButton,
  renderAuthEmailShell,
} from "@/lib/email/templates/auth-shared";

const benefits = [
  "Seguir tus pedidos.",
  "Guardar productos en favoritos.",
  "Comprar más rápido.",
  "Recibir novedades.",
];

function getWelcomeName(payload: AuthWelcomeEmailPayload) {
  const source = payload.firstName || payload.fullName || "";
  const normalized = source
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\p{L}\s'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  const firstSegment = normalized.split(" ")[0]?.slice(0, 32);

  return firstSegment || "";
}

export function renderUserWelcomeEmail(
  payload: AuthWelcomeEmailPayload,
): TransactionalEmail {
  const firstName = getWelcomeName(payload);
  const accountUrl = getAuthAccountUrl();
  const shopUrl = getAuthShopUrl();
  const whatsappUrl = getAuthWhatsAppUrl(
    "Hola W.todocell, tengo una consulta sobre mi cuenta.",
  );
  const greeting = firstName
    ? `Hola ${firstName}, tu cuenta ya está lista.`
    : "Tu cuenta ya está lista.";
  const body = `
    ${renderAuthBadge("Cuenta confirmada")}
    <h1 style="margin:18px 0 10px;color:#34272d;font-size:31px;line-height:1.12;font-weight:800;">¡Qué lindo tenerte por acá!</h1>
    <p style="margin:0;color:#765c66;font-size:15px;line-height:1.75;">${escapeAuthEmailHtml(greeting)}</p>
    <div style="margin-top:22px;border-radius:22px;background:#fff3f7;border:1px solid #f0d8e1;padding:20px;">
      <p style="margin:0 0 12px;color:#9f5e78;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">Ahora podes</p>
      <ul style="margin:0;padding-left:20px;color:#765c66;font-size:14px;line-height:1.8;">
        ${benefits.map((benefit) => `<li>${escapeAuthEmailHtml(benefit)}</li>`).join("")}
      </ul>
    </div>
    <p style="margin:26px 0 0;">
      ${renderAuthEmailButton({ href: accountUrl, label: "Ir a mi cuenta" })}
    </p>
    <p style="margin:14px 0 0;">
      ${renderAuthEmailButton({
        href: shopUrl,
        label: "Explorar productos",
        variant: "secondary",
      })}
    </p>
    <div style="margin-top:24px;border:1px solid #f0d8e1;border-radius:22px;background:#fff9fb;padding:18px 20px;">
      <p style="margin:0 0 8px;color:#34272d;font-size:15px;font-weight:800;">Estamos cerca</p>
      <p style="margin:0 0 16px;color:#765c66;font-size:14px;line-height:1.65;">Escribinos por WhatsApp o segui nuestras novedades en Instagram.</p>
      ${renderAuthEmailButton({
        href: whatsappUrl,
        label: "Hablar por WhatsApp",
        variant: "secondary",
      })}
      <p style="margin:14px 0 0;color:#765c66;font-size:13px;line-height:1.6;">
        Instagram:
        <a href="${escapeAuthEmailHtml(siteConfig.instagram.url)}" style="color:#9f5e78;font-weight:700;text-decoration:none;">${escapeAuthEmailHtml(siteConfig.instagram.handle)}</a>
      </p>
    </div>
    <p style="margin:24px 0 0;color:#987582;font-size:14px;line-height:1.7;">
      Gracias por ser parte de W.todocell.
    </p>
  `;

  return {
    html: renderAuthEmailShell({
      body,
      preview: "Tu cuenta de W.todocell ya esta lista.",
    }),
    subject: "¡Bienvenido a W.todocell!",
    text: [
      "W.todocell - Cuenta confirmada",
      firstName
        ? `Hola ${firstName}, tu cuenta ya está lista.`
        : "Tu cuenta ya está lista.",
      "Ahora podes:",
      benefits.map((benefit) => `- ${benefit}`).join("\n"),
      `Ir a mi cuenta: ${accountUrl}`,
      `Explorar productos: ${shopUrl}`,
      `WhatsApp: ${whatsappUrl}`,
      `Instagram: ${siteConfig.instagram.url}`,
      "Gracias por ser parte de W.todocell.",
    ].join("\n\n"),
  };
}
