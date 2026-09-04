const benefits = [
  "Envios a todo el pais",
  "Entregas en AMBA por mensajeria",
  "Compra segura",
  "Atencion personalizada",
];

export function ProductBenefits() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {benefits.map((benefit) => (
        <div
          className="flex items-center gap-3 rounded-[22px] border border-white/50 bg-white/28 px-4 py-3 text-sm font-semibold text-muted-foreground backdrop-blur-sm"
          key={benefit}
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-primary/55"
          />
          <span>{benefit}</span>
        </div>
      ))}
    </div>
  );
}
