import type { AdminNavItemData } from "@/components/admin/admin-nav-item";

export const adminNavItems: Array<AdminNavItemData> = [
  { href: "/admin", icon: "overview", label: "Resumen" },
  { href: "/admin/contenido", icon: "content", label: "Contenido" },
  { href: "/admin/productos", icon: "products", label: "Productos" },
  { href: "/admin/pedidos", icon: "orders", label: "Pedidos" },
  { href: "/admin/usuarios", icon: "customers", label: "Usuarios" },
  { href: "/admin/clientes", icon: "customers", isEnabled: false, label: "Clientes" },
  {
    href: "/admin/categorias",
    icon: "categories",
    isEnabled: false,
    label: "Categorías",
  },
  {
    href: "/admin/newsletter",
    icon: "newsletter",
    isEnabled: false,
    label: "Newsletter",
  },
  {
    href: "/admin/configuracion",
    icon: "settings",
    isEnabled: false,
    label: "Configuración",
  },
  { href: "/", icon: "shop", label: "Volver a la tienda" },
];
