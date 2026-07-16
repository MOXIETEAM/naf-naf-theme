# Custom Header — estado y pendientes

Branch: `feature/header`. Objetivo final: header custom basado en Figma (naf-naf), reemplazando el header nativo de Horizon, personalizado bloque a bloque.

Figma de referencia:
- Desktop: https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1509-12494
- Mobile: https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1670-6328
- Header sólido (PLP/PDP): https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1512-5080
- Menú desktop: https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1476-5542
- Menú mobile: node-id 1563-4982, 1533-2803, 1577-8047

## Hallazgo clave (mega menu / drawer mobile)

Cada ítem del menú (ROPA, COLECCIONES, NAF&ME, SALE) tiene un **layout de dropdown completamente distinto** (columnas + imágenes de ocasión / cards + banner asimétrico / panel promocional de membresía / columnas + cards + banner grande). El drawer mobile es un **drawer con tabs persistentes** + panel de contenido por tab + drill-down a subcategorías. Nada de esto lo resuelve el `menu_style` único de `_header-menu` nativo — se necesita, en la fase del mega menu, una arquitectura de **bloques anidados custom** (bloque de bloques por instancia en el editor, no metaobjects, no matching por posición) para que el cliente arme cada dropdown desde el Theme Editor. Ver plan de Fase 1 para más detalle: `custom_header-main` y la topbar ya están resueltos; el mega menu/drawer quedan para una fase aparte.

## Hecho

### 1. Barra de utilidades superior (`custom_header-top-bar`)
Commit `670d483`. Sección + 4 blocks ya implementados:
- `sections/custom_header-top-bar.liquid`
- `blocks/custom_header-country.liquid`
- `blocks/custom_header-help.liquid`
- `blocks/custom_header-delivery.liquid`
- `blocks/custom_header-account.liquid`

**Estado:** funcional y **wireada en vivo** en `sections/header-group.json` (`custom_header_top_bar_XLrxc3`).

### 2. Header principal — Fase 1: shell completo (`custom_header-main`)
`sections/custom_header-main.liquid` — copia 1:1 de `sections/header.liquid` nativo (logo + menu + search + localization + cart/account, lógica sticky/transparent). El nativo **no se tocó**.

Diffs intencionales vs. el nativo (documentados con comentarios `MOXIE:` en el archivo):
1. `id="header-component"` se mantiene idéntico al nativo (dependencia dura de `layout/theme.liquid` y `assets/utilities.js`).
2. Static block ids `header-logo`/`header-menu` → `header-logo-main`/`header-menu-main` (solo claridad, no había colisión real).
3. `schema.name` → `"Moxie Header Principal"` (antes `t:names.header`).

Validado con Shopify Dev MCP (`validate_theme`). Quedan 2 errores de "static block id ya usado" por el reuso de `header-menu-main` en 3 variantes (menu/drawer/navigation_bar) — **confirmado falso positivo**: el mismo validador tira el mismo error contra `header.liquid` nativo sin modificar. No requiere fix.

**Wireado en `header-group.json`** (`header_section` ahora tipo `custom_header-main`, blocks `header-logo-main`/`header-menu-main`), con los settings ya configurados para calzar con el Figma: transparente en home (logo/color inverso), sólido en product/collection, logo centrado, menú a la izquierda en texto plano (el mega-menu rico queda para la fase siguiente), búsqueda a la derecha, localization (país/idioma) apagada porque ya vive en la topbar. `type_font_primary_size: 0.75rem` (12px) y `type_font_primary_link: body` (Host Grotesk regular) para la tipografía del menú.

Además, 2 settings nuevos en el schema de `custom_header-main.liquid` (`menu_highlight_background_color`, `menu_highlight_text_color`) para que el color del pill "SALE" sea editable desde el Theme Editor — inyectados como CSS vars (`--menu-highlight-background`/`--menu-highlight-text`) en el `style` del `<header-component>`.

