import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearReclamoDto } from './dto/crear-reclamo.dto';
import { ResponderReclamoDto } from './dto/responder-reclamo.dto';

/**
 * Libro de Reclamaciones virtual (Ley 29571 + DS 011-2011). El registro es
 * publico (cualquier consumidor puede presentar una hoja); la gestion y la
 * respuesta son del admin. Plazo legal de respuesta: 15 dias habiles.
 */
@Injectable()
export class ReclamosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearReclamoDto) {
    // Igual que en pedidos: el codigo unico tiene una ventana de carrera entre
    // el chequeo y el create; ante colision (P2002) se reintenta con otro codigo.
    for (let intento = 0; intento < 5; intento += 1) {
      const codigo = await this.generarCodigoUnico();
      try {
        return await this.prisma.reclamo.create({
          data: {
            codigo,
            tipo: dto.tipo,
            nombreCompleto: dto.nombreCompleto,
            documento: dto.documento,
            domicilio: dto.domicilio,
            telefono: dto.telefono,
            email: dto.email ?? null,
            esMenorDeEdad: dto.esMenorDeEdad ?? false,
            apoderado: dto.apoderado ?? null,
            descripcionBien: dto.descripcionBien,
            montoReclamado:
              dto.montoReclamado !== undefined
                ? new Prisma.Decimal(dto.montoReclamado)
                : null,
            detalle: dto.detalle,
            pedidoConsumidor: dto.pedidoConsumidor,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new BadRequestException(
      'No se pudo registrar el reclamo. Intenta nuevamente.',
    );
  }

  listar() {
    return this.prisma.reclamo.findMany({ orderBy: { creadoEn: 'desc' } });
  }

  async responder(id: string, dto: ResponderReclamoDto) {
    const reclamo = await this.prisma.reclamo.findUnique({ where: { id } });
    if (!reclamo) {
      throw new NotFoundException('El reclamo no existe.');
    }
    return this.prisma.reclamo.update({
      where: { id },
      data: {
        respuesta: dto.respuesta,
        estado: 'RESPONDIDO',
        respondidoEn: new Date(),
      },
    });
  }

  private async generarCodigoUnico(): Promise<string> {
    const anio = new Date().getFullYear();
    for (let intento = 0; intento < 5; intento += 1) {
      const aleatorio = Math.floor(1000 + Math.random() * 9000);
      const codigo = `LR-${anio}-${aleatorio}`;
      const existente = await this.prisma.reclamo.findUnique({
        where: { codigo },
      });
      if (!existente) {
        return codigo;
      }
    }
    return `LR-${anio}-${Date.now()}`;
  }
}
