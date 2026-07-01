# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shopify Horizon theme base (v3.4.0) with a custom Sass + PostCSS build pipeline. Maintained separately from upstream Horizon using a structured git workflow.

## Commands

```bash
# Full dev (CSS watcher + Shopify theme server)
npm run dev:shopify

# CSS only
npm run watch:css        # watch + rebuild on change
npm run build:css        # one-shot dev build
npm run build:css:prod   # production build (minified, no source maps)
```

Requires `.env` with `SHOPIFY_STORE=<store-slug>` (no `.myshopify.com`).

## CSS Architecture

- **Entry:** `src/styles/main.scss`
- **Output:** `assets/mox-custom-styles.css`
- **Pipeline:** Sass → PostCSS (autoprefixer) → cssnano (prod only)

```
src/styles/
├── base/         # _variables.scss (CSS custom props), _mixins.scss, _reset.scss
├── components/   # _header.scss, _footer.scss
└── pages/        # _home.scss, _plp.scss
```

The `container` mixin in `_mixins.scss` is the standard layout wrapper (`max-width: 1200px`).

### Fluid scaling (valores fijos de Figma → CSS responsivo)

Figma siempre entrega valores fijos en px para el desktop. Antes de hardcodear un px, revisar primero si Horizon ya lo resuelve nativo:

**1. Texto que es h1-h6 o párrafo (dentro de la escala de Theme Editor):** ya es fluido nativo. Horizon genera `--font-size--h1` … `--font-size--h6` y `--font-size--paragraph` como `clamp()` en `snippets/theme-styles-variables.liquid` (a partir de `settings.type_size_*`), con lógica anti-solapamiento entre tamaños vecinos. **Usar esas variables (`var(--font-size--h1)`, etc.), nunca reimplementar esto** — ya es más completo que cualquier función custom (está atado al Theme Editor).

**2. Todo lo que Horizon NO cubre** — tamaños de fuente fuera de esa escala (badges, eyebrows, números de stat, etc.) y cualquier valor de layout (padding, gap, width, height, etc.) — usar las funciones Sass en `src/styles/base/_mixins.scss`:

- `fluid($px)` — layout (padding, gap, width, height, etc.)
- `fluid-type($px)` — font-size fuera de la escala h1-h6/paragraph (piso de legibilidad más conservador, 85% fijo)

Ambas generan un `clamp()` entre el ancho de referencia de Figma (`$ref-w: 1440px`) y el breakpoint nativo de Horizon (`$min-w: 990px`, definidos en `_variables.scss`). Por debajo de 990px siguen mandando los breakpoints fijos de Horizon (750px/990px) — `fluid()` no los reemplaza, solo cubre el rango 990–1440px donde el tema no tiene escalado propio.

Uso en un partial nuevo:
```scss
@use '../base/mixins' as *;

.mi-componente {
  padding: fluid(20);
  font-size: fluid-type(16); // solo si NO es h1-h6/paragraph
}
```

## Theme Structure

Standard Shopify Liquid theme layout:
- `layout/theme.liquid` — master HTML template, loads `mox-custom-styles.css`
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
- Custom styles go in `src/styles/`, never inline in Liquid files
- Keep SCSS modular; add new partials under the appropriate subfolder and `@use` them in `main.scss`

## CORE RULES (CRITICAL)

- Never modify Horizon core files
- Always extend instead of overwrite
- All custom CSS goes in src/styles/
- Do not inline CSS in Liquid
- Always check existing theme implementation before building new logic

## CUSTOMIZATION DECISION TREE

1. Can it be solved with CSS?
   → Use src/styles/

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

- Source code: src/
- Compiled code: assets/
- Never edit compiled CSS directly
- Always modify source and rebuild

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

1. **¿Se resuelve solo con CSS?** → Override en `src/styles/`. No tocar el Liquid original.
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
