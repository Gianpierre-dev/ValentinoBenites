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
import { BilleterasService } from './billeteras.service';
import { CrearBilleteraDto } from './dto/crear-billetera.dto';
import { ActualizarBilleteraDto } from './dto/actualizar-billetera.dto';

@Controller('billeteras')
export class BilleterasController {
  constructor(private readonly billeterasService: BilleterasService) {}

  // Publico: el checkout pinta las billeteras activas.
  @Get()
  listarActivas() {
    return this.billeterasService.listarActivas();
  }

  @Get('todas')
  @UseGuards(JwtAuthGuard)
  listarTodas() {
    return this.billeterasService.listarTodas();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Body() dto: CrearBilleteraDto) {
    return this.billeterasService.crear(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarBilleteraDto) {
    return this.billeterasService.actualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  eliminar(@Param('id') id: string) {
    return this.billeterasService.eliminar(id);
  }
}
