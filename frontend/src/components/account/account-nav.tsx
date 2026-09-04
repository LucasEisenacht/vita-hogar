import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

type AccountNavProps = {
  active: "addresses" | "favorites" | "orders" | "profile";
};

const accountNavItems = [
  { href: "/mi-cuenta/perfil", key: "profile", label: "Mi perfil" },
  { href: "/mi-cuenta/direcciones", key: "addresses", label: "Mis direcciones" },
  { href: "/mi-cuenta/pedidos", key: "orders", label: "Mis pedidos" },
  { href: "/mi-cuenta/favoritos", key: "favorites", label: "Mis favoritos" },
] as const;

export function AccountNav({ active }: AccountNavProps) {
  return (
    <nav aria-label="Secciones de mi cuenta" className="flex flex-wrap gap-3">
      {accountNavItems.map((item) => (
        <Link
          className={buttonStyles({
            size: "sm",
            variant: active === item.key ? "primary" : "secondary",
          })}
          href={item.href}
          key={item.key}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
