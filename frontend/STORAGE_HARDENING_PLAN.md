# W.todocell Storage Hardening Plan

Bucket auditado: `product-images`.

## Estado actual

- El bucket es publico.
- La tabla `public.product_images` usa RLS.
- Las policies de `storage.objects` restringen escritura a usuarios admin.
- Las URLs publicas de objetos siguen siendo accesibles si alguien conoce la ruta.

## Limitacion real

Una policy mas estricta sobre `storage.objects` no alcanza para ocultar objetos si el bucket sigue siendo publico y se sirven URLs publicas. Por eso no se aplico una migracion automatica en esta etapa.

## Estrategias posibles

### Opcion A: bucket publico solo para productos activos

- Mantener un bucket publico para imagenes publicadas.
- Mover imagenes de borradores/inactivos a otro bucket.
- Publicar/copiar al bucket publico solo al activar el producto.

Ventaja: no rompe URLs publicas del catalogo.  
Costo: requiere proceso de promocion/publicacion.

### Opcion B: bucket privado para borradores

- Crear `product-images-drafts` privado.
- Usar signed URLs en admin.
- Mover al bucket publico al publicar.

Ventaja: protege contenido no publicado.  
Costo: requiere cambios en admin y flujo de publicacion.

### Opcion C: bucket privado completo

- Convertir todas las imagenes a URLs firmadas o proxy propio.

Ventaja: maximo control.  
Costo: mayor complejidad, cache menos simple y posible impacto en performance.

## Objetos huerfanos

Pendiente crear una tarea de auditoria que compare:

- objetos en `storage.objects`;
- filas en `public.product_images`;
- estado `products.is_active`.

No borrar objetos automaticamente sin reporte previo.

## Recomendacion

Implementar primero Opcion B para borradores/inactivos y mantener el bucket publico para productos activos. Es la ruta menos riesgosa para no romper el catalogo publico.
