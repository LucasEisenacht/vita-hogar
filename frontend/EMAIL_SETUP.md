# W.todocell Email Setup

Este proyecto ya tiene un outbox transaccional para pedidos y un proveedor Resend configurable por variables de entorno.

## Variables requeridas

- `RESEND_API_KEY`: server-only. API key de Resend.
- `EMAIL_FROM`: server-only. Remitente con formato `W.todocell <pedidos@dominio>`.
- `ORDER_EMAIL_PROCESSOR_SECRET`: server-only. Secret largo para ejecutar el procesador del outbox.
- `CRON_SECRET`: server-only opcional. Secret largo reservado para un cron futuro o proveedor externo.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only. Usado solo por el procesador de emails.
- `NEXT_PUBLIC_SITE_URL`: publica. URL canonica del sitio, sin slash final.
- `ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION`: server-only. Numero de version activa: `1` o `2`.
- `ORDER_CONFIRMATION_TOKEN_SECRET_V1`: server-only. Secreto HMAC de version 1, minimo 32 caracteres.

## Variables opcionales

- `EMAIL_REPLY_TO`: server-only. Puede quedar vacia si aun no hay casilla de respuesta configurada.
- `EMAIL_PROVIDER_TIMEOUT_MS`: server-only. Timeout entre 1000 y 30000 ms. Default: 10000.
- `ORDER_CONFIRMATION_TOKEN_SECRET_V2`: server-only. Secreto HMAC de version 2 para rotacion futura o pedidos emitidos con version 2.

## Variables de tokens de pedido

| Nombre | Formato esperado | Obligatoria | Ejemplo ficticio |
| --- | --- | --- | --- |
| `ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION` | Numero entero `1` o `2`. No es un secreto. | Si, en produccion | `1` |
| `ORDER_CONFIRMATION_TOKEN_SECRET_V1` | String aleatorio de al menos 32 caracteres, sin saltos de linea. | Si `CURRENT_VERSION=1` o si existen pedidos historicos version 1 | `dev_v1_aaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `ORDER_CONFIRMATION_TOKEN_SECRET_V2` | String aleatorio de al menos 32 caracteres, sin saltos de linea. | Si `CURRENT_VERSION=2` o si existen pedidos historicos version 2 | `dev_v2_bbbbbbbbbbbbbbbbbbbbbbbbbb` |

Si falta el secreto correspondiente a la version actual, el checkout falla antes de insertar el pedido. Esto evita pedidos parcialmente creados, stock reducido o emails encolados con tokens invalidos.

## Produccion

En Vercel Production:

```txt
NEXT_PUBLIC_SITE_URL=https://www.wtodocell.com.ar
EMAIL_FROM=W.todocell <pedidos@wtodocell.com.ar>
```

No guardar claves en el repositorio. Cargar los valores reales en Vercel Environment Variables.

## Procesamiento del outbox

Los emails de pedidos no se envian dentro de la transaccion principal del checkout. Cuando se inserta un pedido, el trigger de Supabase agrega una fila en `order_email_outbox` con estado `pending`. Luego el procesador reclama lotes chicos de filas pendientes, llama a Resend y marca cada fila como `sent` o `failed`.

En Vercel Hobby no se usa cron frecuente. Despues de una RPC `create_order` exitosa, la Server Action procesa en servidor un lote chico del outbox y tambien agenda con `after()` de Next.js otro lote posterior. La respuesta del checkout ya queda asegurada antes de ese trabajo de email, por lo que un fallo de Resend no cancela el pedido.

Ese lote tambien puede incluir pendientes anteriores. Asi, cada compra nueva intenta enviar el email recien encolado y reintentar otros emails `pending` o reintentables sin duplicarlos.

Cuando el panel admin pasa un pedido por primera vez a `payment_confirmed` con `payment_status = approved`, el trigger encola `payment_confirmed`. La accion de admin tambien procesa un lote chico del outbox y agenda otro lote con `after()`.

El endpoint protegido queda disponible para ejecucion manual o automatizacion futura:

```txt
GET /api/emails/process-order-outbox
Authorization: Bearer <CRON_SECRET>
```

```txt
POST /api/emails/process-order-outbox
Authorization: Bearer <ORDER_EMAIL_PROCESSOR_SECRET>
```

El secret no se acepta por query string. Si faltan `CRON_SECRET` y `ORDER_EMAIL_PROCESSOR_SECRET`, el endpoint falla cerrado con `401`. `ORDER_EMAIL_PROCESSOR_SECRET` protege el uso manual por `POST`; `CRON_SECRET` queda reservado para un cron externo, Vercel Pro u otro proveedor si se agregan reintentos periodicos mas adelante.

El procesador interno no depende de Upstash. La proteccion se basa en bearer secret server-only, lote fijo, claim atomico en base de datos e idempotencia del proveedor. Los endpoints publicos siguen usando el rate limiter configurado aparte.

## Prueba local

El proyecto incluye un script local, no una API publica:

```bash
npm run email:test -- --to correo@ejemplo.com
```

Requiere `RESEND_API_KEY` y `EMAIL_FROM`. No usa datos reales de clientes.

Para probar el procesamiento del outbox sin crear una ruta publica, ejecutar manualmente el endpoint contra un entorno controlado que tenga filas `pending`:

```bash
curl -X POST https://www.wtodocell.com.ar/api/emails/process-order-outbox \
  -H "Authorization: Bearer <ORDER_EMAIL_PROCESSOR_SECRET>"
