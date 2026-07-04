# ESTADO — Ecommerce Valentino Benites (proyecto interno: FABIOLA)

## Qué es
Ecommerce de moda (carteras/accesorios de cuero para mujer) de la marca **Valentino Benites**,
mercado Perú. Referencia visual/estructura: paez.com.pe. Marca/paleta de esvalentinobenites.com.
- Logo oficial: `apps/web/public/logo-valentino.png` (emblema circular VB).
- Paleta: acento morado `#7D2181` + magenta `#D64EDC`. Tokens en `apps/web/app/globals.css`.
- "FABIOLA" es el nombre interno del proyecto, NO la marca pública.

## Modelo de negocio (importante)
**Hecho a pedido, SIN stock.** La clienta muestra los colores disponibles; cuando entra un
pedido de un color, lo fabrica (artesanal, ~24 h). No hay inventario ni "agotado".

## Stack
Monorepo pnpm. `apps/api` (NestJS 11 + Prisma 6 + PostgreSQL + JWT) · `apps/web` (Next 16 App
Router + React 19 + Tailwind v4 + zustand). Node 24 vía nvm. DB local: `fabiola` @ localhost:5432.
Storage: Wasabi S3 (bucket privado servido por proxy del backend).

## Estado actual — EN PRODUCCIÓN
Fase 1 (storefront + mini-panel) y el **rediseño transaccional** están desplegados y andando.

### Rediseño transaccional (mergeado a `main`, desplegado)
- **Variantes de color**: `Producto` (modelo) 1→N `Variante` (color), foto y precio opcionales
  por variante (fallback al modelo). Unidad comprable = la variante. Selector de color estilo
  Paez en la ficha (aparece con 2+ colores).
- **Pedido transaccional**: todo cierre crea un `Pedido` real. Estados
  `PENDIENTE_PAGO → PAGADO → EN_PRODUCCION → ENVIADO` (+ CANCELADO/RECHAZADO), máquina de
  estados con transiciones validadas. `ItemPedido` guarda `colorElegido` (qué fabricar).
- **Izipay pre-enchufado (STUB)**: endpoints token + callback, **fail-closed** (503 salvo que
  `IZIPAY_STUB_HABILITADO=true`; NO seteado en prod). La integración real es trabajo aparte.
- **WhatsApp** ahora crea pedido real (con fix del popup móvil).
- **Migración de datos**: M1 backfill 1:1 corrida en prod (50 variantes). La agrupación por
  modelo (M2) la hace la clienta desde **Admin → Migración** (revisable, no destructiva).
- 61 tests de backend (Jest) + web tsc/lint limpios.

### Administrable desde el panel (Admin → Configuración)
Hero (título/subtítulo/color), banners de la home, redes sociales, QR Yape/Plin,
**barra de anuncios** (marquee superior estilo Paez: toggle + lista de mensajes editables).

## Producción (Railway) — proyecto `fabiola`, 3 servicios (Postgres + api + web)
- **Storefront**: https://web-production-77a4c.up.railway.app
- **API**: https://api-production-2c9f.up.railway.app/api
- **Admin**: https://web-production-77a4c.up.railway.app/admin/login
  - Usuario: admin@fabiola.pe · contraseña: ver Railway (variable del servicio api). NO se
    documenta acá (repo público).
- **Auto-deploy roto**: el repo se renombró a `ValentinoBenites` y se rompió el webhook de
  GitHub→Railway. Desplegar a mano con `railway up --service api --detach` y
  `railway up --service web --detach`.
- **Migraciones/scripts contra prod**: usar `DATABASE_PUBLIC_URL` del servicio Postgres
  (`thomas.proxy.rlwy.net`), no la interna. `prisma migrate deploy` con esa URL.

## Cómo levantarlo (local)
`pnpm dev` desde la raíz (web 3024 / api 4024). Solo Gian abre puertos.
- Backfill de variantes en local: `pnpm --filter api db:backfill-variantes`.

## Pendientes (lado clienta / negocio — no técnico)
- Agrupar sus modelos por color desde **Admin → Migración** (ej: "Bandolera Andina" ya quedó
  hecha como ejemplo con 7 colores).
- Revisar los 7 productos marcados "Único" (nombres sin color reconocible).
- Cargar precios reales, número de WhatsApp real, y los QR reales de Yape/Plin.
- Rotar/definir `SEED_ADMIN_PASSWORD` del admin de prod (repo público).

## Fases futuras
- **Izipay real**: integrar la pasarela sobre el stub ya preparado (modalidad redirect vs
  embedded a definir; el schema ya soporta `referenciaTransaccion`/`proveedorPago`/`rawPago`).
- Inventario/kardex y reportes (si el negocio lo pide; hoy es hecho-a-pedido sin stock).
