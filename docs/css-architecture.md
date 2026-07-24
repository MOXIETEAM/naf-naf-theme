# CSS Architecture

Estándar vigente para CSS en este theme. Reemplaza el modelo anterior (Sass+PostCSS → bundle único `assets/mox-custom-styles.css`), heredado de un flujo de trabajo en VTEX que no aplica bien a Shopify.

## Por qué cambiamos

Un solo CSS compilado cargado global en cada página (`{{ 'mox-custom-styles.css' | asset_url | stylesheet_tag }}`) no tiene purge por sección: cada página descarga el CSS de *todas* las secciones del theme, exista o no en esa página. Crece sin freno con cada feature nueva y no hay forma de saber, mirando el bundle, a qué componente pertenece cada clase.

Shopify Online Store 2.0 ya resuelve esto de forma nativa: **CSS por componente vía `{% stylesheet %}`**, soportado en `sections/`, `blocks/` y `snippets/`. Shopify colecta e inyecta automáticamente solo el CSS de lo que realmente se renderiza en cada página — sin build step, sin bundle, sin dead weight. Confirmado contra la guía oficial (Shopify Dev MCP, API `liquid`) y contra el propio Horizon nativo, que ya usa este patrón en `sections/header.liquid`, `sections/footer.liquid`, `blocks/_card.liquid`, `blocks/_image.liquid`, etc.

## Paso a paso: qué hacer cada vez que hay que tocar CSS

Seguir en orden. No saltar pasos.

