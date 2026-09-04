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
  "Tu pedido ya salio de W.todocell.",
  "Te vamos a acompanar si necesitas coordinar algun detalle.",
  "Guardaremos el historial del pedido para cualquier consulta.",
];

export function renderOrderShippedEmail(
  payload: OrderEmailPayload,
): TransactionalEmail {
  const orderUrl = payload.confirmationUrl;
  const greeting = getCustomerGreeting(payload);
  const body = `
    ${renderStatusBadge("Pedido despachado")}
    <h1 style="margin:18px 0 10px;color:#34272d;font-size:31px;line-height:1.12;font-weight:800;">Tu pedido fue despachado</h1>
    <p style="margin:0;color:#765c66;font-size:15px;line-height:1.75;">
      ${escapeHtml(greeting)}
    </p>
    <p style="margin:8px 0 0;color:#765c66;font-size:15px;line-height:1.75;">
      El pedido ${escapeHtml(payload.orderNumber)} ya esta en camino o listo para coordinar segun el metodo de entrega elegido.
    </p>
    ${renderOrderMetaGrid(payload)}
    ${renderStatusTimeline({ activeStep: "shipped" })}
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
      preview: `Tu pedido ${payload.orderNumber} fue despachado.`,
    }),
    subject: `Tu pedido ${payload.orderNumber} fue despachado`,
    text: [
      "W.todocell - Pedido despachado",
      greeting,
      `El pedido ${payload.orderNumber} ya esta en camino o listo para coordinar segun el metodo de entrega elegido.`,
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