Estilos nuevos en `src/styles/components/_header-main.scss` (fluid, no toca `_header.scss` legacy):
- Alto fijo: 80px desktop / 60px mobile (`--header-height` + `min-height` en `.header__columns`).
- Mobile: fondo `#DCDCDC33` + `backdrop-filter: blur(34.1px)` fijo, igual en transparente/sólido/scroll. Necesitó `!important` porque `assets/header.js` pisa `--closed-underlay-height` como estilo inline al activarse el sticky-state en scroll — sin `!important` el blur se perdía apenas arrancaba el scroll (bug encontrado y corregido en esta sesión).
- Tipografía del menú: `line-height: 1.333` y `letter-spacing: 0.02em` (2%) vía CSS — no hay setting nativo para esto.
- Buscador nativo (botón que abre `#search-modal`) vestido como pill con placeholder visual "Que estás buscando?" vía `::after` — es CSS puro, no un input real ni cambio de lógica.
- Cuenta oculta en la fila principal en desktop (≥750px) porque ya vive en la topbar; en mobile se mantiene visible (así lo pide el Figma mobile).
- "SALE" como pill (padding 2px 6px, radius 2px, gap 10px), colores vía `var(--menu-highlight-background/text)` — **asume que SALE es siempre el último ítem del menú** (`:last-child`), solo en el menú desktop (`[data-menu-style='menu']`). Riesgo: si el orden cambia en Admin, deja de matchear. Se revisita junto con el mega menu.

**Estado: Fase 1 cerrada y verificada en navegador** (desktop + mobile, incluyendo scroll/sticky).

### 3. Fase 2 — Mega menu desktop + drawer mobile (implementada, pendiente verificación en navegador)

Implementada el 2026-07-06 con **bloques anidados custom** (ver plan aprobado). Decisiones confirmadas por el usuario:
- Links de columna = **link_list de Shopify por columna** (menús en Admin → Navegación; el cliente los crea, ~1 menú pequeño por columna).
- Contenido lo carga el cliente en el Theme Editor (estructura de ejemplo con placeholders ya wireada en `header-group.json`).
- "Rastrear Mi Pedido"/"Favoritos" fuera de alcance: el footer del drawer usa bloques `_custom_menu-utility-link` extensibles (hoy: Ubicación, Mi Cuenta, Ayuda).

**Arquitectura**: `blocks/_custom_menu.liquid` (contenedor static, renderizado 2× desde `custom_header-main.liquid` con el mismo id `custom-menu-main` y `variant` default/mobile — patrón nativo, válido para `UniqueStaticBlockId`; el validador viejo tira 1 falso positivo, igual que contra `header.liquid` nativo sin tocar). Los hijos se configuran UNA vez y renderizan en ambas copias (hijos agnósticos a variante: `content_for 'blocks'` no acepta params custom). Jerarquía: `_custom_menu` → `_custom_menu-item` (×4, con setting `highlight` para la pill SALE — murió el hack `:last-child`) → `_custom_menu-column` (link_list) / `_custom_menu-card` / `_custom_menu-card-group` / `_custom_menu-banner` / `_custom_menu-promo` (+ `_custom_menu-promo-tier`); y `_custom_menu-utility-link` como hijo directo del contenedor. Layout desktop por composición: grilla de 12 columnas + setting "Ancho en desktop" por bloque (CSS var `--custom-menu-span`).

**Desktop sin JS nuevo**: el ítem emite el contrato de markup de `assets/header-menu.js` (`ref="menuitem"`, `ref="submenu[]"`, `on:pointerenter="/activate"`, overflow-list con slot "more") → hover-intent, animación clip-path, "More" y `setHeaderMenuStyle()` heredados. El `{% stylesheet %}` nativo de `_header-menu.liquid` se copió 1:1 al bloque contenedor (los stylesheet solo se incluyen si el archivo se renderiza — sin la copia, toda la maquinaria visual del dropdown desaparecía). La variante `navigation_bar` se eliminó del header custom.

**Drawer mobile**: `<custom-header-drawer>` (`assets/custom-header-drawer.js`, extends `Component`) — tabs persistentes (uno por ítem, flechas ←/→/Home/End), panel por tab (mismos bloques del desktop re-presentados vía CSS: columnas → filas drill-down a pantalla completa con back, card-groups → scroll horizontal), buscador pill (abre `#search-modal` nativo), footer de utilidades, trapFocus/Escape, `activate/deactivate` no-ops (los `on:` de los li resuelven contra este componente dentro del drawer), y re-prefijado de ids `drawer-*` al conectar (evita ids duplicados entre las 2 copias). SCSS: `_header-mega-menu.scss` + `_header-drawer.scss` (con `prefers-reduced-motion`).

**Validación**: Theme Check MCP limpio en todos los archivos nuevos/modificados. **Pendiente**: `npm run build:css` + verificación en navegador (desktop hover/teclado/sticky/overflow ~800px, drawer tabs/drill-down/Escape en 390px, Theme Editor agregar/reordenar bloques) — requiere dev server del desarrollador.

## Fase 2 — detalle original del requerimiento (referencia)

Dirección recomendada: **bloques anidados custom** en el Theme Editor (no metaobjects, no matching por posición contra el link list) — cada ítem del menú principal es una instancia de bloque con sus propios sub-bloques de contenido, editable por el cliente sin tocar código. Detalle de lo que hay que soportar, por ítem (visto en las capturas de Figma, node-ids arriba):

