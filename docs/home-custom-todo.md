# Custom Home — estado y pendientes

Branch: `feat/homepage`. Objetivo final: home custom basado en Figma (naf-naf), sección por sección, usando el flujo `/moxie-design` para cada franja nueva.

Figma de referencia:
- Desktop (home completo): https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1509-12485
- Mobile (home completo): https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1476-8334
- File key: `cKO4NnWn4Hy7Ii6Q5reHba`. Nodo raíz desktop `1509:12485` ("home"), nodo raíz mobile `1476:8334` ("HOME_MOBILE").

Header y footer **fuera de alcance** en este doc — ya resueltos en otras ramas (`feature/header` para el header; footer wireado como `Footer` instance en `custom_hero-slider`/index).

## Decisiones confirmadas por el cliente/usuario

1. **Hero:** ~~el slider de 3 slides ya construido (`custom_hero-slider`, Ana Beliza / La Vacanza / New drop) se mantiene tal cual. El Figma de este archivo muestra un hero estático distinto ("Love is where mom is") — se asume desactualizado o de otro brief y se ignora. No se retrabaja el Hero.~~ **Actualizado (2026-07-24):** el cliente confirmó que el Figma "Love is where mom is" (desktop `2140:3812` / mobile `1563:4852`) **sí es el vigente** — la suposición anterior era incorrecta. Se retrabajó el Hero para calzar con ese Figma (full-bleed + botón `button-ghost` + copy de `slide_1`). Ver detalle completo en "Hero — pivote a full-bleed + botón Ghost" más abajo.
2. **`product_list_fa6P9H`** (stock `product-list`) se repositiona como la sección "New Arrivals" del Figma (reubicado en `order` de `templates/index.json`, antes de `carousel_capsulas_temporada`). Sigue con `collection: "all"` de placeholder — **falta que el cliente confirme la colección real** para esta franja.
3. **`collection_list_h4Xr2p`** (stock `collection-list`, vacío) no tiene match directo con ningún módulo del Figma. El diseño trae un carrusel de colecciones ("Módulo colección 01") y una grilla de banners curados ("Módulo colección 02"), ninguno es un grid stock de 4 columnas. Se decide su destino (reusar como base o eliminar) al construir esas dos secciones.
4. **Orden de construcción:** top-to-bottom siguiendo el Figma.

## Componente compartido: Product Card — funcional y visualmente cerrado (100%)

Se abordó **antes** que las secciones nuevas del home porque de él dependen casi todas (New Arrivals, Carrusel tabs, Recrea el look, Ocasiones de uso, Banner y producto, etc.) — arreglarlo una sola vez en el componente compartido evita repetir el trabajo en cada sección. Figma de referencia: card `1476:6272` (desktop, "cómo debe quedar"), interacción de tallas `1476:6379` ("hovertallas"), mobile `2152:362`.

**Hecho:**
- Wishlist: bug de ícono invisible corregido (`<path>` sin `<svg>` envolvente), bloque `custom_wishlist` wireado en `templates/collection.json` (PLP) y `templates/index.json` (home) — antes no estaba en ningún `block_order`. Posición desktop (misma fila que el precio, a la derecha) y chip mobile (cuadrado gris `#8e8e8e`/radio 2px, antes círculo translúcido) fieles al Figma. Toggle + sincronización mobile/desktop del mismo producto verificados en navegador.
- Selector de talla (trigger "+"): siempre visible en desktop (antes oculto hasta hover de toda la card), anclado abajo-derecha (bug de positioning por dependencia de variables CSS del wrapper nativo `.quick-add`, corregido con offset propio). Overlay de hover con blur/translúcido fiel al componente "hovertallas" del Figma. Corregido para buscar la opción de talla (antes solo `'Talla'` exacto — el catálogo real mezcla `Talla`/`Size`, ambos se matchean ahora).
- Badge "NEW IN" del Figma = sistema de campaign flag (metaobject) ya existente — no requirió código, es contenido (crear el metaobject con label "NEW IN" queda del lado del cliente/usuario en Admin).
- CSS migrado de `src/styles/components/_product-card.scss` (legacy Sass) a `{% stylesheet %}` nativo en `custom_wishlist-button.liquid`, `custom_product-card-size-select.liquid` y `custom_quick-view-modal.liquid`, por `docs/css-architecture.md`.

**Validación funcional mobile (2026-07-24)** — sesión de cierre, contra `/collections/mujeres-ropa` real (81 productos) y home, en navegador (desktop + mobile). Bugs reales encontrados y corregidos:
1. `blocks/_product-card-gallery.liquid`: precedencia de operadores en Liquid (`and`/`or` sin paréntesis soportados) hacía que un producto agotado con `mobile_quick_add` activo igual mostrara el trigger de talla. Corregido con `if` anidado.
2. `snippets/custom_product-card-size-select.liquid`: el trigger "+" reusa la clase nativa `.quick-add__button`, cuyo `display`/`opacity` dependen de custom properties (`--quick-add-mobile-display`/`--quick-add-mobile-opacity`) que solo setea `snippets/product-card.liquid` nativo (no usado acá) — sin override, el trigger quedaba `display:none`/`opacity:0` e inaccesible al tap en mobile. Forzado visible siempre.
3. Selector de talla: el catálogo real usa `Talla` **o** `Size` según el producto (no solo `Talla`) — sin esto, el Quick View y el overlay no mostraban ninguna talla en productos reales.
4. `on:click="/selectSize"` (en `custom_product-card-size-select.liquid` y `custom_quick-view-modal.liquid`) resolvía contra `<product-form-component>` (el ancestro `-component` más cercano, también extiende `Component`) en vez del propio componente — el click no hacía nada, silenciosamente. Corregido con selector explícito (`product-card-size-select/selectSize` / `custom-quick-view-modal/selectSize`).
5. `selectSize()` en ambos JS (`assets/custom-product-card-size-select.js`, `assets/custom-quick-view-modal.js`) usaba `event.currentTarget` (siempre `document`, la raíz del listener delegado) en vez de `event.target` (que el framework sí remapea al botón real) — tras corregir #4, esto tiraba `TypeError` y tampoco agregaba al carrito.

