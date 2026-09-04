import {
  deliveryMethods,
  paymentMethods,
  type DeliveryMethodCode,
  type PaymentMethodCode,
} from "@/config/checkout";
import type {
  CreateOrderCartItemInput,
  CreateOrderInput,
  ShippingAddressInput,
} from "@/lib/orders/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeText(value: string | undefined, maxLength: number) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeOptionalText(value: string | undefined, maxLength: number) {
  const normalizedValue = normalizeText(value, maxLength);

  return normalizedValue || undefined;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return digits.length >= 8 && digits.length <= 15;
}

function isValidDeliveryMethod(value: string): value is DeliveryMethodCode {
  return deliveryMethods.some((method) => method.code === value);
}

function isValidPaymentMethod(value: string): value is PaymentMethodCode {
  return paymentMethods.some((method) => method.code === value);
}

function normalizeItem(
  item: CreateOrderCartItemInput,
): CreateOrderCartItemInput | null {
  if (!uuidPattern.test(item.productId)) {
    return null;
  }

  if (item.variantId && !uuidPattern.test(item.variantId)) {
    return null;
  }

  const quantity = Math.floor(item.quantity);

  if (quantity < 1 || quantity > 99) {
    return null;
  }

  if (typeof item.clientUnitPrice !== "number" || item.clientUnitPrice < 0) {
    return null;
  }

  return {
    clientUnitPrice: Math.floor(item.clientUnitPrice),
    productId: item.productId,
    quantity,
    selectedColor: normalizeOptionalText(item.selectedColor, 80),
    selectedCompatibility: normalizeOptionalText(
      item.selectedCompatibility,
      120,
    ),
    variantId: item.variantId,
  };
}

function normalizeShippingAddress(
  address: ShippingAddressInput | undefined,
): ShippingAddressInput {
  return {
    apartment: normalizeOptionalText(address?.apartment, 80),
    city: normalizeOptionalText(address?.city, 120),
    postalCode: normalizeOptionalText(address?.postalCode, 24),
    province: normalizeOptionalText(address?.province, 120),
    reference: normalizeOptionalText(address?.reference, 240),
    street: normalizeOptionalText(address?.street, 120),
    streetNumber: normalizeOptionalText(address?.streetNumber, 40),
  };
}

export function normalizeCreateOrderInput(
  input: CreateOrderInput,
): CreateOrderInput | { message: string } {
  const customerFirstName = normalizeText(input.customerFirstName, 80);
  const customerLastName = normalizeText(input.customerLastName, 80);
  const customerEmail = normalizeText(input.customerEmail, 180).toLowerCase();
  const customerPhone = normalizeText(input.customerPhone, 60);
  const customerDni = normalizeOptionalText(input.customerDni, 24);
  const customerNotes = normalizeOptionalText(input.customerNotes, 500);
  const confirmationToken = normalizeText(input.confirmationToken, 160);
  const idempotencyKey = normalizeText(input.idempotencyKey, 120);
  const deliveryMethod = input.deliveryMethod;
  const paymentMethod = input.paymentMethod;
  const savedAddressId = normalizeOptionalText(input.savedAddressId, 80);

  if (!customerFirstName) {
    return { message: "Ingresa tu nombre." };
  }

  if (!customerLastName) {
    return { message: "Ingresa tu apellido." };
  }

  if (!customerEmail || !isValidEmail(customerEmail)) {
    return { message: "Ingresa un email valido." };
  }

  if (!customerPhone || !isValidPhone(customerPhone)) {
    return { message: "Ingresa un telefono valido." };
  }

  if (!idempotencyKey) {
    return { message: "No pudimos preparar el pedido. Intenta nuevamente." };
  }

  if (confirmationToken.length < 32) {
    return { message: "No pudimos preparar la confirmacion. Intenta nuevamente." };
  }

  if (!isValidDeliveryMethod(deliveryMethod)) {
    return { message: "Selecciona un metodo de envio valido." };
  }

  if (!isValidPaymentMethod(paymentMethod)) {
    return { message: "Selecciona un metodo de pago valido." };
  }

  if (savedAddressId && !uuidPattern.test(savedAddressId)) {
    return { message: "Selecciona una direccion guardada valida." };
  }

  if (input.items.length === 0) {
    return { message: "Tu carrito esta vacio." };
  }

  if (input.items.length > 50) {
    return { message: "El carrito tiene demasiados productos." };
  }

  const items = input.items.map(normalizeItem);

  if (items.some((item) => item === null)) {
    return { message: "Uno de los productos ya no esta disponible." };
  }

  const methodConfig = deliveryMethods.find(
    (method) => method.code === deliveryMethod,
  );
  const shippingAddress = normalizeShippingAddress(input.shippingAddress);

  if (methodConfig?.requiresAddress) {
    if (!shippingAddress.street) {
      return { message: "Ingresa la calle de entrega." };
    }

    if (!shippingAddress.streetNumber) {
      return { message: "Ingresa el numero de entrega." };
    }

    if (!shippingAddress.city) {
      return { message: "Ingresa la localidad de entrega." };
    }
  }

  if (methodConfig?.requiresProvince && !shippingAddress.province) {
    return { message: "Ingresa la provincia de entrega." };
  }

  if (methodConfig?.requiresPostalCode && !shippingAddress.postalCode) {
    return { message: "Ingresa el codigo postal." };
  }

  return {
    customerDni,
    customerEmail,
    customerFirstName,
    customerLastName,
    customerNotes,
    confirmationToken,
    customerPhone,
    deliveryMethod,
    idempotencyKey,
    items: items.filter(
      (item): item is CreateOrderCartItemInput => item !== null,
    ),
    paymentMethod,
    savedAddressId,
    saveShippingAddress: Boolean(input.saveShippingAddress),
    saveShippingAddressAsDefault: Boolean(input.saveShippingAddressAsDefault),
    shippingAddress,
  };
}