```

Para verificar el estado de una fila:

```sql
select
  event_type,
  status,
  attempts,
  last_error,
  provider_message_id,
  sent_at,
  updated_at
from public.order_email_outbox
where order_id = '<order-id>'
order by created_at;
```

Los errores se guardan sanitizados en `last_error` y tambien se pueden revisar en Vercel Function Logs. Los logs usan prefijos `[order-email-outbox]`, `[processOrderEmailOutbox]` y `[createOrderEmailOutboxAfter]`. No registrar ni compartir claves, tokens ni headers completos.

## Diagnostico de esquema de pedidos

Si produccion falla al aplicar el outbox por una columna faltante en `public.orders`, revisar primero el desfase entre el esquema real y las migraciones:

```sql
select
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'orders'
  and column_name in (
    'confirmation_token_hash',
    'confirmation_token_expires_at',
    'confirmation_token_secret_version',
    'idempotency_key'
  )
order by column_name;
```

Para revisar los objetos del outbox sin modificar datos:

```sql
select to_regclass('public.order_email_outbox') as order_email_outbox_table;

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'claim_order_email_outbox';

select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'orders'
  and trigger_name in (
    'enqueue_order_received_email',
    'enqueue_payment_confirmed_email'
  )
order by trigger_name, event_manipulation;
```

Para verificar permisos y grants efectivos de las RPC del procesador:

```sql
select
  has_function_privilege(
    'service_role',
    'public.claim_order_email_outbox(integer)',
    'execute'
  ) as service_role_can_claim,
  has_function_privilege(
    'authenticated',
    'public.claim_order_email_outbox(integer)',
    'execute'
  ) as authenticated_can_claim,
  has_function_privilege(
    'anon',
    'public.claim_order_email_outbox(integer)',
    'execute'
  ) as anon_can_claim;
```

Para revisar filas pendientes, fallidas o colgadas:

```sql
select
  status,
  count(*) as total,
  min(created_at) as oldest_created_at,
  min(next_attempt_at) as next_attempt_at
from public.order_email_outbox
where status in ('pending', 'failed', 'processing')
group by status
order by status;

select
  id,
  order_id,
  event_type,
  status,
  attempts,
  next_attempt_at,
  updated_at,
  left(coalesce(last_error, ''), 240) as last_error
from public.order_email_outbox
where status = 'processing'
  and updated_at < now() - interval '10 minutes'
order by updated_at;
```

En produccion, si `supabase_migrations.schema_migrations` solo llega hasta `20260726000800` pero el esquema tiene columnas posteriores aplicadas manualmente, no reejecutar completas las migraciones historicas `01300`, `01400`, `01700` y `01900`. El orden recomendado es:

1. `20260726002000_bridge_missing_order_confirmation_columns.sql`
2. `20260726002100_reconcile_order_email_outbox_production.sql`

La migracion `02100` consolida la tabla, constraints, indices, funciones, triggers y grants necesarios para el outbox. No genera emails historicos automaticamente.

Para reintentar un pedido puntual, primero revisar si ya tiene filas de outbox:

```sql
select
  orders.order_number,
  orders.id as order_id,
  outbox.id as outbox_id,
  outbox.event_type,
  outbox.status,
  outbox.attempts,
  outbox.next_attempt_at,
  outbox.sent_at,
  left(coalesce(outbox.last_error, ''), 240) as last_error
