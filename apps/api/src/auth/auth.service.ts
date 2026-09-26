import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarCredencialesDto } from './dto/actualizar-credenciales.dto';
import { LoginDto } from './dto/login.dto';
import { PayloadJwt } from './jwt.strategy';

const RONDAS_BCRYPT = 10;

export interface UsuarioPublico {
  id: string;
  email: string;
  nombre: string | null;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioPublico;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<RespuestaLogin> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const passwordValida = await bcrypt.compare(
      dto.password,
      usuario.passwordHash,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const payload: PayloadJwt = { sub: usuario.id, email: usuario.email };
    const token = await this.jwt.signAsync(payload);

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
      },
    };
  }

  /**
   * Cambia el correo y/o la contrasena del usuario autenticado. Siempre exige
   * la contrasena actual: tener una sesion abierta no basta para tomar la
   * cuenta.
   */
  async actualizarCredenciales(
    usuarioId: string,
    dto: ActualizarCredencialesDto,
  ): Promise<UsuarioPublico> {
    if (!dto.emailNuevo && !dto.passwordNueva) {
      throw new BadRequestException(
        'Indica un correo nuevo o una contraseña nueva.',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const passwordValida = await bcrypt.compare(
      dto.passwordActual,
      usuario.passwordHash,
    );

    if (!passwordValida) {
      // 400 y no 401: la sesión es válida; lo incorrecto es un dato del formulario.
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }

    if (dto.emailNuevo && dto.emailNuevo !== usuario.email) {
      const existente = await this.prisma.usuario.findUnique({
        where: { email: dto.emailNuevo },
      });
      if (existente) {
        throw new ConflictException('Ese correo ya está en uso.');
      }
    }

    const actualizado = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ...(dto.emailNuevo ? { email: dto.emailNuevo } : {}),
        ...(dto.passwordNueva
          ? {
              passwordHash: await bcrypt.hash(dto.passwordNueva, RONDAS_BCRYPT),
            }
          : {}),
      },
    });

    return {
      id: actualizado.id,
      email: actualizado.email,
      nombre: actualizado.nombre,
    };
  }
}
