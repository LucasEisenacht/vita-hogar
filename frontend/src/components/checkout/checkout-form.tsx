"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkoutHelpText,
  getDeliveryMethodConfig,
} from "@/config/checkout";
import { createOrder } from "@/lib/orders/actions";
import type { AccountAddress } from "@/lib/account/addresses";
import { useCart } from "@/context/cart-context";
import type {
  CheckoutErrors,
  CheckoutFormData,
  DeliveryMethod,
  PaymentMethod,
} from "@/components/checkout/types";
import { CheckoutEmpty } from "@/components/checkout/checkout-empty";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { CustomerFields } from "@/components/checkout/customer-fields";
import { DeliveryFields } from "@/components/checkout/delivery-fields";
import { PaymentMethods } from "@/components/checkout/payment-methods";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

type CheckoutFormProps = {
  initialAddresses?: Array<AccountAddress>;
  initialCustomer?: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
};

const baseFormData: CheckoutFormData = {
  apartment: "",
  city: "",
  deliveryMethod: "amba_courier",
  dni: "",
  email: "",
  firstName: "",
  lastName: "",
  paymentMethod: "bank_transfer",
  phone: "",
  postalCode: "",
  province: "",
  reference: "",
  saveAddress: "",
  saveAddressAsDefault: "",
  selectedAddressId: "",
  street: "",
  streetNumber: "",
};

