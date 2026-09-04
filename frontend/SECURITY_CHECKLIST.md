# W.todocell Security Checklist

Checklist operativo para dejar el frontend y la integracion con Supabase listos para produccion.

## Obligatorio Antes De Produccion

- Aplicar manualmente la migracion `supabase/migrations/20260726002500_admin_role_management_security.sql` en Supabase.
- Confirmar que exista al menos un usuario con rol `super_admin` antes de delegar administracion desde el panel.
- Verificar que `SUPABASE_SERVICE_ROLE_KEY` exista solo en entorno server de Vercel y nunca como variable `NEXT_PUBLIC_*`.
- Configurar `ORDER_EMAIL_PROCESSOR_SECRET`, `AUTH_EMAIL_PROCESSOR_SECRET` y secretos de confirmacion de pedidos en produccion.
- Configurar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` para rate limiting persistente en produccion.
- Probar CSP en modo report-only y revisar errores reales antes de activar `ENABLE_CSP_ENFORCE=true`.
- Confirmar en Supabase que RLS permanece activo en `orders`, `order_status_history`, `user_roles`, `profiles`, `products`, `product_images`, `product_model_variants` y outboxes.
- Revisar que anon no tenga permisos de escritura sobre tablas comerciales ni administrativas.
- Validar que authenticated no pueda leer columnas internas de pedidos: `admin_notes`, `confirmation_token_hash`, `idempotency_key`, `stock_restored_at`, `confirmation_token_secret_version` e `internal_note`.
- Ejecutar una compra real de prueba en produccion y verificar outbox, email, stock, historial y detalle publico del pedido.

## Autenticacion Y Sesiones

- Supabase Auth maneja sesiones y cookies del lado servidor.
- Las rutas `/admin` deben pasar por `requireAdmin()`.
- La administracion de roles debe pasar por `requireSuperAdmin()` y por la RPC `public.manage_user_role`.
- Mantener MFA o controles equivalentes para cuentas con rol `super_admin` desde Supabase si el plan lo permite.
- Revisar periodicamente usuarios sin confirmar, sesiones antiguas y cuentas administrativas inactivas.

## Autorizacion Y Roles

- Roles actuales: `customer`, `employee`, `admin`, `super_admin`.
- Cambios de rol desde UI: solo `super_admin`.
- La RPC de roles evita degradar o revocar el ultimo `super_admin`.
- Todo cambio debe quedar registrado en `admin_role_audit_log` con actor, usuario objetivo, rol anterior, rol nuevo, accion, motivo e IP hasheada.
- No editar `user_roles` manualmente salvo recuperacion operativa controlada.

## Datos Internos

- Clientes deben consumir funciones o vistas seguras, no columnas internas directas.
- Columnas internas de pedidos no deben salir al bundle cliente ni por REST directo.
- Los tokens de confirmacion se almacenan solo como hash.
- Idempotency keys no deben mostrarse al cliente ni aparecer en emails.
- Notas internas de admin deben quedar fuera de vistas publicas y de cliente.

## Rate Limiting

- Checkout: limitar creacion de pedidos por identidad/IP.
- Admin: limitar cambios de estado, reintentos de emails y cambios de roles.
- Endpoints manuales de outbox: mantener bearer secret y rate limit.
- En desarrollo se usa memoria local.
- En produccion sin Upstash, los limites no criticos quedan en modo seguro-compatible; configurar Upstash para enforcement real.

## Headers Y CSP

- Mantener `X-Content-Type-Options: nosniff`.
- Mantener `X-Frame-Options: DENY` y `frame-ancestors 'none'`.
- Mantener `Referrer-Policy: strict-origin-when-cross-origin`.
- Mantener `Permissions-Policy` restrictiva.
- Mantener HSTS en deployment de produccion.
- CSP debe seguir en Report-Only hasta revisar fuentes reales de imagen, Supabase, Resend y analitica futura.
- Activar enforcement con `ENABLE_CSP_ENFORCE=true` solo tras validar staging/produccion.

## API Routes Y Server Actions

- Server Actions administrativas deben validar rol en servidor.
- No confiar en datos del cliente para precios, stock, roles ni estado de pedidos.
- Mantener logs sanitizados: no imprimir tokens, secrets, payloads sensibles ni datos completos de tarjetas/documentos.
- Los endpoints internos deben seguir protegidos por secrets y no depender de una URL publica sin autenticacion.

## Supabase

- No desactivar RLS como workaround.
- No usar `GRANT ALL` sobre tablas o funciones.
- Mantener grants por columnas cuando existan datos internos.
- Funciones `SECURITY DEFINER` deben fijar `search_path`.
- Funciones `SECURITY INVOKER` deben depender de RLS y permisos minimos.
- Revisar `supabase_migrations` antes de aplicar SQL en produccion.

## Uploads E Imagenes

- Validar extension, MIME, tamano y cantidad antes de subir.
- Mantener buckets y paths acotados por producto.
- No permitir URLs remotas arbitrarias para SSRF.
- Mantener `next.config.ts` con `remotePatterns` restringido al host de Supabase.

## Dependencias Y Deploy

- Ejecutar `npm.cmd run lint`, `npx.cmd tsc --noEmit` y `npm.cmd run build` antes de desplegar.
- Revisar `npm audit` antes de releases mayores.
- No subir `.env.local`.
- Rotar secretos si se exponen en logs, screenshots o herramientas externas.
- Documentar rollback de deploy y migraciones antes de cambios de base de datos.