1. **¿Es texto h1-h6 o párrafo, dentro de la escala del Theme Editor?** → usar `var(--font-size--h1)` … `var(--font-size--h6)`, `var(--font-size--paragraph)`. Ya es fluido nativo. Terminado — no sigas al paso 2.
2. **¿El valor (color, spacing, radio, etc.) ya existe como token?** → usarlo con `var(--token)`. Tokens nativos de Horizon en `snippets/theme-styles-variables.liquid`, tokens custom de Moxie en `src/styles/base/_variables.scss` (ver [Tokens de diseño](#tokens-de-diseño)). Nunca hardcodear el valor ni redeclarar el token dentro del componente.
3. **¿Es un px fijo de Figma que necesita escalar entre 990px y 1440px** (layout: padding/gap/width/height, o font-size fuera de la escala h1-h6/paragraph)? → correr `node tools/fluid.js <px>` (agregar `--type` si es tamaño de fuente) y pegar el `clamp()` resultante como valor literal (ver [tools/fluid.js](#toolsfluidjs--reemplazo-de-fluidfluid-type)). Por debajo de 990px siguen los breakpoints fijos de Horizon (750px/990px), esto no los reemplaza.
4. **Decidir dónde vive el `{% stylesheet %}`:**
   - Componente usado en un solo lugar y el archivo no es grande → agregarlo/editarlo dentro del mismo `.liquid` (sección/bloque/snippet). Si es un archivo **nativo** de Horizon, marcar el cambio con `{%- comment -%} MOXIE: [motivo] {%- endcomment -%}`.
   - Se reusa desde 2+ sections/blocks, el markup ya es grande, o el bloque puede no renderizarse siempre (estado vacío, contenido inyectado por AJAX/facets) → crear/editar `snippets/custom_[nombre]-styles.liquid` con el `{% stylesheet %}` y `{% render %}` desde el componente que lo usa (ver [patrón "afuera y lo llamo"](#patrón-afuera-y-lo-llamo-css-en-snippet-dedicado)).
5. **Escribir el CSS** siguiendo las reglas duras del `{% stylesheet %}`: cero interpolación Liquid, valores dinámicos solo vía custom properties seteadas inline en el HTML (ver [Regla de oro](#regla-de-oro)).
6. **No tocar `src/styles/` para código nuevo** — es legacy en transición. Si el componente que estás tocando todavía tiene su CSS en un partial de ese bundle (ver [checklist de migración](#checklist-de-migración-del-legacy-sass)), aprovechá y migralo: movés ese bloque al `{% stylesheet %}` nativo, sacás el partial/`@use` si queda vacío, y actualizás la tabla del checklist.
7. **Validar** los archivos `.liquid` tocados con `mcp__shopify-dev-mcp__validate_theme` (o dejar que corra el skill `shopify-theme-check`) antes de dar la tarea por terminada — nunca reportar un cambio de Liquid como completo sin esto.
8. **Confirmar visualmente** si hay un dev server corriendo (`npm run dev:shopify` / `shopify theme dev`) que no se rompió nada — paridad visual con el estado anterior al cambio.
9. **Si este documento cambió** (nueva regla, nuevo patrón, ajuste al estándar) → revisar la sección "CSS Architecture" del `CLAUDE.md` de este proyecto y actualizarla para que el resumen quede alineado con lo que dice acá. Este doc es la fuente de verdad detallada; `CLAUDE.md` es el resumen que Claude carga automático en cada sesión — no pueden quedar desincronizados.

## Regla de oro

**Todo CSS nuevo va en un `{% stylesheet %}` dentro del `.liquid` de la sección/bloque/snippet que lo usa. Nunca se agrega código nuevo al bundle Sass legacy (`src/styles/`).**

```liquid
<div class="price-discount-badge">-{{ discount_percent }}%</div>

{% stylesheet %}
  .price-discount-badge {
    display: inline-flex;
    padding: 0.2em 0.5em;
    background-color: var(--color-foreground);
    color: var(--color-background);
  }
{% endstylesheet %}
```

Reglas duras dentro de `{% stylesheet %}` (así es como lo hace Horizon nativo, cero excepciones):
- **Cero interpolación Liquid** (`{{ }}`) dentro del bloque — Liquid no se renderiza ahí.
- Valores dinámicos (settings del Theme Editor, valores por bloque) entran **solo** vía CSS custom properties, seteadas inline en el HTML: `style="--gap: {{ block.settings.gap }}px"` y consumidas como `var(--gap)` en el CSS.
- Un único valor variable → usar `var()`. Si son muchas propiedades que cambian juntas (ej. un layout completo) → usar una clase condicional (`class="{{ block.settings.layout }}"`) en vez de multiplicar custom properties.

## Patrón "afuera y lo llamo" (CSS en snippet dedicado)

Si el archivo de marcado ya es grande y no querés que el CSS lo infle más, movelo a un snippet dedicado que **solo** contenga el `{% stylesheet %}`, y renderizalo desde la sección/bloque. Esto ya es un patrón nativo de Horizon — `sections/main-collection.liquid` no tiene stylesheet propio, delega en `snippets/product-card-styles.liquid`.

Convención de nombre: `snippets/custom_[nombre]-styles.liquid`.

```liquid
{# sections/custom_hero.liquid #}
...markup...
{% render 'custom_hero-styles' %}
```

```liquid
{# snippets/custom_hero-styles.liquid #}
{% stylesheet %}
  .custom-hero { ... }
{% endstylesheet %}
```

Shopify deduplica automáticamente: si el snippet se renderiza varias veces en la misma página, el CSS solo se inyecta una vez.

### ¿Inline en la sección o snippet aparte? Da igual en performance

Shopify compila **un** stylesheet por archivo `.liquid` (sección/bloque/snippet) y lo inyecta **una sola vez** por página, sin importar cuántas veces se renderice ese archivo ni si el `{% stylesheet %}` vive dentro de la sección o en un snippet separado. **Cero impacto en peso descargado ni en Core Web Vitals por la ubicación del archivo** — la decisión de separar es 100% organizativa, no de performance.

Separar en un snippet dedicado vale la pena cuando aplica alguno de estos casos:

1. **El componente se renderiza desde 2+ sections/blocks distintos** (ej. una card de producto usada en collection, search y related products). Un snippet único = una sola fuente de verdad; pegado inline en cada sección, Shopify igual dedupea *si el texto es byte-idéntico*, pero mantenerlo idéntico a mano en 3-4 archivos es donde se rompe con el tiempo.
2. **El markup ya es largo** — separar el CSS evita que el archivo se vuelva un mamotreto donde no se distingue el HTML de los estilos.
3. **El bloque que contiene el CSS puede no renderizarse siempre** (contenido condicional, estados vacíos, morphing por AJAX). Caso real en este mismo theme: `snippets/product-card-styles.liquid` existe separado — con su propio doc comment explicándolo — justamente porque si el CSS viviera dentro de la card individual (adentro de un `{% for %}` de productos) y el grid llega vacío por un filtro, ese `{% stylesheet %}` nunca se renderiza en esa carga inicial. Cuando facets hace el morph AJAX e inyecta cards nuevas, el CSS ya tiene que estar cargado — si no, hay FOUC. Por eso la sección (`main-collection.liquid`) renderiza el snippet de estilos **siempre**, exista o no producto, garantizando que el stylesheet esté presente desde el primer render.

Regla práctica: si el componente se renderiza desde un solo lugar y el archivo no es grande, el `{% stylesheet %}` puede ir inline sin culpa — menos indirección, un archivo menos que abrir. Separar quedamos en los 3 casos de arriba, no por costumbre.

## Tokens de diseño

Toda variable de diseño (color, spacing, tipografía, radios, etc.) sale de la capa de tokens existente:

- **Tokens nativos de Horizon** (`--font-body--family`, `--color-foreground`, `--padding-*`, `--gap-*`, `--layer-*`, etc.) — definidos en `snippets/theme-styles-variables.liquid`. Usar siempre estos primero.
- **Tokens custom de Moxie** (`--color-primary`, `--font-primary`, etc.) — definidos en `src/styles/base/_variables.scss` hoy; se irán moviendo a un `{% style %}` propio a medida que se migre cada componente que los consume.

**Nunca redeclarar un token dentro de un `{% stylesheet %}` de componente.** Si falta un token, se agrega a la capa global, no se hardcodea el valor en el componente.

## Texto vs. layout: qué escala y cómo

Ver también la sección "Fluid scaling" del `CLAUDE.md` del proyecto — resumen aquí:

1. **Texto h1-h6 / párrafo dentro de la escala del Theme Editor** → ya es fluido nativo vía `var(--font-size--h1)` … `var(--font-size--h6)`, `var(--font-size--paragraph)`. Nunca reimplementar esto.
2. **Todo lo demás** (badges, eyebrows, números de stat, y cualquier padding/gap/width/height) → clamp() calculado con `tools/fluid.js` (ver abajo) y pegado como CSS literal dentro del `{% stylesheet %}`.

## `tools/fluid.js` — reemplazo de `fluid()`/`fluid-type()`

Los mixins Sass `fluid($px)`/`fluid-type($px)` dejaron de ser el camino de autoría (no hay Sass corriendo dentro de un `{% stylesheet %}`). El reemplazo es un script standalone, **fuera del build del theme** — no corre en `npm run build:css` ni en ningún hook, se ejecuta manualmente al maquetar:

```bash
node tools/fluid.js 20          # -> clamp(14px, 1.39vw, 20px)   (layout: padding, gap, width, height)
node tools/fluid.js 16 --type   # -> clamp(14px, 1.11vw, 16px)   (font-size fuera de la escala h1-h6/paragraph)
```

El script replica exactamente la matemática de `_mixins.scss` (mismo `$ref-w: 1440`, `$min-w: 990`, mismo piso del 85% para `fluid-type`). El output se pega literal como `clamp()` en el `{% stylesheet %}` — no queda ninguna dependencia de Sass en el archivo final.

## Do / Don't

| Hacer | No hacer |
|---|---|
| CSS nuevo en `{% stylesheet %}` de la sección/bloque/snippet | Agregar código nuevo a `src/styles/` |
| `var(--token)` para valores dinámicos | `{{ settings.x }}` interpolado dentro de `{% stylesheet %}` |
| Reutilizar clases nativas ya existentes (`.menu-list__*`, `.price-item__group`, etc.) cuando el diseño calce | Reinventar una clase que ya existe nativa |
| `clamp()` literal calculado con `tools/fluid.js` | Reimplementar `fluid()`/`fluid-type()` con Sass o JS runtime |
| Prefijo `custom_` en secciones/bloques/snippets propios de Moxie | Clases sin scope claro que puedan chocar con nativas |

## Checklist de migración del legacy Sass

El pipeline Sass (`src/styles/`, `assets/mox-custom-styles.css`, scripts `sass:*`/`post:*` de `package.json`) **se mantiene activo durante la transición** — no se rompe nada a mitad de camino. Se retira en un PR dedicado ahora que esta lista llegó a cero.

Regla de migración: **al tocar una sección por cualquier feature o fix, esa es la oportunidad de migrar su CSS — no se migra todo de golpe.**

| Partial | Estado | Nota |
|---|---|---|
| `components/_header.scss` | Eliminado, código muerto | Cero referencias en `.liquid`/`.js` (`hdt-site-top_nav`, `clx-menu-item__*`, etc. — prefijo de otro tema) |
| `components/_footer.scss` | Eliminado, código muerto | Cero referencias en `.liquid` (`hdt-footer-main`, `hdt-toolbar*`) |
| `components/_header-main.scss` | Migrado (archivo vacío, queda en `@use` sin romper nada) | Alturas fijas, glass mobile y buscador-pill del header → `sections/custom_header-main.liquid` |
| `components/_header-mega-menu.scss` | Migrado (archivo vacío, queda en `@use` sin romper nada) | Pill destacada (SALE) y tab activo → `blocks/_custom_menu.liquid`/`blocks/_custom_menu-item.liquid`. Grilla del dropdown → `blocks/_custom_menu-item.liquid`. Columna/card/card-group/banner/promo/promo-tier → `snippets/custom-menu-column.liquid`, `snippets/custom-menu-card.liquid`, `snippets/custom-menu-card-group.liquid`, `snippets/custom-menu-banner.liquid`, `snippets/custom-menu-promo.liquid`, `snippets/custom-menu-promo-tier.liquid` |
| `components/_header-drawer.scss` | Migrado (archivo vacío, queda en `@use` sin romper nada) | Shell del drawer (summary/icon/panel/search/nav/list + animación) → `blocks/_custom_menu.liquid`. Variante drawer de tab/panel/grid → `blocks/_custom_menu-item.liquid`. Drill-down de columna → `snippets/custom-menu-column.liquid`. Scroll horizontal de cards → `snippets/custom-menu-card-group.liquid`. Footer de utilidades → `blocks/_custom_menu-utility-link.liquid` |
| `components/_product-card.scss` | Migrado (archivo vacío, queda en `@use` sin romper nada) | Badge de descuento → `snippets/price.liquid`. Wishlist → `snippets/custom_wishlist-button.liquid` (de paso se corrigió un bug: el ícono se renderizaba sin `<svg>` envolvente y no pintaba). Size-select → `snippets/custom_product-card-size-select.liquid` (de paso, el trigger "+" se restyleó a chip gris `#8e8e8e`/radio 2px fiel a Figma, en vez de la píldora blanca nativa). Quick-view modal → `snippets/custom_quick-view-modal.liquid` |
| `pages/_home.scss` | Migrado (archivo vacío, queda en `@use` sin romper nada) | Alineación mobile del promo banner → `sections/section.liquid`. Flechas visibles en mobile del carousel → `sections/carousel.liquid`. `.hdt-slider__button--next`/`.hdt-slider__dots` eliminados sin migrar (código muerto, mismo prefijo `hdt-*`) |
| `pages/_plp.scss` | Eliminado, código muerto | Cero referencias en `.liquid`/`.js` (`hdt-collection-product-row`, `hdt-card-product__*`, `hdt-collection-products-list-mb` — nunca tocado por un commit de Moxie) |

## Ejemplo de referencia ya migrado

`snippets/price.liquid` — el badge de `-X%` de descuento se movió del bundle Sass a un `{% stylesheet %}` nativo dentro del propio snippet (archivo nativo de Horizon, ya venía con una modificación mínima marcada `MOXIE:`). Es el ejemplo a seguir para el resto del checklist.