Con los 5 fixes: agregar al carrito real desde el overlay desktop y desde el Quick View mobile confirmado end-to-end (variante correcta, cantidad 1, `/cart.js` actualizado). Theme Check limpio en los 3 `.liquid` tocados.

**Pendiente real, no bloqueante — detalles visuales confirmados contra el prototipo interactivo de Figma (node-id 1672:7004), quedan para un pase de pulido posterior:**
- Posición del corazón desktop: en el Figma va en la fila del título (no del precio) — hoy ancla al borde inferior del content block, que coincide con el precio.
- Overlay de tallas: en el Figma las tallas van alineadas a la izquierda (hoy `justify-content: center`).

**Overlay de tallas — ajustes 1:1 (2026-07-24):** el "+" ahora desaparece por completo (`opacity:0`/`visibility:hidden`, transición 0.15s) cuando el overlay se revela en hover/focus-within desktop — antes quedaba superpuesto. La barra del overlay pasó a `height: 72px` con `display:flex; align-items:center` (antes altura variable según padding), tallas centradas verticalmente adentro. Tipografía de cada talla (`.product-card-size-select__size`) ajustada a spec exacta del Figma: Host Grotesk (`var(--font-body--family)`), weight 500, 14px, line-height 100%, letter-spacing 0, color `#000000` literal (antes tokens del tema `var(--color-foreground)`/`var(--font-size--sm)` que no calzaban 1:1). Archivo: `snippets/custom_product-card-size-select.liquid`.

**Parpadeo azul en Guía de tallas mobile — causa real encontrada (2026-07-24):** el fix de tap-highlight de este mismo día (5 botones puntuales) no eliminaba el flash porque no era ahí — `DialogComponent.showDialog()` (`assets/dialog.js`) hace `this.addEventListener('click', ...)` sobre el propio wrapper (`<custom-quick-view-modal class="quick-view-modal-component">`) para detectar clicks fuera del dialog y cerrarlo. Un elemento con un listener de `click` nativo adjunto recibe el tap-highlight por defecto de WebKit/Chrome mobile en **toda su superficie**, no solo en los botones — por eso el flash cubría cualquier tap dentro de la sub-vista de guía (tabla, imagen, texto de instrucciones incluidos). Corregido con un único `-webkit-tap-highlight-color: transparent` en `.quick-view-modal-component` (el wrapper), sin tocar `assets/dialog.js` (nativo) ni los 5 resets puntuales anteriores (quedan, son correctos igual). Archivo: `snippets/custom_quick-view-modal.liquid`.

**Parpadeo azul detrás de la card completa — causa real #2, distinta de la anterior (2026-07-24):** tras el fix del modal, el cliente reportó que el flash seguía viéndose "detrás de la card" al interactuar (no adentro del modal). Investigado con Chrome DevTools MCP (`http://127.0.0.1:9292/collections/all`, mobile viewport emulado): el `<a class="contents" ref="cardGalleryLink">` nativo que envuelve la imagen de cada card (`snippets/card-gallery.liquid`) nunca tuvo un reset de `-webkit-tap-highlight-color` — al tocar la card (o los overlays absolutos encima: flag, wishlist, "+") el navegador pintaba el rectángulo azul por defecto sobre toda la card. Corregido con `.card-gallery a.contents { -webkit-tap-highlight-color: transparent; }` en un `{% stylesheet %}` nuevo en `blocks/_product-card-gallery.liquid` (sin tocar `card-gallery.liquid`, nativo). Verificado con `getComputedStyle(...).webkitTapHighlightColor` → `rgba(0, 0, 0, 0)` en el anchor real de la card, mobile y desktop.

**Parpadeo azul persistente — causa real #3, la definitiva (2026-07-24):** el cliente seguía viéndolo tras los fixes #1 y #2. Se probó primero contra el preview público (`fd0on0yomjdww4sl-75412471853.shopifypreview.com`, mismo dev theme en vivo, confirmado por los 2 fixes anteriores ya presentes en su CSS servido) — ahí los 5 productos cargados estaban agotados (`"Agotado"` badge), así que ni el trigger "+" ni el modal de Quick View se renderizan (`{% if product.available %}` en `blocks/_product-card-gallery.liquid`), dejando el corazón de wishlist como único control táctil real disponible para probar. Auditoría completa con Claude in Chrome (`getComputedStyle(...).webkitTapHighlightColor` sobre cada `<a>`/`<button>` de la card, en `127.0.0.1:9292/collections/all` con productos disponibles) encontró **3 controles más sin el reset** (mismo patrón que las causas #1 y #2, nunca se había auditado el componente completo de punta a punta):
- `.wishlist-button__control` (`snippets/custom_wishlist-button.liquid`) — `rgba(0, 0, 0, 0.18)`, el más probable causante del flash que seguía viendo el cliente en el preview (agotado), ya que era el único control interactivo real ahí.
- `.product-card-size-select__trigger.quick-add__button` (el "+", `snippets/custom_product-card-size-select.liquid`) — `rgba(0, 0, 0, 0.18)`.
- `.product-card-size-select__size` (cada talla del overlay de hover, mismo archivo) — `rgba(0, 0, 0, 0.18)`.

Los 3 corregidos con `-webkit-tap-highlight-color: transparent`. Auditoría de cierre (`querySelectorAll('a, button, [role="button"]')` dentro de `.card-gallery`, `.product-badges`, `.wishlist-button`, `.product-card-size-select`, `.quick-view-modal-component`) da **0 controles** con highlight nativo — el componente completo queda cubierto. (Quedan 19 elementos nativos del tema fuera de este componente —filtros, drawer, skip-link— con el mismo highlight por defecto; no se tocan, fuera de alcance de este bug.)

