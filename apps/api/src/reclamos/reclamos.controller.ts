import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReclamosService } from './reclamos.service';
import { CrearReclamoDto } from './dto/crear-reclamo.dto';
import { ResponderReclamoDto } from './dto/responder-reclamo.dto';

@Controller('reclamos')
export class ReclamosController {
  constructor(private readonly reclamosService: ReclamosService) {}

  // Registro publico de la hoja de reclamacion. Limite mas estricto que el
  // global para frenar abuso del formulario (5 por minuto por IP).
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  crear(@Body() dto: CrearReclamoDto) {
    return this.reclamosService.crear(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listar() {
    return this.reclamosService.listar();
  }

  @Patch(':id/responder')
  @UseGuards(JwtAuthGuard)
  responder(@Param('id') id: string, @Body() dto: ResponderReclamoDto) {
    return this.reclamosService.responder(id, dto);
  }
}
