# VITA HOGAR — Design System

Estado: documento fuente de verdad para la futura implementación visual.
Alcance: auditar, definir y documentar. Esta etapa no implementa CSS, componentes, layouts, assets ni fuentes en código.

## 0. Principio rector

VITA HOGAR debe sentirse como una marca real de hogar, blanquería y decoración: cálida, serena, material, confiable y editorial. Debe vender con claridad sin parecer una plantilla SaaS, una marca tech reciclada ni una demo generada por IA.

La funcionalidad heredada de W.todocell se conserva como estructura técnica. La identidad visual, el lenguaje fotográfico, el contenido y la jerarquía comercial se reemplazarán de forma controlada en etapas posteriores.

Regla de decisión: cada elemento visual debe justificar su existencia por marca, comprensión o conversión. Si solo decora, se elimina.

## 1. Auditoría visual heredada

### 1.1 Estado observado

El frontend usa Next.js App Router, React, TypeScript y Tailwind CSS v4. La estructura está separada en rutas públicas, tienda, producto, carrito, checkout, cuenta, auth, APIs y admin.

Puntos auditados:

- src/app/globals.css tiene 1199 líneas y concentra tokens, fondos, superficies, efectos ambientales, sparkles, estados y animaciones.
- src/app/layout.tsx contiene shell global, metadata y carga de fuentes.
- Navbar tiene aproximadamente 1023 líneas y reúne navegación, búsqueda, cuenta, carrito y mega menú.
- Home compone hero, categorías, showcases, beneficios, lifestyle, Instagram, newsletter y footer.
- Tienda y categorías incluyen filtros, orden, grillas, estados vacíos y navegación.
- Producto incluye galería, información, variantes, compra, beneficios, detalles y relacionados.
- Carrito, checkout, cuenta, auth y admin tienen flujos funcionales que deben mantenerse.
- Los componentes compartidos incluyen Container, Card, Button, ProductCard, inputs, loaders y estados vacíos.
- Las imágenes usan next/image, ratios declarados, object-fit y posiciones por asset.
- Hay breakpoints Tailwind, variantes mobile/desktop y clases motion-reduce puntuales.

### 1.2 Decisiones heredadas que deben desaparecer

- Rosa pastel como color primario dominante.
- Fondos con múltiples radial gradients y gradientes verticales permanentes.
- Glassmorphism, backdrop-filter y superficies translúcidas como lenguaje general.
- Sparkles, estrellas, brillos, halos y partículas ambientales.
- Animaciones de ambient drift, wave breathe, sparkle y twinkle.
- Radios 999px, botones pill y tarjetas excesivamente redondeadas.
- Sombras suaves aplicadas a demasiados elementos.
- Blobs, glow y figuras flotantes sin función.
- Categorías, copy e imágenes de celulares, accesorios, gaming, fundas y tecnología.
- Logos, favicon, metadata, redes y URLs de W.todocell.
- Secuencias de secciones compuestas por cards repetidas.

Los tokens actuales son evidencia de lo que debe reemplazarse, no la base de la paleta final.

### 1.3 Reutilización estructural

Se conserva, salvo incompatibilidad posterior:

- App Router, providers y contexto de carrito.
- Queries, normalización, estados de carga y estados vacíos.
- Container, botones, inputs y componentes UI como contratos funcionales.
- ProductCard como contrato de datos, no como piel visual.
- Galería, variantes, CTA de compra y resumen.
- Filtros, orden, categorías y rutas públicas.
- Flujos de checkout, cuenta, favoritos, pedidos y admin.
- Server Components y carga de datos en servidor.
- next/image, metadata dinámica, alt y ratios.

Necesitan nueva piel: botones, inputs, selects, controles de cantidad, estados vacíos, carrito, checkout y admin.

Necesitan rediseño real: navbar, mega menú, hero, Home, categorías, product cards, grillas, página de producto, footer, fotografía, tokens, tipografías, motion y responsive.

## 2. Referencias recibidas

### 2.1 Logo real

El logo real de VITA HOGAR fue recibido como PNG transparente.

