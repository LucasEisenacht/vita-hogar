import { siteConfig } from "@/config/site";
import {
  deliveryMethodLabels,
  getPaymentMethodLabel,
  getWhatsAppOrderUrl,
} from "@/config/checkout";
import { formatCurrency } from "@/lib/format-currency";
import { formatOrderDateTime } from "@/lib/orders/format-order-date";
import { buildPublicUrl } from "@/lib/site-url";
import type { OrderEmailPayload } from "@/lib/email/types";

type StatusTone = "blush" | "success" | "neutral";

type ButtonVariant = "primary" | "secondary";

const colors = {
  blush: "#fff3f7",
  border: "#f0d8e1",
  champagne: "#fffaf6",
  foreground: "#34272d",
  muted: "#765c66",
  mutedSoft: "#987582",
  primary: "#d89aac",
  primaryDark: "#9f5e78",
  success: "#7aa878",
  successSoft: "#edf7ee",
  surface: "#fffdfb",
} as const;

const buttonStyles: Record<ButtonVariant, string> = {
  primary: [
    "display:inline-block",
    "border-radius:999px",
    `background:${colors.primary}`,
    "color:#ffffff",
    "font-size:14px",
    "font-weight:700",
    "line-height:1",
    "padding:14px 22px",
    "text-decoration:none",
  ].join(";"),
  secondary: [
    "display:inline-block",
    "border-radius:999px",
    `background:${colors.blush}`,
    `border:1px solid ${colors.border}`,
    `color:${colors.primaryDark}`,
    "font-size:14px",
    "font-weight:700",
    "line-height:1",
    "padding:13px 20px",
    "text-decoration:none",
  ].join(";"),
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCustomerFirstName(value: string) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\p{L}\s'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

export function getCustomerGreeting(payload: OrderEmailPayload) {
  const firstName = normalizeCustomerFirstName(payload.customerFirstName);

  if (!firstName) {
    return "¡Gracias por tu compra!";
  }

  return `Hola ${firstName},`;
}

function getItemVariantParts(item: OrderEmailPayload["items"][number]) {
  return [
    item.selectedColor ? `Color: ${item.selectedColor}` : "",
    [item.variantBrand, item.variantModel].filter(Boolean).join(" "),
    item.selectedCompatibility ? `Compatible: ${item.selectedCompatibility}` : "",
  ].filter(Boolean);
}

function getAddressLine(payload: OrderEmailPayload) {
  const address = payload.shippingAddress;

  if (!address?.street) {
    return "";
  }

  return [
    `${address.street} ${address.number ?? ""}`.trim(),
    address.floorApartment,
    address.city,
    address.province,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function getLogoUrl() {
  return buildPublicUrl(siteConfig.logo.src, {
    fallbackOrigin: siteConfig.url,
  });
}

export function getWhatsAppSupportUrl(orderNumber: string) {
  return getWhatsAppOrderUrl(
    `Hola W.todocell, tengo una consulta sobre mi pedido ${orderNumber}.`,
  );
}

export function getInstagramUrl() {
  return siteConfig.instagram.url;
}

export function renderEmailButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: ButtonVariant;
}) {
  return `<a href="${escapeHtml(href)}" style="${buttonStyles[variant]}">${escapeHtml(label)}</a>`;
}

export function renderStatusBadge(label: string, tone: StatusTone = "blush") {
  const toneStyles: Record<StatusTone, string> = {
    blush: `background:${colors.blush};border:1px solid ${colors.border};color:${colors.primaryDark};`,
    neutral: "background:#fff8f3;border:1px solid #eadbd2;color:#8b6a5e;",
    success: `background:${colors.successSoft};border:1px solid #cfe7d2;color:#527d55;`,
  };

  return `
    <span style="display:inline-block;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.16em;line-height:1;padding:9px 12px;text-transform:uppercase;${toneStyles[tone]}">
      ${escapeHtml(label)}
    </span>
  `;
}

export function renderInfoPanel({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return `
    <td style="padding:8px;width:50%;vertical-align:top;">
      <div style="border:1px solid ${colors.border};border-radius:18px;background:#fff9f7;padding:14px 16px;">
        <p style="margin:0 0 5px;color:${colors.primaryDark};font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(label)}</p>
        <p style="margin:0;color:${colors.foreground};font-size:15px;font-weight:700;line-height:1.45;">${escapeHtml(value)}</p>
      </div>
    </td>
  `;
}

export function renderOrderItems(payload: OrderEmailPayload) {
  return payload.items
    .map((item) => {
      const variantParts = getItemVariantParts(item);

      return `
        <tr>
          <td style="padding:15px 0;border-bottom:1px solid ${colors.border};">
            <strong style="display:block;color:${colors.foreground};font-size:14px;line-height:1.45;">${escapeHtml(item.productName)}</strong>
            ${
              variantParts.length > 0
                ? `<span style="display:block;margin-top:4px;color:${colors.mutedSoft};font-size:12px;line-height:1.45;">${escapeHtml(variantParts.join(" · "))}</span>`
                : ""
            }
          </td>
          <td style="padding:15px 0;border-bottom:1px solid ${colors.border};text-align:center;color:${colors.muted};font-size:13px;font-weight:700;">${item.quantity}</td>
          <td style="padding:15px 0;border-bottom:1px solid ${colors.border};text-align:right;color:${colors.foreground};font-size:13px;font-weight:700;">${formatCurrency(item.unitPrice)}</td>
        </tr>
      `;
    })
    .join("");
}

export function renderTotals(payload: OrderEmailPayload) {
  const discountRow =
    payload.discountAmount > 0
      ? `
        <tr>
          <td style="padding:7px 0;color:${colors.muted};font-size:14px;">Descuento</td>
          <td style="padding:7px 0;text-align:right;color:${colors.foreground};font-size:14px;font-weight:700;">-${formatCurrency(payload.discountAmount)}</td>
        </tr>
      `
      : "";

  return `
    <table role="presentation" width="100%" style="margin-top:18px;border-collapse:collapse;">
      <tr>
        <td style="padding:7px 0;color:${colors.muted};font-size:14px;">Subtotal</td>
        <td style="padding:7px 0;text-align:right;color:${colors.foreground};font-size:14px;font-weight:700;">${formatCurrency(payload.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:7px 0;color:${colors.muted};font-size:14px;">Envio</td>
        <td style="padding:7px 0;text-align:right;color:${colors.foreground};font-size:14px;font-weight:700;">${
          payload.shippingCostStatus === "to_be_confirmed"
            ? "A coordinar"
            : formatCurrency(payload.shippingCost)
        }</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:15px 0 0;color:${colors.foreground};font-size:16px;font-weight:800;">Total</td>
        <td style="padding:15px 0 0;text-align:right;color:${colors.foreground};font-size:23px;font-weight:800;">${formatCurrency(payload.total)}</td>
      </tr>
    </table>
  `;
}

export function renderOrderSummaryCard(payload: OrderEmailPayload) {
  return `
    <div style="margin-top:24px;border:1px solid ${colors.border};border-radius:22px;background:${colors.champagne};padding:20px;">
      <p style="margin:0 0 12px;color:${colors.primaryDark};font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">Resumen del pedido</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left" style="padding-bottom:8px;color:${colors.primaryDark};font-size:11px;text-transform:uppercase;letter-spacing:0.12em;">Producto</th>
            <th align="center" style="padding-bottom:8px;color:${colors.primaryDark};font-size:11px;text-transform:uppercase;letter-spacing:0.12em;">Cant.</th>
            <th align="right" style="padding-bottom:8px;color:${colors.primaryDark};font-size:11px;text-transform:uppercase;letter-spacing:0.12em;">Precio</th>
          </tr>
        </thead>
        <tbody>${renderOrderItems(payload)}</tbody>
      </table>
      ${renderTotals(payload)}
    </div>
  `;
}

export function renderNextSteps(steps: string[]) {
  return `
    <div style="margin-top:22px;border-radius:22px;background:${colors.blush};padding:20px;">
      <p style="margin:0 0 12px;color:${colors.primaryDark};font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">Proximos pasos</p>
      <ol style="margin:0;padding-left:20px;color:${colors.muted};font-size:14px;line-height:1.75;">
        ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
    </div>
  `;
}

export function renderStatusTimeline({
  activeStep,
}: {
  activeStep: "received" | "paid" | "preparing" | "shipped" | "delivered";
}) {
  const steps = [
    { key: "received", label: "Pedido recibido" },
    { key: "paid", label: "Pago confirmado" },
    { key: "preparing", label: "Preparacion" },
    { key: "shipped", label: "Entrega" },
  ] as const;
  const activeIndex =
    activeStep === "delivered"
      ? steps.length - 1
      : steps.findIndex((step) => step.key === activeStep);

  return `
    <table role="presentation" width="100%" style="margin-top:22px;border-collapse:collapse;">
      <tr>
        ${steps
          .map((step, index) => {
            const completed = index <= activeIndex;
            const markerColor = completed ? colors.primary : "#ead8df";
            const textColor = completed ? colors.foreground : colors.mutedSoft;

            return `
              <td style="padding:0 4px;text-align:center;vertical-align:top;width:25%;">
                <div style="height:8px;border-radius:999px;background:${markerColor};"></div>
                <p style="margin:8px 0 0;color:${textColor};font-size:11px;font-weight:700;line-height:1.35;">${escapeHtml(step.label)}</p>
              </td>
            `;
          })
          .join("")}
      </tr>
    </table>
  `;
}

export function renderSupportBlock(payload: OrderEmailPayload) {
  const whatsappUrl = getWhatsAppSupportUrl(payload.orderNumber);

  return `
    <div style="margin-top:24px;border:1px solid ${colors.border};border-radius:22px;background:#fff9fb;padding:18px 20px;">
      <p style="margin:0 0 8px;color:${colors.foreground};font-size:15px;font-weight:800;">¿Tenes alguna duda?</p>
      <p style="margin:0 0 16px;color:${colors.muted};font-size:14px;line-height:1.65;">Escribinos por WhatsApp y te ayudamos con tu pedido.</p>
      ${renderEmailButton({
        href: whatsappUrl,
        label: "Hablar por WhatsApp",
        variant: "secondary",
      })}
    </div>
  `;
}

export function renderEmailShell({
  body,
  preview,
}: {
  body: string;
  preview: string;
}) {
  const logoUrl = getLogoUrl();

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
      </head>
      <body style="margin:0;background:#fff5f7;color:${colors.foreground};font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
        <table role="presentation" width="100%" style="border-collapse:collapse;background:linear-gradient(135deg,#fff5f7 0%,#fffaf6 45%,#fff0f5 100%);">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" style="max-width:640px;border-collapse:collapse;border-radius:30px;background:${colors.surface};border:1px solid ${colors.border};box-shadow:0 22px 58px rgba(172,105,132,0.14);overflow:hidden;">
                <tr>
                  <td style="padding:28px 28px 12px;background:#fffaf7;">
                    <table role="presentation" width="100%" style="border-collapse:collapse;">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="${escapeHtml(logoUrl)}" width="148" height="54" alt="${escapeHtml(siteConfig.logo.alt)}" style="display:block;border:0;max-width:148px;height:auto;">
                          <p style="margin:6px 0 0;color:${colors.primaryDark};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(siteConfig.name)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 28px 30px;">
                    ${body}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px 26px;border-top:1px solid ${colors.border};background:#fff9f7;color:${colors.muted};font-size:12px;line-height:1.65;">
                    <strong style="color:${colors.foreground};">${escapeHtml(siteConfig.name)}</strong><br>
                    Accesorios que combinan con tu estilo.<br>
                    ${escapeHtml(siteConfig.location.city)}, ${escapeHtml(siteConfig.location.province)}.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getOrderMetaLines(payload: OrderEmailPayload) {
  const addressLine = getAddressLine(payload);
  const deliveryLabel = deliveryMethodLabels[payload.deliveryMethod];

  return [
    `Pedido: ${payload.orderNumber}`,
    `Fecha: ${formatOrderDateTime(payload.createdAt)}`,
    payload.paidAt ? `Pago acreditado: ${formatOrderDateTime(payload.paidAt)}` : "",
    payload.shippedAt ? `Despacho: ${formatOrderDateTime(payload.shippedAt)}` : "",
    payload.deliveredAt ? `Entrega: ${formatOrderDateTime(payload.deliveredAt)}` : "",
    `Metodo de pago: ${getPaymentMethodLabel(payload.paymentMethod)}.`,
    `Entrega: ${deliveryLabel}.`,
    addressLine ? `Direccion: ${addressLine}.` : "",
  ].filter(Boolean);
}

export function renderOrderMetaGrid(payload: OrderEmailPayload) {
  const addressLine = getAddressLine(payload);
  const deliveryLabel = deliveryMethodLabels[payload.deliveryMethod];

  return `
    <table role="presentation" width="100%" style="margin:18px -8px 0;border-collapse:separate;border-spacing:0;">
      <tr>
        ${renderInfoPanel({ label: "Pedido", value: payload.orderNumber })}
        ${renderInfoPanel({
          label: "Fecha",
          value: formatOrderDateTime(payload.createdAt),
        })}
      </tr>
      <tr>
        ${renderInfoPanel({
          label: "Pago",
          value: getPaymentMethodLabel(payload.paymentMethod),
        })}
        ${renderInfoPanel({ label: "Entrega", value: deliveryLabel })}
      </tr>
      ${
        addressLine
          ? `<tr>${renderInfoPanel({ label: "Direccion", value: addressLine })}<td style="padding:8px;width:50%;"></td></tr>`
          : ""
      }
    </table>
  `;
}

export function renderTextOrderItems(payload: OrderEmailPayload) {
  return payload.items
    .map((item) => {
      const variantParts = getItemVariantParts(item);
      const variantText =
        variantParts.length > 0 ? ` (${variantParts.join(" - ")})` : "";

      return `- ${item.productName}${variantText} x${item.quantity}: ${formatCurrency(item.unitPrice)}`;
    })
    .join("\n");
}

export function renderTextTotals(payload: OrderEmailPayload) {
  return [
    `Subtotal: ${formatCurrency(payload.subtotal)}`,
    `Envio: ${
      payload.shippingCostStatus === "to_be_confirmed"
        ? "A coordinar"
        : formatCurrency(payload.shippingCost)
    }`,
    payload.discountAmount > 0
      ? `Descuento: -${formatCurrency(payload.discountAmount)}`
      : "",
    `Total: ${formatCurrency(payload.total)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderTextNextSteps(steps: string[]) {
  return steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
}