from public.orders
left join public.order_email_outbox as outbox
  on outbox.order_id = orders.id
where orders.order_number = 'WT-2026-000004'
order by outbox.created_at;
```

Si existe una fila `pending` o `failed`, usar la accion de reintento del panel admin o llamar el endpoint protegido:

```bash
curl -X POST https://www.wtodocell.com.ar/api/emails/process-order-outbox \
  -H "Authorization: Bearer <ORDER_EMAIL_PROCESSOR_SECRET>"
```

Si no existe ninguna fila, no crear emails historicos masivos. Crear una fila controlada solo para el pedido que se quiera reenviar:

```sql
insert into public.order_email_outbox (
  order_id,
  event_type,
  recipient_email,
  payload
)
select
  orders.id,
  'order_received',
  lower(btrim(orders.customer_email)),
  public.build_order_email_payload(orders.id, 'order_received')
from public.orders
where orders.order_number = 'WT-2026-000004'
  and orders.customer_email is not null
  and length(btrim(orders.customer_email)) > 0
on conflict (order_id, event_type) do nothing;
```

## Reparar payload de un email de pedido

Si una fila queda con `last_error = 'invalid_email_payload'`, primero aplicar `20260726002200_fix_order_email_payload_builder.sql`. Luego reconstruir solo la fila afectada:

```sql
update public.order_email_outbox as outbox
set
  payload = public.build_order_email_payload(orders.id, outbox.event_type),
  status = 'pending',
  last_error = null,
  next_attempt_at = now(),
  attempts = least(outbox.attempts, 4)
from public.orders
where outbox.order_id = orders.id
  and (
    case
      when orders.order_number::text like 'WT-%' then orders.order_number::text
      else 'WT-' || to_char(orders.created_at, 'YYYY') || '-' || lpad(orders.order_number::text, 6, '0')
    end
  ) = 'WT-2026-000005'
  and outbox.event_type in ('order_received', 'payment_confirmed')
  and outbox.status <> 'sent';
```

Verificar el JSON reconstruido:

```sql
select
  orders.order_number,
  outbox.event_type,
  outbox.status,
  outbox.attempts,
  outbox.next_attempt_at,
  outbox.payload ->> 'customerEmail' as customer_email,
  outbox.payload ->> 'orderNumber' as payload_order_number,
  outbox.payload ->> 'paymentMethod' as payment_method,
  outbox.payload ->> 'deliveryMethod' as delivery_method,
  (outbox.payload ->> 'total')::integer as total,
  jsonb_array_length(outbox.payload -> 'items') as item_count,
  jsonb_pretty(outbox.payload) as payload
from public.order_email_outbox as outbox
join public.orders as orders
  on orders.id = outbox.order_id
where (
    case
      when orders.order_number::text like 'WT-%' then orders.order_number::text
      else 'WT-' || to_char(orders.created_at, 'YYYY') || '-' || lpad(orders.order_number::text, 6, '0')
    end
  ) = 'WT-2026-000005'
order by outbox.created_at;
```

Para diagnosticar el pedido `WT-2026-000003` en Supabase SQL Editor:

```sql
select
  orders.order_number,
  orders.id as order_id,
  outbox.id as outbox_id,
  outbox.event_type,
  outbox.status,
  outbox.attempts,
  outbox.created_at,
  outbox.sent_at as processed_at,
  left(coalesce(outbox.last_error, ''), 240) as last_error
from public.orders
left join public.order_email_outbox as outbox
  on outbox.order_id = orders.id
where orders.order_number = 'WT-2026-000003'
order by outbox.created_at;
```

Para diagnosticar el pedido `WT-2026-000004`, reemplazar el numero en la consulta anterior o usar:

```sql
select
  orders.order_number,
  orders.id as order_id,
  outbox.id as outbox_id,
  outbox.event_type,
  outbox.status,
  outbox.attempts,
  outbox.created_at,
  outbox.sent_at as processed_at,
  left(coalesce(outbox.last_error, ''), 240) as last_error
from public.orders
left join public.order_email_outbox as outbox
  on outbox.order_id = orders.id
where orders.order_number = 'WT-2026-000004'
order by outbox.created_at;
```

Para confirmar que PostgREST ve la RPC del claim:

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'claim_order_email_outbox';
```