- Dimensión: 500 × 500 px.
- Modo: RGBA.
- Fondo: transparente.
- Área visible con margen interior.
- Lectura cromática objetiva: marca oscura/negra sobre transparencia.

Reglas futuras:

- El logo real será la fuente de identidad; no se reconstruirá con texto.
- No aplicar filtros, gradientes, glow, sombras ni recolor automático.
- Preparar variantes horizontal, compacta, monocroma y favicon en implementación.
- Mantener espacio de protección equivalente a la altura de la V como punto de partida.
- No copiar el logo dentro de otros elementos decorativos.

### 2.2 Render de referencia

El render/mockup recibido es una composición vertical de 1024 × 1536 px, con predominio de valores claros y neutros.

Se usa solo para orientar clima luminoso, calidez, jerarquía editorial, relación entre espacio/producto/ambiente y familia de neutros naturales.

No se copia layout, composición, textos, cards, proporciones, tratamiento de imagen, decoración ni navegación. La propuesta debe ser más coherente, legible y propia que el render.

## 3. Dirección visual VITA HOGAR

### 3.1 Concepto

Hogar sereno, material y habitable.

Palabras guía: lino, algodón, madera clara, cerámica, fibras, luz de mañana, tactilidad, orden, descanso, cuidado, detalle cotidiano, editorial de interiorismo y premium accesible.

### 3.2 Personalidad

- Cálida, no infantil.
- Sofisticada, no ostentosa.
- Premium, no inaccesible.
- Editorial, no ornamental.
- Doméstica, no rústica por defecto.
- Moderna, no tecnológica.
- Clara, no fría.
- Material, no texturizada artificialmente.

### 3.3 Principios de composición

1. Una imagen o producto debe tener protagonismo real.
2. El espacio vacío debe separar y jerarquizar.
3. La asimetría debe ser controlada y repetible.
4. La interfaz debe alternar inspiración y compra.
5. Las superficies se distinguen primero con fondo, espacio y tipografía.
6. La textura proviene de la fotografía y el contenido, no de noise overlay.
7. La decoración no compite con el producto.
8. Los CTA son visibles sin dominar toda la pantalla.
9. La consistencia se logra con tokens y reglas, no con la misma card en todas partes.

## 4. Paleta

Paleta objetivo recomendada. Implementar como tokens semánticos, no como HEX dispersos.

| Token | HEX | Función | Uso | No usar |
|---|---|---|---|---|
| background | #F6F1E8 | Marfil cálido | Canvas general | Inputs o CTA |
| background-alt | #E9DFD1 | Arena suave | Bandas y capítulos | Texto pequeño |
| surface | #FFFDF8 | Superficie limpia | Formularios y módulos necesarios | Fondo único de todo |
| surface-elevated | #FFFFFF | Claridad máxima | Menús, modales y resumen | Tarjetas apiladas |
| text-primary | #2E2924 | Espresso | Títulos, body, precios | Sin invertir en fondos oscuros |
| text-secondary | #625A50 | Café grisáceo | Descripciones y apoyo | Labels muy pequeños sin validar |
| muted | #8A7F73 | Baja prioridad | Captions y metadata | Instrucciones esenciales |
| border | #D6C9BA | Línea cálida | Divisores, inputs y límites | Marcos decorativos |
| accent-primary | #7B5D43 | Madera/caramelo profundo | CTA y links de acción | Fondo global o gradiente |
| accent-secondary | #71806E | Salvia apagado | Acentos naturales y estados | Color dominante repetido |
| success | #3F6B4A | Verde profundo | Confirmaciones y stock | Adorno |
| warning | #8A622D | Ocre oscuro | Avisos y stock bajo | Bloques extensos |
| error | #A33F3B | Rojo arcilla | Errores y destructive | Color de marca |
| focus-ring | #6E4A32 | Bronce oscuro | Focus-visible sobre claros | Texto general |

Reglas:

