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

## Pendiente — Fase 2: Mega menu desktop + drawer mobile

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

## Archivos clave

- `sections/header.liquid` — nativo, no tocar
- `sections/custom_header-main.liquid` — header principal custom (wireado en vivo)
- `sections/custom_header-top-bar.liquid` + `blocks/custom_header-*.liquid` — barra superior (wireada en vivo)
- `sections/header-group.json` — ambas secciones wireadas
- `src/styles/components/_header-main.scss` — estilos Fase 1 (pill de búsqueda, pill de SALE, cuenta oculta en desktop)
- `src/styles/components/_header.scss` — legacy `.hdt-*` de otro tema, no tocar
- `src/styles/base/_mixins.scss` — `fluid()`/`fluid-type()` para valores Figma → responsive
- `assets/utilities.js`, `layout/theme.liquid` — dependencias duras del id `#header-component`
