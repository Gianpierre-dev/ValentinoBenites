import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriasService } from './categorias.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  listar() {
    return this.categoriasService.listarActivas();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Body() dto: CrearCategoriaDto) {
    return this.categoriasService.crear(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarCategoriaDto) {
    return this.categoriasService.actualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  eliminar(@Param('id') id: string) {
    return this.categoriasService.eliminar(id);
  }
}