- text-primary: objetivo mínimo 7:1 sobre background y surface.
- text-secondary: mínimo 4.5:1 en texto normal.
- muted solo para información no esencial y siempre validado contra el fondo real.
- CTA primario con combinación que alcance mínimo 4.5:1.
- Links no dependen solo del color: añadir subrayado, peso o contexto.
- Focus ring visible sobre control y fondo, con offset de 2 px.
- No usar gradientes en la paleta base.
- Madera/caramelo, salvia y cobre son acentos, no fondos generales.
- Máximo tres colores cromáticos visibles por sección además de neutros.

## 5. Tipografías

### 5.1 Familias

- Display/editorial: Newsreader, pesos 400 y 500.
- Heading: Newsreader, pesos 400 y 500; itálica solo con intención.
- Body/UI: Source Sans 3, pesos 400, 500, 600 y 700.
- Labels: Source Sans 3, 600, tracking moderado.
- Precio: Source Sans 3, 600 o 700.
- Números/dashboard: Source Sans 3 con números tabulares.
- Fallback display: Georgia, Times New Roman, serif.
- Fallback UI: Arial, Helvetica, sans-serif.

No implementar fuentes en esta etapa.

### 5.2 Escala

| Rol | Desktop | Mobile | Line-height | Weight | Uso |
|---|---:|---:|---:|---:|---|
| Display XL | 64 px | 44 px | 0.98–1.04 | 400 | Hero, una vez |
| H1 | 52 px | 38 px | 1.02–1.08 | 400/500 | Página o colección |
| H2 | 40 px | 30 px | 1.08–1.14 | 400/500 | Capítulos editoriales |
| H3 | 28 px | 24 px | 1.12–1.18 | 500 | Producto y subcolección |
| H4 | 21 px | 19 px | 1.2 | 600 | Título operativo |
| Body large | 20 px | 18 px | 1.45 | 400 | Bajada |
| Body | 16 px | 16 px | 1.5 | 400 | Lectura |
| Small | 14 px | 14 px | 1.45 | 400/500 | Metadata |
| Label | 12 px | 12 px | 1.2 | 600 | Labels |
| Caption | 11 px | 11 px | 1.35 | 500 | Nota |

Párrafos editoriales de 58–66 caracteres por línea. Uppercase solo en labels y navegación secundaria. Display máximo de tres líneas desktop y cuatro mobile. Precio identificable sin competir con el título.

## 6. Grid, layout y ritmo

- Wide desktop: máximo 1440 px para campañas puntuales.
- Contenedor principal: máximo 1280 px.
- Editorial estrecho: máximo 680 px.
- Lectura larga: máximo 720 px.
- Gutters: 32 px desktop, 24 px tablet, 16 px mobile.
- Desktop: 12 columnas, gutter 24 px.
- Tablet: 8 columnas, gutter 20 px.
- Mobile: 4 columnas, gutter 16 px.
- Breakpoints conceptuales: 640, 768, 1024, 1280 y 1536 px.
- Unidad base de spacing: 4 px; escala 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120.
- Secciones: 96 px desktop, 64 px tablet, 48 px mobile.
- Capítulos de inspiración pueden llegar a 128 px desktop si la foto lo justifica.
- Relación label/título: 12 px; título/bajada: 16–24 px; contenido/CTA: 24–32 px.
- Nunca usar un ancho fijo que provoque scroll horizontal.

La Home debe alternar impacto visual, orientación, compra rápida, pausa editorial, prueba/beneficio, inspiración y cierre comercial. No usar tres secciones de cards consecutivas. Cada sección debe cambiar al menos dos variables entre densidad, escala, alineación, fondo, copy o interacción.

## 7. Radios, bordes y sombras

- radius-sm: 4 px para inputs y controles pequeños.
- radius-md: 8 px para botones, campos y cards funcionales.
- radius-lg: 14 px para módulos editoriales o paneles de compra.
- radius-full: solo avatar, indicador circular, swatch o control circular.
- No superar 16 px sin razón compositiva.

Borde: 1 px sólido border. Usarlo para separar o contener, no para enmarcar todo.

Sombras:

- Nivel 0: ninguna.
- Nivel 1: 0 4px 16px rgba(46, 41, 36, 0.06) para dropdowns y superficies elevadas.
- Nivel 2: 0 12px 32px rgba(46, 41, 36, 0.08) para modal o resumen sticky.

