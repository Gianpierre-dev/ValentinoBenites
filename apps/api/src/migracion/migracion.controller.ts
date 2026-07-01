import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MigracionService } from './migracion.service';

@Controller('admin/migracion')
@UseGuards(JwtAuthGuard)
export class MigracionController {
  constructor(private readonly migracionService: MigracionService) {}

  // Devuelve la propuesta de agrupacion (parser). SOLO LECTURA: no aplica nada.
  // La aplicacion/fusion (M2) se hace desde el admin (Batch 4).
  @Get('propuesta')
  proponerAgrupacion() {
    return this.migracionService.proponerAgrupacion();
  }
}