**Ajustes de posición 1:1 con Figma (2026-07-24), verificados con Chrome DevTools MCP contra el producto real "Camisa con brillo de un solo hombro - Negro" en `/collections/all`:**
- Wishlist mobile: `top: 20px; right: 17px` (antes `var(--padding-2xs)`) — `snippets/custom_wishlist-button.liquid`. Confirmado por `getBoundingClientRect()`: offset real 20px/17px exactos.
- Trigger "+" mobile (abre Quick View): `inset-block-end: 15.38px; inset-inline-end: 17px`. Trigger "+" desktop (hover de tallas): `inset-block-end: 24px; inset-inline-end: 24px` (antes `var(--padding-sm)` fijo en ambos breakpoints) — `snippets/custom_product-card-size-select.liquid`. Confirmado por `getBoundingClientRect()` en ambos breakpoints (17/15.38px mobile, 24/24px desktop, exactos).
- Flags (NEW IN/SALE/SOLD OUT): mobile `--badge-inset: 18px` + `min-height: 21.43px`; desktop `--badge-inset: 24px` + `min-height: 22px` + `border-radius: 2px` (antes la fórmula nativa `max(var(--padding-xs), ...)` de `snippets/product-badges-styles.liquid`, que no se toca — override vía `.card-gallery .product-badges`/`.card-gallery .product-badges__badge`, 2 clases de especificidad para ganarle a la regla nativa de 1 clase sin depender del orden de bundling) — nuevo `{% stylesheet %}` en `blocks/_product-card-gallery.liquid`. El override es agnóstico a qué esquina esté configurada en `settings.badge_position` (hoy `top-right` en `config/settings_data.json`, el cliente puede cambiarla desde el Admin sin romper este ajuste). No se pudo verificar visualmente el tamaño del badge en este pase porque ninguno de los 5 productos cargados en `/collections/all` tenía flag activa (sold out/sale/campaign flag) — validado solo por inspección del CSS compilado servido (regla presente con la especificidad correcta).

**Íconos reales (2026-07-24) — hecho:**
- Trigger de talla "+": ya no es el SVG nativo `icon-add-to-cart.svg` — es texto real `+` (`var(--font-body--family)` = Host Grotesk, weight 400, 16px, line-height 94%, color blanco) sobre el chip gris `#8e8e8e`. Chip resize de `var(--button-size-md)` (44px, touch target nativo) a las dimensiones exactas del Figma (`padding: 4px 7px`, auto width/height ≈ 24×23, radius 2px) — implica renunciar al touch target de 44px para calzar 1:1 con el diseño, decisión explícita del usuario en esta fase.
- Wishlist: ícono nativo `heart` reemplazado por el asset real `assets/wishlist-card.svg` (corazón outline, stroke negro 50% opacidad, sin fill) vía `inline_asset_content`, 18×16 en desktop, sin chip de fondo.
- Wishlist mobile — **no es el mismo dibujo escalado**: el cliente detectó que el centro del corazón lleva fondo blanco en mobile. Confirmado contra Figma (node `1939:4775`, exportado con `download_assets`) — es una variante distinta: mismo trazado pero `fill="white" stroke="black" stroke-width="0.3"` (relleno sólido, no outline), ya centrada en su propio viewBox 20×20 para llenar el chip. Nuevo asset `assets/wishlist-card-mobile.svg`; `custom_wishlist-button.liquid` elige el archivo según `variant` (`mobile` → el relleno, `desktop`/otro → el outline). Chip mobile 20×20/radius 1px (antes 44px/radius 2px, heredado del touch target).
- Theme Check limpio en los 2 snippets y el nuevo asset.

**Guía de tallas (2026-07-24) — implementada y validada con datos reales:**

Sub-vista dentro del mismo Quick View mobile (Figma `1615:9059` diseño, `1476:8334` prototipo,
`1639:9170` guía de tallas). El cliente pidió que sea **por producto vía metafield** (no un chart
hardcodeado), replicando el patrón ya usado para el badge NEW IN/SALE (`product_flag` +
`product.metafields.custom.flag`).

- **Modelo de datos** (a crear en Shopify Admin → Configuración → Datos personalizados — no lo pude
  crear yo, no tengo acceso de escritura a la Admin API desde esta sesión):
  - Metaobject `size_guide` con 3 campos:
    - `name` (single line text) — label interno, ej. "Guía tallas — Ropa superior mujer"
    - `measurements` (JSON) — array de filas, una por talla:
      ```json
      [
        {"size": "XS", "bust_cm": 84, "waist_cm": 64, "hip_cm": 93, "bust_in": 33.1, "waist_in": 25.2, "hip_in": 36.6},
        {"size": "S",  "bust_cm": 88, "waist_cm": 67, "hip_cm": 96, "bust_in": 34.6, "waist_in": 26.4, "hip_in": 37.8},
        {"size": "M",  "bust_cm": 92, "waist_cm": 71, "hip_cm": 100, "bust_in": 36.2, "waist_in": 28.0, "hip_in": 39.4},
        {"size": "L",  "bust_cm": 96, "waist_cm": 75, "hip_cm": 104, "bust_in": 37.8, "waist_in": 29.5, "hip_in": 40.9},
        {"size": "XL", "bust_cm": 100, "waist_cm": 79, "hip_cm": 108, "bust_in": 39.4, "waist_in": 31.1, "hip_in": 42.5}
      ]
      ```
      (valores cm confirmados contra el Figma; los `_in` son conversión directa cm/2.54 — el cliente
      puede ajustarlos si tiene sus propios valores en pulgadas). JSON elegido en vez de un metaobject
      anidado por fila porque el cliente prioriza integración/carga programática sobre edición manual
      fila por fila en Admin.
    - `image` (file reference, imagen) — la foto instructiva con las zonas de medición superpuestas;
      el cliente la sube en Admin al crear cada entrada de size_guide.
    - `instructions` (rich text) — texto de "cómo medir". Deliberadamente NO son 3 bloques fijos
      Busto/Cintura/Cadera en locale (así estaba implementado en un primer borrador): el cliente hizo
      notar que una guía de otra categoría (hombre, calzado, etc.) puede no tener esas 3 zonas —
      el merchant escribe libremente lo que aplique en esta entrada puntual, se renderiza con el
      filtro `metafield_tag` (soporta headings/párrafos/listas del editor rich text nativo).
  - Metafield en producto: `product.metafields.custom.size_guide` (tipo: referencia a metaobject
    `size_guide`) — mismo patrón que `custom.flag`, así varios productos del mismo corte reusan la
    misma entrada.