No combinar sombra fuerte, borde brillante y backdrop blur. No usar sombra permanente en cada producto.

## 8. Botones

Primary: altura 44 px, o 48 px en compra; padding horizontal 20–24 px; radius 6–8 px; fondo accent-primary; texto blanco, Source Sans 3 semibold, 15–16 px; hover oscurece 8–10% sin translate ni glow; focus-visible con focus-ring de 2 px y offset 2 px; disabled usa border y muted sin opacidad extrema.

Secondary: transparente o surface, borde border, texto text-primary; hover background-alt y borde accent-primary.

Tertiary/text: sin caja, accent-primary o text-primary, subrayado o cambio de peso al hover, área táctil mínima 44 px.

Destructive: solo para acciones irreversibles; preferir secondary con borde error cuando no sea la acción principal; requiere confirmación.

Icon button: mínimo 44 × 44 px, icono 20–22 px, label accesible obligatorio.

No usar gradientes, glow, botones gigantes, pills universales ni múltiples estilos compitiendo.

## 9. Inputs y formularios

Base: altura mínima 44 px, radius 6–8 px, fondo surface, borde border, padding 12–14 px, label real arriba, helper asociado y placeholder solo como ejemplo.

Estados:

- Default: border y text-primary.
- Hover: borde más oscuro.
- Focus: focus-ring visible.
- Error: error, mensaje textual y no solo color.
- Success: solo si aporta información.
- Disabled: background-alt, muted y explicación cuando no sea obvio.
- Loading: conservar label y estructura.

Select con control claro. Textarea inicial de 112–144 px. Checkbox/radio con área táctil mínima de 44 px. Search con label, limpiar y estado vacío. Quantity con botones 44 × 44 px y límites anunciados. Errores de checkout junto al campo y en resumen si son varios.

## 10. Cards y productos

Un producto no debe parecer una tarjeta de dashboard. La imagen manda y el chrome se reduce.

Product card:

- Ratio de imagen 4:5 por defecto.
- object-fit cover con contexto; contain solo para producto recortado con fondo controlado.
- Fondo de imagen background-alt o surface.
- Sin sombra ni borde permanente salvo necesidad.
- Nombre máximo de dos líneas.
- Precio visible; cuotas debajo con menor contraste.
- Máximo un badge, solo si cambia la decisión.
- Favorito discreto con label accesible.
- Hover desktop: escala máxima 1.02 y cambio informativo sutil, sin levantar la card.
- No overlay de texto salvo que el asset lo soporte.
- Mobile no depende de hover.

Category card: preferir fotografía de ambiente o detalle textil a ilustraciones geométricas. Debe comunicar ambiente, material o uso.

Empty state: copy útil, una acción principal y tratamiento sobrio; sin sparkles, blobs ni ilustración genérica de IA.

## 11. Fotografía

Dirección: luz natural lateral o difusa, interiores reales, lino, algodón, tejidos, madera clara, cerámica, piedra y fibras. Paleta cálida desaturada con contraste. Estilismo editorial con pocos objetos. Producto en contexto cuando explique escala, uso o tactilidad.

Tratamiento:

- Hero: una escena fuerte con profundidad y área de descanso para mensaje.
- Categorías: ambientes o detalles que distingan categoría en menos de dos segundos.
- Producto: fondo limpio o ambiente controlado, producto nítido.
- Lifestyle: escenas reales, cuidadas y no stock.
- Banners: una idea, sin texto incrustado.
- Inspiración: secuencias de 2–4 imágenes con ritmo de revista.

Prohibido: CGI evidente, fondos artificiales brillantes, exceso de props, texto dentro de la imagen, fotos stock reconocibles, recortes que destruyan textura e imágenes gigantes sin sizes o formato moderno.

## 12. Navbar

Dirección: casa editorial clara.

