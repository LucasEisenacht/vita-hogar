import { siteConfig } from "@/config/site";
import type {
  OrderEmailPayload,
  TransactionalEmail,
} from "@/lib/email/types";
import {
  escapeHtml,
  getCustomerGreeting,
  getInstagramUrl,
  getOrderMetaLines,
  renderEmailButton,
  renderEmailShell,
  renderOrderMetaGrid,
  renderOrderSummaryCard,
  renderStatusBadge,
  renderStatusTimeline,
  renderSupportBlock,
  renderTextOrderItems,
  renderTextTotals,
} from "@/lib/email/templates/shared";

export function renderOrderDeliveredEmail(
  payload: OrderEmailPayload,
): TransactionalEmail {
  const orderUrl = payload.confirmationUrl;
  const greeting = getCustomerGreeting(payload);
  const instagramUrl = getInstagramUrl();
  const body = `
    ${renderStatusBadge("Pedido entregado", "success")}
    <h1 style="margin:18px 0 10px;color:#34272d;font-size:31px;line-height:1.12;font-weight:800;">¡Tu pedido fue entregado!</h1>
    <p style="margin:0;color:#765c66;font-size:15px;line-height:1.75;">
      ${escapeHtml(greeting)}
    </p>
    <p style="margin:8px 0 0;color:#765c66;font-size:15px;line-height:1.75;">
      Gracias por elegir W.todocell. Esperamos que disfrutes tu pedido ${escapeHtml(payload.orderNumber)}.
    </p>
    ${renderOrderMetaGrid(payload)}
    ${renderStatusTimeline({ activeStep: "delivered" })}
    ${renderOrderSummaryCard(payload)}
    ${
      orderUrl
        ? `<p style="margin:26px 0 0;">${renderEmailButton({
            href: orderUrl,
            label: "Ver mi pedido",
          })}</p>`
        : ""
    }
    <div style="margin-top:20px;border-radius:22px;background:#fff3f7;border:1px solid #f0d8e1;padding:18px 20px;">
      <p style="margin:0 0 8px;color:#34272d;font-size:15px;font-weight:800;">Seguinos en Instagram</p>
      <p style="margin:0 0 16px;color:#765c66;font-size:14px;line-height:1.65;">Compartimos novedades, colecciones y favoritos seleccionados.</p>
      ${renderEmailButton({
        href: instagramUrl,
        label: `Ver ${siteConfig.instagram.handle}`,
        variant: "secondary",
      })}
    </div>
    ${renderSupportBlock(payload)}
    <p style="margin:24px 0 0;color:#987582;font-size:14px;line-height:1.7;">
      Gracias por elegir W.todocell.
    </p>
  `;

  return {
    html: renderEmailShell({
      body,
      preview: `Tu pedido ${payload.orderNumber} fue entregado.`,
    }),
    subject: `¡Tu pedido ${payload.orderNumber} fue entregado!`,
    text: [
      "W.todocell - Pedido entregado",
      greeting,
      `Gracias por elegir W.todocell. Esperamos que disfrutes tu pedido ${payload.orderNumber}.`,
      getOrderMetaLines(payload).join("\n"),
      "Estado: Pedido recibido -> Pago confirmado -> Preparacion -> Entrega completada",
      renderTextOrderItems(payload),
      renderTextTotals(payload),
      orderUrl ? `Ver mi pedido: ${orderUrl}` : "",
      `Instagram: ${instagramUrl}`,
      "Si tenes cualquier inconveniente, escribinos por WhatsApp.",
      "Gracias por elegir W.todocell.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