- **Código ya implementado** (`snippets/custom_quick-view-modal.liquid` +
  `assets/custom-quick-view-modal.js`): el botón "Guía de tallas" solo aparece si
  `product.metafields.custom.size_guide.value` existe (sin setting manual — se eliminó el checkbox
  `show_size_guide` de `blocks/_product-card-gallery.liquid`, ya obsoleto). Al tocarlo,
  `showSizeGuide()` oculta la vista de tallas y muestra la vista de guía dentro del mismo modal
  (`ref="sizesView"`/`ref="guideView"`, mismo patrón que el resto del theme); "Atrás" hace el camino
  inverso (`backToSizes()`). El toggle CM/IN (`setUnit()`) no recalcula nada en runtime — cada celda
  de la tabla trae ambos valores precargados (`data-cm`/`data-in`) desde el JSON del metaobject, el
  JS solo decide cuál mostrar como texto.
- **Bug encontrado y corregido durante la validación**: `.quick-view-modal__view--guide` tenía
  `display: flex` incondicional en el `{% stylesheet %}` — una clase con `display` explícito pisa en
  especificidad al `display: none` que el atributo nativo `[hidden]` aplica vía UA stylesheet, así
  que la vista de guía quedaba siempre visible (superpuesta a la de tallas) en vez de solo al tocar
  "Size guide". Corregido con el selector `.quick-view-modal__view--guide:not([hidden])`.
- **Validado con datos reales** (2026-07-24): metaobject `size_guide` creado en Admin, entrada de
  prueba cargada (imagen real + measurements) y asignada vía `custom.size_guide` al producto
  "Camisa con brillo de un solo hombro - Negro". Probado en `/collections/mujeres-ropa`: el botón
  "Size guide" aparece solo en ese producto, abre la sub-vista con la tabla (5 tallas) e imagen
  reales, el toggle CM/IN recalcula el texto de todas las celdas correctamente, y "Back" vuelve a la
  vista de tallas sin perder estado. Theme Check limpio.
- **Pase de fidelidad 1:1 contra Figma** (2026-07-24, nodos `1615:9059` Quick View / `1639:9170`
  Guía de tallas, comparación pixel a pixel): ajustes de texto/tamaño/forma reales encontrados y
  corregidos:
  - Título "Quick view"/"Compra rápida": spec exacta del Figma (nodo `1610:8968`) — Host Grotesk
    SemiBold (600) 14px, letter-spacing 5% (0.05em), line-height 100%, centrado. Antes heredaba el
    h2 nativo del tema (tamaño de heading grande, weight normal, izquierda) — se detectó al comparar
    contra captura real del cliente, se veía notoriamente más grande que en Figma.
  - Imagen del producto en el Quick View: 110×173px exacto del Figma (antes `6rem`/96px genérico).
  - "Select your size"/"Selecciona la talla": color apagado (antes negro pleno).
  - "Size guide"/"Guía de tallas": spec exacta del componente "Button/Ghost" del Figma (nodo
    `1812:7649`) — border 0.3px, border-radius 6px, padding 8px 16px, Host Grotesk Medium (500) 14px
    (antes usaba el radio/padding genérico de settings del tema y heredaba el tamaño de texto body,
    no calzaba con las medidas de alto mínimo del componente real).
  - Estado "Últimas N Unidades": negro pleno + bold, Title Case (antes atenuado, sentence case).
  - Estado "Avísame Cuando Esté Disponible": Title Case + tilde correcta en "Esté" (antes sentence
    case y sin tilde — típo del Figma origen, corregido en vez de replicado).
  - Heading "¿Cómo deseas ver las medidas?": bold (antes weight normal).
  - Tabla de medidas: columna "Talla" y encabezados en negro/bold; los números de medida en gris más
    apagado (antes todo con el mismo peso/color).
  - Copy de instrucciones corregido por el cliente en el metaobject: "abdomen" (typo "abdome" en el
    Figma origen) y sin el "más" de más que yo había agregado de más en "la parte sobresaliente".
  - Locale `notify_when_available`/`last_units_left` pasados a Title Case en `en.default.json` y
    `es.json` (antes sentence case) — decisión del cliente para calzar 1:1 con el Figma en vez del
    estándar de textos largos.
- **Parpadeo azul al tocar botones (2026-07-24)**: el cliente reportó un flash azul al abrir "Guía
  de tallas" y al alternar CM/IN en mobile real. Es el tap-highlight default del navegador (WebKit/
  Chrome mobile) — el tema no lo resetea globalmente, solo puntualmente en 2 componentes nativos
  (`snippets/pagination-controls.liquid`, `sections/product-hotspots.liquid`; confirmado por grep,
  no hay reset global). Agregado `-webkit-tap-highlight-color: transparent` a los 5 controles del
  modal (cerrar, tallas, "Guía de tallas", toggle CM/IN, "Atrás"), mismo patrón que esos 2 archivos.
  Verificado vía `getComputedStyle(...).webkitTapHighlightColor` → `rgba(0,0,0,0)` en los 5.
