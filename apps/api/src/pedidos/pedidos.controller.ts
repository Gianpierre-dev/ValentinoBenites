import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PedidosService } from './pedidos.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  crear(@Body() dto: CrearPedidoDto) {
    return this.pedidosService.crear(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listar() {
    return this.pedidosService.listar();
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard)
  actualizarEstado(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoDto,
  ) {
    return this.pedidosService.actualizarEstado(id, dto);
  }
}