Para revisar permisos efectivos:

```sql
select
  has_function_privilege(
    'service_role',
    'public.claim_order_email_outbox(integer)',
    'execute'
  ) as service_role_can_execute,
  has_function_privilege(
    'authenticated',
    'public.claim_order_email_outbox(integer)',
    'execute'
  ) as authenticated_can_execute,
  has_function_privilege(
    'anon',
    'public.claim_order_email_outbox(integer)',
    'execute'
  ) as anon_can_execute;
```

Para revisar solo configuracion desde el resultado:

- `email_provider_not_configured`: falta `RESEND_API_KEY`.
- `invalid_from_email`: falta o es invalido `EMAIL_FROM`.
- `invalid_reply_to_email`: `EMAIL_REPLY_TO` esta presente pero no es valido.
- `email_outbox_claim_failed`: revisar `SUPABASE_SERVICE_ROLE_KEY` y permisos de `claim_order_email_outbox`.
- `email_provider_4xx` o `email_provider_5xx`: revisar Resend y el detalle sanitizado de `last_error`.

Desde el detalle admin de un pedido existe una accion discreta para reintentar emails pendientes o fallidos. No reenvia filas con estado `sent`.

## Resend

Antes de produccion:

- verificar dominio `wtodocell.com.ar` en Resend;
- configurar SPF, DKIM y DMARC;
- usar una casilla real para `EMAIL_FROM`;
- decidir si `EMAIL_REPLY_TO` apunta a soporte o pedidos.

## Supabase Auth SMTP

Los emails de confirmacion de cuenta y recuperacion de contrasena los envia Supabase Auth, no el outbox de pedidos. Para que salgan con marca W.todocell hay que configurarlo manualmente en Supabase:

1. Ir a Supabase Dashboard.
2. Abrir Authentication.
3. Abrir SMTP Settings.
4. Activar Custom SMTP.
5. Completar:
   - Host: el host SMTP del proveedor elegido.
   - Port: el puerto indicado por el proveedor, normalmente `587`.
   - Username: usuario SMTP o API user.
   - Password: password/API key del proveedor.
   - Sender email: casilla verificada, por ejemplo `pedidos@wtodocell.com.ar`.
   - Sender name: `W.todocell`.

No cargar estas credenciales en el repositorio.

## Supabase Auth Redirect URLs

Agregar en Authentication > URL Configuration:

```txt
https://www.wtodocell.com.ar/auth/callback
http://localhost:3000/auth/callback
```

Confirmar que `Site URL` sea:

```txt
https://www.wtodocell.com.ar
```

## Template: Confirm signup

Usar como HTML en Supabase Auth > Email Templates > Confirm signup:

```html
<!doctype html>
<html lang="es">
  <body style="margin:0;background:#fff8f6;color:#33272c;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" style="border-collapse:collapse;background:#fff8f6;">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <table role="presentation" width="100%" style="max-width:560px;border-collapse:collapse;border-radius:28px;background:#fffdfb;border:1px solid #f1dfe5;">
            <tr>
              <td style="padding:30px 28px;">
                <p style="margin:0 0 14px;color:#b9788e;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">W.todocell</p>
                <h1 style="margin:0 0 12px;font-size:28px;line-height:1.18;color:#2f2529;">Confirmá tu cuenta</h1>
                <p style="margin:0 0 22px;color:#6f5660;line-height:1.7;">Gracias por crear tu cuenta. Confirmá tu email para guardar favoritos y seguir tus compras con más calma.</p>
                <p style="margin:0 0 24px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;border-radius:999px;background:#d99bae;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;">Confirmar cuenta</a></p>
                <p style="margin:0;color:#8f6976;font-size:13px;line-height:1.6;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br><a href="{{ .ConfirmationURL }}" style="color:#b9788e;">{{ .ConfirmationURL }}</a></p>
                <p style="margin:22px 0 0;color:#9b7b84;font-size:12px;line-height:1.6;">Si no creaste una cuenta en W.todocell, podés ignorar este mensaje.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Template: Reset password

Usar como HTML en Supabase Auth > Email Templates > Reset password:

```html
<!doctype html>
<html lang="es">
  <body style="margin:0;background:#fff8f6;color:#33272c;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" style="border-collapse:collapse;background:#fff8f6;">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <table role="presentation" width="100%" style="max-width:560px;border-collapse:collapse;border-radius:28px;background:#fffdfb;border:1px solid #f1dfe5;">
            <tr>
              <td style="padding:30px 28px;">
                <p style="margin:0 0 14px;color:#b9788e;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">W.todocell</p>
                <h1 style="margin:0 0 12px;font-size:28px;line-height:1.18;color:#2f2529;">Restablecé tu contraseña</h1>
                <p style="margin:0 0 22px;color:#6f5660;line-height:1.7;">Recibimos una solicitud para cambiar la contraseña de tu cuenta. Usá este enlace para elegir una nueva.</p>
                <p style="margin:0 0 24px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;border-radius:999px;background:#d99bae;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;">Cambiar contraseña</a></p>
                <p style="margin:0;color:#8f6976;font-size:13px;line-height:1.6;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br><a href="{{ .ConfirmationURL }}" style="color:#b9788e;">{{ .ConfirmationURL }}</a></p>
                <p style="margin:22px 0 0;color:#9b7b84;font-size:12px;line-height:1.6;">Si no pediste este cambio, ignorá este mensaje. Tu contraseña actual seguirá activa.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Template: Change email