- **ROPA**: 4 columnas de texto (Trending / Prendas / Denim / Accesorios) + sección "Por Ocasiones de Uso" con 4 cards de imagen (Dailywear, Going Out, Holiday, Workleisure).
- **COLECCIONES**: layout asimétrico — 3 cards de imagen (Dreamy, Dazzle, La Vacanza) + 1 columna de texto + 1 banner grande de imagen + 1 columna de texto adicional. Layout distinto al de Ropa, no es una grilla uniforme.
- **NAF&ME**: no es un listado de links — es un panel promocional completo (tiers de membresía Member/Silver/Black con íconos, texto descriptivo, botón CTA, banner con % de descuento y su propio CTA).
- **SALE**: 3 columnas de texto (Sale %/Precio/Ropa) + cards de imagen ("Explora tus favoritos") + banner grande.

**Drawer mobile**: no es el accordion/drill-down nativo simple. Es un drawer con **tabs persistentes** (Ropa/Colecciones/NAF&ME/Sale) + buscador visible arriba + panel de contenido que cambia según el tab activo (mismas cards/banners que el desktop, reordenados a una columna) + links con chevron que hacen drill-down a subcategorías (pantalla completa, con botón "back") + footer fijo de utilidades (Ubicación, Mi Cuenta, Rastrear Mi Pedido, Favoritos, Ayuda).

Cada bloque de nivel superior (Ropa/Colecciones/Naf&Me/Sale) debería poder renderizar tanto el dropdown desktop como el panel del tab mobile desde la misma configuración, para no duplicar contenido.

**Antes de empezar esta fase, confirmar:**
- Si "Rastrear Mi Pedido" y "Favoritos" son funcionalidad real (order tracking / wishlist) que hay que construir, o quedan fuera de alcance.
- Si el copy/contenido de cada dropdown (textos, imágenes) ya existe o hay que pedirlo.

## Fase 2.5 — bloques anidados con guardrails (reemplaza a "Fase 3 — layouts rígidos")

Implementada 2026-07-14. El cliente pidió recuperar la flexibilidad de composición de Fase 2
("n cantidad de bloques", reordenar, ítems "full imágenes"/"full columnas", ajustar cuántas
columnas/cards tiene un layout) sin volver a poder romper el layout como pasaba antes de Fase 3.

**Qué cambió:**
- `_custom_menu-item.liquid` ya NO tiene el `select` `menu_layout` ni los ~140 settings
  condicionados por `visible_if`. Ahora expone `content_for 'blocks'` y acepta bloques hijos
  reales: `_custom_menu-column`, `_custom_menu-card-group`, `_custom_menu-banner`,
  `_custom_menu-promo`. El merchant los agrega/quita/reordena libremente desde el Theme Editor.
- Nuevos archivos: `blocks/_custom_menu-{column,card,card-group,banner,promo,promo-tier}.liquid`
  — wrappers delgados que reutilizan tal cual los snippets de Fase 3
  (`snippets/custom-menu-*.liquid`, ahora con parámetro `block_attributes` para selección/drag en
  el editor). `_custom_menu-card` solo puede vivir dentro de `_custom_menu-card-group` (no es hijo
  directo del ítem) para que sus hermanos siempre se autodistribuyan como grupo.
- **`limit`/`max_blocks` NO se usaron**: se intentó (ver blueprint original evaluado) pero Theme
  Check/`validate_theme` los rechaza — Shopify solo permite esas propiedades en el schema de una
  **section**, no en el de un **theme block** (`blocks/*.liquid`). Confirmado en la práctica al
  validar `_custom_menu-item.liquid`, `_custom_menu.liquid`, `_custom_menu-card-group.liquid` y
  `_custom_menu-promo.liquid` (los 4 fallaron con "Property limit/max_blocks is not allowed").
  Esto significa que la cantidad de ítems de nivel superior, columnas, cards, etc. no tiene un
  tope explícito en el schema — solo el límite implícito de Shopify (50 bloques por
  sección/contenedor, contando todos los niveles).
