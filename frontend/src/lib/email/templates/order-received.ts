import type {
  OrderEmailPayload,
  TransactionalEmail,
} from "@/lib/email/types";
import {
  escapeHtml,
  getCustomerGreeting,
  getOrderMetaLines,
  renderEmailButton,
  renderEmailShell,
  renderNextSteps,
  renderOrderMetaGrid,
  renderOrderSummaryCard,
  renderStatusBadge,
  renderSupportBlock,
  renderTextNextSteps,
  renderTextOrderItems,
  renderTextTotals,
} from "@/lib/email/templates/shared";

const nextSteps = [
  "Revisaremos el comprobante.",
  "Confirmaremos el pago.",
  "Prepararemos el pedido.",
  "Te contactaremos para coordinar la entrega.",
];

export function renderOrderReceivedEmail(
  payload: OrderEmailPayload,
): TransactionalEmail {
  const orderUrl = payload.confirmationUrl;
  const greeting = getCustomerGreeting(payload);
  const body = `
    ${renderStatusBadge("Pedido recibido")}
    <h1 style="margin:18px 0 10px;color:#34272d;font-size:31px;line-height:1.12;font-weight:800;">¡Gracias por tu compra!</h1>
    <p style="margin:0;color:#765c66;font-size:15px;line-height:1.75;">
      ${escapeHtml(greeting)}
    </p>
    <p style="margin:8px 0 0;color:#765c66;font-size:15px;line-height:1.75;">
      Recibimos tu pedido y quedo pendiente mientras verificamos el pago.
    </p>
    ${renderOrderMetaGrid(payload)}
    ${renderOrderSummaryCard(payload)}
    ${renderNextSteps(nextSteps)}
    ${
      orderUrl
        ? `<p style="margin:26px 0 0;">${renderEmailButton({
            href: orderUrl,
            label: "Ver mi pedido",
          })}</p>`
        : ""
    }
    ${renderSupportBlock(payload)}
    <p style="margin:24px 0 0;color:#987582;font-size:14px;line-height:1.7;">
      Te enviaremos otro correo cuando el pago este confirmado.
    </p>
  `;

  return {
    html: renderEmailShell({
      body,
      preview: `Recibimos tu pedido ${payload.orderNumber}.`,
    }),
    subject: `¡Recibimos tu pedido ${payload.orderNumber}!`,
    text: [
      `W.todocell - Pedido recibido`,
      greeting,
      `Recibimos tu pedido ${payload.orderNumber} y quedo pendiente mientras verificamos el pago.`,
      getOrderMetaLines(payload).join("\n"),
      renderTextOrderItems(payload),
      renderTextTotals(payload),
      "Proximos pasos:",
      renderTextNextSteps(nextSteps),
      orderUrl ? `Ver mi pedido: ${orderUrl}` : "",
      "¿Tenes alguna duda? Escribinos por WhatsApp.",
      "Te enviaremos otro correo cuando el pago este confirmado.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
