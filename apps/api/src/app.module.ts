import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductosModule } from './productos/productos.module';
import { VariantesModule } from './variantes/variantes.module';
import { CategoriasModule } from './categorias/categorias.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PagosModule } from './pagos/pagos.module';
import { MigracionModule } from './migracion/migracion.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { ReclamosModule } from './reclamos/reclamos.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Límite global: 100 peticiones por minuto por IP.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    ProductosModule,
    VariantesModule,
    CategoriasModule,
    PedidosModule,
    PagosModule,
    MigracionModule,
    ConfiguracionModule,
    NotificacionesModule,
    ReclamosModule,
    StorageModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
