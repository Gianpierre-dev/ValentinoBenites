import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ProductosModule } from './productos/productos.module';
import { VariantesModule } from './variantes/variantes.module';
import { CategoriasModule } from './categorias/categorias.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { BilleterasModule } from './billeteras/billeteras.module';
import { PagosModule } from './pagos/pagos.module';
import { MigracionModule } from './migracion/migracion.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { ReclamosModule } from './reclamos/reclamos.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { SuscriptoresModule } from './suscriptores/suscriptores.module';
import { StorageModule } from './storage/storage.module';

const METODOS_SOLO_LECTURA = new Set(['GET', 'HEAD', 'OPTIONS']);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Límite global de 100 peticiones por minuto por IP, solo para escrituras.
    // Las lecturas se excluyen porque el SSR de la tienda las hace todas desde
    // la misma IP del servidor web, y compartirían el cupo entre todos los
    // visitantes.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
      skipIf: (contexto) =>
        METODOS_SOLO_LECTURA.has(
          contexto.switchToHttp().getRequest<{ method: string }>().method,
        ),
      errorMessage:
        'Demasiadas solicitudes seguidas. Espera un momento e intenta de nuevo.',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ProductosModule,
    VariantesModule,
    CategoriasModule,
    PedidosModule,
    BilleterasModule,
    PagosModule,
    MigracionModule,
    ConfiguracionModule,
    NotificacionesModule,
    ReclamosModule,
    SuscriptoresModule,
    StorageModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
