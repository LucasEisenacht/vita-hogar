import "server-only";
import { createOrderConfirmationToken } from "@/lib/orders/confirmation-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPublicUrl } from "@/lib/site-url";
import { sendTransactionalEmail } from "@/lib/email/send-transactional-email";
import { renderOrderDeliveredEmail } from "@/lib/email/templates/order-delivered";
import { renderOrderReceivedEmail } from "@/lib/email/templates/order-received";
import { renderOrderShippedEmail } from "@/lib/email/templates/order-shipped";
import { renderPaymentConfirmedEmail } from "@/lib/email/templates/payment-confirmed";
import type {
  OrderEmailEventType,
  OrderEmailPayload,
  OrderEmailPayloadItem,
  OrderEmailStatus,
} from "@/lib/email/types";
import type { Json } from "@/types/database";

export const ORDER_EMAIL_OUTBOX_BATCH_SIZE = 10;
export const ORDER_EMAIL_OUTBOX_MUTATION_BATCH_SIZE = 3;

type ClaimedEmailRow = {
  attempts: number;
  id: string;
  order_id: string;
  event_type: OrderEmailEventType;
  next_attempt_at: string | null;
  provider_message_id: string | null;
  recipient_email: string;
  payload: Json;
};

class EmailSendError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "EmailSendError";
    this.retryable = retryable;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function parseEmailItem(value: unknown): OrderEmailPayloadItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const productName = getString(value.productName);
  const quantity = getNumber(value.quantity);
  const unitPrice = getNumber(value.unitPrice);
  const lineTotal = getNumber(value.lineTotal);

  if (!productName || !quantity || unitPrice === undefined || lineTotal === undefined) {
    return null;
  }

  return {
    lineTotal,
    productName,
    productSlug: getString(value.productSlug),
    quantity,
    selectedColor: getString(value.selectedColor),
    selectedCompatibility: getString(value.selectedCompatibility),
    unitPrice,
    variantBrand: getString(value.variantBrand),
    variantModel: getString(value.variantModel),
  };
}

function parsePayload(payload: unknown): OrderEmailPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  const items = Array.isArray(payload.items)
    ? payload.items.map(parseEmailItem).filter((item) => item !== null)
    : [];
  const eventType = getString(payload.eventType);
  const buyerType = getString(payload.buyerType);
  const orderId = getString(payload.orderId);
  const orderNumber = getString(payload.orderNumber);
  const customerEmail = getString(payload.customerEmail);
  const customerFirstName = getString(payload.customerFirstName);
  const customerLastName = getString(payload.customerLastName);
  const deliveryMethod = getString(payload.deliveryMethod);
  const paymentMethod = getString(payload.paymentMethod);
  const paymentStatus = getString(payload.paymentStatus);
  const shippingCostStatus = getString(payload.shippingCostStatus);
  const subtotal = getNumber(payload.subtotal);
  const discountAmount = getNumber(payload.discountAmount);
  const shippingCost = getNumber(payload.shippingCost);
  const total = getNumber(payload.total);
  const createdAt = getString(payload.createdAt);

  if (
    (eventType !== "order_delivered" &&
      eventType !== "order_received" &&
      eventType !== "order_shipped" &&
      eventType !== "payment_confirmed") ||
    (buyerType !== "guest" && buyerType !== "registered") ||
    !orderId ||
    !orderNumber ||
    !customerEmail ||
    customerFirstName === undefined ||
    customerLastName === undefined ||
    (deliveryMethod !== "pickup" &&
      deliveryMethod !== "amba_courier" &&
      deliveryMethod !== "nationwide_shipping") ||
    paymentMethod !== "bank_transfer" ||
    (paymentStatus !== "pending" &&
      paymentStatus !== "approved" &&
      paymentStatus !== "rejected" &&
      paymentStatus !== "refunded" &&
      paymentStatus !== "cancelled") ||
    (shippingCostStatus !== "fixed" &&
      shippingCostStatus !== "to_be_confirmed") ||
    subtotal === undefined ||
    discountAmount === undefined ||
    shippingCost === undefined ||
    total === undefined ||
    !createdAt ||
    items.length === 0
  ) {
    return null;
  }

  return {
    buyerType,
    createdAt,
    currency: "ARS",
    customerEmail,
    customerFirstName,
    customerLastName,
    deliveredAt: getString(payload.deliveredAt),
    deliveryMethod,
    discountAmount,
    eventType,
    items,
    orderId,
    orderNumber,
    paidAt: getString(payload.paidAt),
    paymentMethod,
    paymentStatus,
    shippingAddress: isRecord(payload.shippingAddress)
      ? {
          city: getString(payload.shippingAddress.city),
          floorApartment: getString(payload.shippingAddress.floorApartment),
          number: getString(payload.shippingAddress.number),
          postalCode: getString(payload.shippingAddress.postalCode),
          province: getString(payload.shippingAddress.province),
          references: getString(payload.shippingAddress.references),
          street: getString(payload.shippingAddress.street),
        }
      : undefined,
    shippingCost,
    shippingCostStatus,
    shippedAt: getString(payload.shippedAt),
    status:
      payload.status === "pending_payment" ||
      payload.status === "payment_confirmed" ||
      payload.status === "preparing" ||
      payload.status === "ready" ||
      payload.status === "shipped" ||
      payload.status === "delivered" ||
      payload.status === "cancelled"
        ? payload.status
        : undefined,
    subtotal,
    total,
  };
}

