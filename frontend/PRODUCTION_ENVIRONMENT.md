# W.todocell Production Environment

## Production

Configurar en Vercel Production:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.wtodocell.com.ar
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=W.todocell <pedidos@wtodocell.com.ar>
EMAIL_REPLY_TO=
ORDER_EMAIL_PROCESSOR_SECRET=
CRON_SECRET=
ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION=
ORDER_CONFIRMATION_TOKEN_SECRET_V1=
ORDER_CONFIRMATION_TOKEN_SECRET_V2=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Formatos esperados

| Variable | Formato | Obligatoria en produccion | Ejemplo ficticio |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL HTTPS del proyecto Supabase | Si | `https://project-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key publica | Si | `sb_publishable_xxx` |
| `NEXT_PUBLIC_SITE_URL` | URL HTTPS sin slash final | Si | `https://www.wtodocell.com.ar` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key server-only | Si para emails/outbox | `sb_secret_xxx` |
| `RESEND_API_KEY` | API key server-only de Resend | Si para enviar emails | `re_xxx` |
| `EMAIL_FROM` | `Nombre <email@dominio>` | Si para enviar emails | `W.todocell <pedidos@example.com>` |
| `EMAIL_REPLY_TO` | Email valido o vacio | No | `soporte@example.com` |
| `ORDER_EMAIL_PROCESSOR_SECRET` | String aleatorio largo | Si para procesar outbox | `email_processor_dev_secret_32_chars` |
| `CRON_SECRET` | String aleatorio largo server-only | No; solo cron futuro/externo | `cron_dev_secret_32_chars` |
| `ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION` | Numero `1` o `2`; no es secreto | Si | `1` |
| `ORDER_CONFIRMATION_TOKEN_SECRET_V1` | String aleatorio minimo 32 caracteres | Si cuando current version es `1` | `dev_v1_aaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `ORDER_CONFIRMATION_TOKEN_SECRET_V2` | String aleatorio minimo 32 caracteres | Si cuando current version es `2` | `dev_v2_bbbbbbbbbbbbbbbbbbbbbbbbbb` |
| `UPSTASH_REDIS_REST_URL` | URL HTTPS REST de Upstash | Si para rate limiting real | `https://example.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST server-only de Upstash | Si para rate limiting real | `AXXX...` |

Para rotar secrets de confirmacion:

1. Crear el nuevo secreto en la version no activa.
2. Cambiar `ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION` a esa version.
3. Mantener el secreto anterior mientras existan pedidos o emails emitidos con la version previa.
4. No reutilizar secretos entre versiones.

## Preview

Configurar:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Si Preview procesa emails o pedidos reales, tambien requiere las variables server-only correspondientes. Si no, mantener Resend/outbox desactivado.

## Development

Configurar localmente en `.env.local`:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Agregar variables server-only solo cuando se prueben pedidos/emails.

## Server-only

Nunca exponer al cliente:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `ORDER_EMAIL_PROCESSOR_SECRET`
- `CRON_SECRET`
- `ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION`
- `ORDER_CONFIRMATION_TOKEN_SECRET_V1`
- `ORDER_CONFIRMATION_TOKEN_SECRET_V2`
- `UPSTASH_REDIS_REST_TOKEN`

## Publicas

Estas variables se incorporan al bundle cliente:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

No colocar secretos en variables `NEXT_PUBLIC_*`.