- Altura: 76 px desktop, 64 px mobile.
- Fondo opaco surface o background, con borde inferior sutil.
- Sticky permitido con altura estable y sin blur como recurso principal.
- Logo real a la izquierda, sobrio y con espacio de protección.
- Navegación: Ambientes, Textiles, Deco e Inspiración solo cuando el contenido esté confirmado.
- Búsqueda accesible y fácil de encontrar.
- Cuenta y carrito a la derecha; indicador numérico discreto.
- Mega menú funcional conservable como panel editorial de columnas de texto e imagen.
- Mobile: foco atrapado, cierre claro, jerarquía y carrito persistente.
- No navbar transparente por defecto sobre hero.
- No brillos, sparkles, glass premium ni iconos decorativos.

## 13. Hero

Dirección principal: escena editorial con columna de mensaje.

- Grid asimétrico 7/5 desktop.
- Imagen de ambiente en el bloque principal.
- Columna de mensaje sobre marfil o arena sólido.
- Headline breve en Newsreader, bajada de 2–3 líneas, un CTA primary y opcionalmente un link.
- Mobile: imagen arriba y mensaje debajo.
- Altura determinada por contenido y foto, no por viewport completo obligatorio.

Se elige porque mantiene protagonismo fotográfico, separa inspiración y acción, evita el hero tech y no copia el render.

Alternativas descartadas:

1. Full-bleed con texto superpuesto: mayor riesgo de contraste pobre y campaña genérica.
2. Tríptico de ambientes: reduce el foco inicial y se siente catálogo demasiado pronto.

## 14. Home — arquitectura visual

Secuencia recomendada, reducible según catálogo:

1. Hero editorial.
2. Ambientes o formas de habitar: una imagen dominante y dos apoyos, no cinco cards iguales.
3. Novedades: grilla de baja decoración, máximo cuatro visibles en desktop.
4. Colección destacada: imagen grande + material, uso y cuidado.
5. Pausa lifestyle con copy corto.
6. Más elegidos: módulo de compra más denso.
7. Beneficios: tres razones concretas.
8. Inspiración/lookbook, no carrusel automático.
9. Newsletter específica sobre novedades, cuidado y hogar.
10. Footer con ayuda, políticas, navegación y redes confirmadas.

## 15. Tienda y categorías

Tienda: H1, bajada breve, contexto; filtros y orden sobrios; desktop con filtros visibles; mobile con drawer accesible y resumen de activos; cantidad de resultados clara; grilla base de 4 columnas desktop, 3 tablet y 2 mobile, ajustable por imagen; empty state útil.

Category chips solo si ayudan; no fila infinita de pills.

Living, Dormitorio, Baño, Cocina/Comedor, Deco, Textiles, Mantas, Almohadones, Cestas y Aromas/Velas son hipótesis, no contenido definitivo hasta confirmación del cliente.

## 16. Product page

- Desktop: galería 6 columnas e información/compra 6 columnas.
- Mobile: galería, título/precio/CTA temprano, detalles después.
- Galería consistente, navegación accesible y zoom solo si aporta.
- Título, precio, cuotas, stock y CTA sin pared de cajas.
- Variantes con labels reales y selección clara.
- Envío, cambios y cuidado cerca de la decisión.
- Descripción y características por jerarquía, no por tarjetas apiladas.
- Relacionados al final.
- CTA sticky mobile solo si no tapa contenido.
- No paneles translúcidos ni sombras flotantes para cada bloque.

## 17. Carrito, checkout, cuenta y admin

Mantener funcionalidad y flujos.

Carrito/checkout/cuenta:

- Fondo background y resumen surface.
- Una jerarquía principal por pantalla.
- Progress discreto, no wizard ornamental.
- Inputs y errores según reglas anteriores.
- Un CTA primary visible.
- Resumen sticky solo si mejora comprensión.
- Mobile con resumen colapsable y CTA accesible.
- Estados vacíos útiles, sin ilustración decorativa innecesaria.

Admin:

- Operativo, no editorial.
- Mantener rutas y arquitectura.
- Logo/nombre de VITA HOGAR cuando se implemente la piel.
- Fondo neutro, paneles claros, controles 40–44 px.
- Tablas alineadas, estados claros y acciones seguras.
- Sin hero, lookbook, sparkles, motion ambiental ni marketing.

## 18. Motion

