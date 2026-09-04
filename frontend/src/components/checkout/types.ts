import type { DeliveryMethod, PaymentMethod } from "@/types/database";

export type { DeliveryMethod };
export type { PaymentMethod };

export type CheckoutFormData = {
  selectedAddressId: string;
  firstName: string;
  lastName: string;
  phone: string;
  dni: string;
  email: string;
  deliveryMethod: DeliveryMethod;
  street: string;
  streetNumber: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  reference: string;
  saveAddress: string;
  saveAddressAsDefault: string;
  paymentMethod: PaymentMethod;
};

export type CheckoutErrors = Partial<
  Record<keyof CheckoutFormData | "form", string>
>;
