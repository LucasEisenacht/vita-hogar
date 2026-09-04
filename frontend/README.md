# W.todocell Frontend

Frontend del e-commerce W.todocell, una tienda de accesorios y tecnologia con
una identidad visual femenina, minimalista y premium.

## Desarrollo

Instalar dependencias si el entorno aun no las tiene:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Normalmente Next.js levanta en [http://localhost:3000](http://localhost:3000).

## Comandos

```bash
npm run dev
npm run lint
npm run build
```

## Stack

- Next.js con App Router
- React
- TypeScript
- Tailwind CSS v4

## Configuracion de pedidos y emails

El checkout y el procesador de emails requieren estas variables de entorno en
servidor, sin exponer valores reales en el repositorio:

```bash
ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION=1
ORDER_CONFIRMATION_TOKEN_SECRET_V1=
ORDER_CONFIRMATION_TOKEN_SECRET_V2=
SUPABASE_SERVICE_ROLE_KEY=
ORDER_EMAIL_PROCESSOR_SECRET=
CRON_SECRET=
RESEND_API_KEY=
EMAIL_FROM="W.todocell <pedidos@tu-dominio.com>"
EMAIL_REPLY_TO=
EMAIL_PROVIDER_TIMEOUT_MS=10000
NEXT_PUBLIC_SITE_URL=
```

`ORDER_CONFIRMATION_TOKEN_SECRET_V1` debe conservar el secreto original usado
para pedidos historicos. Las versiones futuras se agregan sin reescribir tokens
ni guardar tokens planos.

## Configuracion de emails con Resend

La integracion transaccional usa la API HTTP de Resend directamente:
`POST https://api.resend.com/emails`. El envio considera exitoso solo un HTTP
2xx con JSON valido que incluya `{ "id": "provider-message-id" }`.

Pasos manuales:

1. Crear una cuenta en Resend.
2. Agregar un dominio propio de W.todocell.
3. Verificar los registros SPF y DKIM indicados por Resend.
4. Configurar DMARC si el dominio todavia no lo tiene.
5. Crear una API key con permisos de envio.
6. Configurar `RESEND_API_KEY` en el entorno seguro.
7. Definir `EMAIL_FROM` con formato `W.todocell <email@dominio-verificado>`.
8. Definir `ORDER_EMAIL_PROCESSOR_SECRET` para poder ejecutar manualmente el processor protegido.
9. Probar primero con un email controlado antes de usar clientes reales.
10. Nunca publicar `RESEND_API_KEY` ni `SUPABASE_SERVICE_ROLE_KEY`.

En desarrollo se puede usar temporalmente el remitente de prueba permitido por
Resend, pero no hay fallback automatico en el codigo. En produccion el sender
debe pertenecer a un dominio verificado.

En produccion Hobby, el checkout agenda con `after()` de Next.js el
procesamiento de un lote chico del outbox despues de crear el pedido. El
endpoint protegido sigue disponible para reintentos manuales o automatizacion
futura.
