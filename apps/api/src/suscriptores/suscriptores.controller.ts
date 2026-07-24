import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuscriptoresService } from './suscriptores.service';
import { CrearSuscriptorDto } from './dto/crear-suscriptor.dto';

@Controller('suscriptores')
export class SuscriptoresController {
  constructor(private readonly suscriptoresService: SuscriptoresService) {}

  // Alta publica del newsletter, con limite estricto anti-abuso.
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  suscribir(@Body() dto: CrearSuscriptorDto) {
    return this.suscriptoresService.suscribir(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listar() {
    return this.suscriptoresService.listar();
  }
}
