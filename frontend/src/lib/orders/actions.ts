"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  processOrderEmailOutboxBatch,
  processOrderEmailOutboxMutationBatch,
} from "@/lib/email/order-email-processor";
import {
  createOrderConfirmationToken,
  getCurrentOrderConfirmationTokenSecretVersion,
} from "@/lib/orders/confirmation-token";
import { createClient } from "@/lib/supabase/server";
import { isOrderStatus } from "@/lib/orders/status";
import { normalizeCreateOrderInput } from "@/lib/orders/validation";
import { checkSensitiveActionRateLimit } from "@/lib/security/sensitive-action-rate-limit";
import type {
  CreateOrderInput,
  CreateOrderResult,
  CreatedOrderItem,
  OrderEmailRetryActionState,
  OrderStatusActionState,
} from "@/lib/orders/types";
import type {
  PaymentStatus,
  ProductAvailabilityType,
  ProductCondition,
  ShippingCostStatus,
} from "@/types/database";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function getProductAvailabilityType(
  value: unknown,
): ProductAvailabilityType | undefined {
  return value === "in_stock" || value === "made_to_order" ? value : undefined;
}

function getProductCondition(value: unknown): ProductCondition | undefined {
  return value === "new" || value === "used" || value === "refurbished"
    ? value
    : undefined;
}

function getPaymentStatus(value: unknown): PaymentStatus | undefined {
  return value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "refunded" ||
    value === "cancelled"
    ? value
    : undefined;
}

function getShippingCostStatus(
  value: unknown,
): ShippingCostStatus | undefined {
  return value === "fixed" || value === "to_be_confirmed" ? value : undefined;
}

function parseCreatedOrderItem(value: unknown): CreatedOrderItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const productId = getString(value.productId);
  const productName = getString(value.productName);
  const quantity = getNumber(value.quantity);
  const unitPrice = getNumber(value.unitPrice);
  const lineTotal = getNumber(value.lineTotal);
  const availabilityType =
    getProductAvailabilityType(value.availabilityType) ?? "in_stock";

  if (!productId || !productName || !quantity || unitPrice === undefined || lineTotal === undefined) {
    return null;
  }

  return {
    availabilityType,
    lineTotal,
    productCondition: getProductCondition(value.productCondition),
    productId,
    productName,
    productSlug: getString(value.productSlug),
    quantity,
    selectedColor: getString(value.selectedColor),
    selectedCompatibility: getString(value.selectedCompatibility),
    unitPrice,
    variantBrand: getString(value.variantBrand),
    variantId: getString(value.variantId),
    variantModel: getString(value.variantModel),
  };
}

function parseCreateOrderResponse(value: unknown): CreateOrderResult {
  if (!isRecord(value)) {
    return {
      message: "No pudimos registrar el pedido. Intenta nuevamente.",
      success: false,
    };
  }

  const id = getString(value.id);
  const orderNumber = getString(value.orderNumber);
  const confirmationToken = getString(value.confirmationToken);
  const status = getString(value.status);
  const subtotal = getNumber(value.subtotal);
  const shippingCost = getNumber(value.shippingCost);
  const shippingCostStatus = getShippingCostStatus(value.shippingCostStatus);
  const paymentStatus = getPaymentStatus(value.paymentStatus);
  const total = getNumber(value.total);
  const itemsValue = Array.isArray(value.items) ? value.items : [];
  const items = itemsValue
    .map(parseCreatedOrderItem)
    .filter((item): item is CreatedOrderItem => item !== null);

  if (
    !id ||
    !orderNumber ||
    !confirmationToken ||
    !status ||
    !isOrderStatus(status) ||
    subtotal === undefined ||
    shippingCost === undefined ||
    !shippingCostStatus ||
    !paymentStatus ||
    total === undefined ||
    items.length === 0
  ) {
    return {
      message: "No pudimos registrar el pedido. Intenta nuevamente.",
      success: false,
    };
  }

  return {
    confirmationToken,
    currency: "ARS",
    id,
    items,
    orderNumber,
    paymentStatus,
    shippingCost,
    shippingCostStatus,
    status,
    subtotal,
    success: true,
    total,
  };
}

function getOrderErrorMessage(message?: string) {
  if (message?.includes("idempotency_key_conflict")) {
    return "No pudimos confirmar este pedido por seguridad. Actualiza la pagina e intenta nuevamente.";
  }

  if (message?.includes("empty_cart")) {
    return "Tu carrito esta vacio.";
  }

  if (message?.includes("price_changed")) {
    return "El precio de un producto cambio. Actualiza el carrito y revisa el total.";
  }

  if (message?.includes("missing_client_price")) {
    return "Necesitamos actualizar el carrito antes de confirmar el pedido.";
  }

  if (message?.includes("product_unavailable")) {
    return "Uno de los productos ya no esta disponible.";
  }

  if (message?.includes("insufficient_stock")) {
    return "No hay stock suficiente de uno de los productos.";
  }

  if (message?.includes("variant_unavailable")) {
    return "Uno de los modelos seleccionados ya no esta disponible.";
  }

  if (message?.includes("invalid_delivery_method")) {
    return "Selecciona un metodo de envio valido.";
  }

  if (message?.includes("invalid_shipping_address")) {
    return "Completa la direccion de entrega para continuar.";
  }

  return "No pudimos registrar el pedido. Intenta nuevamente.";
}

