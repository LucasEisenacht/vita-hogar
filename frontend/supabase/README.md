# Supabase de VITA HOGAR

Este directorio define la instalacion desde cero para un proyecto Supabase nuevo,
vacio y exclusivo de VITA HOGAR. No debe vincularse ni aplicarse a proyectos de
otras aplicaciones.

## Alcance de las migraciones

Las migraciones crean solamente schema e infraestructura. No crean categorias,
productos, precios, stock, usuarios, roles administrativos ni contenido comercial.
El unico `insert` intencional de la cadena registra el bucket de infraestructura
`product-images` en `storage.buckets`.

| Version | Responsabilidad | Dependencias principales |
| --- | --- | --- |
| `00100` | Perfiles y trigger de alta de usuario | `auth.users` |
| `00200` | Roles, rol inicial `customer` y helpers de autorizacion | `profiles`, `auth.users` |
| `00300` | Categorias, productos y RLS de catalogo | helpers de roles |
| `00400` | Metadatos de imagenes, bucket y politicas de Storage | productos, roles, Storage |
| `00500` | Favoritos | usuarios, productos |
| `00600` | Pedidos, items, historial y RPC iniciales | usuarios, productos, roles |
| `00700` | Atributos comerciales genericos y actualizacion de checkout | productos, pedidos |
| `00800` | Reposicion de stock al cancelar | pedidos, productos |
| `00900` | Permiso para helper de arrays | helper creado en `00700` |
| `01000` | Variantes de modelo y RPC administrativos | productos, roles |
| `01100` | Sincronizacion y endurecimiento de variantes/stock | variantes, productos |
| `01200` | Schema y RLS de contenido Home, sin contenido inicial | roles |
| `01300` | Checkout definitivo, confirmacion privada y stock de variantes | pedidos, variantes, imagenes |
| `01400` | Outbox y RPC de emails de pedidos | pedidos e items |
| `01500` | Borrado administrativo de productos | productos, roles |
| `01600` | Clave de color en imagenes | imagenes de producto |
| `01700` | Color en variantes y RPC administrativos finales | variantes, productos |
| `01800` | Trigger endurecido de email de pago confirmado | pedidos, outbox |
| `01900` | Reclamo concurrente seguro del outbox | outbox de pedidos |
| `02000` | Compatibilidad de columnas de confirmacion | pedidos |
| `02100` | Reconciliacion idempotente del outbox y RPC de consulta | pedidos, items, historial |
| `02200` | Payload final de emails de pedidos | outbox de pedidos |
| `02300` | Eventos de despacho y entrega | pedidos, outbox |
| `02400` | Outbox de emails de Auth | `auth.users` |
| `02500` | Gestion auditada de roles y vistas seguras | roles, pedidos |
| `02600` | Perfil ampliado y direcciones de clientes | perfiles, `auth.users` |

Los numeros de version son unicos y determinan el orden de aplicacion.

## Datos que deben cargarse despues

Antes de desactivar el modo demo se deben definir y cargar, con informacion real:

1. categorias de VITA HOGAR;
2. productos, precios, disponibilidad y stock;
3. variantes, si cada producto las necesita;
4. imagenes en el bucket `product-images` y sus filas en `product_images`;
5. contenido Home y enlaces comerciales reales;
6. un usuario real creado mediante Auth y el bootstrap controlado del primer
   `super_admin`.

No existe un seed automatico del primer administrador. Una vez creado el usuario
en el proyecto nuevo, el propietario del proyecto debe asignar el rol
`super_admin` de forma manual y auditada durante el bootstrap. A partir de ahi,
la aplicacion puede administrar los demas roles con `manage_user_role`.

## Procedimiento posterior de aplicacion

No ejecutar estos pasos hasta contar con autorizacion y con el identificador del
proyecto nuevo de VITA HOGAR.

```powershell
cd C:\proyectos\vita-hogar\frontend
npx supabase login
npx supabase link --project-ref <VITA_HOGAR_PROJECT_REF>
npx supabase migration list --linked
npx supabase db push --linked
```

Antes del `db push`, verificar visualmente que el project ref sea el proyecto
nuevo y exclusivo de VITA HOGAR. Despues de aplicar el schema se configuran Auth,
URLs de redireccion, variables de entorno y datos reales; no antes.

## Validacion local

La validacion completa de ejecucion requiere Supabase local (CLI y Docker) o el
proyecto nuevo autorizado. Sin esas herramientas solo puede validarse de forma
estatica el orden, la unicidad de versiones, las dependencias, la ausencia de
seeds comerciales y la compilacion de la aplicacion.
