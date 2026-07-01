import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VariantesService } from './variantes.service';
import { CrearVarianteDto } from './dto/crear-variante.dto';
import { ActualizarVarianteDto } from './dto/actualizar-variante.dto';
import { AgregarImagenVarianteDto } from './dto/agregar-imagen-variante.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class VariantesController {
  constructor(private readonly variantesService: VariantesService) {}

  @Post('productos/:productoId/variantes')
  crear(
    @Param('productoId') productoId: string,
    @Body() dto: CrearVarianteDto,
  ) {
    return this.variantesService.crear(productoId, dto);
  }

  @Patch('variantes/:id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarVarianteDto) {
    return this.variantesService.actualizar(id, dto);
  }

  @Delete('variantes/:id')
  eliminar(@Param('id') id: string) {
    return this.variantesService.eliminar(id);
  }

  @Post('variantes/:id/imagenes')
  agregarImagen(
    @Param('id') id: string,
    @Body() dto: AgregarImagenVarianteDto,
  ) {
    return this.variantesService.agregarImagen(id, dto);
  }

  @Delete('variantes/imagenes/:id')
  eliminarImagen(@Param('id') id: string) {
    return this.variantesService.eliminarImagen(id);
  }
}