Si se habilita cambio de email, usar la misma estructura visual y el CTA con:

```html
<a href="{{ .ConfirmationURL }}">Confirmar nuevo email</a>
```

## Supabase Auth SMTP - configuracion actualizada

Los emails de confirmacion de cuenta, recuperacion de contrasena y cambio de email los envia Supabase Auth. No pasan por `order_email_outbox`.

Configurar manualmente en Supabase Dashboard:

1. Ir a Authentication.
2. Abrir SMTP Settings.
3. Activar Custom SMTP.
4. Completar con datos de Resend:
   - Host: `smtp.resend.com`.
   - Port: `587`.
   - Username: `resend`.
   - Password: API key SMTP/API key creada en Resend. No guardarla en el repo.
   - Sender name: `W.todocell`.
   - Sender email: `hola@wtodocell.com.ar`.

Usar `hola@wtodocell.com.ar` para Auth separa identidad de cuenta/soporte de `pedidos@wtodocell.com.ar`, que queda reservado para emails transaccionales de compra.

Variables del frontend para emails propios de cuenta:

```env
AUTH_EMAIL_FROM=W.todocell <hola@wtodocell.com.ar>
AUTH_EMAIL_REPLY_TO=hola@wtodocell.com.ar
AUTH_EMAIL_PROCESSOR_SECRET=valor-largo-aleatorio
```

`AUTH_EMAIL_FROM` se usa para el email propio de bienvenida. `RESEND_API_KEY` sigue siendo server-only. No exponer estas variables al cliente.

## Supabase Auth Redirect URLs - configuracion actualizada

Configurar `Site URL`:

```txt
https://www.wtodocell.com.ar
```

Agregar en Authentication > URL Configuration:

```txt
https://www.wtodocell.com.ar/auth/callback
https://www.wtodocell.com.ar/auth/callback?next=/actualizar-contrasena
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=/actualizar-contrasena
```

Si Supabase no acepta query strings exactas en la lista, cargar la URL base `/auth/callback` y verificar el comportamiento desde el Dashboard. La aplicacion valida `next` con `getSafeAuthRedirect`, por lo que no acepta redirects externos.

## Templates actualizados de Supabase Auth

Los templates HTML listos para copiar se generan localmente, sin enviar correos reales:

```bash
npm run auth-email:preview -- --event confirm_signup
npm run auth-email:preview -- --event reset_password
npm run auth-email:preview -- --event change_email
```

Copiar el HTML generado desde:

```txt
auth-email-previews/confirm_signup.html
auth-email-previews/reset_password.html
auth-email-previews/change_email.html
```

Cada template usa:

- `{{ .ConfirmationURL }}` para el boton y enlace alternativo.
- Logo absoluto: `https://www.wtodocell.com.ar/brand/wtodocell-logo-cropped.png`.
- Fondo blush, tarjeta crema, estilos inline y texto en espanol.
- Link alternativo visible.
- Mensaje de seguridad.
- Soporte por WhatsApp con URL centralizada.

Asuntos finales:

- Confirm signup: `Confirmá tu cuenta en W.todocell`.
- Reset password: `Restablecé tu contraseña de W.todocell`.
- Change email: `Confirmá tu nuevo email en W.todocell`.

