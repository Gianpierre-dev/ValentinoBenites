import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PedidosService } from './pedidos.service';
import { CotizarPedidoDto, CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { ActualizarEnvioDto } from './dto/actualizar-envio.dto';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  // Endpoint público: sin un límite propio se podría llenar el panel de pedidos falsos.
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post()
  crear(@Body() dto: CrearPedidoDto) {
    return this.pedidosService.crear(dto);
  }

  // Solo lectura (no crea nada): el checkout la consulta antes de mostrar el pago.
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('cotizar')
  @HttpCode(HttpStatus.OK)
  cotizar(@Body() dto: CotizarPedidoDto) {
    return this.pedidosService.cotizar(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listar() {
    return this.pedidosService.listar();
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard)
  actualizarEstado(@Param('id') id: string, @Body() dto: ActualizarEstadoDto) {
    return this.pedidosService.actualizarEstado(id, dto);
  }

  @Patch(':id/envio')
  @UseGuards(JwtAuthGuard)
  actualizarEnvio(@Param('id') id: string, @Body() dto: ActualizarEnvioDto) {
    return this.pedidosService.actualizarEnvio(id, dto);
  }
}