- Hover de imagen: 180–240 ms, escala máxima 1.02.
- Color/borde: 120–180 ms.
- Entrada de sección: fade y desplazamiento máximo 8 px, 240–360 ms.
- Modal/drawer: 180–240 ms.
- Feedback de botón inmediato y corto.
- Sin autoplay, parallax por defecto, GSAP, WebGL, Three.js o librerías nuevas.
- No animar fondos, partículas ni texto continuamente.
- Una animación de entrada como máximo por sección.
- Respetar prefers-reduced-motion: quitar desplazamiento, escala y loops; conservar cambio de estado.
- Motion no debe ser necesario para comprender, encontrar o comprar.

## 19. Responsive

Mobile no es desktop apilado:

- Header compacto y navegación jerárquica.
- CTA siempre accesible.
- Dos columnas solo si imagen y precio siguen siendo legibles.
- Filtros en drawer con foco y cierre.
- Galería usable por tap/swipe.
- Display reducido sin perder carácter.
- Evitar copy centrado largo y espacios gigantes.

Tablet: reducir gutters y altura de imagen, usar 2–3 columnas según contexto y no duplicar controles.

Desktop: usar asimetría y ancho de texto controlado; reservar 12 columnas para composición.

Wide desktop: aumentar aire y escala de imagen sin estirar texto; contenido máximo 1280–1440 px.

## 20. Accesibilidad

- Contraste validado para cada combinación real.
- focus-visible visible en links, botones, inputs, cards interactivas y drawers.
- Navegación completa por teclado y orden de foco lógico.
- Labels reales, helper text asociado y errores anunciables.
- Alt descriptivo para producto/ambiente; alt vacío para decoración redundante.
- Semántica HTML correcta.
- No comunicar estados solo con color.
- Targets mínimos 44 × 44 px.
- Dialogs con foco atrapado y retorno al disparador.
- prefers-reduced-motion.
- No emojis como iconografía comercial.
- Validar zoom 200%, reflow y ausencia de scroll horizontal.

## 21. Performance

- next/image con sizes correcto.
- AVIF/WebP y dimensiones acordes al uso.
- No priorizar todas las imágenes.
- Una familia display y una UI, con pesos limitados.
- Evitar video hero por defecto.
- Server Components cuando no haya interacción.
- CSS antes que JS para transiciones simples.
- Imágenes debajo del fold lazy y con espacio reservado.
- No sumar librerías de animación por estética.
- Verificar mobile lento antes de aprobar secciones.

## 22. ANTI-AI-SLOP GUARDRAILS

Prohibido o limitado:

- Gradientes arbitrarios y purple/blue tech gradients.
- Glassmorphism genérico y backdrop blur por defecto.
- Sombras excesivas y cards flotantes repetidas.
- Pill buttons universales.
- Blobs, sparkles, partículas y glow sin función.
- Iconos random o mezclas de familias.
- Emojis en UI comercial.
- Copy como “Elevá tu experiencia”, copy genérico o microcopy corporativo vacío.
- Hero de startup y métricas decorativas.
- Animaciones constantes, parallax, stagger generalizado y texto entrando desde todos lados.
- Layouts simétricos repetitivos y bento grids por moda.
- Noise/grain artificial sin intención.
- Badges, ribbons, stickers y 3D gratuitos.
- Texto incrustado en imágenes.
- Cuatro cards idénticas como solución universal.
- Carruseles sin propósito.
- Interfaz de tienda que parezca dashboard.
- Colores fuera de tokens semánticos.

En su lugar:

- Paleta corta y contraste medido.
- Separación por espacio, alineación y cambio de fondo.
- Fotografía para explicar material y uso.
- Asimetría con una razón concreta.
- Una idea por sección.
- Color reservado para acción, estado y jerarquía.
- Animación solo para explicar una transición.
- Copy específico sobre hogar, material, cuidado o uso.
- Revisión mobile, reduced motion y accesibilidad.
- Eliminar cualquier recurso que no mejore marca, comprensión o conversión.

Test de aprobación:

