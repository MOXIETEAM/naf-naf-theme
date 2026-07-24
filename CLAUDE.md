# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shopify Horizon theme base (v3.4.0). CSS lives natively per component via `{% stylesheet %}` (see `docs/css-architecture.md`). El pipeline legacy Sass + PostCSS de bundle único fue retirado por completo — no hay build step de CSS en este repo. Maintained separately from upstream Horizon using a structured git workflow.

## Commands

```bash
# Dev (Shopify theme server)
npm run dev:shopify
```

Requires `.env` with `SHOPIFY_STORE=<store-slug>` (no `.myshopify.com`).

## CSS Architecture

**Estándar vigente: CSS por componente vía `{% stylesheet %}` nativo, en el propio `.liquid` de la sección/bloque/snippet.** Ver `docs/css-architecture.md` para la guía completa (patrón "afuera y lo llamo" con snippets dedicados, tokens de diseño). Esa doc es la fuente de verdad — este archivo solo resume.

No existe `src/styles/` en este repo — el pipeline Sass+PostCSS (bundle único `assets/mox-custom-styles.css`) fue retirado tras completar la migración a `{% stylesheet %}` nativo (ver checklist cerrado y playbook de retiro en `docs/css-architecture.md`). Si estás replicando este estándar en otra tienda Moxie que todavía tenga ese pipeline activo, seguí ese mismo playbook cuando termine su propia migración. El mixin `container` legacy (`max-width: 1200px`) nunca se llegó a usar (`@include container` no aparece en ningún partial) — no hay nada que migrar; para un wrapper de ancho máximo usar las clases nativas de Horizon `.page-width-normal`/`.page-width-wide`/`.page-width-narrow`/`.page-width-content` (`assets/base.css`, tokens en `snippets/theme-styles-variables.liquid`).

### Fluid scaling (valores fijos de Figma → CSS responsivo)

Figma siempre entrega valores fijos en px para el desktop. Antes de hardcodear un px, revisar primero si Horizon ya lo resuelve nativo:

**1. Texto que es h1-h6 o párrafo (dentro de la escala de Theme Editor):** ya es fluido nativo. Horizon genera `--font-size--h1` … `--font-size--h6` y `--font-size--paragraph` como `clamp()` en `snippets/theme-styles-variables.liquid` (a partir de `settings.type_size_*`), con lógica anti-solapamiento entre tamaños vecinos. **Usar esas variables (`var(--font-size--h1)`, etc.), nunca reimplementar esto** — ya es más completo que cualquier función custom (está atado al Theme Editor).

**2. Todo lo que Horizon NO cubre** — tamaños de fuente fuera de esa escala (badges, eyebrows, números de stat, etc.) y cualquier valor de layout (padding, gap, width, height, etc.) — calcular el `clamp()` con el helper standalone `tools/fluid.js` (no corre en el build, se ejecuta manualmente) y pegar el resultado literal dentro del `{% stylesheet %}`:

```bash
node tools/fluid.js 20          # -> clamp(14px, 1.39vw, 20px)   layout: padding, gap, width, height
node tools/fluid.js 16 --type   # -> clamp(14px, 1.11vw, 16px)   font-size fuera de h1-h6/paragraph
```

El script replica la misma fórmula de los mixins Sass `fluid()`/`fluid-type()` que existían en el pipeline ya retirado: ancho de referencia de Figma `$ref-w: 1440px`, breakpoint nativo de Horizon `$min-w: 990px`, piso de legibilidad 85% fijo para `fluid-type`. Por debajo de 990px siguen mandando los breakpoints fijos de Horizon (750px/990px) — esto no los reemplaza, solo cubre el rango 990–1440px donde el tema no tiene escalado propio.

## Theme Structure

Standard Shopify Liquid theme layout:
- `layout/theme.liquid` — master HTML template; no longer loads any global CSS bundle, each component ships its own `{% stylesheet %}` (see `docs/css-architecture.md`)
- `sections/` — theme editor sections (43 files)
- `blocks/` — reusable section blocks (114 files)
- `snippets/` — Liquid partials (93 files)
- `templates/` — page templates (JSON-based)
- `config/settings_schema.json` — theme customizer settings

## Git Workflow

```
main        → upstream Shopify/horizon only (never modify directly)
development → project work
feature/*   → individual features, branch from development
```

**To pull Horizon updates:**
```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

git checkout development
git merge main
```

Resolve conflicts in `development`, never in `main`.

## Rules

- Never modify Horizon core files — extend instead
- CSS nuevo va en un `{% stylesheet %}` nativo dentro del componente (ver `docs/css-architecture.md`) — no existe ningún `src/styles/` ni bundle Sass en este repo

## CORE RULES (CRITICAL)

- Never modify Horizon core files
- Always extend instead of overwrite
- CSS nuevo: `{% stylesheet %}` nativo por componente (ver `docs/css-architecture.md`) — no hay pipeline Sass/PostCSS en este repo
- Do not inline CSS in Liquid outside of `{% stylesheet %}`/`{% style %}` tags
- Always check existing theme implementation before building new logic

