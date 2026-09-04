# W.todocell Production Checklist

Checklist operativo para cerrar W.todocell V1.0 antes de vender. Los items marcados como verificados fueron revisados en este repositorio local; los pendientes requieren validacion manual en Vercel, Supabase, Resend o produccion.

## 1. Git / release

- [x] Revisar `git status --short` antes de esta pasada.
- [x] Revisar `git log --oneline -5`.
- [ ] Crear commit de release despues de QA final.
- [ ] Crear tag de version si se adopta versionado para V1.0.

## 2. Variables de entorno

- [x] Existe guia en `PRODUCTION_ENVIRONMENT.md`.
- [ ] Configurar valores reales en Vercel Production.
- [ ] Confirmar que ningun secreto este en variables `NEXT_PUBLIC_*`.
- [ ] Confirmar `NEXT_PUBLIC_SITE_URL=https://www.wtodocell.com.ar`.

## 3. Supabase

- [x] El frontend usa Supabase server/client helpers centralizados.
- [ ] Verificar proyecto Supabase de produccion contra migraciones esperadas.
- [ ] Validar funciones RPC de pedidos, roles y outboxes en produccion.

## 4. Migraciones

- [x] No se modificaron migraciones historicas en esta pasada.
- [ ] Aplicar manualmente migraciones pendientes en Supabase si produccion no esta al dia.
- [ ] Registrar fecha, operador y resultado de cada migracion aplicada.

## 5. RLS

- [x] Existe checklist de RLS/seguridad en `SECURITY_CHECKLIST.md`.
- [ ] Confirmar RLS activo en tablas comerciales, cuenta, roles y outboxes.
- [ ] Confirmar que anon no tenga escrituras comerciales ni administrativas.

## 6. Roles

- [x] Admin usa `requireAdmin()`.
- [x] Gestion de usuarios usa flujo separado de super admin.
- [ ] Confirmar que exista al menos un `super_admin` real antes de operar.
- [ ] Activar MFA o control equivalente para cuentas admin si el plan lo permite.

## 7. Service Role

- [x] `SUPABASE_SERVICE_ROLE_KEY` esta aislado en helpers server-only.
- [ ] Configurar service role solo en Vercel server environment.
- [ ] Rotar la key si alguna vez fue compartida fuera del panel seguro.

## 8. Storage

- [x] Existe `STORAGE_HARDENING_PLAN.md`.
- [x] `next.config.ts` restringe imagenes remotas al bucket `product-images`.
- [ ] Auditar objetos huerfanos antes de borrar cualquier archivo.
- [ ] Definir estrategia para borradores/inactivos antes de privatizar buckets.

## 9. Backups

- [ ] Confirmar backups de Supabase habilitados segun plan.
- [ ] Exportar snapshot previo a migraciones de produccion.
- [ ] Documentar responsable y frecuencia de recuperacion.

## 10. Auth

- [x] Existen paginas de ingreso, registro, recuperacion y actualizacion de password.
- [x] Callback de Auth centralizado en `/auth/callback`.
- [ ] Configurar Site URL y Redirect URLs en Supabase.
- [ ] Probar confirmacion de email y recuperacion de password en produccion.

## 11. Resend

- [x] Existe integracion server-side para emails transaccionales.
- [ ] Verificar dominio `wtodocell.com.ar` en Resend.
- [ ] Configurar SPF, DKIM y DMARC.
- [ ] Configurar `RESEND_API_KEY`, `EMAIL_FROM` y reply-to reales.

## 12. SMTP

- [x] `EMAIL_SETUP.md` documenta SMTP de Supabase Auth.
- [ ] Activar Custom SMTP en Supabase Auth.
- [ ] Probar templates de confirmacion, reset y cambio de email.

## 13. Emails de pedidos

- [x] Existe `order_email_outbox`.
- [x] Endpoint manual de outbox requiere bearer secret.
- [ ] Probar compra real y verificar email `order_received`.
- [ ] Confirmar email `payment_confirmed` al aprobar pago.

## 14. Email de bienvenida

- [x] Existe `auth_email_outbox`.
- [x] Hay templates y preview local documentados.
- [ ] Probar bienvenida con usuario nuevo confirmado en produccion.

## 15. Checkout

- [x] Checkout usa Server Action y RPC `create_order`.
- [x] Guest checkout existe.
- [ ] Probar compra real completa en mobile y desktop.
- [ ] Verificar stock, historial, confirmacion y outbox despues de la compra.

## 16. Guest checkout

- [x] El flujo guest sigue soportado.
- [ ] Probar que un invitado pueda comprar sin cuenta.
- [ ] Confirmar que el link de confirmacion no exponga datos internos.

## 17. Pedidos

- [x] Cliente puede ver pedidos propios.
- [x] Admin puede listar y ver detalle de pedidos.
- [x] Admin puede exportar CSV con filtros.
- [ ] Probar cambios de estado con un pedido real de produccion controlado.

## 18. Admin