function getEmailTemplate(payload: OrderEmailPayload) {
  if (payload.eventType === "order_delivered") {
    return renderOrderDeliveredEmail(payload);
  }

  if (payload.eventType === "order_shipped") {
    return renderOrderShippedEmail(payload);
  }

  if (payload.eventType === "payment_confirmed") {
    return renderPaymentConfirmedEmail(payload);
  }

  return renderOrderReceivedEmail(payload);
}

function sanitizeLastError(error: string) {
  return error.replace(/[\r\n]+/g, " ").slice(0, 240);
}

function logOrderEmail(
  message: string,
  metadata: Record<string, string | number | boolean | null | undefined> = {},
) {
  console.info("[order-email-outbox]", message, metadata);
}

function getNextAttemptAt(attempts: number, retryable: boolean) {
  if (!retryable || attempts >= 5) {
    return null;
  }

  const delayMinutesByAttempt: Record<number, number> = {
    1: 1,
    2: 5,
    3: 15,
    4: 60,
  };
  const delayMinutes = delayMinutesByAttempt[attempts];

  if (!delayMinutes) {
    return null;
  }

  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

async function getConfirmationUrl({
  buyerType,
  idempotencyKey,
  orderId,
  orderNumber,
  secretVersion,
}: {
  buyerType: "guest" | "registered";
  idempotencyKey?: string | null;
  orderId: string;
  orderNumber: string;
  secretVersion?: number | null;
}) {
  if (buyerType === "registered") {
    return buildPublicUrl(`/mi-cuenta/pedidos/${encodeURIComponent(orderId)}`);
  }

  if (!idempotencyKey) {
    throw new Error("missing_idempotency_key");
  }

  if (!secretVersion) {
    throw new Error("missing_confirmation_token_secret_version");
  }

  const token = createOrderConfirmationToken({
    idempotencyKey,
    secretVersion,
  });

  return buildPublicUrl(`/checkout/confirmacion/${encodeURIComponent(
    orderNumber,
  )}?token=${encodeURIComponent(token)}`);
}

export async function processOrderEmailOutbox(
  batchSize = 10,
  source = "manual",
) {
  logOrderEmail("batch_started", { batchSize, source });
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("claim_order_email_outbox", {
    batch_size: batchSize,
  });

  if (error) {
    logOrderEmail("claim_failed", {
      code: error.code,
      source,
    });
    throw new Error("email_outbox_claim_failed");
  }

  const rows = (data ?? []) as ClaimedEmailRow[];
  const results: Array<{ id: string; status: OrderEmailStatus }> = [];
  logOrderEmail("batch_claimed", {
    claimed: rows.length,
    source,
  });

  for (const row of rows) {
    const payload = parsePayload(row.payload);
    logOrderEmail("row_processing", {
      attempts: row.attempts,
      eventType: row.event_type,
      orderId: row.order_id,
      outboxId: row.id,
      source,
    });

    try {
      if (!payload) {
        throw new Error("invalid_email_payload");
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, idempotency_key, confirmation_token_secret_version")
        .eq("id", row.order_id)
        .maybeSingle();

      if (orderError || !order) {
        throw new Error("order_context_not_found");
      }

      logOrderEmail("send_attempt", {
        eventType: payload.eventType,
        orderId: row.order_id,
        outboxId: row.id,
        source,
      });
      const confirmationUrl = await getConfirmationUrl({
        buyerType: payload.buyerType,
        idempotencyKey: order.idempotency_key,
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        secretVersion: order.confirmation_token_secret_version,
      });
      const email = getEmailTemplate({
        ...payload,
        confirmationUrl,
      });
      const sendResult = await sendTransactionalEmail({
        ...email,
        eventType: payload.eventType,
        idempotencyKey: row.id,
        to: row.recipient_email,
      });

      if (!sendResult.ok) {
        throw new EmailSendError(sendResult.error, sendResult.retryable);
      }

      logOrderEmail("send_success", {
        eventType: payload.eventType,
        hasProviderMessageId: Boolean(sendResult.providerMessageId),
        orderId: row.order_id,
        outboxId: row.id,
        source,
      });
      await supabase
        .from("order_email_outbox")
        .update({
          last_error: null,
          next_attempt_at: null,
          provider_message_id: sendResult.providerMessageId ?? null,
          sent_at: new Date().toISOString(),
          status: "sent",
        })
        .eq("id", row.id)
        .eq("status", "processing");
      results.push({ id: row.id, status: "sent" });
      logOrderEmail("row_finalized", {
        eventType: payload.eventType,
        orderId: row.order_id,
        outboxId: row.id,
        source,
        status: "sent",
      });
    } catch (error) {
      const lastError = sanitizeLastError(
        error instanceof Error ? error.message : "email_send_failed",
      );
      const retryable =
        error instanceof EmailSendError
          ? error.retryable
          : ![
              "email_provider_not_configured",
              "invalid_email_provider_response",
              "invalid_email_provider_timeout",
              "invalid_email_content",
              "invalid_email_subject",
              "invalid_email_idempotency_key",
              "invalid_from_email",
              "invalid_from_name",
              "invalid_recipient_email",
              "invalid_reply_to_email",
            ].includes(lastError);
      const nextAttemptAt = getNextAttemptAt(row.attempts, retryable);
      await supabase
        .from("order_email_outbox")
        .update({
          attempts: retryable ? row.attempts : 5,
          last_error: lastError,
          next_attempt_at: nextAttemptAt,
          status: "failed",
        })
        .eq("id", row.id)
        .eq("status", "processing");
      results.push({ id: row.id, status: "failed" });
      logOrderEmail("row_finalized", {
        error: lastError,
        eventType: row.event_type,
        orderId: row.order_id,
        outboxId: row.id,
        source,
        status: "failed",
      });
    }
  }

  logOrderEmail("batch_finished", {
    processed: results.length,
    source,
  });

  return {
    processed: results.length,
    results,
  };
}

export async function processOrderEmailOutboxBatch(source = "manual") {
  return processOrderEmailOutbox(ORDER_EMAIL_OUTBOX_BATCH_SIZE, source);
}

export async function processOrderEmailOutboxMutationBatch(source = "mutation") {
  return processOrderEmailOutbox(ORDER_EMAIL_OUTBOX_MUTATION_BATCH_SIZE, source);
}