## CUSTOMIZATION DECISION TREE

1. Can it be solved with CSS?
   → `{% stylesheet %}` nativo en el componente (sección/bloque/snippet). Si el marcado ya es grande, usar un snippet dedicado `custom_[nombre]-styles.liquid` (patrón "afuera y lo llamo", ver `docs/css-architecture.md`).

2. Small Liquid change?
   → Modify minimally + add comment:
   {%- comment -%} MOXIE: ... {%- endcomment -%}

3. Structural change?
   → Create custom file (never modify original)

## THEME INTEGRATION RULES

- Respect Horizon rendering model (Liquid = server-side)
- Avoid unnecessary JS (prefer CSS / Liquid)
- Reuse existing components before creating new ones
- Do not duplicate functionality already in theme

## SOURCE OF TRUTH

- CSS: no hay paso de compilación — el `{% stylesheet %}` dentro de cada `.liquid` (sections/blocks/snippets) ES el source, editar ahí directamente
- `assets/` — JS, imágenes, fuentes y otros estáticos servidos tal cual (no CSS compilado)

## AI OPERATING MODE

- Give only ONE solution at a time
- Do not guess — verify when uncertain
- Read files before modifying
- Follow Shopify best practices (performance, simplicity, maintainability)

## JS RULES

- Always use theme's native system
- Do not introduce new frameworks unless necessary
- Reuse existing components (sliders, modals, etc.)

## AI Behavior

- Actuar como experto en Shopify (Liquid, SCSS, JS, optimización de temas y apps).
- Una sola solución a la vez, bien planteada. Si no funciona, pasar a la siguiente.
- Si no sabes algo, NO inventes — busca en la web y regresa con información verificada.
- Antes de tocar cualquier archivo, leerlo primero.
- NO responder preguntas de Shopify solo desde memoria — verificar contra docs oficiales cuando haya duda.

---

## Filosofía de Customización

El objetivo es **nunca romper el tema base** para que actualizaciones upstream se apliquen sin conflictos.

### Árbol de decisión (en orden de prioridad)

1. **¿Se resuelve solo con CSS?** → `{% stylesheet %}` nativo en el componente (ver `docs/css-architecture.md`). Si es un archivo nativo de Horizon, se agrega el bloque marcado `MOXIE:`; si el marcado ya es grande, usar un snippet dedicado `custom_[nombre]-styles.liquid` en vez de inflar el archivo.
2. **¿Requiere un cambio mínimo en Liquid?** → Modificar el original con el cambio más pequeño posible. Marcar con `{%- comment -%} MOXIE: [descripción] {%- endcomment -%}`.
3. **¿Requiere un cambio estructural?** → Crear archivo custom nuevo basado en el original. No modificar el original.

### Antes de crear algo nuevo

1. **Auditar el tema base**: Buscar si ya existe una sección, bloque, snippet o componente JS que haga lo que se necesita o algo cercano.
2. **Entender el patrón nativo**: Leer cómo el tema resuelve funcionalidades similares (sliders, tabs, accordions, modales, lazy loading). Usar el mismo sistema interno.
3. **Reutilizar antes de reinventar**: Si el tema tiene un slider con su propio JS, usarlo. Si tiene un sistema de componentes, extenderlo. Solo crear JS custom o traer un framework si el tema no ofrece nada viable.

---

## JS — Integración con el tema base

Antes de escribir JS custom:

1. **Identificar el sistema de componentes del tema** (ej. Horizon usa `Component<Refs>` con `ref=` y `on:click=`; HDT usa `themeHDN`; Dawn usa Web Components con `customElements.define`). Cada tema tiene el suyo.
2. **Usar ese mismo sistema** para componentes custom. Si el tema extiende una clase base, el componente custom también.
3. **Reutilizar JS existente** para: sliders, modales/drawers, lazy loading, fetch de product/cart data.
4. **Solo crear JS independiente** si el tema no tiene nada que cubra la necesidad, o adaptar lo existente sería más complejo que crear desde cero.

---

## Nomenclatura Custom

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Sección | `custom_[descriptor].liquid` | `custom_hero.liquid` |
| Bloque | `custom_[descriptor].liquid` | `custom_promo_banner.liquid` |
| Snippet | `custom_[descriptor].liquid` | `custom_product_badge.liquid` |
| Preset name | `"Moxie [descripción]"` | `"Moxie Hero"` |
| Preset category | `"Moxie"` | — |

> El prefijo **"Moxie"** identifica componentes propios en el Theme Editor.

---

## Animaciones en Secciones Custom

Incluir un reveal sutil al cargar o re-renderizar, alineado con el estilo del tema base. Usar las variables de animación del tema, motion restringido, y **siempre** fallback para `prefers-reduced-motion`.