- **No es un bug de código — falta publicar el idioma español**: el cliente notó que el modal
  muestra "Quick view"/"Select your size"/"Size guide" en inglés en vez de "Compra rápida"/etc.
  Confirmado: `locales/es.json` ya tiene las traducciones correctas (se usan en todo este componente
  vía `{{ 'content.xxx' | t }}`), pero `document.documentElement.lang` resuelve `en` incluso pasando
  `?locale=es` en la URL — el resto del sitio se ve en español porque es contenido literal cargado
  en Admin (menús, texto de secciones), no porque el idioma activo de la tienda sea español. Falta
  publicar/activar español como idioma en Shopify Admin → Configuración → Idiomas para que estos
  textos (y cualquier otro que use `| t`) se sirvan en español a los visitantes.

**Flags por colección, no solo por producto (2026-07-24):** decisión del cliente — más práctico asignar la flag a nivel colección completa que producto por producto. Un producto puede pertenecer a 2+ colecciones flageadas a la vez (ej. "Nueva Temporada" + "Cápsula Denim"): se muestran **todas apiladas verticalmente** (decisión del cliente, no hay spec de Figma para multi-flag), dedupeadas por id de metaobject si dos colecciones comparten la misma entrada. El metafield directo por producto (`product.metafields.custom.flag`) se mantiene como fuente adicional (no se quitó capacidad, solo se sumó la de colección) — ambos coexisten. Prioridad: **Agotado siempre gana** (oculta cualquier flag) > flags (producto + colecciones) > Sale automático (solo si no hay ninguna flag explícita). Implementado en `blocks/_product-card-gallery.liquid`, iterando `product.collections` y leyendo `collection.metafields.custom.flag.value` de cada una. Theme Check limpio.

**Setup de Admin completado y feature validada end-to-end (2026-07-24):** el cliente creó la definición de metafield `custom.flag` en el recurso **Colección** (Admin → Configuración → Datos personalizados → Colecciones, tipo "Referencia a metaobject" → `product_flag`, misma definición reusada del recurso Producto) y asignó entradas de prueba a 2 colecciones distintas conteniendo el mismo producto ("Camisa con brillo de un solo hombro - Negro"). También corregido en el mismo pase: `config/settings_data.json` tenía `badge_position: "top-right"` — el Figma/spec real es top-left, cambiado a `"top-left"` (afecta a todos los badges del tema, no solo los de campaña).

**Bug real encontrado y corregido probando el multi-flag: `.id` no es `.system.id` en metaobjects (2026-07-24):** con las 2 colecciones flageadas activas, el cliente reportó "tengo un problema, una flag reemplaza a la otra" — solo se veía 1 badge en vez de 2 apilados. Diagnosticado con un `{% comment %}` de debug temporal (removido después) que confirmó `collection_flag.id` siempre venía vacío mientras `collection_flag.label` sí resolvía bien. Causa: los metaobjects exponen su ID del sistema en `.system.id`, no en `.id` directo (confirmado contra la doc oficial de Shopify, `metaobject_system`) — con `.id` vacío, el marcador de dedupe era el mismo string ("|") para cualquier flag, así que la segunda entrada siempre se detectaba como "ya mostrada" y se omitía. Corregido reemplazando `product_flag.id`/`collection_flag.id` por `.system.id` en los 2 puntos de `blocks/_product-card-gallery.liquid`. Verificado en navegador: 2 badges apilados correctamente en el mismo producto.

**Flag con imagen/gif (2026-07-24):** pedido ad-hoc del cliente (no hay spec de Figma) — el metaobject `product_flag` ahora acepta un campo opcional `image` (tipo Archivo). Extraído a un snippet nuevo `snippets/custom_product-flag-badge.liquid` (reusado desde el punto de flag-de-producto y el loop de flags-de-colección, para no duplicar la rama imagen/texto y evitar que un bug como el de `.system.id` se repita en 2 lugares): si `flag.image` viene cargado renderiza `<img>` (`image_url`/`image_tag`, sin forzar `format:` para no romper GIFs animados); si no, cae al chip de texto+colores de siempre. Alto de la imagen igualado al `min-height` del chip de texto por breakpoint (21.43px mobile / 22px desktop) — ancho libre según aspect ratio. Validado en navegador con un GIF real (`wired-outline-3245-gift-free-hover-pinch.gif`) apilado junto a un badge de texto. Theme Check limpio en el snippet nuevo y en `blocks/_product-card-gallery.liquid`.

**Pendiente conocido, aceptado por ahora — no bloqueante:** el badge dentro del **Quick View modal** (`snippets/custom_quick-view-modal.liquid`, variable `campaign_flag`) todavía solo lee `product.metafields.custom.flag` — no revisa `product.collections` ni soporta el campo `image`. Si un producto tiene flag solo por colección (o con imagen), la card del grid la muestra pero el Quick View no. Se preguntó 2 veces si igualarlo y no hubo confirmación explícita — queda documentado para no re-descubrirlo en una sesión futura, se iguala cuando el cliente lo pida.

**Nombre de producto largo se sobreponía al wishlist en desktop (2026-07-24):** el cliente encontró un caso no cubierto en la validación anterior — un título de 2-3 líneas (sin límite nativo de wrap) invadía visualmente el ícono de wishlist (touch target de 44px, `snippets/custom_wishlist-button.liquid`), anclado al borde inferior de `.product-card__content` (`blocks/custom_wishlist.liquid`). El bloque `price` ya reservaba `padding-inline-end: 32px` para convivir con ese ícono; el título nunca tuvo ese resguardo ni truncamiento. Corregido extendiendo el `{% stylesheet %}` ya existente en `blocks/custom_wishlist.liquid` (sin tocar el `product-title.liquid` nativo ni `snippets/text.liquid`): `[role="heading"]` dentro de `.product-card__content`, solo desktop (`min-width: 750px`), pasa a `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` + `padding-inline-end: 32px` (mismo valor que price). Un nombre largo ahora trunca con "…" en 1 línea en vez de wrappear y solaparse. Theme Check limpio. Validado visualmente en desktop por el cliente (2026-07-24).

**Fuera de alcance (decisión del usuario):** persistencia real de wishlist (sigue stub, solo `aria-pressed`).

## Hero — pivote a full-bleed + botón Ghost (2026-07-24)