El cambio de email no tiene UI propia actualmente; el template queda preparado para cuando se habilite ese flujo en Supabase Auth.

## Email de bienvenida

La bienvenida es un email propio de W.todocell enviado con Resend despues de que Supabase confirma el email del usuario.

Arquitectura:

1. La migracion `20260726002400_create_auth_email_outbox.sql` crea `auth_email_outbox`.
2. Un trigger sobre `auth.users` encola `user_welcome` cuando `email_confirmed_at` pasa por primera vez de `null` a timestamp.
3. La tabla tiene `unique(user_id, event_type)` para impedir duplicados.
4. `/auth/callback` procesa un lote chico del outbox en servidor y agenda otro con `after()`.
5. Si Resend falla, el login no falla; la fila queda `failed` o pendiente para reintento.
6. El endpoint manual `POST /api/emails/process-auth-outbox` permite reintentar con bearer `AUTH_EMAIL_PROCESSOR_SECRET`.

No se encolan usuarios historicos automaticamente. Si se quiere enviar bienvenida a usuarios antiguos, preparar una accion manual controlada.

Preview local:

```bash
npm run auth-email:preview -- --event welcome
```

Salida:

```txt
auth-email-previews/welcome.html
auth-email-previews/welcome.txt
```

## Diagnostico de confirmacion y bienvenida

`/auth/callback` acepta los formatos de Supabase con `code` y con
`token_hash` + `type`. La ruta registra eventos sanitizados sin tokens ni
emails:

- `callback_received`
- `exchange_started`
- `exchange_success`
- `exchange_failed`
- `redirect_selected`
- `auth_outbox_processing_started`
- `auth_outbox_processing_finished`

Si la confirmacion crea sesion, redirige a:

```txt
/mi-cuenta?email-confirmado=1
```

Si Supabase confirma el email pero no deja sesion activa, redirige a:

```txt
/ingresar?email-confirmado=1&next=/mi-cuenta
```

### Consultas SQL de diagnostico

Verificar si el trigger existe y esta activo:

```sql
select
  tgname,
  tgenabled
from pg_trigger
where tgname in (
  'enqueue_auth_welcome_email_on_insert',
  'enqueue_auth_welcome_email_on_confirmation'
);
```

Verificar la funcion RPC de claim:

```sql
select
  n.nspname as schema_name,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'claim_auth_email_outbox';
```

Ver ultimas filas del outbox sin exponer payload completo:

```sql
select
  id,
  user_id,
  event_type,
  status,
  attempts,
  last_error,
  created_at,
  updated_at,
  sent_at,
  jsonb_pretty(payload - 'email') as payload_without_email
from public.auth_email_outbox
order by created_at desc
limit 10;
```

Confirmar que un usuario especifico ya tiene email confirmado:

```sql
select
  id,
  email_confirmed_at,
  created_at,
  updated_at
from auth.users
where id = 'REEMPLAZAR_UUID_DEL_USUARIO';
```

### Reintento manual del procesador

No pegar secretos en el codigo. En PowerShell:

```powershell
$secret = Read-Host "AUTH_EMAIL_PROCESSOR_SECRET"
Invoke-RestMethod `
  -Method Post `
  -Uri "https://www.wtodocell.com.ar/api/emails/process-auth-outbox" `
  -Headers @{ Authorization = "Bearer $secret" }
```

### Encolar bienvenida para un usuario ya confirmado

Usar solo para un caso puntual confirmado manualmente. No reenvia si ya existe
una fila `(user_id, event_type)` por la restriccion unica.

```sql
with target_user as (
  select
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
  from auth.users
  where id = 'REEMPLAZAR_UUID_DEL_USUARIO'
    and email_confirmed_at is not null
)
insert into public.auth_email_outbox (
  user_id,
  event_type,
  recipient_email,
  payload,
  status
)
select
  id,
  'user_welcome',
  lower(email),
  jsonb_build_object(
    'eventType', 'user_welcome',
    'userId', id,
    'email', lower(email),
    'firstName', nullif(raw_user_meta_data->>'first_name', ''),
    'fullName', nullif(raw_user_meta_data->>'full_name', ''),
    'createdAt', created_at,
    'confirmedAt', email_confirmed_at
  ),
  'pending'
from target_user
on conflict (user_id, event_type) do nothing;
```
