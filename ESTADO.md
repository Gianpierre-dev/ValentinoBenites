# ESTADO — Ecommerce Valentino Benites (proyecto interno: FABIOLA)

## Qué es
Ecommerce de moda (carteras/accesorios) para la marca **Valentino Benites**. Referencia
visual/estructura: paez.com.pe. Marca y assets tomados de esvalentinobenites.com.
- Logo oficial: `apps/web/public/logo-valentino.png` (emblema circular VB).
- Paleta: base minimalista (blanco/slate) + **acento morado de marca `#7D2181`**
  (magenta `#D64EDC` como variante), extraídos del sitio oficial. Tokens en `globals.css`.
- "FABIOLA" es solo el nombre interno del proyecto, NO la marca pública.
Desarrollo por fases (ver `C:\Users\User\.claude\plans\dale-armemos-el-alcance-steady-hoare.md`).

## Stack
Monorepo pnpm. `apps/api` (NestJS + Prisma 6 + PostgreSQL 17 + JWT) · `apps/web` (Next 16 App Router + Tailwind v4 + zustand).
Node 24 vía nvm. Base de datos local: `fabiola` (postgres / sql @ localhost:5432).

## Fase 1 — COMPLETADA (branch `feat/fase1-ecommerce`)
- Backend: auth JWT, módulos productos/categorías/pedidos/configuración, storage Wasabi (tolerante a credenciales vacías).
- Seed: 44 productos, 6 categorías, 64 imágenes (picsum placeholder), admin.
- Storefront: home, catálogo, producto, carrito, checkout dual (WhatsApp + Yape manual).
- Admin: login, CRUD productos/categorías, pedidos, configuración.
- Verificado: tsc backend OK, eslint + tsc frontend OK, contrato API alineado.

## Cómo levantarlo (local)
1. API:  `cd apps/api && pnpm start:dev`  (puerto 4024)
2. Web:  `cd apps/web && pnpm dev`         (puerto 3024)
   O ambos desde la raíz: `pnpm dev`
- Storefront: http://localhost:3024
- Admin: http://localhost:3024/admin/login  →  admin@fabiola.pe / admin123
  (en dev la contraseña sale de SEED_ADMIN_PASSWORD o cae a 'admin123')

## Producción (Railway) — DESPLEGADO
Proyecto Railway: `fabiola` (workspace stigold-code's Projects). 3 servicios: Postgres + api + web.
- **Storefront**: https://web-production-77a4c.up.railway.app
- **API**: https://api-production-2c9f.up.railway.app/api
- **Admin**: https://web-production-77a4c.up.railway.app/admin/login
  - admin@fabiola.pe / `Fabiola-82d493d51d`  (CAMBIAR esta contraseña)
- DB sembrada en prod: 44 productos, 6 categorías.
- Config monorepo: cada servicio con Root Directory `/` + Config Path `apps/{api,web}/railway.json`
  (se setea por API GraphQL de Railway, no por CLI; ver memoria fabiola-deploy-railway).
- Deploy por CLI: `railway up --service api --ci` / `--service web --ci`.

## Pendientes reales
- Credenciales Wasabi (WASABI_* en `apps/api/.env`) para fotos reales — hoy usa placeholder.
- Número de WhatsApp real del negocio (en Configuración del admin).
- Color de acento de marca (hoy negro sobrio) + logo de la tienda.
- Probar flujos end-to-end levantando las apps.

## Fases futuras
- Fase 2: inventario real (kardex entradas/salidas/stock) + reportes.
- Fase 3: pasarela de pago automática (Izipay/Culqi con Yape/Plin).
