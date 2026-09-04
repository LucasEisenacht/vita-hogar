import { siteConfig } from "@/config/site";

export type DeliveryMethodCode =
  | "pickup"
  | "amba_courier"
  | "nationwide_shipping";

export type PaymentMethodCode = "bank_transfer";

export type ShippingCostStatus = "fixed" | "to_be_confirmed";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled";

export type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "preparing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

export type DeliveryMethodConfig = {
  code: DeliveryMethodCode;
  cost: number;
  costStatus: ShippingCostStatus;
  description: string;
  label: string;
  requiresAddress: boolean;
  requiresPostalCode: boolean;
  requiresProvince: boolean;
};

export const deliveryMethods: Array<DeliveryMethodConfig> = [
  {
    code: "pickup",
    cost: 0,
    costStatus: "fixed",
    description: "Coordinamos punto y horario por WhatsApp.",
    label: "Retiro coordinado",
    requiresAddress: false,
    requiresPostalCode: false,
    requiresProvince: false,
  },
  {
    code: "amba_courier",
    cost: 5000,
    costStatus: "fixed",
    description: "Motomensajeria para CABA y zonas cercanas de AMBA.",
    label: "Motomensajeria AMBA",
    requiresAddress: true,
    requiresPostalCode: true,
    requiresProvince: false,
  },
  {
    code: "nationwide_shipping",
    cost: 0,
    costStatus: "to_be_confirmed",
    description: "Despachamos a todo el pais con costo a coordinar.",
    label: "Envio a todo el pais",
    requiresAddress: true,
    requiresPostalCode: true,
    requiresProvince: true,
  },
];

export const paymentMethods = [
  {
    code: "bank_transfer",
    description:
      "El pedido queda pendiente hasta acreditar el pago. Te mostramos los pasos al confirmar.",
    label: "Transferencia bancaria",
  },
] satisfies Array<{
  code: PaymentMethodCode;
  description: string;
  label: string;
}>;

export const orderStatuses: Array<OrderStatus> = [
  "pending_payment",
  "payment_confirmed",
  "preparing",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

export const orderStatusLabels: Record<OrderStatus, string> = {
  cancelled: "Cancelado",
  delivered: "Entregado",
  payment_confirmed: "Pago confirmado",
  pending_payment: "Pendiente de pago",
  preparing: "En preparacion",
  ready: "Listo para entregar",
  shipped: "Enviado",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  approved: "Pago acreditado",
  cancelled: "Pago cancelado",
  pending: "Pago pendiente",
  refunded: "Pago reintegrado",
  rejected: "Pago rechazado",
};

export const deliveryMethodLabels: Record<DeliveryMethodCode, string> =
  deliveryMethods.reduce(
    (labels, method) => ({
      ...labels,
      [method.code]: method.label,
    }),
    {} as Record<DeliveryMethodCode, string>,
  );

export const bankTransferConfig = {
  instructions:
    "Los datos de transferencia se comparten por WhatsApp para esta primera version. No hay CBU, alias ni titular hardcodeados en el cliente.",
  isConfigured: false,
  label: "Transferencia bancaria",
} as const;

export const checkoutHelpText = {
  accountHint:
    "Ya tenes cuenta? Inicia sesion para completar tus datos y consultar el pedido despues.",
  confirmationIntro:
    "Recibimos tu pedido. El equipo de W.todocell va a revisar el pago y coordinar la entrega por WhatsApp.",
  whatsappCta: "Enviar comprobante por WhatsApp",
} as const;

export function getDeliveryMethodConfig(code: DeliveryMethodCode) {
  return deliveryMethods.find((method) => method.code === code);
}

export function getPaymentMethodLabel(code: PaymentMethodCode) {
  return paymentMethods.find((method) => method.code === code)?.label ?? code;
}

export function getWhatsAppOrderUrl(message: string) {
  return `${siteConfig.whatsapp.url}?text=${encodeURIComponent(message)}`;
}
