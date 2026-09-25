import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ActualizarCredencialesDto } from './dto/actualizar-credenciales.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PayloadJwt } from './jwt.strategy';

interface RequestConUsuario extends Request {
  user: PayloadJwt;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Límite estricto contra fuerza bruta: 5 intentos por minuto por IP.
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Mismo límite: exige la contrasena actual, así que también es blanco de
  // fuerza bruta.
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Patch('credenciales')
  @UseGuards(JwtAuthGuard)
  actualizarCredenciales(
    @Req() req: RequestConUsuario,
    @Body() dto: ActualizarCredencialesDto,
  ) {
    return this.authService.actualizarCredenciales(req.user.sub, dto);
  }
}