Contradice la decisión previa de este mismo doc (ver "Decisiones confirmadas", punto 1) — el
cliente confirmó que el Figma "Love is where mom is" (desktop `2140:3812` / mobile `1563:4852`,
mismo file key) **sí es el vigente** para el Hero, no uno desactualizado/de otro brief como se
había asumido. Se retrabajó `hero_slider_home` en consecuencia.

**Hallazgo de partida:** el hero (`sections/custom_hero-slider.liquid` +
`blocks/_custom_hero-slide.liquid`) ya existía y ya soportaba lo pedido — múltiples slides,
imagen o video por slide, media mobile independiente de desktop (checkbox
`custom_mobile_media`). El preset del bloque ya traía el copy exacto de este Figma (eyebrow
"NEW DROP", heading "Love is where mom is", botón "Comprar ahora"), señal de que se había
construido pensando en este mismo diseño en algún momento anterior no documentado.

**2 huecos de fidelidad encontrados y resueltos (decisión del cliente, no asumidos):**
1. **Carrusel "peek" → full-bleed:** el layout anterior mostraba el slide activo al 64% del
   ancho (86% en mobile) con paneles laterales (`.hero-fade-slider__peek`) mostrando un recorte
   del slide anterior/siguiente + flechas circulares siempre visibles — de ahí que se viera
   "como 3 banners cortados al tiempo". El Figma muestra el banner a ancho completo, sin peek ni
   flechas. Se quitaron los divs de peek del markup, `.hero-fade-slider__stage` pasó de
   `width: 64%` a `100%`, se eliminó el setting `slideshow_gap` (quedaba muerto sin peek al
   lado), y los defaults de `icons_style`/`corner_radius` pasaron a `none`/`0` (antes
   `arrows_large`/`16`).
2. **Botón "Ghost":** el Figma pide fondo `rgba(23,23,23,0.1)` + `backdrop-filter: blur(2px)` +
   borde blanco + radius 6px + ícono chevron. Ninguna clase nativa (`.button`/`.button-secondary`/
   `.button-custom`, ver `assets/base.css`) tiene blur. Se agregó una variante nueva
   `button-ghost` — opción nueva en el schema de `blocks/button.liquid` + `{% stylesheet %}`
   autocontenido en `snippets/button.liquid` (no toca `assets/base.css`, core de Horizon).
   El ícono reutiliza `assets/icon-caret.svg` (mismo asset que `snippets/slideshow-arrow.liquid`),
   rotado -90° para apuntar a la derecha.

**Wireo en vivo (`templates/index.json` → `hero_slider_home`):** `icons_style: none`,
`corner_radius: 0`; los 3 slides con `style_class: button-ghost` (consistencia visual del
carrusel — no tenía sentido mezclar estilos de CTA entre slides de un mismo hero); `slide_1`
actualizado al copy exacto de este Figma (`NEW DROP` / `Love is where mom is`). `slide_2`
("floral print"/"La Vacanza") y `slide_3` ("New drop") **no se tocaron en el copy** — podían ser
campañas de negocio ya aprobadas; si el cliente quiere ese mismo copy en los 3, es un cambio de
texto simple.

No se subieron imágenes/video reales — el cliente las carga desde el Theme Editor (Shopify no
permite referenciar `image_picker`/`video` por URL externa).

Theme Check (Dev MCP `validate_theme`) limpio en los 4 archivos tocados:
`sections/custom_hero-slider.liquid`, `blocks/button.liquid`, `snippets/button.liquid`,
`templates/index.json`.

## New Arrivals (fila #5) — cerrado 100% con copia del stock `product-list` (2026-07-24)

Se auditó el schema completo de `sections/product-list.liquid` (nativo) contra el Figma (`2138:4736` desktop / `2152:362` mobile): layout carrusel, heading+subtítulo, columnas, gap y CTA son 100% configurables por Theme Editor/JSON — no se necesitaba una sección custom desde cero. **Regla de oro del proyecto: nunca tocar un archivo nativo, ni con un `{% stylesheet %}` marcado MOXIE** — así que en vez de agregar el CSS del CTA por breakpoint directo en `sections/product-list.liquid`, se hizo una copia 1:1 (`sections/custom_product-list.liquid`) y el ajuste se aplicó solo ahí. `sections/product-list.liquid` queda intacto en el repo. `templates/index.json` → `product_list_fa6P9H` ahora usa `"type": "custom_product-list"`.

Cambios en `product_list_fa6P9H`:
- `layout_type`: `grid` → `carousel` (el Figma usa flecha de navegación en desktop y scroll horizontal en mobile — nativo de `carousel`, no de `grid`). `icons_style: arrow`, `icons_shape: circle`.
- Header: el bloque `_product-list-text` (antes `<h3>{{ closest.collection.title }}</h3>`) pasó a texto literal `<h1>New Arrivals</h1><p>Las últimas tendencias de ropa para mujer.</p>` con `type_preset: "rte"` — la clase `.rte` nativa (confirmado en `snippets/text.liquid`) hereda el escalado tipográfico fluido del tema para `h1`/`p` anidados sin necesitar bloques anidados ni CSS custom.
- CTA por breakpoint (Figma pide dos botones distintos, no hay toggle nativo "ocultar en mobile/desktop"):
  - Desktop ("Ver lo nuevo ›", pill negro, arriba-derecha): bloque `home_new_arrivals_cta_desktop` dentro del header. **Bug encontrado durante la verificación**: se intentó primero con el bloque semántico `_product-list-button` (auto-oculta si la colección no tiene más productos que `max_products` y auto-linkea a `closest.collection`) — el botón nunca renderizaba (0 apariciones en el HTML servido). Causa: dentro de un bloque **estático** (`static-header`), `closest.collection` no resuelve de forma confiable a `section.settings.collection` (mismo motivo documentado por el que `carousel_capsulas_temporada` usa un link literal `<a href="shopify://collections/all">` en vez de este mecanismo). Corregido usando un bloque `button` genérico con `link: "shopify://collections/all"` explícito — mismo patrón que ya usa `carousel_capsulas_temporada`.
  - Mobile ("Comprar todo", outline, full-width, debajo del grid): bloque `home_new_arrivals_cta_mobile`, tipo `button` genérico agregado al slot `content_for 'blocks'` que la sección ya renderiza después del grid (confirmado leyendo el liquid) — `_product-list-button` no está en el whitelist de bloques de ese slot, solo dentro de `_product-list-content`.
  - Alternancia por breakpoint: `{% stylesheet %}` en `custom_product-list.liquid` con selectores `[class*="__home_new_arrivals_cta_desktop"]`/`[class*="__home_new_arrivals_cta_mobile"]` + `@media (min-width: 750px)`. **Detalle no obvio**: la clase por-instancia que emite `snippets/button.liquid` (`{{ style_class }}--{{ block.id }}`) trae un hash generado por Shopify antepuesto al id de bloque (ej. `button-secondary--AMi8rQmcxWEdIZm9BV__home_new_arrivals_cta_mobile`) — un selector exacto con el id literal no matchea nunca; se resolvió con selector de substring `[class*="__<id>"]` y `display: revert` (en vez de forzar `inline-flex`/`grid` a mano) para no adivinar el `display` real del componente.