- [x] `/admin` muestra dashboard operativo.
- [x] Admin mantiene navegacion a contenido, productos, pedidos y usuarios.
- [ ] Probar dashboard con datos reales y cuenta admin real.

## 19. Gestion de usuarios

- [x] Existe panel de usuarios y roles.
- [x] Cambios sensibles requieren `requireSuperAdmin()`.
- [ ] Verificar auditoria de cambios de rol en produccion.

## 20. Rate limiting

- [x] Existe abstraccion de rate limit.
- [x] Produccion sin Upstash falla cerrado en politicas criticas.
- [ ] Configurar `UPSTASH_REDIS_REST_URL`.
- [ ] Configurar `UPSTASH_REDIS_REST_TOKEN`.
- [ ] Monitorear falsos positivos despues de activar.

## 21. CSP

- [x] Headers de seguridad estan en `next.config.ts`.
- [x] CSP permanece en Report-Only por defecto.
- [ ] Revisar reportes reales antes de activar enforcement.
- [ ] Activar `ENABLE_CSP_ENFORCE=true` solo despues de validar.

## 22. Dominio

- [x] URL canonica configurada como `https://www.wtodocell.com.ar` en config.
- [ ] Confirmar DNS del dominio en Vercel.
- [ ] Confirmar redireccion entre apex/www si corresponde.

## 23. HTTPS

- [x] Produccion usa URL HTTPS.
- [x] HSTS se agrega en deployments de produccion.
- [ ] Confirmar certificado valido en Vercel.

## 24. SEO

- [x] Metadata global y por pagina principal existente.
- [x] Metadata de producto y categoria existente.
- [x] Canonicals reutilizados.
- [ ] Verificar en Google Search Console despues del deploy.

## 25. Sitemap

- [x] Existe `src/app/sitemap.ts`.
- [x] Incluye home, tienda, busqueda, categorias y productos activos.
- [ ] Probar `/sitemap.xml` en produccion despues del deploy.

## 26. Robots

- [x] Existe `src/app/robots.ts`.
- [x] Bloquea admin, checkout, cuenta, auth y API.
- [ ] Probar `/robots.txt` en produccion despues del deploy.

## 27. Structured data

- [x] Organization y WebSite globales.
- [x] Product y BreadcrumbList en Product Page.
- [ ] Validar URLs reales con Rich Results Test.

## 28. 404/error

- [x] Existe `src/app/not-found.tsx`.
- [x] Existe `src/app/error.tsx`.
- [x] Existe `src/app/global-error.tsx`.
- [ ] Probar 404 y error controlado en produccion.

## 29. Performance

- [x] Hero evita depender de `matchMedia` post-hidratacion para renderizar imagen.
- [x] Se mantuvo `scrollbar-gutter: stable`.
- [x] Se mantuvo animacion del navbar por `background-position`.
- [ ] Medir Lighthouse/Web Vitals reales despues del deploy.

## 30. Accesibilidad

- [x] Hay estilos globales de `:focus-visible`.
- [x] Navbar/mega menu tienen labels y estados ARIA principales.
- [x] Paginacion/error/404 tienen acciones accesibles.
- [ ] Hacer QA manual de teclado completo en produccion.

## 31. Analytics

- [ ] No se verifico una integracion de analytics en el repo.
- [ ] Definir herramienta antes de V1.0 si se necesita medicion comercial.

## 32. Logs

- [x] Procesadores de email registran logs sanitizados.
- [ ] Revisar Vercel Function Logs despues de compra real.
- [ ] Confirmar que no se registren tokens ni secrets.

## 33. QA mobile

- [ ] Home, tienda, producto, carrito, checkout, cuenta y admin.
- [ ] Menu mobile, mini cart, filtros y busqueda.
- [ ] Formularios con teclado mobile.

## 34. QA desktop

- [ ] Home, tienda, producto, carrito, checkout, cuenta y admin.
- [ ] Mega menu, busqueda, filtros y export CSV.
- [ ] Estados de foco con teclado.

## 35. QA de produccion

- [ ] Compra real controlada.
- [ ] Email recibido.
- [ ] Pedido visible para cliente.
- [ ] Pedido visible para admin.
- [ ] Cambio de estado.
- [ ] Exportacion CSV.

## 36. Dependencias

- [x] Dependencias directas documentadas en `DEPENDENCY_AUDIT.md`.
- [ ] Revisar versiones antes de actualizaciones mayores.
- [ ] No usar `npm audit fix --force` sin revision.

## 37. npm audit

- [x] Ejecutar `npm audit` con red disponible.
- [x] Vulnerabilidades high corregidas con overrides puntuales.
- [ ] Mantener los overrides hasta que los paquetes padres publiquen versiones corregidas compatibles.
- [ ] Revisar nuevamente `npm audit` antes del deploy final.

## 38. Rollback basico

- [ ] Documentar deploy anterior estable en Vercel.
- [ ] Tener snapshot Supabase antes de migraciones.
- [ ] Si falla deploy sin migraciones nuevas, revertir deployment en Vercel.
- [ ] Si falla despues de migracion aditiva, revertir deploy y mantener datos.
