# 🧩 Horizon Base Theme

Base para proyectos Shopify usando **Horizon + Sass + PostCSS + Git workflow**.

---

## 🚀 1. Requisitos (una sola vez)

```bash
# Node LTS (v20 recomendado)
nvm install 20
nvm use 20

# Shopify CLI
npm -g uninstall @shopify/cli @shopify/theme
npm -g i @shopify/cli@latest @shopify/theme@latest
shopify version
```

---

## 📦 2. Setup del proyecto

```bash
git clone <URL_DEL_REPO>.git
cd <CARPETA>
npm install
cp .env.example .env
```

---

## ⚙️ 3. Configurar tienda

Editar `.env`:

```bash
SHOPIFY_STORE=tu-tienda
```

👉 Usa solo el nombre (sin `.myshopify.com`)

Ejemplo:

Si tu tienda es:
https://admin.shopify.com/store/croydon-colombia

Entonces debes usar:

```bash
SHOPIFY_STORE=croydon-colombia
```

---

## 🧪 4. Desarrollo

```bash
npm run dev:shopify
```

---

## 🎨 CSS

- Entrada: `src/styles/main.scss`
- Output: `assets/mox-custom-styles.css`

Pipeline:
- Sass → compilación
- PostCSS → autoprefixer
- cssnano → solo producción

---

## 🌿 Git Workflow

- `main` → Horizon puro (NO tocar)
- `development` → proyecto
- `feature/*` → desarrollo

---

## 🔄 Actualizar Horizon (CRÍTICO)

```bash
# 1. Actualizar base (Horizon)
 git checkout main
 git fetch upstream
 git merge upstream/main
 git push origin main

# 2. Aplicar al proyecto
 git checkout development
 git merge main
```

Reglas:
- Nunca modificar `main`
- Resolver conflictos en `development`

---

## ⚠️ Reglas importantes

- No modificar archivos core de Horizon
- Extender en lugar de sobrescribir
- Mantener código modular
- Evitar duplicación

---

## 🧠 Comandos útiles

```bash
npm run watch:css
npm run build:css:prod
shopify theme dev --store $SHOPIFY_STORE
```

---

## ✅ Checklist

- [ ] Node instalado
- [ ] Shopify CLI listo
- [ ] `.env` configurado
- [ ] `npm install`
- [ ] `npm run dev:shopify`

---

## 🎯 Objetivo

- Base reutilizable
- Updates seguros de Horizon
- Buen performance y mantenimiento
