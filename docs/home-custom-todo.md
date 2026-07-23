# Custom Home — estado y pendientes

Branch: `feat/homepage`. Objetivo final: home custom basado en Figma (naf-naf), sección por sección, usando el flujo `/moxie-design` para cada franja nueva.

Figma de referencia:
- Desktop (home completo): https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1509-12485
- Mobile (home completo): https://www.figma.com/design/cKO4NnWn4Hy7Ii6Q5reHba/naf-naf?node-id=1476-8334
- File key: `cKO4NnWn4Hy7Ii6Q5reHba`. Nodo raíz desktop `1509:12485` ("home"), nodo raíz mobile `1476:8334` ("HOME_MOBILE").

Header y footer **fuera de alcance** en este doc — ya resueltos en otras ramas (`feature/header` para el header; footer wireado como `Footer` instance en `custom_hero-slider`/index).

## Decisiones confirmadas por el cliente/usuario

1. **Hero:** el slider de 3 slides ya construido (`custom_hero-slider`, Ana Beliza / La Vacanza / New drop) se mantiene tal cual. El Figma de este archivo muestra un hero estático distinto ("Love is where mom is") — se asume desactualizado o de otro brief y se ignora. No se retrabaja el Hero.
2. **`product_list_fa6P9H`** (stock `product-list`) se repositiona como la sección "New Arrivals" del Figma (reubicado en `order` de `templates/index.json`, antes de `carousel_capsulas_temporada`). Sigue con `collection: "all"` de placeholder — **falta que el cliente confirme la colección real** para esta franja.
3. **`collection_list_h4Xr2p`** (stock `collection-list`, vacío) no tiene match directo con ningún módulo del Figma. El diseño trae un carrusel de colecciones ("Módulo colección 01") y una grilla de banners curados ("Módulo colección 02"), ninguno es un grid stock de 4 columnas. Se decide su destino (reusar como base o eliminar) al construir esas dos secciones.
4. **Orden de construcción:** top-to-bottom siguiendo el Figma.

## Componente compartido: Product Card — 90%

Se abordó **antes** que las secciones nuevas del home porque de él dependen casi todas (New Arrivals, Carrusel tabs, Recrea el look, Ocasiones de uso, Banner y producto, etc.) — arreglarlo una sola vez en el componente compartido evita repetir el trabajo en cada sección. Figma de referencia: card `2138:4743` (desktop, dentro de "New Arrivals") / `2152:362` (mobile); variantes/tallas `1476:6379` ("hovertallas").

**Hecho:**
- Wishlist: bug de ícono invisible corregido (`<path>` sin `<svg>` envolvente), bloque `custom_wishlist` wireado en `templates/collection.json` (PLP) y `templates/index.json` (home) — antes no estaba en ningún `block_order`. Posición desktop (misma fila que el precio, a la derecha) y chip mobile (cuadrado gris `#8e8e8e`/radio 2px, antes círculo translúcido) fieles al Figma.
- Selector de talla (trigger "+"): siempre visible en desktop (antes oculto hasta hover de toda la card), anclado abajo-derecha (bug de positioning por dependencia de variables CSS del wrapper nativo `.quick-add`, corregido con offset propio). Overlay de hover con blur/translúcido fiel al componente "hovertallas" del Figma. Corregido para buscar la opción **"Talla"** explícita (antes tomaba la primera opción del producto, mostrando color en vez de talla en productos donde color viene primero).
- Badge "NEW IN" del Figma = sistema de campaign flag (metaobject) ya existente — no requirió código, es contenido (crear el metaobject con label "NEW IN" queda del lado del cliente/usuario en Admin).
- CSS migrado de `src/styles/components/_product-card.scss` (legacy Sass) a `{% stylesheet %}` nativo en `custom_wishlist-button.liquid`, `custom_product-card-size-select.liquid` y `custom_quick-view-modal.liquid`, por `docs/css-architecture.md`.

