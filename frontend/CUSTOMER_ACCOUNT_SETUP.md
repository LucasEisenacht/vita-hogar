# W.todocell Customer Account V1.0

Guia operativa para la experiencia de cuenta del cliente.

## Aplicado En Codigo

- Perfil editable en `/mi-cuenta/perfil`.
- Direcciones guardadas en `/mi-cuenta/direcciones`.
- Tarjeta activa de direcciones en `/mi-cuenta`.
- Navegacion unificada de cuenta.
- Precarga de perfil y direcciones en checkout para usuarios autenticados.
- Guardado opcional de una nueva direccion desde checkout.
- Validacion server-side de `savedAddressId` contra el usuario autenticado.
- Timeline visual en detalle de pedido de cliente.
- Pulido de listado de pedidos con estado de pago, entrega, total, fecha y cantidad de productos.
- Rate limiting en perfil, direcciones, checkout y favoritos.
- Favoritos mantienen RLS, `unique(user_id, product_id)` y pagina `/mi-cuenta/favoritos`.

## Fuente De Verdad

- Email: `auth.users.email`.
- Nombre, apellido, telefono y fecha de nacimiento: `public.profiles`.
- `auth.users.user_metadata`: fallback de compatibilidad para usuarios existentes.
- Direcciones: `public.user_addresses`.
- Pedidos: `public.orders`, `public.order_items`, `public.order_status_history`.
- Favoritos: `public.favorites`.

## Migraciones Nuevas

Aplicar en este orden despues de las migraciones previas pendientes:

1. `supabase/migrations/20260726002500_admin_role_management_security.sql`
2. `supabase/migrations/20260726002600_customer_account_profiles_addresses.sql`

La migracion de cuenta:

- agrega `profiles.birth_date`;
- permite `INSERT` seguro del perfil propio para upsert;
- crea `user_addresses`;
- agrega RLS por propietario;
- limita a 10 direcciones por usuario;
- mantiene una sola direccion predeterminada por usuario;
- reasigna una predeterminada si se elimina la default;
- no toca pedidos historicos.

## RLS Y Seguridad

- `profiles`: owner-only `SELECT`, `INSERT`, `UPDATE`.
- `user_addresses`: owner-only `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- `favorites`: owner-only y primary key `(user_id, product_id)`.
- `orders`: consultas de cliente filtradas por `user_id`.
- `order_status_history`: lectura publica de cliente sin notas internas.
- Server Actions derivan `user_id` desde sesion, no desde formularios.
- `savedAddressId` enviado por checkout se valida contra `user_addresses.user_id`.
- Checkout guarda snapshot de direccion en `orders.shipping_address`.
- No se expone `service_role` al cliente.

## Checkout

Usuario autenticado:

- precarga perfil como valores iniciales;
- lista direcciones guardadas;
- permite elegir una direccion;
- permite usar otra direccion;
- permite guardar la nueva direccion si el usuario lo marca;
- permite marcarla como predeterminada si se guarda.

Guest:

- conserva el flujo anterior;
- no carga ni guarda direcciones.

## Timeline De Pedidos

Estados reales usados:

- `pending_payment`: Pedido recibido.
- `payment_confirmed`: Pago confirmado.
- `preparing`: En preparacion.
- `ready`: Listo para despachar o retirar.
- `shipped`: Despachado.
- `delivered`: Entregado.
- `cancelled`: Cancelado.

Fechas:

- Se usa `Intl.DateTimeFormat` con locale `es-AR`.
- Se usa zona `America/Argentina/Buenos_Aires`.
- No se ajustan horas manualmente.
- No se inventan timestamps: se usan columnas reales o `order_status_history`.

## Rate Limiting

Reutiliza la infraestructura existente:

- perfil: `account-profile-update`;
- crear direccion: `account-address-create`;
- editar direccion: `account-address-update`;
- eliminar direccion: `account-address-delete`;
- favoritos: `favorite-toggle`;
- checkout: `checkout-create-order`.

En produccion distribuida configurar:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Pruebas Manuales

- Registrar/iniciar sesion.
- Editar perfil y verificar persistencia.
- Crear 2 direcciones y marcar una como predeterminada.
- Editar una direccion.
- Eliminar la predeterminada y confirmar que otra queda como default.
- Entrar al checkout autenticado y elegir direccion guardada.
- Usar otra direccion y guardarla desde checkout.
- Confirmar que guest checkout sigue sin cambios.
- Abrir `/mi-cuenta/pedidos`.
- Abrir detalle de pedido propio y revisar timeline.
- Cambiar un ID de pedido en URL y confirmar 404.
- Agregar/quitar favoritos desde cards, busqueda, Product Page y pagina de favoritos.

## Rollback Conceptual

- Si la migracion de direcciones falla antes de deploy, no desplegar el codigo que consulta `user_addresses`.
- Si el deploy falla despues de migrar, revertir deploy de Vercel; la migracion es aditiva y no borra datos.
- No eliminar `user_addresses` en produccion sin exportar datos de clientes.

## Pendientes

- Aplicar migraciones manualmente en Supabase.
- Probar con usuarios reales de staging/produccion.
- Configurar Upstash para rate limiting persistente.
- Evaluar futuro flujo seguro de cambio de email desde Supabase Auth.
- Agregar pruebas automatizadas si se incorpora un runner estable para Server Actions.
