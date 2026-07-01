# Custom Header — estado y pendientes

Branch: `feature/header`. Objetivo final: header custom basado en Figma (naf-naf), reemplazando el header nativo de Horizon, personalizado bloque a bloque.

Figma de referencia:
- Desktop: https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1509-12494
- Mobile: https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1670-6328

## Bloqueante actual

**Figma MCP rate-limited** (seat View del plan Professional agotó su cuota de tool calls: `get_design_context`, `get_screenshot`, `get_metadata` fallan con "tool call limit"). Sin esto no se puede leer el diseño real para personalizar nada visualmente. Retomar cuando:
- se renueve la cuota (esperar / upgrade de seat), o
- se compartan capturas de pantalla directas del Figma en el chat.

## Hecho

### 1. Barra de utilidades superior (`custom_header-top-bar`)
Commit `670d483`. Sección + 4 blocks ya implementados:
- `sections/custom_header-top-bar.liquid`
- `blocks/custom_header-country.liquid`
- `blocks/custom_header-help.liquid`
- `blocks/custom_header-delivery.liquid`
- `blocks/custom_header-account.liquid`

**Estado:** funcional pero **no wireada** en `sections/header-group.json` (huérfana, no aparece en el Theme Editor todavía).

### 2. Header principal — réplica base (`custom_header-main`)
`sections/custom_header-main.liquid` — copia 1:1 de `sections/header.liquid` nativo (logo + menu + search + localization + cart/account, lógica sticky/transparent). El nativo **no se tocó**.

Diffs intencionales vs. el nativo (documentados con comentarios `MOXIE:` en el archivo):
1. `id="header-component"` se mantiene idéntico al nativo (dependencia dura de `layout/theme.liquid` y `assets/utilities.js`).
2. Static block ids `header-logo`/`header-menu` → `header-logo-main`/`header-menu-main` (solo claridad, no había colisión real).
3. `schema.name` → `"Moxie Header Principal"` (antes `t:names.header`).

Validado con Shopify Dev MCP (`validate_theme`). Quedan 2 warnings de "static block id ya usado" por el reuso de `header-menu-main` en 3 variantes (menu/drawer/navigation_bar) — **confirmado que es un falso positivo del linter**, ya que el mismo warning aparece corriendo el validador contra el `header.liquid` nativo sin modificar (mismo patrón: un mismo static block renderizado en distintas ubicaciones vía `variant`). No requiere fix.

**Estado:** archivo creado, **no wireado** en `header-group.json` todavía (decisión explícita: no reemplazar el header nativo en vivo hasta avanzar más con la personalización).

## Pendiente (en orden sugerido)

1. **Recuperar acceso a Figma** (bloqueante para todo lo de abajo).
2. **Revisar bloque a bloque contra Figma** cuáles de los ~40 settings de `custom_header-main.liquid` sobran/faltan y qué cambia visualmente en cada uno:
   - Logo (posición, tamaño, variante inversa en transparent header)
   - Menu (posición, estilo, mega-menu vs texto, navigation bar)
   - Search (mostrar/ocultar, posición, estilo icon/texto)
   - Localization (country/language selector — confirmar si el diseño lo incluye o se elimina)
   - Actions/cart (icon vs texto, bubble style/colores)
   - Colores de fila top/bottom, dividers, bordes
   - Sticky header (always / scroll-up / never) y transparent header (home/product/collection)
3. **Decidir si el custom header necesita blocks propios** (`custom_header-logo`, `custom_header-menu`) o si los nativos `_header-logo`/`_header-menu` alcanzan con solo ajustar settings — según CLAUDE.md, solo crear blocks nuevos si hay cambio **estructural** real (no solo visual/CSS).
4. **Estilos nuevos** (fluid sizing, spacing, tipografía específica de Figma) van en `src/styles/components/_header.scss` — usando `fluid()`/`fluid-type()` de `src/styles/base/_mixins.scss`. Ojo: ese archivo tiene CSS muerto de otro tema (clases `.hdt-*`, no tocar, decisión ya tomada) — agregar los estilos nuevos debajo, sin mezclar.
5. **Wirear ambas secciones en `sections/header-group.json`**:
   - Agregar `custom_header-top-bar` (no está).
   - Reemplazar `header_section` (`"type": "header"`) por `"type": "custom_header-main"`, copiando/adaptando el `settings` actual y agregando el objeto `"blocks"` con los ids nuevos (`header-logo-main`, `header-menu-main`) apuntando a `_header-logo`/`_header-menu` (o a los blocks custom si se decide crearlos en el paso 3).
   - Este paso hace el cambio visible en vivo/Theme Editor — coordinar antes de hacerlo porque afecta el storefront.
6. **Verificación visual en navegador** (Theme Editor / dev server) comparando contra Figma desktop y mobile, una vez wireado.
7. **Limpieza final**: confirmar que no quedó nada huérfano, correr `shopify-theme-check` sobre todos los archivos tocados antes de dar la feature por cerrada.

## Archivos clave

- `sections/header.liquid` — nativo, no tocar
- `sections/custom_header-main.liquid` — header principal custom (creado, no wireado)
- `sections/custom_header-top-bar.liquid` + `blocks/custom_header-*.liquid` — barra superior (creada, no wireada)
- `sections/header-group.json` — pendiente de wirear ambas secciones
- `src/styles/components/_header.scss` — legacy `.hdt-*` (no tocar) + destino de estilos nuevos
- `src/styles/base/_mixins.scss` — `fluid()`/`fluid-type()` para valores Figma → responsive
- `assets/utilities.js`, `layout/theme.liquid` — dependencias duras del id `#header-component`
