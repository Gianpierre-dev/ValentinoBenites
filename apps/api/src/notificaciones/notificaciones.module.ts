import { Global, Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

// Global: cualquier modulo de negocio puede notificar sin re-importar.
@Global()
@Module({
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
