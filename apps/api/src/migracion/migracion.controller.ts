import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AplicarGrupoDto } from './dto/aplicar-grupo.dto';
import { MigracionService } from './migracion.service';

@Controller('admin/migracion')
@UseGuards(JwtAuthGuard)
export class MigracionController {
  constructor(private readonly migracionService: MigracionService) {}

  // Devuelve la propuesta de agrupacion (parser). SOLO LECTURA: no aplica nada.
  @Get('propuesta')
  proponerAgrupacion() {
    return this.migracionService.proponerAgrupacion();
  }

  // Aplica un grupo revisado (M2): fusiona los colores en el producto cabecera y
  // absorbe (soft-delete) los demas. Idempotente y grupo por grupo. Humano en el loop.
  @Post('aplicar')
  aplicarAgrupacion(@Body() grupo: AplicarGrupoDto) {
    return this.migracionService.aplicarAgrupacion(grupo);
  }
}
