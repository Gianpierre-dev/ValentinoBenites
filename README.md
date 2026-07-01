# FABIOLA

Ecommerce "Valentino Benites": storefront público + panel de administración.

## Stack

- **API**: NestJS + Prisma 6 + PostgreSQL + JWT (`apps/api`)
- **Web**: Next.js (App Router) + Tailwind v4 + TypeScript strict + Zustand (`apps/web`)
- **Gestor de paquetes**: pnpm
- **Storage**: Wasabi (S3-compatible)

## Acceso al panel de administración (solo desarrollo local)

Al ejecutar la seed de desarrollo se crea un usuario administrador con estas
credenciales:

| Campo       | Valor              |
| ----------- | ------------------ |
| Correo      | `admin@fabiola.pe` |
| Contraseña  | `admin123`         |

Ingresa en `/admin` con esos datos.

> **Importante — estas credenciales son SOLO para desarrollo local.**
> La contraseña `admin123` únicamente funciona cuando `NODE_ENV` no es
> `production`. En producción la seed destructiva está bloqueada y el usuario
> administrador se crea con la variable de entorno `SEED_ADMIN_PASSWORD` (mínimo
> 8 caracteres), por lo que **la clave de producción es distinta y no se publica
> aquí**. Nunca subas credenciales reales de producción a este repositorio.

Puedes personalizar el usuario de desarrollo con las variables `SEED_ADMIN_EMAIL`
y `SEED_ADMIN_PASSWORD` antes de correr la seed.

## Puesta en marcha local

```bash
pnpm install

# API
pnpm --filter api exec prisma migrate dev
pnpm --filter api db:seed
pnpm --filter api dev

# Web
pnpm --filter web dev
```