**Pendiente (10%):** revisar mobile (el usuario lo dejó para después de cerrar desktop).

**Fuera de alcance (decisión del usuario):** persistencia real de wishlist (sigue stub, solo `aria-pressed`) y guía de tallas del quick-view (sigue oculta, falta fuente de datos del cliente).

## Inventario de secciones (Figma ↔ built)

| # | Sección | Nodo desktop | Nodo mobile | Estado | Archivo / nota |
|---|---------|-------------|-------------|--------|-----------------|
| 1 | Hero ("Love is where mom is" en Figma / slider real) | `1668:6288` | `1563:4852` | ✅ Hecho | `sections/custom_hero-slider.liquid` — decisión: mantener slider, ignorar hero estático del Figma |
| 2 | Franja promocional (70% off + 2 CTA) | `1668:6289` | `1670:6329` | ✅ Hecho | `promo_banner_ana_vacanza` en `index.json` |
| 3 | Categorías principales (Camisas/Tejidos/Jeans/Pantalones) | sin frame propio — hijos sueltos del root, confirmar wrapper real en extracción | `1476:8375` | ⏳ Pendiente | nuevo |
| 4 | Módulo colección 01 (carrusel de colecciones, `Colecciones_carrusel`) | `2138:5623` | `1476:8829` | ⏳ Pendiente | nuevo — evaluar reuso de `collection_list_h4Xr2p` |
| 5 | New Arrivals | `2138:4736` | `2152:362` | 🔶 Reposicionado | `product_list_fa6P9H` — falta asignar colección real (hoy `"all"`) |
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

**Resumen:** 3 secciones hechas, 1 reposicionada (pendiente dato del cliente), 13 nuevas por construir.

## Flujo por sección

Para cada fila ⏳ Pendiente, en el orden de la tabla:
1. Invocar `/moxie-design` con las URLs desktop+mobile del nodo puntual (deep link `?node-id=`).
2. Dejar correr el flujo completo de la skill: extracción + tabla de inventario → build fiel (4 garantías) → `moxie-interactions` si aplica (secciones 6 y 13) → `moxie-validate`.
3. Verificar visualmente contra Figma (desktop + mobile) con `npm run dev:shopify` levantado.
4. Actualizar esta tabla (Hecho + archivo(s) creados) antes de pasar a la siguiente sección.

Al cerrar todas las secciones, correr `/qa home` — deja el status en `docs/qa/QA-home.md`.

## Archivos clave

- `templates/index.json` — orden de secciones del home (single source of truth del layout final)
- `sections/custom_hero-slider.liquid` + `blocks/_custom_hero-slide.liquid` + `assets/custom-hero-slider.js` — Hero (hecho)
- `promo_banner_ana_vacanza` (sección `type: section` genérica, no archivo custom propio) — Franja promocional (hecho)
- `carousel_capsulas_temporada` (sección `type: carousel` stock) — Banners cápsulas (hecho)
- `product_list_fa6P9H` (sección `type: product-list` stock) — repositionado como New Arrivals, falta colección real
- `collection_list_h4Xr2p` (sección `type: collection-list` stock, vacía) — destino a decidir en secciones 4/8
- `src/styles/pages/_home.scss` — fixes puntuales ya aplicados (slider next button, promo banner mobile alignment, flechas del carousel de cápsulas en mobile); wireado en `src/styles/main.scss`
- Product Card (compartido, no exclusivo de home — 90%, ver sección arriba): `blocks/_product-card-gallery.liquid`, `blocks/custom_wishlist.liquid`, `snippets/custom_wishlist-button.liquid`, `snippets/custom_product-card-size-select.liquid`, `snippets/custom_quick-view-modal.liquid` (los 3 últimos ya con `{% stylesheet %}` nativo migrado); `templates/collection.json` (PLP) wireado también. `src/styles/components/_product-card.scss` quedó vacío (migrado)
