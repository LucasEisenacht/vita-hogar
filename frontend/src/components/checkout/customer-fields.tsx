import type { CheckoutErrors, CheckoutFormData } from "@/components/checkout/types";
import { Input } from "@/components/ui/input";

type CustomerFieldsProps = {
  errors: CheckoutErrors;
  formData: CheckoutFormData;
  onChange: (field: keyof CheckoutFormData, value: string) => void;
};

export function CustomerFields({
  errors,
  formData,
  onChange,
}: CustomerFieldsProps) {
  return (
    <fieldset className="space-y-5">
      <legend className="font-display text-2xl font-semibold text-foreground">
        Datos personales
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          autoComplete="given-name"
          error={errors.firstName}
          id="firstName"
          label="Nombre"
          onChange={(event) => onChange("firstName", event.target.value)}
          value={formData.firstName}
        />
        <Input
          autoComplete="family-name"
          error={errors.lastName}
          id="lastName"
          label="Apellido"
          onChange={(event) => onChange("lastName", event.target.value)}
          value={formData.lastName}
        />
        <Input
          autoComplete="tel"
          error={errors.phone}
          id="phone"
          inputMode="tel"
          label="Telefono"
          onChange={(event) => onChange("phone", event.target.value)}
          value={formData.phone}
        />
        <Input
          autoComplete="off"
          error={errors.dni}
          id="dni"
          inputMode="numeric"
          label="DNI opcional"
          onChange={(event) => onChange("dni", event.target.value)}
          value={formData.dni}
        />
        <Input
          autoComplete="email"
          error={errors.email}
          id="email"
          label="Email"
          onChange={(event) => onChange("email", event.target.value)}
          type="email"
          value={formData.email}
        />
      </div>
    </fieldset>
  );
}