function logOrderConfirmationTokenError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.replace(/[\r\n]+/g, " ").slice(0, 180)
      : "order_confirmation_token_configuration_error";

  console.error("[createOrderConfirmationToken]", message);
}

function logOrderEmailOutboxError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.replace(/[\r\n]+/g, " ").slice(0, 180)
      : "order_email_outbox_processor_error";

  console.error("[createOrderEmailOutboxAfter]", message);
}

async function processOrderEmailOutboxAfterMutation(source: string) {
  try {
    await processOrderEmailOutboxMutationBatch(`${source}:inline`);
  } catch (error) {
    logOrderEmailOutboxError(error);
  }

  after(async () => {
    try {
      await processOrderEmailOutboxBatch(`${source}:after`);
    } catch (error) {
      logOrderEmailOutboxError(error);
    }
  });
}

async function userOwnsSavedAddress(addressId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_addresses")
    .select("id")
    .eq("id", addressId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && Boolean(data);
}

async function saveCheckoutAddressIfRequested({
  input,
  userId,
}: {
  input: CreateOrderInput;
  userId: string;
}) {
  if (
    !input.saveShippingAddress ||
    input.savedAddressId ||
    input.deliveryMethod === "pickup" ||
    !input.shippingAddress?.street ||
    !input.shippingAddress.streetNumber ||
    !input.shippingAddress.city ||
    !input.shippingAddress.province ||
    !input.shippingAddress.postalCode
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("user_addresses").insert({
    floor_apartment: input.shippingAddress.apartment ?? null,
    is_default: Boolean(input.saveShippingAddressAsDefault),
    label: "Checkout",
    locality: input.shippingAddress.city,
    municipality: null,
    phone: input.customerPhone,
    postal_code: input.shippingAddress.postalCode,
    province: input.shippingAddress.province,
    recipient_name: `${input.customerFirstName} ${input.customerLastName}`,
    reference: input.shippingAddress.reference ?? null,
    street: input.shippingAddress.street,
    street_number: input.shippingAddress.streetNumber,
    user_id: userId,
  });
}

function getOrderStatusErrorMessage(code?: string) {
  if (code === "cancelled_locked") {
    return "Un pedido cancelado no puede reactivarse desde el panel.";
  }

  if (code === "invalid_status") {
    return "Selecciona un estado valido.";
  }

  if (code === "invalid_transition") {
    return "Esa transicion de estado no esta permitida.";
  }

  if (code === "not_allowed") {
    return "No tenes permisos para actualizar pedidos.";
  }

  if (code === "order_not_found") {
    return "No pudimos encontrar el pedido.";
  }

  return "No pudimos actualizar el estado del pedido.";
}

function parseOrderStatusUpdateResult(value: unknown) {
  if (!isRecord(value)) {
    return {
      code: "invalid_response",
      success: false,
    };
  }

  return {
    changed: getBoolean(value.changed) ?? false,
    code: getString(value.code),
    restoredStock: getNumber(value.restoredStock) ?? 0,
    success: getBoolean(value.success) ?? false,
  };
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const normalizedInput = normalizeCreateOrderInput(input);

  if ("message" in normalizedInput) {
    return {
      message: normalizedInput.message,
      success: false,
    };
  }

  let confirmationToken: string;
  let confirmationTokenSecretVersion: number;

  try {
    confirmationTokenSecretVersion =
      getCurrentOrderConfirmationTokenSecretVersion();
    confirmationToken = createOrderConfirmationToken({
      idempotencyKey: normalizedInput.idempotencyKey,
      secretVersion: confirmationTokenSecretVersion,
    });
  } catch (error) {
    logOrderConfirmationTokenError(error);

    return {
      message:
        "No pudimos preparar la confirmacion del pedido. Intenta nuevamente en unos minutos.",
      success: false,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const customerEmail = user?.email
    ? user.email.trim().toLowerCase()
    : normalizedInput.customerEmail;

  if (!customerEmail) {
    return {
      message: "No pudimos validar el email del pedido.",
      success: false,
    };
  }

  if (normalizedInput.savedAddressId) {
    if (!user) {
      return {
        message: "Inicia sesion para usar una direccion guardada.",
        success: false,
      };
    }

    const ownsAddress = await userOwnsSavedAddress(
      normalizedInput.savedAddressId,
      user.id,
    );

    if (!ownsAddress) {
      return {
        message: "Selecciona una direccion guardada valida.",
        success: false,
      };
    }
  }

  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user?.id ?? customerEmail,
    keyPrefix: "checkout-create-order",
    limit: 8,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      message:
        "Detectamos demasiados intentos de compra. Espera unos minutos e intenta nuevamente.",
      success: false,
    };
  }

  const { data, error } = await supabase.rpc("create_order", {
    order_payload: {
      ...normalizedInput,
      confirmationToken,
      confirmationTokenSecretVersion,
      customerEmail,
    },
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createOrder]", error);
    }

    return {
      message: getOrderErrorMessage(error.message),
      success: false,
    };
  }

  const result = parseCreateOrderResponse(data);

  if (result.success) {
    if (user) {
      await saveCheckoutAddressIfRequested({
        input: normalizedInput,
        userId: user.id,
      });
    }

    revalidatePath("/mi-cuenta");
    revalidatePath("/mi-cuenta/direcciones");
    revalidatePath("/mi-cuenta/pedidos");
    revalidatePath("/admin/pedidos");
    await processOrderEmailOutboxAfterMutation("create-order");
  }

  return result;
}

export async function updateOrderStatusAction(
  _previousState: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  const { user } = await requireAdmin();
  const orderId = formData.get("orderId");
  const status = formData.get("status");
  const note = formData.get("note");
  const confirmCancellation = formData.get("confirmCancellation");

  if (typeof orderId !== "string" || typeof status !== "string") {
    return {
      message: "No pudimos actualizar el estado del pedido.",
      status: "error",
    };
  }

  if (!isOrderStatus(status)) {
    return {
      message: "Selecciona un estado valido.",
      status: "error",
    };
  }

  if (status === "cancelled" && confirmCancellation !== "true") {
    return {
      message:
        "Confirma que queres cancelar el pedido y reponer el stock inmediato.",
      status: "error",
    };
  }

  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user.id,
    keyPrefix: "admin-order-status",
    limit: 30,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      message:
        "Hay demasiados cambios de estado recientes. Espera unos minutos e intenta nuevamente.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_order_status", {
    new_status_value: status,
    note_value: typeof note === "string" ? note : null,
    order_id_value: orderId,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[updateOrderStatusAction]", error);
    }

    return {
      message: getOrderStatusErrorMessage(error.message),
      status: "error",
    };
  }

  const result = parseOrderStatusUpdateResult(data);

  if (!result.success) {
    return {
      message: getOrderStatusErrorMessage(result.code),
      status: "error",
    };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/mi-cuenta/pedidos");
  revalidatePath("/mi-cuenta");
  await processOrderEmailOutboxAfterMutation("update-order-status");

  if (!result.changed) {
    return {
      message: "El pedido ya estaba en ese estado.",
      status: "success",
    };
  }

  if (status === "cancelled") {
    return {
      message:
        result.restoredStock > 0
          ? `Pedido cancelado. Se repusieron ${result.restoredStock} unidades de stock inmediato.`
          : "Pedido cancelado. No habia stock inmediato para reponer.",
      restoredStock: result.restoredStock,
      status: "success",
    };
  }

  return {
    message: "Estado del pedido actualizado correctamente.",
    status: "success",
  };
}

export async function retryOrderEmailsAction(
  _previousState: OrderEmailRetryActionState,
  formData: FormData,
): Promise<OrderEmailRetryActionState> {
  const { user } = await requireAdmin();
  const orderId = formData.get("orderId");

  if (typeof orderId !== "string" || !orderId) {
    return {
      message: "No pudimos identificar el pedido.",
      status: "error",
    };
  }

  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user.id,
    keyPrefix: "admin-order-email-retry",
    limit: 12,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      message:
        "Hay demasiados reintentos de email recientes. Espera unos minutos e intenta nuevamente.",
      status: "error",
    };
  }

  let resetError: unknown;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("order_email_outbox")
      .update({
        last_error: null,
        next_attempt_at: null,
        status: "pending",
      })
      .eq("order_id", orderId)
      .neq("status", "sent");
    resetError = error;
  } catch (error) {
    resetError = error;
  }

  if (resetError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[retryOrderEmailsAction]", resetError);
    }

    return {
      message: "No pudimos preparar el reintento de emails.",
      status: "error",
    };
  }

  try {
    const result = await processOrderEmailOutboxMutationBatch("admin-retry");
    revalidatePath(`/admin/pedidos/${orderId}`);
    revalidatePath("/admin/pedidos");

    return {
      message:
        result.processed > 0
          ? `Procesamos ${result.processed} email(s) del outbox.`
          : "No habia emails pendientes para procesar.",
      processed: result.processed,
      status: "success",
    };
  } catch (error) {
    logOrderEmailOutboxError(error);

    return {
      message: "No pudimos procesar el outbox. Revisá los logs del servidor.",
      status: "error",
    };
  }
}