- **El guardrail real está en el CSS, no en el schema**: `.custom-menu-item__grid`
  (`src/styles/components/_header-mega-menu.scss`) pasó de `display: grid` con
  `grid-column: span N` (exige que la suma de spans "cuadre" con 12) a `display: flex; flex-wrap:
  wrap` con `flex: var(--custom-menu-span, 3) 1 0` — el "Ancho relativo en desktop" de cada
  bloque (`span_desktop`, select de valores discretos 1/2/3/4/5/6/8/12 según el tipo) pasa a ser
  un PESO relativo, no una fracción fija de 12. Con 2 columnas en vez de 4, se reparten 50/50
  solas; un ítem "full imágenes" (solo `_custom_menu-card-group`) o "full columnas" (solo
  `_custom_menu-column`) se autodistribuye sin configuración especial. `min-width` por tipo de
  bloque (columna 140px, card-group 300px, banner 260px, promo 480px) es la válvula de seguridad:
  si no cabe una fila, el flex-wrap envuelve a la siguiente en vez de aplastar el contenido.
- `.custom-menu-card-group__cards` pasó de `grid-auto-flow: column` (sin wrap, se comprimía con
  muchos cards) a `grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))`.
- Fix de un riesgo real encontrado (no reportado por el cliente, pero real desde Fase 2):
  `.custom-menu-banner__media`/`.custom-menu-promo__media` no tenían `aspect-ratio` fijo — una
  imagen de proporción arbitraria podía descuadrar el alto de la fila frente a sus hermanos. Ahora
  ambos tienen `aspect-ratio` fijo + `height: auto`.
- `snippets/custom-menu-column.liquid`: si no hay `link_list` asignado y no es `request.design_mode`,
  el snippet completo no renderiza nada — evita un heading flotando sobre un hueco vacío cuando el
  merchant agrega el bloque pero olvida asignar el menú.
- `sections/header-group.json`: los 4 ítems ya wireados (ROPA/COLECCIONES/NAF&ME/SALE) se
  migraron de settings planos a árboles de bloques hijos equivalentes (mismos `span_desktop` que
  antes estaban hardcodeados en el `{% case %}`), para que el resultado visual sea idéntico al de
  antes del cambio.
- **No se agregaron `presets` con sub-árboles de bloques predefinidos** en `_custom_menu-item`
  (a diferencia de lo evaluado originalmente): el soporte de Shopify para presets de un *theme
  block* (no de una sección) con bloques hijos anidados no está confirmado en la documentación
  pública, y arriesgarlo sin poder validarlo de forma confiable no vale la pena. En su lugar, el
  punto de partida para un ítem nuevo con un diseño ya armado es **duplicar** uno de los 4 ítems
  existentes en el Theme Editor (acción nativa, sin riesgo) y editarlo desde ahí.
- `assets/header-menu.js`, `assets/custom-header-drawer.js` y
  `src/styles/components/_header-drawer.scss` **no requirieron cambios** — ya eran agnósticos a
  la cantidad/combinación de bloques hijos (el drawer opera por clase + `order` según el tipo de
  bloque, no por posición fija en el DOM).

## Archivos clave

- `sections/header.liquid` — nativo, no tocar
- `sections/custom_header-main.liquid` — header principal custom (wireado en vivo; Fase 2 reemplazó los `content_for` de `_header-menu` por `_custom_menu` y eliminó navigation_bar + settings `menu_highlight_*`)
- `sections/custom_header-top-bar.liquid` + `blocks/custom_header-*.liquid` — barra superior (wireada en vivo)
- `blocks/_custom_menu.liquid` — contenedor del menú custom (2 variantes; CSS nativo del dropdown copiado en su `{% stylesheet %}`)
- `blocks/_custom_menu-item.liquid` + `_custom_menu-{column,card,card-group,banner,promo,promo-tier,utility-link}.liquid` — bloques anidados del mega menu (Fase 2.5: bloques hijos reales que se agregan/reordenan libremente, sin `limit`/`max_blocks` — Shopify no lo permite en theme blocks — en vez de un `select` de layouts fijos)
- `assets/custom-header-drawer.js` — componente del drawer con tabs (único JS custom del header)
- `sections/header-group.json` — todo wireado, con árbol de ejemplo de los 4 dropdowns
- `src/styles/components/_header-main.scss` — estilos Fase 1 (pill de búsqueda, cuenta oculta en desktop)
- `src/styles/components/_header-mega-menu.scss` — dropdown desktop (grilla, columnas, cards, banner, promo, pill SALE)
- `src/styles/components/_header-drawer.scss` — drawer mobile (tabs, drill-down, footer, buscador pill)
- `src/styles/components/_header.scss` — legacy `.hdt-*` de otro tema, no tocar
- `src/styles/base/_mixins.scss` — `fluid()`/`fluid-type()` para valores Figma → responsive
- `assets/utilities.js`, `layout/theme.liquid` — dependencias duras del id `#header-component`
- `blocks/_header-menu.liquid`, `snippets/header-drawer.liquid`, `assets/header-menu.js` — nativos, referencia del contrato de markup, no tocar