1. ¿Se reconoce hogar/deco sin leer el logo?
2. ¿La fotografía domina donde debe?
3. ¿Hay más de un tratamiento de card compitiendo?
4. ¿Podría pertenecer a cualquier startup?
5. ¿Hay gradiente, blob, glow o pill innecesario?
6. ¿La acción se entiende sin hover?
7. ¿El contraste funciona en mobile?
8. ¿La sección funciona sin animación?
9. ¿El copy describe algo real?
10. ¿Se ve como VITA HOGAR y no como W.todocell beige?

## 23. Plan de implementación visual

Fase 0, preparación: confirmar logo, tokens, escala, fuentes y retirar clases obsoletas sin tocar funcionalidad.

Fase 1, shell: layout global, fondo, tipografía, Container, rhythm, navbar, menú mobile, footer, focus y reduced motion.

Fase 2, Home: hero, ambientes, novedades, colección, lifestyle, beneficios, inspiración y newsletter.

Fase 3, tienda/producto: header, filtros, grilla, empty states, ProductCard, categorías, galería, variantes y compra.

Fase 4, compra/cuenta: carrito, checkout, cuenta, favoritos, pedidos y estados.

Fase 5, admin: nombre, logo, paleta operativa, tablas, formularios y acciones.

Fase 6, QA: responsive, contraste, teclado, reduced motion, imágenes, performance y anti-AI-slop.

## 24. Skill/guardrail

Candidatos evaluados: taste-skill, SkillUI y Dembrandt.

Elección: taste-skill como guardrail conceptual anti-slop para agentes.

Motivo:

- Su objetivo declarado coincide con prevenir frontend genérico.
- Puede servir como criterio de composición, jerarquía y variación durante implementación.
- Queda subordinado a este DESIGN.md y al logo real.
- No debe reescribir arquitectura, instalar dependencias, cambiar tokens automáticamente ni sustituir decisiones de marca.
- SkillUI no pudo identificarse con una fuente oficial confiable en esta etapa.
- Dembrandt es útil para extracción/generación automatizada, pero crawl y decisiones externas tienen más riesgo de importar patrones ajenos.

Instalada: NO.

Referencia pública consultada: https://www.tasteskill.dev/

## 25. Fuente complementaria DESIGN.md

Evaluadas conceptualmente: styles.refero.design, designmd.me, open-design.ai, designmd.supply, getdesign.md, aura.build, neuform.ai, hyperbrowser.ai y typeui.sh.

Elección: styles.refero.design.

Motivo:

- Aporta una referencia de estructura operativa para tokens, componentes y decisiones.
- Se usa solo como referencia documental, no como fuente de estilos, assets, layout o copy.
- La identidad se define desde el logo, el brief, la auditoría y este documento.
- No se instalaron herramientas ni se importaron templates.

Referencia pública consultada: https://styles.refero.design/

## 26. Guardrails de implementación futura

- Leer este archivo antes de modificar UI.
- Implementar por fase y superficie; no hacer rebranding masivo sin revisión.
- Cada cambio visual debe indicar tokens, componentes y rutas afectados.
- No mezclar rebranding con features nuevas.
- No reemplazar datos del catálogo sin confirmación.
- No usar assets del render como producción.
- No conectar servicios externos para resolver una decisión visual.
- Mantener funcionalidad, rutas, estados y contratos de datos.
- Validar screenshots en mobile, tablet, desktop y wide desktop.
- Ejecutar accesibilidad y anti-AI-slop antes de cerrar cada fase.
- Si algo no está definido, elegir la opción sobria, semántica y reversible.

## 27. Criterio de aprobación

La implementación futura está lista cuando:

- se reconoce VITA HOGAR sin depender de W.todocell;
- la paleta mantiene contraste y no cae en beige monocromático;
- la fotografía explica material y contexto;
- la tienda sigue siendo fácil de comprar;
- el hero tiene una composición propia;
- las cards no dominan la experiencia;
- la UI funciona sin hover ni motion;
- mobile no es desktop apilado;
- admin conserva claridad;
- no aparecen patrones prohibidos;
- no se modifica funcionalidad sin tarea explícita.

Este documento es la fuente de verdad visual hasta la aprobación de una versión posterior.
