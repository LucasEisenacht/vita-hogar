import { siteConfig } from "@/config/site";
import { getWhatsAppOrderUrl } from "@/config/checkout";
import { buildPublicUrl } from "@/lib/site-url";

type AuthEmailButton = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

const colors = {
  blush: "#fff3f7",
  border: "#f0d8e1",
  foreground: "#34272d",
  muted: "#765c66",
  mutedSoft: "#987582",
  primary: "#d89aac",
  primaryDark: "#9f5e78",
  surface: "#fffdfb",
} as const;

const buttonStyles = {
  primary:
    "display:inline-block;border-radius:999px;background:#d89aac;color:#ffffff;font-size:14px;font-weight:700;line-height:1;padding:14px 22px;text-decoration:none",
  secondary:
    "display:inline-block;border-radius:999px;background:#fff3f7;border:1px solid #f0d8e1;color:#9f5e78;font-size:14px;font-weight:700;line-height:1;padding:13px 20px;text-decoration:none",
} as const;

export function escapeAuthEmailHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getAuthEmailLogoUrl() {
  return buildPublicUrl(siteConfig.logo.src, {
    fallbackOrigin: siteConfig.url,
  });
}

export function getAuthWhatsAppUrl(message: string) {
  return getWhatsAppOrderUrl(message);
}

export function getAuthAccountUrl() {
  return buildPublicUrl("/mi-cuenta", {
    fallbackOrigin: siteConfig.url,
  });
}

export function getAuthShopUrl() {
  return buildPublicUrl("/tienda", {
    fallbackOrigin: siteConfig.url,
  });
}

export function renderAuthEmailButton({
  href,
  label,
  variant = "primary",
}: AuthEmailButton) {
  return `<a href="${escapeAuthEmailHtml(href)}" style="${buttonStyles[variant]}">${escapeAuthEmailHtml(label)}</a>`;
}

export function renderAuthEmailShell({
  body,
  preview,
}: {
  body: string;
  preview: string;
}) {
  const logoUrl = getAuthEmailLogoUrl();

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
  </head>
  <body style="margin:0;background:#fff5f7;color:${colors.foreground};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeAuthEmailHtml(preview)}</div>
    <table role="presentation" width="100%" style="border-collapse:collapse;background:linear-gradient(135deg,#fff5f7 0%,#fffaf6 48%,#fff0f5 100%);">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" style="max-width:620px;border-collapse:collapse;border-radius:30px;background:${colors.surface};border:1px solid ${colors.border};box-shadow:0 22px 58px rgba(172,105,132,0.14);overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;background:#fffaf7;">
                <img src="${escapeAuthEmailHtml(logoUrl)}" width="148" height="54" alt="${escapeAuthEmailHtml(siteConfig.logo.alt)}" style="display:block;border:0;max-width:148px;height:auto;">
                <p style="margin:6px 0 0;color:${colors.primaryDark};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">${escapeAuthEmailHtml(siteConfig.name)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 30px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 26px;border-top:1px solid ${colors.border};background:#fff9f7;color:${colors.muted};font-size:12px;line-height:1.65;">
                <strong style="color:${colors.foreground};">${escapeAuthEmailHtml(siteConfig.name)}</strong><br>
                Accesorios que combinan con tu estilo.<br>
                ${escapeAuthEmailHtml(siteConfig.location.city)}, ${escapeAuthEmailHtml(siteConfig.location.province)}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderAuthBadge(label: string) {
  return `
    <span style="display:inline-block;border-radius:999px;background:${colors.blush};border:1px solid ${colors.border};color:${colors.primaryDark};font-size:11px;font-weight:800;letter-spacing:0.16em;line-height:1;padding:9px 12px;text-transform:uppercase;">
      ${escapeAuthEmailHtml(label)}
    </span>
  `;
}

export function renderAuthSecurityNote(text: string) {
  return `
    <div style="margin-top:22px;border-radius:20px;background:#fff8f3;border:1px solid #eadbd2;padding:16px 18px;">
      <p style="margin:0;color:${colors.mutedSoft};font-size:13px;line-height:1.65;">${escapeAuthEmailHtml(text)}</p>
    </div>
  `;
}