- Verificado en navegador (Chrome DevTools MCP) en 1440px, 749px y 750px exactos: el CTA correcto aparece/desaparece justo en el breakpoint, carrusel funciona, arrow nav presente (opacity 0 por defecto, aparece en hover — comportamiento nativo, no bug).
- **Proporción de cards en mobile, ajustada a 1:1 (2026-07-24):** el cliente notó que el Figma muestra ~1.4 productos visibles en mobile (1 completo + un tercio del siguiente), no los ~1.6 que daba el default. Medido por pixel-scan sobre el screenshot de Figma (New Arrivals `2152:362`): card 243px / gap 12px sobre 345px de ancho total → card ≈ 70.4% del contenedor. El setting nativo `mobile_card_size` solo expone 2 valores en el dropdown del Theme Editor (`60cqw`/`44cqw`, ninguno da 70%) — como es un `select` cuyo valor sigue siendo un string libre a nivel de Liquid/JSON, se puede asignar `"70cqw"` directamente en `templates/index.json` sin problema de renderizado (el theme no valida el string contra las opciones del dropdown al renderizar, solo la UI del Theme Editor restringe qué se puede *elegir* ahí). Verificado con `getBoundingClientRect()`: card 350/500 = 70%, ratio visible resultante ≈ 1.36 cards, calza con el Figma. **Nota para el cliente:** si alguien abre este control en el Theme Editor y lo toca, el dropdown solo ofrece 60/44 — perdería el 70% custom; documentado acá para no perderlo de vista.
- **Peek de la 5ta card en desktop, eliminado para calzar 1:1 con Figma (2026-07-24):** el cliente notó "veo más de 4 en desktop" — el Figma (`2138:4736`) muestra exactamente 4 cards sin ninguna asomando, mientras el build mostraba 4 + ~25% de una 5ta. Causa raíz (pixel-scan del Figma confirmó 4 cards + 3 gaps = exactamente el ancho del frame, 0 peek): Horizon define el "peek" de todos sus carousels vía 2 mecanismos **globales y nativos** (`snippets/theme-styles-variables.liquid`: `--peek-next-slide-size: 3rem`; `assets/base.css`: clase `.force-full-width` que expande el carousel a `grid-column: 1/-1`, fuera del ancho de contenido, para que el peek sangre en el gutter de la página). Sobreescribir esto en un `.liquid` nativo violaría la regla de oro (nunca tocar nativo) y afectaría TODOS los carousels del sitio. Se sobreescribieron los 3 custom properties involucrados (`--peek-next-slide-size: 0px`, `.force-full-width { grid-column: 2 }`, `--gutter-slide-width: 0px`) **solo dentro del `{% stylesheet %}` de `sections/custom_product-list.liquid`**, scoped por `[data-testid="product-list"]` — no toca ningún archivo nativo, y como las custom properties CSS resuelven por proximidad en el DOM (no por especificidad/orden de carga), este override local le gana al valor global sin `!important`. Verificado con `getBoundingClientRect()`: card4 termina exactamente en el borde derecho del contenedor (x=1400 en viewport 1440), card5 queda fuera del área visible — 0 peek. Mobile no se vio afectado (usa una fórmula de ancho completamente distinta, basada en `--mobile-card-size`, no en `--peek-next-slide-size`).

**Pendiente, no bloqueante:**
- `collection: "all"` sigue de placeholder — cambio de 1 setting cuando el cliente confirme la colección real de New Arrivals (y el `link` de ambos botones CTA, hoy `shopify://collections/all`, debería apuntar a esa misma colección).
- El chevron `›` del botón "Ver lo nuevo" es carácter literal en el `label` (no hay slot de ícono nativo en `snippets/button.liquid`) — visualmente calza bien, pero no es un ícono real.
- Theme Check reporta `ERROR: The id 'static-product-card' is already being used by another static block` en `custom_product-list.liquid` — falso positivo pre-existente del `product-list` nativo (sus 3 presets comparten los mismos ids de static block, normal porque son alternativas mutuamente excluyentes al agregar sección nueva vía Theme Editor). Confirmado con `git show HEAD:sections/product-list.liquid` que ya estaba así antes de esta sesión — no se modificó ni se puede modificar (archivo nativo).

## Inventario de secciones (Figma ↔ built)

