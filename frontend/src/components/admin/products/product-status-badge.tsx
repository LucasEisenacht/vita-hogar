import { Badge } from "@/components/ui/badge";

type ProductStatusBadgeProps = {
  isActive: boolean;
};

export function ProductStatusBadge({ isActive }: ProductStatusBadgeProps) {
  return (
    <Badge variant={isActive ? "stock" : "neutral"}>
      {isActive ? "Activo" : "Oculto"}
    </Badge>
  );
}