function getInitialFormData(
  initialCustomer?: CheckoutFormProps["initialCustomer"],
): CheckoutFormData {
  return {
    ...baseFormData,
    email: initialCustomer?.email ?? "",
    firstName: initialCustomer?.firstName ?? "",
    lastName: initialCustomer?.lastName ?? "",
    phone: initialCustomer?.phone ?? "",
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function validateCheckout(formData: CheckoutFormData, hasItems: boolean) {
  const errors: CheckoutErrors = {};

  if (!hasItems) {
    errors.form = "Tu carrito esta vacio.";
  }

  if (!formData.firstName.trim()) {
    errors.firstName = "Ingresa tu nombre.";
  }

  if (!formData.lastName.trim()) {
    errors.lastName = "Ingresa tu apellido.";
  }

  if (!formData.phone.trim()) {
    errors.phone = "Ingresa tu telefono.";
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = "Ingresa un telefono valido.";
  }

  if (formData.email.trim() && !isValidEmail(formData.email)) {
    errors.email = "Ingresa un email valido.";
  }

  if (!formData.email.trim()) {
    errors.email = "Ingresa tu email.";
  }

  const deliveryConfig = getDeliveryMethodConfig(formData.deliveryMethod);

  if (deliveryConfig?.requiresAddress) {
    if (!formData.street.trim()) {
      errors.street = "Ingresa la calle.";
    }
    if (!formData.streetNumber.trim()) {
      errors.streetNumber = "Ingresa el numero.";
    }
    if (!formData.city.trim()) {
      errors.city = "Ingresa la localidad.";
    }
    if (deliveryConfig.requiresProvince && !formData.province.trim()) {
      errors.province = "Ingresa la provincia.";
    }
    if (deliveryConfig.requiresPostalCode && !formData.postalCode.trim()) {
      errors.postalCode = "Ingresa el codigo postal.";
    }
  }

  return errors;
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createConfirmationToken() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);

    return Array.from(tokenBytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  return `${createIdempotencyKey()}-${createIdempotencyKey()}`.replace(/-/g, "");
}

function getAddressLabel(address: AccountAddress) {
  return `${address.label} - ${address.street} ${address.street_number}, ${address.locality}`;
}

function addressToFormPatch(address: AccountAddress): Partial<CheckoutFormData> {
  return {
    apartment: address.floor_apartment ?? "",
    city: address.locality,
    phone: address.phone,
    postalCode: address.postal_code,
    province: address.province,
    reference: address.reference ?? "",
    selectedAddressId: address.id,
    street: address.street,
    streetNumber: address.street_number,
  };
}

export function CheckoutForm({
  initialAddresses = [],
  initialCustomer,
}: CheckoutFormProps) {
  const router = useRouter();
  const { clearCart, items, subtotal } = useCart();
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialCustomer),
  );
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [confirmationToken, setConfirmationToken] = useState(
    createConfirmationToken,
  );
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasMadeToOrderItems = items.some(
    (item) => item.availabilityType === "made_to_order",
  );

  const firstErrorField = useMemo(
    () =>
      Object.keys(errors).find((field) => field !== "form") as
        | keyof CheckoutFormData
        | undefined,
    [errors],
  );

  function updateField(field: keyof CheckoutFormData, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      form: undefined,
    }));
  }

  function selectSavedAddress(addressId: string) {
    if (!addressId) {
      setFormData((currentFormData) => ({
        ...currentFormData,
        selectedAddressId: "",
      }));
      return;
    }

    const address = initialAddresses.find(
      (currentAddress) => currentAddress.id === addressId,
    );

    if (!address) {
      return;
    }

    setFormData((currentFormData) => ({
      ...currentFormData,
      ...addressToFormPatch(address),
      saveAddress: "",
      saveAddressAsDefault: "",
    }));
  }

  function updateDeliveryMethod(deliveryMethod: DeliveryMethod) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      deliveryMethod,
      paymentMethod: "bank_transfer",
      province:
        deliveryMethod === "nationwide_shipping"
          ? currentFormData.province
          : siteConfig.location.province,
      saveAddress: deliveryMethod === "pickup" ? "" : currentFormData.saveAddress,
      saveAddressAsDefault:
        deliveryMethod === "pickup" ? "" : currentFormData.saveAddressAsDefault,
      selectedAddressId:
        deliveryMethod === "pickup" ? "" : currentFormData.selectedAddressId,
    }));
  }

  function updatePaymentMethod(paymentMethod: PaymentMethod) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      paymentMethod,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      paymentMethod: undefined,
    }));
  }

  function focusFirstError(nextErrors: CheckoutErrors) {
    const field = Object.keys(nextErrors).find((key) => key !== "form");

    if (!field) {
      return;
    }

    document.getElementById(field)?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCheckout(formData, items.length > 0);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage("Revisa los campos marcados para continuar.");
      focusFirstError(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Registrando tu pedido...");

    const result = await createOrder({
      confirmationToken,
      customerDni: formData.dni,
      customerEmail: formData.email,
      customerFirstName: formData.firstName,
      customerLastName: formData.lastName,
      customerNotes: formData.reference,
      customerPhone: formData.phone,
      deliveryMethod: formData.deliveryMethod,
      idempotencyKey,
      items: items.map((item) => ({
        clientUnitPrice: item.price,
        productId: item.productId,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedCompatibility: item.selectedCompatibility,
        variantId: item.variantId,
      })),
      paymentMethod: formData.paymentMethod,
      savedAddressId: formData.selectedAddressId || undefined,
      saveShippingAddress: formData.saveAddress === "true",
      saveShippingAddressAsDefault: formData.saveAddressAsDefault === "true",
      shippingAddress: {
        apartment: formData.apartment,
        city: formData.city,
        postalCode: formData.postalCode,
        province:
          formData.deliveryMethod === "nationwide_shipping"
            ? formData.province
            : siteConfig.location.province,
        reference: formData.reference,
        street: formData.street,
        streetNumber: formData.streetNumber,
      },
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrors({ form: result.message });
      setStatusMessage("");
      setConfirmationToken(createConfirmationToken());
      setIdempotencyKey(createIdempotencyKey());
      return;
    }

    clearCart();
    router.push(
      `/checkout/confirmacion/${encodeURIComponent(
        result.orderNumber,
      )}?token=${encodeURIComponent(result.confirmationToken)}`,
    );
  }

  if (items.length === 0) {
    return (
      <StorefrontPageShell intensity="low">
        <Container>
          <CheckoutEmpty />
        </Container>
      </StorefrontPageShell>
    );
  }

  return (
    <StorefrontPageShell intensity="low">
      <Container className="space-y-10">
        <div className="max-w-3xl space-y-3">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
            {siteConfig.name}
          </p>
          <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
            Finalizar compra
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Complet&aacute; tus datos, registramos el pedido y te mostramos los
            pr&oacute;ximos pasos para pagar por transferencia.
          </p>
          <p className="rounded-full border border-white/55 bg-white/36 px-4 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-sm">
            {checkoutHelpText.accountHint}
          </p>
          {!initialCustomer ? (
            <p className="rounded-[22px] border border-primary/15 bg-secondary/50 px-4 py-3 text-sm leading-6 text-primary-hover">
              Podras seguir este pedido desde los emails que te enviaremos. Para
              guardar un historial completo, necesitas una cuenta.
            </p>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <form className="space-y-9" onSubmit={handleSubmit}>
                <CustomerFields
                  errors={errors}
                  formData={formData}
                  onChange={updateField}
                />
                <DeliveryFields
                  errors={errors}
                  formData={formData}
                  onChange={updateField}
                  onDeliveryChange={updateDeliveryMethod}
                />
                {initialAddresses.length > 0 &&
                formData.deliveryMethod !== "pickup" ? (
                  <fieldset className="space-y-4">
                    <legend className="font-display text-2xl font-semibold text-foreground">
                      Direcciones guardadas
                    </legend>
                    <div className="grid gap-3">
                      <label className="grid gap-2 text-sm font-semibold text-foreground">
                        Elegir direccion
                        <select
                          className="h-12 rounded-2xl border border-border bg-surface px-4 text-sm text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] focus:outline-none focus:ring-2 focus:ring-ring/35"
                          onChange={(event) =>
                            selectSavedAddress(event.target.value)
                          }
                          value={formData.selectedAddressId}
                        >
                          <option value="">Usar otra direccion</option>
                          {initialAddresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {getAddressLabel(address)}
                              {address.is_default ? " (predeterminada)" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Si editas los campos del checkout, el pedido guarda una
                        copia de esos datos y no modifica tu direccion guardada.
                      </p>
                    </div>
                  </fieldset>
                ) : null}
                {initialCustomer && formData.deliveryMethod !== "pickup" ? (
                  <div className="grid gap-3 rounded-[24px] border border-border bg-surface-soft p-4">
                    <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                      <input
                        checked={formData.saveAddress === "true"}
                        className="h-4 w-4 accent-[var(--primary)]"
                        onChange={(event) =>
                          setFormData((currentFormData) => ({
                            ...currentFormData,
                            saveAddress: event.target.checked ? "true" : "",
                            saveAddressAsDefault: event.target.checked
                              ? currentFormData.saveAddressAsDefault
                              : "",
                          }))
                        }
                        type="checkbox"
                      />
                      Guardar esta direccion en mi cuenta
                    </label>
                    <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                      <input
                        checked={formData.saveAddressAsDefault === "true"}
                        className="h-4 w-4 accent-[var(--primary)]"
                        disabled={formData.saveAddress !== "true"}
                        onChange={(event) =>
                          updateField(
                            "saveAddressAsDefault",
                            event.target.checked ? "true" : "",
                          )
                        }
                        type="checkbox"
                      />
                      Marcarla como predeterminada
                    </label>
                  </div>
                ) : null}
                <PaymentMethods
                  formData={formData}
                  onPaymentChange={updatePaymentMethod}
                />
                {hasMadeToOrderItems ? (
                  <div className="rounded-[24px] border border-primary/20 bg-secondary/60 p-4 text-sm leading-6 text-primary-hover">
                    Tu carrito incluye productos por encargo. Vamos a confirmar
                    disponibilidad y tiempos por WhatsApp.
                  </div>
                ) : null}
                {errors.form ? (
                  <p className="text-sm font-medium text-destructive">
                    {errors.form}
                  </p>
                ) : null}
                {errors.paymentMethod ? (
                  <p className="text-sm font-medium text-destructive">
                    {errors.paymentMethod}
                  </p>
                ) : null}
                {firstErrorField ? (
                  <p className="text-sm font-medium text-destructive">
                    Hay campos pendientes antes de confirmar.
                  </p>
                ) : null}
                <div className="grid gap-3">
                  <Button
                    className="w-full"
                    disabled={isSubmitting}
                    size="lg"
                    type="submit"
                  >
                    {isSubmitting
                      ? "Registrando pedido..."
                      : "Confirmar pedido"}
                  </Button>
                  <p
                    aria-live="polite"
                    className="min-h-6 text-sm font-semibold text-primary-hover"
                  >
                    {statusMessage}
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <CheckoutSummary
            deliveryMethod={formData.deliveryMethod}
            items={items}
            subtotal={subtotal}
          />
        </div>
      </Container>
    </StorefrontPageShell>
  );
}
