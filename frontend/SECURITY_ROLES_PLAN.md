# W.todocell Security Roles Plan

Este documento propone separar capacidades sin cambiar todavia el modelo aplicado en Supabase.

## Capacidades sugeridas

- `catalog:read`: leer catalogo completo desde admin.
- `catalog:write`: crear y editar productos, categorias, variantes e imagenes.
- `products:delete`: eliminar productos y objetos asociados.
- `orders:read`: leer pedidos y datos de clientes.
- `orders:update`: cambiar estados operativos de pedidos.
- `payments:confirm`: confirmar pagos.
- `content:write`: modificar contenido administrable de Home/CMS.
- `users:manage`: administrar usuarios o datos de perfil.
- `roles:manage`: asignar roles y permisos.

## Mapeo propuesto

### employee

- `catalog:read`
- `orders:read`
- `orders:update`

No deberia borrar productos, cambiar contenido global ni administrar roles.

### admin

- `catalog:read`
- `catalog:write`
- `products:delete`
- `orders:read`
- `orders:update`
- `payments:confirm`
- `content:write`

No deberia administrar roles salvo necesidad operativa.

### super_admin

- todas las capacidades anteriores;
- `users:manage`;
- `roles:manage`.

## Plan de migracion

1. Crear tabla `role_capabilities` o funcion SQL por capacidad.
2. Reemplazar `has_admin_access()` en policies/RPC por checks especificos.
3. Mantener `has_admin_access()` temporalmente para compatibilidad.
4. Auditar cada Server Action y RPC antes de revocar permisos.
5. Aplicar migracion incremental y reversible.

## Estado actual

Actualmente `employee`, `admin` y `super_admin` pasan `has_admin_access()` y tienen acceso administrativo amplio. En esta etapa solo se agrego proteccion local explicita en funciones admin de pedidos; no se cambio el modelo de roles.
