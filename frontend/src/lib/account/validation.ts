import type { UserAddressInsert, UserAddressUpdate } from "@/types/database";

export type FieldErrors = Record<string, string>;

export type ProfileFormValues = {
  birthDate?: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type AddressFormValues = {
  floorApartment?: string;
  isDefault: boolean;
  label: string;
  locality: string;
  municipality?: string;
  phone: string;
  postalCode: string;
  province: string;
  recipientName: string;
  reference?: string;
  street: string;
  streetNumber: string;
};

function normalizeText(value: FormDataEntryValue | null, maxLength: number) {
  return (typeof value === "string" ? value : "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeOptionalText(
  value: FormDataEntryValue | null,
  maxLength: number,
) {
  const normalizedValue = normalizeText(value, maxLength);

  return normalizedValue || undefined;
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return digits.length >= 8 && digits.length <= 15;
}

function isValidBirthDate(value: string) {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date <= new Date();
}

export function validateProfileForm(formData: FormData):
  | {
      errors: FieldErrors;
      values: ProfileFormValues;
    }
  | {
      errors: null;
      values: ProfileFormValues;
    } {
  const values: ProfileFormValues = {
    birthDate: normalizeOptionalText(formData.get("birthDate"), 10),
    firstName: normalizeText(formData.get("firstName"), 80),
    lastName: normalizeText(formData.get("lastName"), 80),
    phone: normalizeText(formData.get("phone"), 60),
  };
  const errors: FieldErrors = {};

  if (!values.firstName) {
    errors.firstName = "Ingresá tu nombre.";
  }

  if (!values.lastName) {
    errors.lastName = "Ingresá tu apellido.";
  }

  if (!values.phone) {
    errors.phone = "Ingresá tu teléfono.";
  } else if (!isValidPhone(values.phone)) {
    errors.phone = "Ingresá un teléfono válido.";
  }

  if (values.birthDate && !isValidBirthDate(values.birthDate)) {
    errors.birthDate = "Ingresá una fecha válida, no futura.";
  }

  return {
    errors: Object.keys(errors).length > 0 ? errors : null,
    values,
  };
}

export function validateAddressForm(formData: FormData):
  | {
      errors: FieldErrors;
      values: AddressFormValues;
    }
  | {
      errors: null;
      values: AddressFormValues;
    } {
  const values: AddressFormValues = {
    floorApartment: normalizeOptionalText(formData.get("floorApartment"), 80),
    isDefault: formData.get("isDefault") === "on",
    label: normalizeText(formData.get("label"), 40),
    locality: normalizeText(formData.get("locality"), 120),
    municipality: normalizeOptionalText(formData.get("municipality"), 120),
    phone: normalizeText(formData.get("phone"), 60),
    postalCode: normalizeText(formData.get("postalCode"), 24),
    province: normalizeText(formData.get("province"), 120),
    recipientName: normalizeText(formData.get("recipientName"), 120),
    reference: normalizeOptionalText(formData.get("reference"), 240),
    street: normalizeText(formData.get("street"), 120),
    streetNumber: normalizeText(formData.get("streetNumber"), 40),
  };
  const errors: FieldErrors = {};

  if (!values.label) {
    errors.label = "Ingresá un alias para esta dirección.";
  }

  if (!values.recipientName) {
    errors.recipientName = "Ingresá quién recibe.";
  }

  if (!values.phone) {
    errors.phone = "Ingresá un teléfono.";
  } else if (!isValidPhone(values.phone)) {
    errors.phone = "Ingresá un teléfono válido.";
  }

  if (!values.street) {
    errors.street = "Ingresá la calle.";
  }

  if (!values.streetNumber) {
    errors.streetNumber = "Ingresá el número.";
  }

  if (!values.locality) {
    errors.locality = "Ingresá la localidad.";
  }

  if (!values.province) {
    errors.province = "Ingresá la provincia.";
  }

  if (!values.postalCode) {
    errors.postalCode = "Ingresá el código postal.";
  }

  return {
    errors: Object.keys(errors).length > 0 ? errors : null,
    values,
  };
}

export function toAddressInsert(
  values: AddressFormValues,
  userId: string,
): UserAddressInsert {
  return {
    floor_apartment: values.floorApartment ?? null,
    is_default: values.isDefault,
    label: values.label,
    locality: values.locality,
    municipality: values.municipality ?? null,
    phone: values.phone,
    postal_code: values.postalCode,
    province: values.province,
    recipient_name: values.recipientName,
    reference: values.reference ?? null,
    street: values.street,
    street_number: values.streetNumber,
    user_id: userId,
  };
}

export function toAddressUpdate(values: AddressFormValues): UserAddressUpdate {
  return {
    floor_apartment: values.floorApartment ?? null,
    is_default: values.isDefault,
    label: values.label,
    locality: values.locality,
    municipality: values.municipality ?? null,
    phone: values.phone,
    postal_code: values.postalCode,
    province: values.province,
    recipient_name: values.recipientName,
    reference: values.reference ?? null,
    street: values.street,
    street_number: values.streetNumber,
  };
}
