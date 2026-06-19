import { IsEnum } from 'class-validator';
import { EstadoPedido } from '@prisma/client';

export class ActualizarEstadoDto {
  @IsEnum(EstadoPedido, { message: 'El estado no es valido.' })
  estado!: EstadoPedido;
}
