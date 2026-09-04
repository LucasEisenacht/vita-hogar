import { formatCurrency } from "@/lib/format-currency";
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
  renderStatusTimeline,
  renderSupportBlock,
  renderTextNextSteps,
  renderTextOrderItems,
  renderTextTotals,
} from "@/lib/email/templates/shared";

const nextSteps = [
  "Prepararemos los productos.",
  "Revisaremos que este todo correcto.",
  "Nos comunicaremos para coordinar la entrega o envio.",
];

export function renderPaymentConfirmedEmail(
  payload: OrderEmailPayload,
): TransactionalEmail {
  const orderUrl = payload.confirmationUrl;
  const greeting = getCustomerGreeting(payload);
  const body = `
    ${renderStatusBadge("Pago confirmado", "success")}
    <h1 style="margin:18px 0 10px;color:#34272d;font-size:31px;line-height:1.12;font-weight:800;">¡Tu pago fue aprobado!</h1>
    <p style="margin:0;color:#765c66;font-size:15px;line-height:1.75;">
      ${escapeHtml(greeting)}
    </p>
    <p style="margin:8px 0 0;color:#765c66;font-size:15px;line-height:1.75;">
      Ya verificamos tu pago y comenzaremos a preparar el pedido.
    </p>
    <div style="margin-top:18px;border-radius:22px;background:#edf7ee;border:1px solid #cfe7d2;padding:18px 20px;">
      <p style="margin:0;color:#527d55;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">Total confirmado</p>
      <p style="margin:8px 0 0;color:#34272d;font-size:26px;font-weight:800;line-height:1;">${formatCurrency(payload.total)}</p>
    </div>
    ${renderOrderMetaGrid(payload)}
    ${renderStatusTimeline({ activeStep: "paid" })}
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
  `;

  return {
    html: renderEmailShell({
      body,
      preview: `Pago confirmado para el pedido ${payload.orderNumber}.`,
    }),
    subject: `Pago confirmado - pedido ${payload.orderNumber}`,
    text: [
      "W.todocell - Pago confirmado",
      greeting,
      `Ya verificamos tu pago y comenzaremos a preparar el pedido ${payload.orderNumber}.`,
      `Total confirmado: ${formatCurrency(payload.total)}`,
      getOrderMetaLines(payload).join("\n"),
      "Estado: Pedido recibido -> Pago confirmado -> Preparacion -> Entrega",
      renderTextOrderItems(payload),
      renderTextTotals(payload),
      "Proximos pasos:",
      renderTextNextSteps(nextSteps),
      orderUrl ? `Ver mi pedido: ${orderUrl}` : "",
      "¿Tenes alguna duda? Escribinos por WhatsApp.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
