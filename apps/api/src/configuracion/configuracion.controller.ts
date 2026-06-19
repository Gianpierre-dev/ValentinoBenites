import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfiguracionService } from './configuracion.service';
import { ActualizarConfiguracionDto } from './dto/actualizar-configuracion.dto';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get()
  obtener() {
    return this.configuracionService.obtener();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  actualizar(@Body() dto: ActualizarConfiguracionDto) {
    return this.configuracionService.actualizar(dto);
  }
}
