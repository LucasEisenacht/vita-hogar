import type {
  CheckoutFormData,
  PaymentMethod,
} from "@/components/checkout/types";
import { paymentMethods } from "@/config/checkout";

type PaymentMethodsProps = {
  formData: CheckoutFormData;
  onPaymentChange: (method: PaymentMethod) => void;
};

export function PaymentMethods({
  formData,
  onPaymentChange,
}: PaymentMethodsProps) {
  return (
    <fieldset className="space-y-5">
      <legend className="font-display text-2xl font-semibold text-foreground">
        Metodo de pago
      </legend>
      <div className="grid gap-3">
        {paymentMethods.map((option) => {
          const isSelected = formData.paymentMethod === option.code;

          return (
            <label
              className={`rounded-[24px] border p-4 transition-colors duration-[250ms] ${
                isSelected
                  ? "border-primary bg-secondary text-primary-hover"
                  : "border-border bg-surface text-muted-foreground hover:border-primary"
              } cursor-pointer`}
              key={option.code}
            >
              <input
                checked={isSelected}
                className="sr-only"
                name="paymentMethod"
                onChange={() => onPaymentChange(option.code)}
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
    </fieldset>
  );
}