| # | Sección | Nodo desktop | Nodo mobile | Estado | Archivo / nota |
|---|---------|-------------|-------------|--------|-----------------|
| 1 | Hero ("Love is where mom is") | `2140:3812` | `1563:4852` | ✅ Hecho (retrabajado 2026-07-24) | `sections/custom_hero-slider.liquid` + `blocks/button.liquid`/`snippets/button.liquid` (`button-ghost`) — full-bleed + copy del Figma en `slide_1`, ver detalle abajo |
| 2 | Franja promocional (70% off + 2 CTA) | `1668:6289` | `1670:6329` | ✅ Hecho | `promo_banner_ana_vacanza` en `index.json` |
| 3 | Categorías principales (Camisas/Tejidos/Jeans/Pantalones) | sin frame propio — hijos sueltos del root, confirmar wrapper real en extracción | `1476:8375` | ⏳ Pendiente | nuevo |
| 4 | Módulo colección 01 (carrusel de colecciones, `Colecciones_carrusel`) | `2138:5623` | `1476:8829` | ⏳ Pendiente | nuevo — evaluar reuso de `collection_list_h4Xr2p` |
| 5 | New Arrivals | `2138:4736` | `2152:362` | ✅ Hecho | `product_list_fa6P9H`, ahora `type: custom_product-list` — falta asignar colección real (hoy `"all"`) |
| 6 | Carrusel tabs (Más vendidos/Más vistos/Tendencia/Sale) | `1668:6291` | `1671:6360` | ⏳ Pendiente | nuevo — requiere `moxie-interactions` (tabs + carrusel). Confirmar con cliente qué define productos de cada tab (colección/tag/metafield) |
| 7 | Banners cápsulas (La Temporada en Dos Claves: Lino/Denim) | `1670:6292` | `1476:8863` | ✅ Hecho | `carousel_capsulas_temporada` en `index.json` |
| 8 | Módulo colección 02 (New Collection: 4 banners asimétricos) | `1670:6293` | `1671:6343` | ⏳ Pendiente | nuevo — evaluar reuso de `collection_list_h4Xr2p` |
| 9 | Recrea el look | `1670:6294` | `1671:6344` | ⏳ Pendiente | nuevo — confirmar si la flecha visible implica carrusel/scroll o es decorativa |
| 10 | Ocasiones de uso (Dailywear/Going out/Holiday/Workleisure) | `1670:6295` | `1476:8520` | ⏳ Pendiente | nuevo |
| 11 | Banner y producto (banner grande + 4 productos) | `1509:12590` | `1671:6345` | ⏳ Pendiente | nuevo |
| 12 | Banners categoría (Tejidos / Faldas / Camisas) | `1670:6296`/`6297`/`6298` | `1671:6346`/`6347`/`6348` | ⏳ Pendiente | nuevo — 3 banners, 2 side-by-side + 1 full-width |
| 13 | Shop the look (imágenes shoppable, pins) | `1670:6316` | `1671:6349` | ⏳ Pendiente | nuevo — requiere `moxie-interactions` (hotspots/popups). Confirmar comportamiento esperado (hover vs click) |
| 14 | Banners promocionales 01+02 | `1670:6317`/`6318` | `1671:6350`/`6351` | ⏳ Pendiente | nuevo |
| 15 | Nuestra comunidad (UGC + producto tageado) | `1509:12627` | `1476:8609` | ⏳ Pendiente | nuevo — confirmar si es feed dinámico real o contenido curado a mano |
| 16 | #NAFGirls (grid de imágenes) | `1670:6319` | `1476:8706` | ⏳ Pendiente | nuevo |
| 17 | Atributos marca (4 beneficios: compra/cambios/beneficios/múltiples) | `1509:12614` | `2149:3876` | ⏳ Pendiente | nuevo |

**Resumen:** 4 secciones hechas, 13 nuevas por construir.

## Flujo por sección

Para cada fila ⏳ Pendiente, en el orden de la tabla:
1. Invocar `/moxie-design` con las URLs desktop+mobile del nodo puntual (deep link `?node-id=`).
2. Dejar correr el flujo completo de la skill: extracción + tabla de inventario → build fiel (4 garantías) → `moxie-interactions` si aplica (secciones 6 y 13) → `moxie-validate`.
3. Verificar visualmente contra Figma (desktop + mobile) con `npm run dev:shopify` levantado.
4. Actualizar esta tabla (Hecho + archivo(s) creados) antes de pasar a la siguiente sección.

Al cerrar todas las secciones, correr `/qa home` — deja el status en `docs/qa/QA-home.md`.

## Archivos clave

- `templates/index.json` — orden de secciones del home (single source of truth del layout final)
- `sections/custom_hero-slider.liquid` + `blocks/_custom_hero-slide.liquid` + `assets/custom-hero-slider.js` — Hero (hecho, retrabajado a full-bleed 2026-07-24, ver detalle arriba); botón `button-ghost` nuevo en `blocks/button.liquid` + `snippets/button.liquid` (reusable en cualquier bloque `button` del tema, no exclusivo del Hero)
- `promo_banner_ana_vacanza` (sección `type: section` genérica, no archivo custom propio) — Franja promocional (hecho)
- `carousel_capsulas_temporada` (sección `type: carousel` stock) — Banners cápsulas (hecho)
- `product_list_fa6P9H` (sección `type: custom_product-list`) — New Arrivals (✅ hecho, ver detalle abajo), falta colección real
- `collection_list_h4Xr2p` (sección `type: collection-list` stock, vacía) — destino a decidir en secciones 4/8
- `src/styles/pages/_home.scss` — fixes puntuales ya aplicados (slider next button, promo banner mobile alignment, flechas del carousel de cápsulas en mobile); wireado en `src/styles/main.scss`
- Product Card (compartido, no exclusivo de home — 100%, ver sección arriba): `blocks/_product-card-gallery.liquid`, `blocks/custom_wishlist.liquid`, `snippets/custom_wishlist-button.liquid`, `snippets/custom_product-card-size-select.liquid`, `snippets/custom_quick-view-modal.liquid`, `snippets/custom_product-flag-badge.liquid` (todos ya con `{% stylesheet %}` nativo migrado); `templates/collection.json` (PLP) wireado también. `src/styles/components/_product-card.scss` quedó vacío (migrado)
