import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { FiltrarProductosDto } from './dto/filtrar-productos.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  listar(@Query() filtros: FiltrarProductosDto) {
    return this.productosService.listar(filtros);
  }

  // Rutas admin: van ANTES de ':slug' para que no las capture como slug.
  @Get('admin/todos')
  @UseGuards(JwtAuthGuard)
  listarTodosAdmin() {
    return this.productosService.listarTodosAdmin();
  }

  @Get('admin/exportar')
  @UseGuards(JwtAuthGuard)
  async exportar(@Res() res: Response) {
    const buffer = await this.productosService.exportarExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="catalogo-valentino-benites.xlsx"',
    );
    res.send(buffer);
  }

  @Get(':slug')
  obtener(@Param('slug') slug: string) {
    return this.productosService.obtenerPorSlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Body() dto: CrearProductoDto) {
    return this.productosService.crear(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarProductoDto) {
    return this.productosService.actualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  eliminar(@Param('id') id: string) {
    return this.productosService.eliminar(id);
  }
}
