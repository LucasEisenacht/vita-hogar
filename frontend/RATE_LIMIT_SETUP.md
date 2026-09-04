# W.todocell Rate Limiting

La aplicacion incluye una abstraccion en `src/lib/security/rate-limit.ts`.

## Estado actual

- Desarrollo: usa un contador en memoria, solo para pruebas locales.
- Produccion con `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`: usa Redis distribuido por REST.
- Produccion sin proveedor: no se declara protegido. Los endpoints criticos pueden fallar cerrado.

No se usa `Map` en memoria como solucion de produccion porque Vercel puede ejecutar multiples instancias serverless.

## Variables

```txt
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Ambas son server-only.

## Procesadores internos

El procesador interno del outbox de pedidos no usa este rate limiter distribuido. El checkout lo agenda server-side con `after()` despues de una RPC exitosa, y el endpoint manual `/api/emails/process-order-outbox` esta protegido por bearer secret server-only (`CRON_SECRET` o `ORDER_EMAIL_PROCESSOR_SECRET`), lote fijo e idempotencia de outbox. Esto evita que el envio transaccional de pedidos quede inutilizado si Upstash todavia no esta configurado, sin debilitar endpoints publicos.

## Limites iniciales propuestos

- Busqueda publica: 60 requests por minuto por IP.
- Recomendaciones: 80 requests por minuto por IP.
- Creacion de pedidos: 5 a 10 pedidos cada 10 minutos por IP/sesion.
- Recuperacion de contrasena: 3 a 5 intentos cada 15 minutos por IP/email.
- Login: 5 a 10 intentos cada 10 minutos por IP/email.
- Registro: 3 a 5 intentos cada hora por IP/email.

Los tres ultimos flujos usan Supabase Auth desde cliente. Para limitarlos de forma fuerte conviene moverlos a Server Actions/Route Handlers propios o configurar protecciones nativas de Supabase/Auth.

## Pendientes

- Configurar Upstash Redis o proveedor equivalente en Vercel.
- Activar limites en checkout/auth cuando esos flujos pasen por servidor propio.
- Monitorear falsos positivos antes de endurecer limites.
- Agregar alertas si un endpoint critico queda sin proveedor distribuido.
