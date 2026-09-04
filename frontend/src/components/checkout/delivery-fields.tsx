import type {
  CheckoutErrors,
  CheckoutFormData,
  DeliveryMethod,
} from "@/components/checkout/types";
import { deliveryMethods } from "@/config/checkout";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";

type DeliveryFieldsProps = {
  errors: CheckoutErrors;
  formData: CheckoutFormData;
  onChange: (field: keyof CheckoutFormData, value: string) => void;
  onDeliveryChange: (method: DeliveryMethod) => void;
};

export function DeliveryFields({
  errors,
  formData,
  onChange,
  onDeliveryChange,
}: DeliveryFieldsProps) {
  return (
    <fieldset className="space-y-5">
      <legend className="font-display text-2xl font-semibold text-foreground">
        Entrega
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {deliveryMethods.map((option) => {
          const isSelected = formData.deliveryMethod === option.code;

          return (
            <label
              className={`cursor-pointer rounded-[24px] border p-4 transition-colors duration-[250ms] ${
                isSelected
                  ? "border-primary bg-secondary text-primary-hover"
                  : "border-border bg-surface text-muted-foreground hover:border-primary"
              }`}
              key={option.code}
            >
              <input
                checked={isSelected}
                className="sr-only"
                name="deliveryMethod"
                onChange={() => onDeliveryChange(option.code)}
                type="radio"
                value={option.code}
              />
              <span className="block font-display text-base font-semibold text-foreground">
                {option.label}
              </span>
              <span className="mt-2 block text-sm leading-6">
                {option.description}
              </span>
            </label>
          );
        })}
      </div>

      {formData.deliveryMethod === "pickup" ? (
        <div className="grid gap-4">
          <div className="rounded-[18px] border border-border bg-surface-soft px-4 py-3 text-sm leading-6 text-muted-foreground">
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
              Retiro
            </span>
            <span className="mt-1 block font-medium text-foreground">
              Coordinamos el punto y horario por WhatsApp
            </span>
          </div>
          <Input
            error={errors.reference}
            id="reference"
            label="Referencia"
            onChange={(event) => onChange("reference", event.target.value)}
            value={formData.reference}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            autoComplete="address-line1"
            error={errors.street}
            id="street"
            label="Calle"
            onChange={(event) => onChange("street", event.target.value)}
            value={formData.street}
          />
          <Input
            autoComplete="address-line2"
            error={errors.streetNumber}
            id="streetNumber"
            label="Numero"
            onChange={(event) => onChange("streetNumber", event.target.value)}
            value={formData.streetNumber}
          />
          <Input
            autoComplete="address-line3"
            error={errors.apartment}
            id="apartment"
            label="Piso / Departamento"
            onChange={(event) => onChange("apartment", event.target.value)}
            value={formData.apartment}
          />
          <Input
            autoComplete="address-level2"
            error={errors.city}
            id="city"
            label="Localidad"
            onChange={(event) => onChange("city", event.target.value)}
            value={formData.city}
          />
          {formData.deliveryMethod === "nationwide_shipping" ? (
            <Input
              autoComplete="address-level1"
              error={errors.province}
              id="province"
              label="Provincia"
              onChange={(event) => onChange("province", event.target.value)}
              value={formData.province}
            />
          ) : (
            <div className="rounded-[18px] border border-border bg-surface-soft px-4 py-3 text-sm leading-6 text-muted-foreground">
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
                Provincia
              </span>
              <span className="mt-1 block font-medium text-foreground">
                {siteConfig.location.province}
              </span>
            </div>
          )}
          <Input
            autoComplete="postal-code"
            error={errors.postalCode}
            id="postalCode"
            label="Codigo postal"
            onChange={(event) => onChange("postalCode", event.target.value)}
            value={formData.postalCode}
          />
          <Input
            className="sm:col-span-2"
            error={errors.reference}
            id="reference"
            label="Referencia"
            onChange={(event) => onChange("reference", event.target.value)}
            value={formData.reference}
          />
        </div>
      )}
    </fieldset>
  );
}
